import test from 'node:test';
import assert from 'node:assert/strict';

import { createLanServer, createRoomStore } from '../server.mjs';

function deterministicStore({ dice = [[1, 1], [1, 1], [1, 1]], codes = ['ROOM1'] } = {}) {
  const clientIds = ['client-host', 'client-guest', 'client-third', 'client-fourth', 'client-extra'];
  let diceIndex = 0;
  return createRoomStore({
    createCode: () => codes[0] ?? 'ROOM1',
    createClientId: () => clientIds.shift(),
    rollDice: () => dice[diceIndex++] ?? [1, 1],
  });
}

async function withHttpServer(store, run) {
  const server = createLanServer({ store });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

async function requestJson(baseUrl, path, { method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

test('LAN room store honors lobby settings when creating a room', () => {
  const store = deterministicStore();
  const created = store.createRoom({
    playerName: 'Ada',
    settings: { startCash: 2800, lapBonus: 600 },
  });
  assert.equal(created.room.lobby.settings.startCash, 2800);
  assert.equal(created.room.lobby.settings.lapBonus, 600);
});

test('LAN room store lets only the host change lobby settings before start', () => {
  const store = deterministicStore();
  const created = store.createRoom({ playerName: 'Ada' });
  const joined = store.joinRoom('ROOM1', { playerName: 'Lin' });

  assert.equal(created.room.lobby.settings.startCash, 1500);

  assert.throws(
    () => store.updateLobbySettings('ROOM1', joined.client.clientId, { settings: { startCash: 3000 } }),
    /房主|host/i,
  );

  const updated = store.updateLobbySettings('ROOM1', created.client.clientId, {
    settings: { startCash: 3000, lapBonus: 450 },
  });
  assert.equal(updated.room.lobby.settings.startCash, 3000);
  assert.equal(updated.room.lobby.settings.lapBonus, 450);

  const started = store.startRoom('ROOM1', created.client.clientId);
  assert.equal(started.room.game.settings.startCash, 3000);
  assert.equal(started.room.game.settings.lapBonus, 450);
  assert.equal(started.room.game.players[0].cash, 3000);
  assert.equal(started.room.game.players[1].cash, 3000);
  assert.equal(started.room.game.board[0].bonus, 450);

  assert.throws(
    () => store.updateLobbySettings('ROOM1', created.client.clientId, { settings: { startCash: 2000 } }),
    /已经开始|started/i,
  );
});

test('LAN room store creates a host lobby, accepts joins, and only the host can start', () => {
  const store = deterministicStore();

  const created = store.createRoom({ playerName: 'Ada' });
  assert.equal(created.roomCode, 'ROOM1');
  assert.equal(created.client.clientId, 'client-host');
  assert.equal(created.client.playerId, 'p1');
  assert.equal(created.client.isHost, true);
  assert.equal(created.room.lobby.started, false);
  assert.deepEqual(created.room.lobby.players.map((player) => player.name), ['Ada']);

  const joined = store.joinRoom('room1', { playerName: 'Lin' });
  assert.equal(joined.client.playerId, 'p2');
  assert.equal(joined.client.isHost, false);
  assert.deepEqual(joined.room.lobby.players.map((player) => player.name), ['Ada', 'Lin']);

  assert.throws(() => store.startRoom('ROOM1', joined.client.clientId), /房主|host/i);

  const started = store.startRoom('ROOM1', created.client.clientId);
  assert.equal(started.room.lobby.started, true);
  assert.equal(started.room.game.players.length, 2);
  assert.deepEqual(started.room.game.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(started.room.game.turn, 0);
  assert.equal(started.room.revision, 3);
});

test('LAN room store assigns and enforces unique fixed avatar colors', () => {
  const store = deterministicStore();

  const created = store.createRoom({ playerName: 'Ada', avatarColor: 'blue' });
  assert.equal(created.client.avatarColor, 'blue');
  assert.equal(created.room.lobby.players[0].avatarColor, 'blue');

  assert.throws(
    () => store.joinRoom('ROOM1', { playerName: 'Dup', avatarColor: 'blue' }),
    /头像颜色|color|used/i,
  );
  assert.throws(
    () => store.joinRoom('ROOM1', { playerName: 'Bad', avatarColor: '#ff00ff' }),
    /头像颜色|color|invalid/i,
  );

  const joined = store.joinRoom('ROOM1', { playerName: 'Lin' });
  assert.equal(joined.client.avatarColor, 'red');

  const changed = store.updateAvatarColor('ROOM1', joined.client.clientId, { avatarColor: 'green' });
  assert.equal(changed.client.avatarColor, 'green');
  assert.equal(changed.room.lobby.players[1].avatarColor, 'green');

  assert.throws(
    () => store.updateAvatarColor('ROOM1', created.client.clientId, { avatarColor: 'green' }),
    /头像颜色|color|used/i,
  );

  store.startRoom('ROOM1', created.client.clientId);
  assert.throws(
    () => store.updateAvatarColor('ROOM1', joined.client.clientId, { avatarColor: 'yellow' }),
    /已经开始|started/i,
  );
});

test('LAN room store lets the host return everyone to the enter-game lobby while keeping the room', () => {
  const store = deterministicStore();
  const created = store.createRoom({ playerName: 'Ada' });
  const joined = store.joinRoom('ROOM1', { playerName: 'Lin' });
  store.startRoom('ROOM1', created.client.clientId);

  assert.throws(() => store.returnToLobby('ROOM1', joined.client.clientId), /房主|host/i);

  const returned = store.returnToLobby('ROOM1', created.client.clientId);
  assert.equal(returned.room.lobby.started, false);
  assert.equal(returned.room.game, null);
  assert.deepEqual(returned.room.lobby.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(returned.room.revision, 4);

  const resumedGuest = store.resumeRoom('ROOM1', joined.client.clientId);
  assert.equal(resumedGuest.room.lobby.started, false);
  assert.equal(resumedGuest.room.game, null);
  assert.equal(resumedGuest.client.playerId, 'p2');
});

test('LAN room store resumes an existing client instead of creating duplicate lobby seats', () => {
  const store = deterministicStore();
  store.createRoom({ playerName: 'Ada' });
  const firstJoin = store.joinRoom('ROOM1', { playerName: 'Lin' });
  const secondJoin = store.joinRoom('ROOM1', {
    playerName: 'Lin again',
    clientId: firstJoin.client.clientId,
  });

  assert.equal(secondJoin.client.clientId, firstJoin.client.clientId);
  assert.equal(secondJoin.client.playerId, 'p2');
  assert.equal(secondJoin.client.name, 'Lin');
  assert.deepEqual(secondJoin.room.lobby.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(secondJoin.room.revision, firstJoin.room.revision);
});

test('LAN room store rejects extra players after four seats', () => {
  const clientIds = ['h', 'a', 'b', 'c', 'd'];
  let nextCode = 'FULL1';
  const store = createRoomStore({
    createCode: () => nextCode,
    createClientId: () => clientIds.shift(),
  });

  store.createRoom({ playerName: 'Host' });
  store.joinRoom('FULL1', { playerName: 'A' });
  store.joinRoom('FULL1', { playerName: 'B' });
  store.joinRoom('FULL1', { playerName: 'C' });

  assert.throws(() => store.joinRoom('FULL1', { playerName: 'D' }), /满|full/i);
});

test('LAN room chat accepts participant messages and syncs them before the game starts', () => {
  const store = deterministicStore();
  store.createRoom({ playerName: 'Ada' });
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;

  const posted = store.addChatMessage('ROOM1', guest.clientId, { text: '准备好了，开始吧' });

  assert.equal(posted.room.chat.length, 1);
  assert.equal(posted.room.chat[0].playerId, 'p2');
  assert.equal(posted.room.chat[0].name, 'Lin');
  assert.equal(posted.room.chat[0].text, '准备好了，开始吧');
  assert.equal(posted.room.revision, 3);
  assert.throws(() => store.addChatMessage('ROOM1', guest.clientId, { text: '   ' }), /消息|message|空/i);
});

test('LAN room actions are server-authoritative and bound to the controlling player', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
  store.startRoom('ROOM1', host.clientId);

  assert.throws(
    () => store.applyAction('ROOM1', guest.clientId, { type: 'roll', payload: { dice: [1, 1] } }),
    /当前玩家|turn|控制/i,
  );

  const rolled = store.applyAction('ROOM1', host.clientId, { type: 'roll', payload: { dice: [1, 1] } });
  assert.equal(rolled.room.game.players[0].position, 2);
  assert.equal(rolled.room.game.pendingOffer.playerId, 'p1');
  assert.equal(rolled.room.game.phase, 'action');

  assert.throws(
    () => store.applyAction('ROOM1', guest.clientId, { type: 'buyShares', payload: { shareCount: 1 } }),
    /当前玩家|turn|控制/i,
  );

  const bought = store.applyAction('ROOM1', host.clientId, { type: 'buyShares', payload: { shareCount: 1 } });
  assert.equal(bought.room.game.players[0].properties.length, 1);
  assert.equal(bought.room.game.phase, 'end');

  const ended = store.applyAction('ROOM1', host.clientId, { type: 'endTurn' });
  assert.equal(ended.room.game.turn, 1);

  assert.throws(
    () => store.applyAction('ROOM1', host.clientId, { type: 'roll', payload: { dice: [1, 1] } }),
    /当前玩家|turn|控制/i,
  );
  const guestRolled = store.applyAction('ROOM1', guest.clientId, { type: 'roll', payload: { dice: [1, 1] } });
  assert.equal(guestRolled.room.game.players[1].position, 2);
});

test('LAN roll ignores forged dice payload and uses the server dice source', () => {
  const store = deterministicStore({ dice: [[1, 1]] });
  const host = store.createRoom({ playerName: 'Ada' }).client;
  store.joinRoom('ROOM1', { playerName: 'Lin' });
  store.startRoom('ROOM1', host.clientId);

  const rolled = store.applyAction('ROOM1', host.clientId, {
    type: 'roll',
    payload: { dice: [6, 6, 6, 6, 6, 6] },
  });

  assert.equal(rolled.room.game.players[0].position, 2);
  assert.deepEqual(rolled.room.game.lastDice, [1, 1]);
});

test('LAN contract creation requires the acting player to bind only their own assets or obligations', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
  store.startRoom('ROOM1', host.clientId);
  const game = store.rooms.get('ROOM1').game;
  const targetSpaceId = game.board.find((space) => space.type === 'property').id;

  assert.throws(() => store.applyAction('ROOM1', guest.clientId, {
    type: 'createContract',
    payload: {
      type: 'voteSupport',
      holderId: 'p2',
      obligorId: 'p1',
      targetSpaceId,
      stance: 'no',
      tradeFromPlayerId: 'p2',
      tradeToPlayerId: 'p1',
    },
  }), /权限|义务|自己|own|obligation/i);
  assert.deepEqual(game.contracts, []);
});

test('LAN trade timestamps use server time instead of client payload time', () => {
  const realNow = Date.now;
  Date.now = () => 10_000;
  try {
    const store = deterministicStore();
    const host = store.createRoom({ playerName: 'Ada' }).client;
    store.joinRoom('ROOM1', { playerName: 'Lin' });
    store.startRoom('ROOM1', host.clientId);

    const snapshot = store.applyAction('ROOM1', host.clientId, {
      type: 'proposeTrade',
      payload: {
        fromPlayerId: 'p1',
        toPlayerId: 'p2',
        offer: { cash: 0 },
        request: { cash: 0 },
        now: 1_000_000_000,
      },
    });

    const trade = snapshot.room.game.pendingTrades[0];
    assert.equal(trade.createdAt, 10_000);
    assert.equal(trade.expiresAt, 70_000);
  } finally {
    Date.now = realNow;
  }
});

test('LAN trade expiry bumps room revision even when the triggering action fails', () => {
  const realNow = Date.now;
  Date.now = () => 10_000;
  try {
    const store = deterministicStore();
    const host = store.createRoom({ playerName: 'Ada' }).client;
    const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
    store.startRoom('ROOM1', host.clientId);
    const proposed = store.applyAction('ROOM1', host.clientId, {
      type: 'proposeTrade',
      payload: {
        fromPlayerId: 'p1',
        toPlayerId: 'p2',
        offer: { cash: 0 },
        request: { cash: 0 },
      },
    });
    const tradeId = proposed.room.game.pendingTrades[0].id;
    const revisionBeforeExpiry = store.rooms.get('ROOM1').revision;

    Date.now = () => 80_000;
    assert.throws(() => store.applyAction('ROOM1', guest.clientId, {
      type: 'acceptTrade',
      payload: { tradeId },
    }), /过期|待处理|pending/i);

    const room = store.rooms.get('ROOM1');
    assert.equal(room.game.pendingTrades[0].status, 'expired');
    assert.equal(room.revision, revisionBeforeExpiry + 1);
  } finally {
    Date.now = realNow;
  }
});

test('LAN trade expiry also bumps revision when acceptTrade itself expires the trade', () => {
  const realNow = Date.now;
  Date.now = () => 10_000;
  try {
    const store = deterministicStore();
    const host = store.createRoom({ playerName: 'Ada' }).client;
    const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
    store.startRoom('ROOM1', host.clientId);
    const proposed = store.applyAction('ROOM1', host.clientId, {
      type: 'proposeTrade',
      payload: {
        fromPlayerId: 'p1',
        toPlayerId: 'p2',
        offer: { cash: 0 },
        request: { cash: 0 },
      },
    });
    const tradeId = proposed.room.game.pendingTrades[0].id;
    const revisionBeforeExpiry = store.rooms.get('ROOM1').revision;
    const times = [69_999, 70_000];
    Date.now = () => times.shift() ?? 70_000;

    assert.throws(() => store.applyAction('ROOM1', guest.clientId, {
      type: 'acceptTrade',
      payload: { tradeId },
    }), /过期|expired/i);

    const room = store.rooms.get('ROOM1');
    assert.equal(room.game.pendingTrades[0].status, 'expired');
    assert.equal(room.revision, revisionBeforeExpiry + 1);
  } finally {
    Date.now = realNow;
  }
});

test('LAN room store lets an existing browser resume after refresh even after start', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  store.joinRoom('ROOM1', { playerName: 'Lin' });
  store.startRoom('ROOM1', host.clientId);

  assert.throws(() => store.joinRoom('ROOM1', { playerName: 'Ada again' }), /已经开始|started/i);

  const resumed = store.resumeRoom('room1', host.clientId);
  assert.equal(resumed.client.clientId, host.clientId);
  assert.equal(resumed.client.playerId, 'p1');
  assert.equal(resumed.room.lobby.started, true);
  assert.equal(resumed.room.game.players.length, 2);
});

test('LAN room store leave removes lobby guests and frees seats before start', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;

  const left = store.leaveRoom('room1', guest.clientId);

  assert.equal(left.room.lobby.players.length, 1);
  assert.equal(left.room.lobby.players[0].playerId, 'p1');
  assert.throws(() => store.startRoom('ROOM1', host.clientId), /至少需要 2|minimum|players/i);
  const rejoined = store.joinRoom('ROOM1', { playerName: 'Grace' });
  assert.equal(rejoined.client.playerId, 'p2');
});

test('LAN room store lets the host kick lobby guests before start', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
  const third = store.joinRoom('ROOM1', { playerName: 'Grace' }).client;

  const kicked = store.kickPlayer('ROOM1', host.clientId, { targetPlayerId: guest.playerId });

  assert.deepEqual(kicked.room.lobby.players.map((player) => player.name), ['Ada', 'Grace']);
  assert.equal(kicked.room.lobby.players[1].playerId, 'p2');
  assert.equal(kicked.room.revision, 4);

  assert.throws(
    () => store.kickPlayer('ROOM1', third.clientId, { targetPlayerId: host.playerId }),
    /房主|host/i,
  );
  assert.throws(
    () => store.kickPlayer('ROOM1', host.clientId, { targetPlayerId: host.playerId }),
    /不能踢出自己|yourself/i,
  );
  assert.throws(() => store.resumeRoom('ROOM1', guest.clientId), /不是该局域网房间的玩家|player/i);
});

test('LAN room store rejects kick after the game starts', () => {
  const store = deterministicStore();
  const host = store.createRoom({ playerName: 'Ada' }).client;
  const guest = store.joinRoom('ROOM1', { playerName: 'Lin' }).client;
  store.startRoom('ROOM1', host.clientId);

  assert.throws(
    () => store.kickPlayer('ROOM1', host.clientId, { targetPlayerId: guest.playerId }),
    /已经开始|started/i,
  );
});

test('LAN HTTP API exposes health URLs and supports create/join/start/resume/state/action/leave contract', async () => {
  const store = deterministicStore({ dice: [[1, 1]] });

  await withHttpServer(store, async (baseUrl) => {
    const health = await requestJson(baseUrl, '/api/health');
    assert.equal(health.ok, true);
    assert.ok(health.urls.some((url) => url.startsWith(baseUrl)), 'health should expose the actual server URL');

    const host = await requestJson(baseUrl, '/api/rooms', {
      method: 'POST',
      body: { playerName: 'Ada' },
    });
    const guest = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/join`, {
      method: 'POST',
      body: { playerName: 'Lin' },
    });
    assert.equal(guest.client.playerId, 'p2');

    const extraGuest = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/join`, {
      method: 'POST',
      body: { playerName: 'Grace' },
    });
    assert.equal(extraGuest.client.playerId, 'p3');

    const afterKick = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/kick`, {
      method: 'POST',
      body: {
        clientId: host.client.clientId,
        targetPlayerId: guest.client.playerId,
      },
    });
    assert.deepEqual(afterKick.room.lobby.players.map((player) => player.name), ['Ada', 'Grace']);
    assert.equal(afterKick.room.lobby.players[1].playerId, 'p2');

    const recolored = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/avatar-color`, {
      method: 'POST',
      body: {
        clientId: extraGuest.client.clientId,
        avatarColor: 'yellow',
      },
    });
    assert.equal(recolored.client.avatarColor, 'yellow');
    assert.equal(recolored.room.lobby.players[1].avatarColor, 'yellow');

    const started = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/start`, {
      method: 'POST',
      body: { clientId: host.client.clientId },
    });
    assert.equal(started.room.lobby.started, true);

    const resumed = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/resume`, {
      method: 'POST',
      body: { clientId: host.client.clientId },
    });
    assert.equal(resumed.client.playerId, 'p1');

    const state = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/state?clientId=${encodeURIComponent(extraGuest.client.clientId)}`);
    assert.equal(state.client.playerId, 'p2');

    await assert.rejects(
      () => requestJson(baseUrl, `/api/rooms/${host.roomCode}/state?clientId=${encodeURIComponent(guest.client.clientId)}`),
      /不是该局域网房间的玩家|player/i,
    );

    const rolled = await requestJson(baseUrl, `/api/rooms/${host.roomCode}/actions`, {
      method: 'POST',
      body: { clientId: host.client.clientId, action: { type: 'roll', payload: { dice: [6, 6] } } },
    });
    assert.deepEqual(rolled.room.game.lastDice, [1, 1]);

    await assert.rejects(
      () => requestJson(baseUrl, `/api/rooms/${host.roomCode}/leave`, {
        method: 'POST',
        body: { clientId: extraGuest.client.clientId },
      }),
      /进行中|started|cannot leave/i,
    );
  });
});
