export const PLAYER_AVATAR_COLORS = [
  { id: 'red', cssVar: 'var(--player-1)', labelKey: 'ui.avatarColor.red' },
  { id: 'blue', cssVar: 'var(--player-2)', labelKey: 'ui.avatarColor.blue' },
  { id: 'green', cssVar: 'var(--player-3)', labelKey: 'ui.avatarColor.green' },
  { id: 'yellow', cssVar: 'var(--player-4)', labelKey: 'ui.avatarColor.yellow' },
];

const PLAYER_AVATAR_COLOR_IDS = new Set(PLAYER_AVATAR_COLORS.map((color) => color.id));

export function normalizeAvatarColorId(value) {
  const id = String(value ?? '').trim().toLowerCase();
  return PLAYER_AVATAR_COLOR_IDS.has(id) ? id : null;
}

export function avatarColorCss(colorId, fallbackIndex = 0) {
  const normalized = normalizeAvatarColorId(colorId);
  const index = Math.max(0, Number(fallbackIndex) || 0);
  const fallback = PLAYER_AVATAR_COLORS[index % PLAYER_AVATAR_COLORS.length] ?? PLAYER_AVATAR_COLORS[0];
  return (PLAYER_AVATAR_COLORS.find((color) => color.id === normalized) ?? fallback).cssVar;
}

export function nextAvailableAvatarColor(usedColorIds = [], preferredIndex = 0) {
  const usedValues = typeof usedColorIds === 'string'
    ? [usedColorIds]
    : [...(usedColorIds ?? [])];
  const used = new Set(usedValues.map(normalizeAvatarColorId).filter(Boolean));
  const index = Math.max(0, Number(preferredIndex) || 0);
  const preferred = PLAYER_AVATAR_COLORS[index % PLAYER_AVATAR_COLORS.length];
  if (preferred && !used.has(preferred.id)) {
    return preferred.id;
  }
  return PLAYER_AVATAR_COLORS.find((color) => !used.has(color.id))?.id ?? null;
}
