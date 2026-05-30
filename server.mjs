import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  CONTRACT_TYPES,
  acceptTrade,
  buildHouse,
  buyCurrentShares,
  castBuildVote,
  createFreePassContract,
  createGame,
  createInheritanceContract,
  createVoteSupportContract,
  declineCurrentShareOffer,
  declareBankruptcy,
  demolishHouse,
  endTurn,
  getCurrentPlayer,
  proposeTrade,
  rejectTrade,
  resolveBuildVote,
  resolvePendingConstruction,
  rollAndMove,
  startBuildVote,
  startDemolishVote,
} from './src/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_ROOM_PLAYERS = 4;
const DEFAULT_PORT = 4173;

export function createRoomStore({
  createCode = randomRoomCode,
  createClientId = randomClientId,
} = {}) {
  const rooms = new Map();

  function createRoom({ playerName } = {}) {
    const roomCode = uniqueRoomCode(rooms, createCode);
    const clientId = createClientId();
    const host = makeParticipant(clientId, 0, playerName, true);
    const room = {
      roomCode,
      hostClientId: clientId,
      lobby: {
        started: false,
        hostPlayerId: host.playerId,
        players: [host],
      },
      game: null,
      revision: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    rooms.set(roomCode, room);
    return withClient(room, host);
  }

  function joinRoom(rawCode, { playerName } = {}) {
    const room = requireRoom(rawCode);
    if (room.lobby.started) {
      throw new Error('游戏已经开始，不能再加入这个局域网房间。');
    }
    if (room.lobby.players.length >= MAX_ROOM_PLAYERS) {
      throw new Error('局域网房间已满，最多 4 名玩家。');
    }

    const clientId = createClientId();
    const participant = makeParticipant(clientId, room.lobby.players.length, playerName, false);
    room.lobby.players.push(participant);
    bump(room);
    return withClient(room, participant);
  }

  function startRoom(rawCode, clientId) {
    const room = requireRoom(rawCode);
    const participant = requireClient(room, clientId);
    if (!participant.isHost) {
      throw new Error('只有房主可以开始局域网游戏。');
    }
    if (room.lobby.started) {
      return withClient(room, participant);
    }
    if (room.lobby.players.length < 2) {
      throw new Error('至少需要 2 名玩家才能开始局域网游戏。');
    }

    room.game = createGame(room.lobby.players.map((player) => player.name));
    room.lobby.started = true;
    bump(room);
    return withClient(room, participant);
  }

  function getState(rawCode, clientId = null) {
    const room = requireRoom(rawCode);
    const participant = clientId ? requireClient(room, clientId) : null;
    return withClient(room, participant);
  }

  function applyAction(rawCode, clientId, action = {}) {
    const room = requireRoom(rawCode);
    const participant = requireClient(room, clientId);
    if (!room.lobby.started || !room.game) {
      throw new Error('局域网游戏还没有开始。');
    }
    if (!action || typeof action.type !== 'string') {
      throw new Error('缺少联机动作类型。');
    }

    const payload = action.payload ?? {};
    const game = room.game;
    const current = () => getCurrentPlayer(game);
    const requireCurrentControl = () => {
      const active = current();
      if (active.id !== participant.playerId) {
        throw new Error(`当前玩家是 ${active.name}，不能由 ${participant.name} 控制。`);
      }
      return active;
    };

    switch (action.type) {
      case 'roll':
        requireCurrentControl();
        rollAndMove(game, payload.dice);
        break;
      case 'buyShares':
        requireCurrentControl();
        buyCurrentShares(game, Number(payload.shareCount ?? 1));
        break;
      case 'declineOffer':
        requireCurrentControl();
        declineCurrentShareOffer(game);
        break;
      case 'endTurn':
        requireCurrentControl();
        endTurn(game);
        break;
      case 'declareBankruptcy': {
        const player = requireCurrentControl();
        declareBankruptcy(game, player.id, { type: 'active', reason: payload.reason ?? '主动破产' });
        break;
      }
      case 'buildHouse':
        requireCurrentControl();
        buildHouse(game, String(payload.propertyId ?? ''));
        break;
      case 'demolishHouse':
        requireCurrentControl();
        demolishHouse(game, String(payload.propertyId ?? ''));
        break;
      case 'startBuildVote':
        requireCurrentControl();
        startBuildVote(game, String(payload.propertyId ?? ''));
        break;
      case 'startDemolishVote':
        requireCurrentControl();
        startDemolishVote(game, String(payload.propertyId ?? ''));
        break;
      case 'castVote':
        castBuildVote(game, String(payload.voteId ?? ''), participant.playerId, payload.stance);
        break;
      case 'resolveVote':
        requireCurrentControl();
        resolveBuildVote(game, String(payload.voteId ?? ''));
        break;
      case 'resolveConstruction':
        requireCurrentControl();
        resolvePendingConstruction(game);
        break;
      case 'proposeTrade':
        assertOwnTradeSide(participant, payload, 'fromPlayerId');
        proposeTrade(game, payload);
        break;
      case 'acceptTrade':
        assertTradeRecipient(game, participant, payload.tradeId);
        acceptTrade(game, String(payload.tradeId ?? ''), Date.now());
        break;
      case 'rejectTrade':
        assertTradeParticipant(game, participant, payload.tradeId);
        rejectTrade(game, String(payload.tradeId ?? ''));
        break;
      case 'createContract':
        createContractFromPayload(game, payload);
        break;
      case 'restart':
        if (!participant.isHost) {
          throw new Error('只有房主可以重开局域网游戏。');
        }
        room.game = createGame(room.lobby.players.map((player) => player.name));
        break;
      default:
        throw new Error(`未知联机动作：${action.type}`);
    }

    bump(room);
    return withClient(room, participant);
  }

  function requireRoom(rawCode) {
    const roomCode = normalizeRoomCode(rawCode);
    const room = rooms.get(roomCode);
    if (!room) {
      throw new Error(`找不到局域网房间 ${roomCode || rawCode}。`);
    }
    return room;
  }

  function requireClient(room, clientId) {
    const participant = room.lobby.players.find((player) => player.clientId === clientId);
    if (!participant) {
      throw new Error('这个浏览器不是该局域网房间的玩家。');
    }
    return participant;
  }

  return {
    createRoom,
    joinRoom,
    startRoom,
    getState,
    applyAction,
    rooms,
  };
}

export function createLanServer({ rootDir = __dirname, store = createRoomStore() } = {}) {
  const resolvedRoot = path.resolve(rootDir);

  return http.createServer(async (request, response) => {
    try {
      setCorsHeaders(response);
      if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
      }

      const url = new URL(request.url, 'http://localhost');
      const route = matchApiRoute(url.pathname);
      if (route) {
        await handleApiRoute({ request, response, route, store, url });
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendJson(response, 405, { error: 'Method not allowed' });
        return;
      }
      await serveStaticFile(response, resolvedRoot, url.pathname, request.method === 'HEAD');
    } catch (error) {
      sendJson(response, error.statusCode ?? 400, { error: error.message ?? String(error) });
    }
  });
}

function createContractFromPayload(game, payload) {
  const type = payload.type;
  if (type === CONTRACT_TYPES.FREE_PASS) {
    return createFreePassContract(game, {
      holderId: String(payload.holderId ?? ''),
      shareRefs: payload.shareRefs ?? [],
    });
  }
  if (type === CONTRACT_TYPES.INHERITANCE) {
    return createInheritanceContract(game, {
      holderId: String(payload.holderId ?? ''),
      shareRefs: payload.shareRefs ?? [],
    });
  }
  if (type === CONTRACT_TYPES.VOTE_SUPPORT) {
    return createVoteSupportContract(game, {
      holderId: String(payload.holderId ?? ''),
      obligorId: String(payload.obligorId ?? ''),
      targetSpaceId: String(payload.targetSpaceId ?? ''),
      voteType: payload.voteType ?? 'build',
      stance: payload.stance,
      remainingUses: Number(payload.remainingUses ?? 1),
    });
  }
  throw new Error(`未知合同类型：${type}`);
}

function assertOwnTradeSide(participant, draft, field) {
  if (draft?.[field] !== participant.playerId) {
    throw new Error('局域网联机中只能以自己的玩家身份发起交易。');
  }
}

function assertTradeRecipient(game, participant, tradeId) {
  const trade = findTrade(game, tradeId);
  if (trade.toPlayerId !== participant.playerId) {
    throw new Error('只有交易接收方可以接受这笔交易。');
  }
}

function assertTradeParticipant(game, participant, tradeId) {
  const trade = findTrade(game, tradeId);
  if (![trade.fromPlayerId, trade.toPlayerId].includes(participant.playerId)) {
    throw new Error('只有交易双方可以拒绝这笔交易。');
  }
}

function findTrade(game, tradeId) {
  const trade = game.pendingTrades.find((candidate) => candidate.id === tradeId);
  if (!trade) {
    throw new Error(`找不到交易 ${tradeId}。`);
  }
  return trade;
}

function withClient(room, participant) {
  return {
    roomCode: room.roomCode,
    client: participant ? publicClient(participant) : null,
    room: publicRoom(room),
  };
}

function publicRoom(room) {
  return {
    roomCode: room.roomCode,
    revision: room.revision,
    lobby: {
      started: room.lobby.started,
      hostPlayerId: room.lobby.hostPlayerId,
      players: room.lobby.players.map(publicPlayer),
    },
    game: room.game,
  };
}

function publicPlayer(player) {
  return {
    playerId: player.playerId,
    name: player.name,
    isHost: player.isHost,
  };
}

function publicClient(participant) {
  return {
    clientId: participant.clientId,
    playerId: participant.playerId,
    name: participant.name,
    isHost: participant.isHost,
  };
}

function makeParticipant(clientId, index, playerName, isHost) {
  const fallback = isHost ? '房主' : `玩家 ${index + 1}`;
  return {
    clientId,
    playerId: `p${index + 1}`,
    name: normalizePlayerName(playerName, fallback),
    isHost,
    joinedAt: Date.now(),
  };
}

function normalizePlayerName(playerName, fallback) {
  const name = String(playerName ?? '').trim();
  return (name || fallback).slice(0, 14);
}

function bump(room) {
  room.revision += 1;
  room.updatedAt = Date.now();
}

function uniqueRoomCode(rooms, createCode) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = normalizeRoomCode(createCode());
    if (code && !rooms.has(code)) {
      return code;
    }
  }
  throw new Error('无法创建唯一房间号，请重试。');
}

function normalizeRoomCode(rawCode) {
  return String(rawCode ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function randomRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let index = 0; index < 5; index += 1) {
    code += alphabet[crypto.randomInt(alphabet.length)];
  }
  return code;
}

function randomClientId() {
  return crypto.randomUUID();
}

function matchApiRoute(pathname) {
  if (pathname === '/api/health') {
    return { name: 'health' };
  }
  if (pathname === '/api/rooms') {
    return { name: 'rooms' };
  }
  const match = pathname.match(/^\/api\/rooms\/([^/]+)(?:\/(join|start|state|actions))?$/);
  if (!match) {
    return null;
  }
  return {
    name: match[2] ?? 'state',
    roomCode: match[1],
  };
}

async function handleApiRoute({ request, response, route, store, url }) {
  if (route.name === 'health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (route.name === 'rooms' && request.method === 'POST') {
    const body = await readJsonBody(request);
    sendJson(response, 201, store.createRoom(body));
    return;
  }

  if (route.name === 'join' && request.method === 'POST') {
    const body = await readJsonBody(request);
    sendJson(response, 200, store.joinRoom(route.roomCode, body));
    return;
  }

  if (route.name === 'start' && request.method === 'POST') {
    const body = await readJsonBody(request);
    sendJson(response, 200, store.startRoom(route.roomCode, body.clientId));
    return;
  }

  if (route.name === 'state' && request.method === 'GET') {
    sendJson(response, 200, store.getState(route.roomCode, url.searchParams.get('clientId')));
    return;
  }

  if (route.name === 'actions' && request.method === 'POST') {
    const body = await readJsonBody(request);
    sendJson(response, 200, store.applyAction(route.roomCode, body.clientId, body.action));
    return;
  }

  sendJson(response, 405, { error: 'Method not allowed' });
}

async function readJsonBody(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 1_000_000) {
      const error = new Error('请求体过大。');
      error.statusCode = 413;
      throw error;
    }
  }
  if (!raw.trim()) {
    return {};
  }
  return JSON.parse(raw);
}

async function serveStaticFile(response, rootDir, pathname, headOnly) {
  const cleanPath = decodeURIComponent(pathname.split('?')[0]);
  const relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
  const targetPath = path.resolve(rootDir, relativePath);
  if (!targetPath.startsWith(rootDir + path.sep) && targetPath !== rootDir) {
    sendJson(response, 403, { error: 'Forbidden' });
    return;
  }

  let filePath = targetPath;
  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }
  if (stat.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const file = await fs.readFile(filePath);
  response.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Cache-Control': 'no-cache',
  });
  if (!headOnly) {
    response.end(file);
  } else {
    response.end();
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  }[extension] ?? 'application/octet-stream';
}

function lanUrls(port) {
  const urls = [`http://127.0.0.1:${port}`];
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const address of iface ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        urls.push(`http://${address.address}:${port}`);
      }
    }
  }
  return urls;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const host = process.env.HOST ?? '0.0.0.0';
  const server = createLanServer();
  server.listen(port, host, () => {
    console.log(`Super Monopoly LAN server listening on ${host}:${port}`);
    console.log('Open one of these URLs on LAN devices:');
    for (const url of lanUrls(port)) {
      console.log(`  ${url}`);
    }
  });
}
