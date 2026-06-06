import test from 'node:test';
import assert from 'node:assert/strict';

import { createRoomStore } from '../server.mjs';

function deterministicStore({ dice = [[1, 1], [1, 1], [1, 1]] } = {}) {
  const clientIds = ['client-host', 'client-guest', 'client-third', 'client-fourth', 'client-extra'];
  let diceIndex = 0;
  return createRoomStore({
    createCode: () => 'ROOM1',
    createClientId: () => clientIds.shift(),
    rollDice: () => dice[diceIndex++] ?? [1, 1],
  });
}

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
  const targetSpaceId = store.rooms.get('ROOM1').game.board.find((space) => space.type === 'property').id;

  assert.throws(() => store.applyAction('ROOM1', guest.clientId, {
    type: 'createContract',
    payload: {
      type: 'voteSupport',
      holderId: 'p2',
      obligorId: 'p1',
      targetSpaceId,
      stance: 'no',
    },
  }), /权限|义务|自己|own|obligation/i);
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
