export const LAN_SESSION_STORAGE_KEY = 'super-monopoly:lan-session:v1';

export function normalizeRoomCode(rawCode) {
  return String(rawCode ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function roomCodeFromLocation(locationLike) {
  const search = locationLike?.search ?? '';
  return normalizeRoomCode(new URLSearchParams(search).get('room'));
}

export function saveStoredLanSession(storage, session) {
  const roomCode = normalizeRoomCode(session?.roomCode);
  const clientId = String(session?.clientId ?? '').trim();
  const playerId = String(session?.playerId ?? '').trim();
  if (!storage?.setItem || !roomCode || !clientId || !playerId) {
    return false;
  }
  storage.setItem(LAN_SESSION_STORAGE_KEY, JSON.stringify({
    roomCode,
    clientId,
    playerId,
    isHost: Boolean(session?.isHost),
  }));
  return true;
}

export function loadStoredLanSession(storage, expectedRoomCode = null) {
  if (!storage?.getItem) return null;
  let parsed;
  try {
    const raw = storage.getItem(LAN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const roomCode = normalizeRoomCode(parsed?.roomCode);
  const clientId = String(parsed?.clientId ?? '').trim();
  const playerId = String(parsed?.playerId ?? '').trim();
  const expected = normalizeRoomCode(expectedRoomCode);
  if (!roomCode || !clientId || !playerId) return null;
  if (expected && expected !== roomCode) return null;
  return {
    roomCode,
    clientId,
    playerId,
    isHost: Boolean(parsed?.isHost),
  };
}

export function clearStoredLanSession(storage) {
  if (storage?.removeItem) {
    storage.removeItem(LAN_SESSION_STORAGE_KEY);
  }
}

export function applyLanSnapshotToSession(currentSession, snapshot) {
  const currentRoom = currentSession?.room ?? null;
  const incomingRoom = snapshot?.room ?? null;
  const currentRevision = Number(currentRoom?.revision);
  const incomingRevision = Number(incomingRoom?.revision);
  if (Number.isFinite(currentRevision) && Number.isFinite(incomingRevision) && incomingRevision < currentRevision) {
    return {
      applied: false,
      session: currentSession,
      game: null,
    };
  }

  const client = snapshot?.client ?? currentSession ?? {};
  const room = incomingRoom ?? currentRoom;
  const session = {
    ...currentSession,
    mode: 'lan',
    roomCode: normalizeRoomCode(snapshot?.roomCode ?? room?.roomCode ?? currentSession?.roomCode),
    clientId: client.clientId ?? currentSession?.clientId ?? null,
    playerId: client.playerId ?? currentSession?.playerId ?? null,
    isHost: client.isHost ?? currentSession?.isHost ?? false,
    room,
  };

  return {
    applied: true,
    session,
    game: room?.game ?? null,
  };
}

export function shareUrlForRoom({ origin, pathname = '/', roomCode, serverUrls = [] } = {}) {
  const normalizedRoomCode = normalizeRoomCode(roomCode);
  if (!normalizedRoomCode) return '';

  const currentOrigin = String(origin ?? '').replace(/\/$/, '');
  const preferredServerUrl = isLoopbackOrigin(currentOrigin)
    ? serverUrls.find((url) => !isLoopbackOrigin(url))
    : null;
  const baseOrigin = preferredServerUrl ? new URL(preferredServerUrl).origin : currentOrigin;
  const cleanPathname = String(pathname || '/').startsWith('/') ? String(pathname || '/') : `/${pathname}`;
  return `${baseOrigin}${cleanPathname}?room=${encodeURIComponent(normalizedRoomCode)}`;
}

export function isLoopbackOrigin(originOrUrl) {
  try {
    const parsed = new URL(originOrUrl);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function isLoopbackHost(hostname) {
  const host = String(hostname ?? '').toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost'
    || host === '::1'
    || host === '0.0.0.0'
    || host.startsWith('127.');
}
