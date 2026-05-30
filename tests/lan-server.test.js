import test from 'node:test';
import assert from 'node:assert/strict';

import { createRoomStore } from '../server.mjs';

function deterministicStore() {
  const clientIds = ['client-host', 'client-guest', 'client-third', 'client-fourth', 'client-extra'];
  return createRoomStore({
    createCode: () => 'ROOM1',
    createClientId: () => clientIds.shift(),
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
