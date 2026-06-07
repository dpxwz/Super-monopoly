import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyLanSnapshotToSession,
  clearStoredLanSession,
  loadStoredLanSession,
  saveStoredLanSession,
  shareUrlForRoom,
} from '../src/lan-client.js';

function fakeStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

test('LAN share URL prefers a non-loopback server URL when host opened localhost', () => {
  const url = shareUrlForRoom({
    origin: 'http://127.0.0.1:4173',
    pathname: '/',
    roomCode: 'AB12C',
    serverUrls: ['http://127.0.0.1:4173', 'http://192.168.1.50:4173'],
  });

  assert.equal(url, 'http://192.168.1.50:4173/?room=AB12C');
});

test('LAN snapshot application ignores stale room revisions', () => {
  const current = {
    mode: 'lan',
    roomCode: 'ROOM1',
    clientId: 'client-host',
    playerId: 'p1',
    isHost: true,
    room: {
      roomCode: 'ROOM1',
      revision: 4,
      game: { turn: 1 },
    },
  };

  const result = applyLanSnapshotToSession(current, {
    roomCode: 'ROOM1',
    client: { clientId: 'client-host', playerId: 'p1', isHost: true },
    room: {
      roomCode: 'ROOM1',
      revision: 3,
      game: { turn: 0 },
    },
  });

  assert.equal(result.applied, false);
  assert.equal(result.session.room.revision, 4);
  assert.equal(result.game, null);
});

test('LAN session storage round-trips only reconnect identity', () => {
  const storage = fakeStorage();
  saveStoredLanSession(storage, {
    mode: 'lan',
    roomCode: 'room1',
    clientId: 'client-host',
    playerId: 'p1',
    isHost: true,
    room: { revision: 99, game: { secret: true } },
  });

  assert.deepEqual(loadStoredLanSession(storage, 'ROOM1'), {
    roomCode: 'ROOM1',
    clientId: 'client-host',
    playerId: 'p1',
    isHost: true,
  });

  assert.equal(loadStoredLanSession(storage, 'OTHER'), null);
  clearStoredLanSession(storage);
  assert.equal(loadStoredLanSession(storage, 'ROOM1'), null);
});
