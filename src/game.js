import { t } from './i18n.js';

export const START_CASH = 1500;
export const LAP_BONUS = 200;
export const START_BONUS = LAP_BONUS;
export const MAX_PLAYERS = 4;
export const BOARD_SIDE_LENGTH = 12;

export const BANK_ID = 'bank';
export const SHARES_PER_PROPERTY = 10;
export const SHARE_PERCENT = 10;
export const MAJOR_SHAREHOLDER_SHARES = 3;
export const DIRECT_BUILD_SHARES = 5;
export const PENDING_TRADE_TIMEOUT_MS = 60_000;

export const CONTRACT_TYPES = Object.freeze({
  FREE_PASS: 'freePass',
  INHERITANCE: 'inheritance',
  VOTE_SUPPORT: 'voteSupport',
});

const START_SPACE = {
  id: 'start',
  type: 'start',
  name: '起始格',
  nameEn: 'Start',
  bonus: LAP_BONUS,
  description: `经过或停在这里获得 $${LAP_BONUS}`,
  descriptionEn: `Pass or land here to receive $${LAP_BONUS}`,
};

const CITY_GROUPS = [
  {
    colorGroup: 'greece-brown',
    colorName: '棕色',
    colorNameEn: 'Brown',
    countryName: '希腊',
    countryNameEn: 'Greece',
    color: '#8d6e63',
    priceStart: 60,
    houseCost: 50,
    baseRent: 2,
    cities: [
      ['thessaloniki', '塞萨洛尼基', 'Thessaloniki'],
      ['patras', '帕特雷', 'Patras'],
      ['heraklion', '伊拉克利翁', 'Heraklion'],
    ],
  },
  {
    colorGroup: 'portugal-sky',
    colorName: '天蓝色',
    colorNameEn: 'Sky Blue',
    countryName: '葡萄牙',
    countryNameEn: 'Portugal',
    color: '#74c0fc',
    priceStart: 100,
    houseCost: 60,
    baseRent: 6,
    cities: [
      ['lisbon', '里斯本', 'Lisbon'],
      ['porto', '波尔图', 'Porto'],
      ['coimbra', '科英布拉', 'Coimbra'],
      ['faro', '法鲁', 'Faro'],
    ],
  },
  {
    colorGroup: 'spain-pink',
    colorName: '粉色',
    colorNameEn: 'Pink',
    countryName: '西班牙',
    countryNameEn: 'Spain',
    color: '#f783ac',
    priceStart: 140,
    houseCost: 80,
    baseRent: 10,
    cities: [
      ['madrid', '马德里', 'Madrid'],
      ['barcelona', '巴塞罗那', 'Barcelona'],
      ['valencia', '瓦伦西亚', 'Valencia'],
      ['seville', '塞维利亚', 'Seville'],
    ],
  },
  {
    colorGroup: 'france-orange',
    colorName: '橙色',
    colorNameEn: 'Orange',
    countryName: '法国',
    countryNameEn: 'France',
    color: '#ffa94d',
    priceStart: 180,
    houseCost: 100,
    baseRent: 14,
    cities: [
      ['paris', '巴黎', 'Paris'],
      ['lyon', '里昂', 'Lyon'],
      ['marseille', '马赛', 'Marseille'],
      ['nice', '尼斯', 'Nice'],
    ],
  },
  {
    colorGroup: 'uk-red',
    colorName: '红色',
    colorNameEn: 'Red',
    countryName: '英国',
    countryNameEn: 'United Kingdom',
    color: '#ff6b6b',
    priceStart: 220,
    houseCost: 120,
    baseRent: 18,
    cities: [
      ['london', '伦敦', 'London'],
      ['manchester', '曼彻斯特', 'Manchester'],
      ['edinburgh', '爱丁堡', 'Edinburgh'],
      ['liverpool', '利物浦', 'Liverpool'],
    ],
  },
  {
    colorGroup: 'germany-yellow',
    colorName: '黄色',
    colorNameEn: 'Yellow',
    countryName: '德国',
    countryNameEn: 'Germany',
    color: '#ffd43b',
    priceStart: 260,
    houseCost: 140,
    baseRent: 22,
    cities: [
      ['berlin', '柏林', 'Berlin'],
      ['munich', '慕尼黑', 'Munich'],
      ['hamburg', '汉堡', 'Hamburg'],
      ['frankfurt', '法兰克福', 'Frankfurt'],
    ],
  },
  {
    colorGroup: 'italy-green',
    colorName: '绿色',
    colorNameEn: 'Green',
    countryName: '意大利',
    countryNameEn: 'Italy',
    color: '#69db7c',
    priceStart: 300,
    houseCost: 160,
    baseRent: 26,
    cities: [
      ['rome', '罗马', 'Rome'],
      ['milan', '米兰', 'Milan'],
      ['venice', '威尼斯', 'Venice'],
      ['florence', '佛罗伦萨', 'Florence'],
    ],
  },
  {
    colorGroup: 'japan-teal',
    colorName: '青色',
    colorNameEn: 'Teal',
    countryName: '日本',
    countryNameEn: 'Japan',
    color: '#63e6be',
    priceStart: 340,
    houseCost: 180,
    baseRent: 30,
    cities: [
      ['tokyo', '东京', 'Tokyo'],
      ['osaka', '大阪', 'Osaka'],
      ['kyoto', '京都', 'Kyoto'],
      ['sapporo', '札幌', 'Sapporo'],
    ],
  },
  {
    colorGroup: 'korea-blue',
    colorName: '蓝色',
    colorNameEn: 'Blue',
    countryName: '韩国',
    countryNameEn: 'South Korea',
    color: '#4dabf7',
    priceStart: 380,
    houseCost: 200,
    baseRent: 34,
    cities: [
      ['seoul', '首尔', 'Seoul'],
      ['busan', '釜山', 'Busan'],
      ['incheon', '仁川', 'Incheon'],
      ['daegu', '大邱', 'Daegu'],
    ],
  },
  {
    colorGroup: 'usa-purple',
    colorName: '紫色',
    colorNameEn: 'Purple',
    countryName: '美国',
    countryNameEn: 'United States',
    color: '#b197fc',
    priceStart: 420,
    houseCost: 220,
    baseRent: 38,
    cities: [
      ['new-york', '纽约', 'New York'],
      ['los-angeles', '洛杉矶', 'Los Angeles'],
      ['chicago', '芝加哥', 'Chicago'],
      ['san-francisco', '旧金山', 'San Francisco'],
    ],
  },
  {
    colorGroup: 'australia-gold',
    colorName: '金色',
    colorNameEn: 'Gold',
    countryName: '澳大利亚',
    countryNameEn: 'Australia',
    color: '#f3c969',
    priceStart: 460,
    houseCost: 240,
    baseRent: 42,
    cities: [
      ['sydney', '悉尼', 'Sydney'],
      ['melbourne', '墨尔本', 'Melbourne'],
      ['brisbane', '布里斯班', 'Brisbane'],
      ['perth', '珀斯', 'Perth'],
    ],
  },
];

const PROPERTY_SPACES = CITY_GROUPS.flatMap((group, groupIndex) => (
  group.cities.map(([id, name, nameEn], cityIndex) => {
    const baseRent = group.baseRent + cityIndex * 2;
    return {
      id,
      type: 'property',
      name,
      nameEn,
      countryName: group.countryName,
      countryNameEn: group.countryNameEn,
      colorGroup: group.colorGroup,
      colorName: group.colorName,
      colorNameEn: group.colorNameEn,
      color: group.color,
      groupOrder: groupIndex,
      groupSize: group.cities.length,
      price: group.priceStart + cityIndex * 10,
      rent: [baseRent, baseRent * 5, baseRent * 15, baseRent * 45, baseRent * 80],
      houseCost: group.houseCost,
    };
  })
));

export const BOARD_SPACES = [START_SPACE, ...PROPERTY_SPACES];

export function createGame(playerNames) {
  const names = normalizePlayerNames(playerNames);
  const board = cloneBoard(BOARD_SPACES);

  return {
    status: 'playing',
    phase: 'roll',
    turn: 0,
    round: 1,
    board,
    pendingOffer: null,
    pendingTrades: [],
    pendingVote: null,
    pendingConstruction: null,
    pendingAuction: null,
    contracts: [],
    lastDice: null,
    winnerId: null,
    nextTradeId: 1,
    nextContractId: 1,
    nextVoteId: 1,
    nextConstructionId: 1,
    players: names.map((name, index) => ({
      id: `p${index + 1}`,
      name,
      cash: START_CASH,
      position: 0,
      properties: [],
      bankrupt: false,
    })),
    log: ['新游戏开始。地块拆分为 10 股，银行持有未售股份。'],
  };
}

export function getCurrentPlayer(game) {
  return game.players[game.turn];
}

export function rollAndMove(game, dice = rollDice()) {
  assertPlaying(game);
  if (game.phase !== 'roll') {
    throw new Error(t('error.cannotRollNow'));
  }

  const player = getCurrentPlayer(game);
  if (player.bankrupt) {
    throw new Error(t('error.bankruptCannotAct'));
  }

  const normalizedDice = normalizeDice(dice);
  const steps = normalizedDice.reduce((sum, value) => sum + value, 0);
  game.lastDice = normalizedDice;

  movePlayerBy(game, player, steps, true);
  addLog(game, t('log.rolled', player.name, normalizedDice.join(' + '), steps, currentSpace(game, player).name));
  resolveLanding(game, player);

  return game;
}

export function buyCurrentShares(game, shareCount) {
  assertPlaying(game);
  const offer = game.pendingOffer;
  if (!offer || offer.type !== 'bankShares') {
    throw new Error(t('error.noPurchasableShares'));
  }
  if (!Number.isInteger(shareCount) || shareCount < 1 || shareCount > offer.maxShareCount) {
    throw new Error(t('error.shareCountRange', offer.maxShareCount));
  }

  const player = getPlayer(game, offer.playerId);
  const property = findSpace(game, offer.spaceId);
  const price = offer.pricePerShare * shareCount;
  if (player.cash < price) {
    throw new Error(t('error.insufficientCash', player.name));
  }

  const shareRefs = offer.availableShareIds.slice(0, shareCount).map((shareId) => ({
    spaceId: property.id,
    shareId,
  }));
  player.cash -= price;
  transferShares(game, BANK_ID, player.id, shareRefs);
  game.pendingOffer = null;
  game.phase = 'end';
  addLog(game, t('log.boughtShares', player.name, formatAmount(price), property.name, shareCount * SHARE_PERCENT));
  refreshCashRecoveryPhase(game);
  checkWinner(game);
  return property;
}

export function buyCurrentProperty(game) {
  const offer = game.pendingOffer;
  if (!offer || offer.type !== 'bankShares') {
    throw new Error(t('error.noPurchasableCity'));
  }
  return buyCurrentShares(game, offer.maxShareCount);
}

export function declineCurrentShareOffer(game) {
  if (!game.pendingOffer) {
    return null;
  }
  const player = getPlayer(game, game.pendingOffer.playerId);
  const property = findSpace(game, game.pendingOffer.spaceId);
  game.pendingOffer = null;
  game.phase = 'end';
  addLog(game, t('log.declinedShares', player.name, property.name));
  return property;
}

export function declineCurrentProperty(game) {
  return declineCurrentShareOffer(game);
}

export function buildHouse(game, propertyId) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  const property = assertProperty(game, propertyId);
  const eligibility = getBuildEligibility(game, property.id, player.id);
  if (!eligibility.canDirectBuild) {
    throw new Error(buildBlockedMessage(eligibility.reason));
  }
  if (property.houses >= property.rent.length - 1) {
    throw new Error(t('error.maxHouseLevel'));
  }

  return applyBuildCostsOrPause(game, property, 'direct');
}

export function demolishHouse(game, propertyId) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  const property = assertProperty(game, propertyId);
  const eligibility = getDemolishEligibility(game, property.id, player.id);
  if (!eligibility.canDirectDemolish) {
    throw new Error(demolishBlockedMessage(eligibility.reason));
  }

  return applyDemolitionRefunds(game, property, 'direct');
}

export function endTurn(game) {
  if (game.status === 'gameOver') {
    return game;
  }
  if (game.phase === 'auctionPending' || game.phase === 'buildPayment') {
    throw new Error(t('error.cannotEndTurnPaused'));
  }

  const currentPlayer = getCurrentPlayer(game);
  if (!currentPlayer.bankrupt && currentPlayer.cash <= 0) {
    game.phase = 'cashRecovery';
    throw new Error(t('error.cashMustBePositive', currentPlayer.name));
  }

  game.pendingOffer = null;
  const activePlayers = game.players.filter((player) => !player.bankrupt);
  if (activePlayers.length <= 1) {
    checkWinner(game);
    return game;
  }

  for (let attempts = 0; attempts < game.players.length * 2; attempts += 1) {
    const previousTurn = game.turn;
    game.turn = (game.turn + 1) % game.players.length;
    if (game.turn <= previousTurn) {
      game.round += 1;
    }

    const player = getCurrentPlayer(game);
    if (player.bankrupt) {
      continue;
    }

    if (player.cash <= 0) {
      game.phase = 'cashRecovery';
      addLog(game, t('log.cashRecoverySimple', player.name));
      return game;
    }

    game.phase = 'roll';
    addLog(game, t('log.turnTo', player.name));
    return game;
  }

  checkWinner(game);
  return game;
}

export function getOwnedProperties(game, playerId) {
  return getPlayerPropertyHoldings(game, playerId).map((holding) => holding.property);
}

export function getColorGroupProperties(game, colorGroup) {
  return game.board.filter((space) => isPurchasable(space) && space.colorGroup === colorGroup);
}

export function ownsCompleteColorGroup(game, playerId, colorGroup) {
  const group = getColorGroupProperties(game, colorGroup);
  return group.length > 0 && group.every((space) => getPlayerShareCount(game, space.id, playerId) === SHARES_PER_PROPERTY);
}

export function canBuildHouse(game, propertyId, playerId = getCurrentPlayer(game).id) {
  return getBuildEligibility(game, propertyId, playerId).canDirectBuild;
}

export function canDemolishHouse(game, propertyId, playerId = getCurrentPlayer(game).id) {
  return getDemolishEligibility(game, propertyId, playerId).canDirectDemolish;
}

export function getBuildEligibility(game, propertyId, playerId) {
  const property = findSpace(game, propertyId);
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player || !isPurchasable(property)) {
    return { canDirectBuild: false, canStartVote: false, reason: 'notFound' };
  }
  if (player.bankrupt) {
    return { canDirectBuild: false, canStartVote: false, reason: 'bankrupt' };
  }
  if (property.houses >= property.rent.length - 1) {
    return { canDirectBuild: false, canStartVote: false, reason: 'maxLevel' };
  }
  if (getBankShareCount(game, propertyId) > 0) {
    return { canDirectBuild: false, canStartVote: false, reason: 'bankSharesRemain' };
  }
  if (ownsCompleteColorGroup(game, playerId, property.colorGroup)) {
    return { canDirectBuild: true, canStartVote: false, reason: 'canDirectBuild' };
  }
  if (isColorGroupMajorShareholder(game, property.colorGroup, playerId)) {
    if (getPlayerShareCount(game, propertyId, playerId) >= DIRECT_BUILD_SHARES) {
      return { canDirectBuild: true, canStartVote: false, reason: 'canDirectBuild' };
    }
    return { canDirectBuild: false, canStartVote: true, reason: 'voteRequired' };
  }
  return { canDirectBuild: false, canStartVote: false, reason: 'notColorGroupMajorShareholder' };
}

export function getDemolishEligibility(game, propertyId, playerId) {
  const property = findSpace(game, propertyId);
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player || !isPurchasable(property)) {
    return { canDirectDemolish: false, canStartVote: false, reason: 'notFound' };
  }
  if (player.bankrupt) {
    return { canDirectDemolish: false, canStartVote: false, reason: 'bankrupt' };
  }
  if ((property.houses ?? 0) <= 0) {
    return { canDirectDemolish: false, canStartVote: false, reason: 'noHouses' };
  }
  if (getBankShareCount(game, propertyId) > 0) {
    return { canDirectDemolish: false, canStartVote: false, reason: 'bankSharesRemain' };
  }
  if (ownsCompleteColorGroup(game, playerId, property.colorGroup)) {
    return { canDirectDemolish: true, canStartVote: false, reason: 'canDirectDemolish' };
  }
  if (isColorGroupMajorShareholder(game, property.colorGroup, playerId)) {
    if (getPlayerShareCount(game, propertyId, playerId) >= DIRECT_BUILD_SHARES) {
      return { canDirectDemolish: true, canStartVote: false, reason: 'canDirectDemolish' };
    }
    return { canDirectDemolish: false, canStartVote: true, reason: 'voteRequired' };
  }
  return { canDirectDemolish: false, canStartVote: false, reason: 'notColorGroupMajorShareholder' };
}

export function getSpaceRent(space) {
  if (!isPurchasable(space)) {
    return 0;
  }
  return space.currentRent ?? space.rent[space.houses ?? 0] ?? space.rent[0];
}

export function rollDice(random = Math.random) {
  return [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)];
}

export function getPlayerShareCount(game, propertyId, playerId) {
  return assertProperty(game, propertyId).shares.filter((share) => share.ownerId === playerId).length;
}

export function getBankShareCount(game, propertyId) {
  return getPlayerShareCount(game, propertyId, BANK_ID);
}

export function getPropertyShareholders(game, propertyId, { includeBank = false } = {}) {
  const property = assertProperty(game, propertyId);
  const holders = new Map();
  for (const share of property.shares) {
    if (share.ownerId === BANK_ID && !includeBank) {
      continue;
    }
    if (!holders.has(share.ownerId)) {
      holders.set(share.ownerId, {
        playerId: share.ownerId,
        shareCount: 0,
        percent: 0,
        shareIds: [],
        shares: [],
      });
    }
    const holder = holders.get(share.ownerId);
    holder.shareCount += 1;
    holder.percent = holder.shareCount * SHARE_PERCENT;
    holder.shareIds.push(share.id);
    holder.shares.push(share);
  }
  return [...holders.values()];
}

export function getPlayerPropertyHoldings(game, playerId) {
  return game.board
    .filter(isPurchasable)
    .map((property) => {
      const shareIds = property.shares
        .filter((share) => share.ownerId === playerId)
        .map((share) => share.id);
      return {
        property,
        propertyId: property.id,
        shareCount: shareIds.length,
        percent: shareIds.length * SHARE_PERCENT,
        shareIds,
        shareRefs: shareIds.map((shareId) => ({ spaceId: property.id, shareId })),
      };
    })
    .filter((holding) => holding.shareCount > 0);
}

export function isFullyPlayerOwned(game, propertyId) {
  return getBankShareCount(game, propertyId) === 0;
}

export function isMajorShareholder(game, propertyId, playerId) {
  return getPlayerShareCount(game, propertyId, playerId) >= MAJOR_SHAREHOLDER_SHARES;
}

export function isColorGroupMajorShareholder(game, colorGroup, playerId) {
  const group = getColorGroupProperties(game, colorGroup);
  return group.length > 0 && group.every((property) => isMajorShareholder(game, property.id, playerId));
}

export function calculateRentPayments(game, propertyId, visitorId) {
  const property = assertProperty(game, propertyId);
  const rentPerShare = getSpaceRent(property) / SHARES_PER_PROPERTY;
  const payments = new Map();

  for (const share of property.shares) {
    if (share.ownerId === BANK_ID || share.ownerId === visitorId) {
      continue;
    }
    if (hasFreePassForShare(game, visitorId, property.id, share.id)) {
      continue;
    }
    if (!payments.has(share.ownerId)) {
      payments.set(share.ownerId, {
        toPlayerId: share.ownerId,
        shareCount: 0,
        amount: 0,
        shareIds: [],
      });
    }
    const payment = payments.get(share.ownerId);
    payment.shareCount += 1;
    payment.amount += rentPerShare;
    payment.shareIds.push(share.id);
  }

  return [...payments.values()];
}

export function transferShares(game, fromPlayerId, toPlayerId, shareRefs) {
  if (toPlayerId === BANK_ID) {
    throw new Error(t('error.soldSharesCannotReturn'));
  }
  if (toPlayerId !== BANK_ID) {
    getPlayer(game, toPlayerId);
  }
  if (fromPlayerId !== BANK_ID) {
    getPlayer(game, fromPlayerId);
  }

  const refs = normalizeShareRefs(shareRefs);
  const resolved = refs.map((shareRef) => ({ ...shareRef, share: getShare(game, shareRef) }));
  for (const { share } of resolved) {
    if (share.ownerId !== fromPlayerId) {
      throw new Error(t('error.shareNotOwned', share.id, fromPlayerId));
    }
    if (fromPlayerId !== BANK_ID && isShareInheritanceBound(game, share)) {
      throw new Error(t('error.inheritanceBound'));
    }
  }

  for (const { share } of resolved) {
    share.ownerId = toPlayerId;
    share.sold = true;
  }
  syncPlayerProperties(game);
  const affectedPropertyIds = new Set(resolved.map(({ spaceId }) => spaceId));
  if (game.suppressConstructionRefresh) {
    game.deferredConstructionPropertyIds ??= new Set();
    for (const spaceId of affectedPropertyIds) {
      game.deferredConstructionPropertyIds.add(spaceId);
    }
  } else {
    refreshPendingConstructionForShareTransfer(game, affectedPropertyIds);
  }
  return resolved.map(({ share }) => share);
}

export function proposeTrade(game, draft) {
  const from = getPlayer(game, draft.fromPlayerId);
  const to = getPlayer(game, draft.toPlayerId);
  if (from.id === to.id) {
    throw new Error(t('error.tradeSamePlayer'));
  }
  const now = Number.isFinite(draft.now) ? draft.now : Date.now();
  const trade = {
    id: `t${game.nextTradeId++}`,
    fromPlayerId: from.id,
    toPlayerId: to.id,
    offer: normalizeTradeAssets(draft.offer),
    request: normalizeTradeAssets(draft.request),
    note: draft.note ?? '',
    status: 'pending',
    createdAt: now,
    expiresAt: now + PENDING_TRADE_TIMEOUT_MS,
  };
  game.pendingTrades.push(trade);
  addLog(game, t('log.tradeProposed', from.name, to.name));
  return trade;
}

export function acceptTrade(game, tradeId, now = Date.now()) {
  const trade = getTrade(game, tradeId);
  if (trade.status !== 'pending') {
    throw new Error(t('error.onlyPendingTrade'));
  }
  if (now >= trade.expiresAt) {
    trade.status = 'expired';
    throw new Error(t('error.tradeExpired'));
  }

  validateTradeLeg(game, trade.fromPlayerId, trade.offer);
  validateTradeLeg(game, trade.toPlayerId, trade.request);

  const wasSuppressingConstruction = game.suppressConstructionRefresh === true;
  if (!wasSuppressingConstruction) {
    game.suppressConstructionRefresh = true;
    game.deferredConstructionPropertyIds = new Set();
  }
  try {
    applyTradeLeg(game, trade.fromPlayerId, trade.toPlayerId, trade.offer);
    applyTradeLeg(game, trade.toPlayerId, trade.fromPlayerId, trade.request);
  } finally {
    if (!wasSuppressingConstruction) {
      const affectedPropertyIds = game.deferredConstructionPropertyIds;
      game.suppressConstructionRefresh = false;
      game.deferredConstructionPropertyIds = null;
      refreshPendingConstructionForShareTransfer(game, affectedPropertyIds ?? new Set());
    }
  }
  trade.status = 'accepted';
  addLog(game, t('log.tradeAccepted', trade.id));
  refreshCashRecoveryPhase(game);
  return trade;
}

export function rejectTrade(game, tradeId) {
  const trade = getTrade(game, tradeId);
  if (trade.status === 'pending') {
    trade.status = 'rejected';
  }
  return trade;
}

export function expirePendingTrades(game, now = Date.now()) {
  const expired = [];
  for (const trade of game.pendingTrades) {
    if (trade.status === 'pending' && now - trade.createdAt >= PENDING_TRADE_TIMEOUT_MS) {
      trade.status = 'expired';
      expired.push(trade);
    }
  }
  return expired;
}

export function createFreePassContract(game, { holderId, shareRefs }) {
  getPlayer(game, holderId);
  return createShareBoundContract(game, CONTRACT_TYPES.FREE_PASS, holderId, shareRefs);
}

export function createInheritanceContract(game, { holderId, shareRefs }) {
  getPlayer(game, holderId);
  return createShareBoundContract(game, CONTRACT_TYPES.INHERITANCE, holderId, shareRefs);
}

export function createVoteSupportContract(game, {
  holderId,
  obligorId,
  targetSpaceId,
  voteType = 'build',
  stance,
  remainingUses = 1,
}) {
  getPlayer(game, holderId);
  getPlayer(game, obligorId);
  assertProperty(game, targetSpaceId);
  if (!['yes', 'no'].includes(stance)) {
    throw new Error(t('error.voteSupportStance'));
  }
  const conflicting = game.contracts.find((contract) => (
    contract.status === 'active'
    && contract.type === CONTRACT_TYPES.VOTE_SUPPORT
    && contract.obligorId === obligorId
    && contract.targetSpaceId === targetSpaceId
    && contract.voteType === voteType
    && contract.remainingUses > 0
    && contract.stance !== stance
  ));
  if (conflicting) {
    throw new Error(t('error.conflictingVoteSupport'));
  }
  const contract = {
    id: `c${game.nextContractId++}`,
    type: CONTRACT_TYPES.VOTE_SUPPORT,
    holderId,
    obligorId,
    targetSpaceId,
    voteType,
    stance,
    remainingUses,
    status: 'active',
  };
  game.contracts.push(contract);
  return contract;
}

export function transferContract(game, contractId, toPlayerId) {
  const contract = getContract(game, contractId);
  getPlayer(game, toPlayerId);
  if (contract.status !== 'active') {
    throw new Error(t('error.contractNotTradable'));
  }
  contract.holderId = toPlayerId;
  return contract;
}

export function buyBackContract(game, contractId, buyerId) {
  const contract = getContract(game, contractId);
  if (![CONTRACT_TYPES.FREE_PASS, CONTRACT_TYPES.INHERITANCE].includes(contract.type)) {
    throw new Error(t('error.onlyFreePassOrInheritance'));
  }
  if (contract.status !== 'active') {
    return contract;
  }
  const refs = normalizeShareRefs(contract.shareRefs);
  const allOwnedByBuyer = refs.every((shareRef) => getShare(game, shareRef).ownerId === buyerId);
  if (!allOwnedByBuyer) {
    throw new Error(t('error.onlyShareOwnerBuyBack'));
  }
  contract.status = 'void';
  for (const shareRef of refs) {
    const share = getShare(game, shareRef);
    share.encumbranceContractIds = share.encumbranceContractIds.filter((id) => id !== contract.id);
  }
  return contract;
}

export function startBuildVote(game, propertyId) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  const property = assertProperty(game, propertyId);
  const eligibility = getBuildEligibility(game, property.id, player.id);
  if (!eligibility.canStartVote) {
    throw new Error(buildBlockedMessage(eligibility.reason));
  }
  const vote = {
    id: `v${game.nextVoteId++}`,
    type: 'build',
    spaceId: property.id,
    initiatorId: player.id,
    votes: {},
    status: 'open',
  };
  game.pendingVote = vote;
  game.phase = 'vote';
  addLog(game, t('log.buildVoteStarted', player.name, property.name));
  return vote;
}

export function startDemolishVote(game, propertyId) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  const property = assertProperty(game, propertyId);
  const eligibility = getDemolishEligibility(game, property.id, player.id);
  if (!eligibility.canStartVote) {
    throw new Error(demolishBlockedMessage(eligibility.reason));
  }
  const vote = {
    id: `v${game.nextVoteId++}`,
    type: 'demolish',
    spaceId: property.id,
    initiatorId: player.id,
    votes: {},
    status: 'open',
  };
  game.pendingVote = vote;
  game.phase = 'vote';
  addLog(game, t('log.demolishVoteStarted', player.name, property.name));
  return vote;
}

export function castBuildVote(game, voteId, playerId, stance) {
  const vote = getVote(game, voteId);
  if (vote.status !== 'open') {
    throw new Error(t('error.voteEnded'));
  }
  if (!['yes', 'no'].includes(stance)) {
    throw new Error(t('error.voteMustBeYesNo'));
  }
  if (getPlayerShareCount(game, vote.spaceId, playerId) <= 0) {
    throw new Error(t('error.onlyShareholdersVote'));
  }
  const forced = getForcedVoteStance(game, playerId, vote.spaceId, vote.type);
  if (forced && forced !== stance) {
    throw new Error(t('error.forcedVoteConflict'));
  }
  vote.votes[playerId] = stance;
  return vote;
}

export function resolveBuildVote(game, voteId) {
  const vote = getVote(game, voteId);
  if (vote.status !== 'open') {
    return { passed: vote.status === 'passed' };
  }
  const property = assertProperty(game, vote.spaceId);
  applyForcedVoteSupportContracts(game, vote);
  let yesShareCount = 0;
  let noShareCount = 0;
  for (const [playerId, stance] of Object.entries(vote.votes)) {
    const count = getPlayerShareCount(game, property.id, playerId);
    if (stance === 'yes') {
      yesShareCount += count;
    } else if (stance === 'no') {
      noShareCount += count;
    }
  }
  const passed = yesShareCount >= DIRECT_BUILD_SHARES;
  vote.status = passed ? 'passed' : 'failed';
  consumeVoteSupportContracts(game, vote);
  if (passed) {
    if (vote.type === 'demolish') {
      applyDemolitionRefunds(game, property, 'vote');
    } else {
      applyBuildCostsOrPause(game, property, 'vote');
    }
  } else {
    game.phase = 'end';
  }
  game.pendingVote = null;
  return { passed, yesShareCount, noShareCount };
}

export function resolvePendingConstruction(game) {
  if (!game.pendingConstruction) {
    throw new Error(t('error.noPendingConstruction'));
  }
  return refreshPendingConstruction(game);
}

export function declareBankruptcy(game, playerId, { type = 'passive', reason = '破产' } = {}) {
  const player = getPlayer(game, playerId);
  if (player.bankrupt) {
    return player;
  }

  player.bankrupt = true;
  player.cash = 0;
  applyInheritanceOnBankruptcy(game, player.id);

  const assets = [];
  for (const property of game.board.filter(isPurchasable)) {
    for (const share of property.shares) {
      if (share.ownerId === player.id) {
        assets.push({ type: 'share', propertyId: property.id, shareId: share.id });
      }
    }
  }
  for (const contract of game.contracts) {
    if (contract.holderId === player.id && contract.status === 'active') {
      assets.push({ type: 'contract', contractId: contract.id, contractType: contract.type });
    }
  }

  game.pendingOffer = null;
  game.pendingAuction = {
    bankruptPlayerId: player.id,
    bankruptcyType: type,
    reason,
    assets,
    unresolvedRules: [
      t('auction.unresolved.flow'),
      t('auction.unresolved.cash'),
      t('auction.unresolved.participants'),
    ],
  };
  game.phase = 'auctionPending';
  addLog(game, t('log.bankruptcy', player.name, reason));
  syncPlayerProperties(game);
  checkWinner(game);
  return player;
}

function resolveLanding(game, player) {
  if (game.status === 'gameOver') {
    return;
  }

  const space = currentSpace(game, player);
  game.pendingOffer = null;

  if (space.type === 'start') {
    game.phase = 'end';
    addLog(game, t('log.stoppedAtStart', player.name));
    checkWinner(game);
    return;
  }

  resolvePurchasableSpace(game, player, space);
  checkWinner(game);
}

function resolvePurchasableSpace(game, player, space) {
  const rentResolved = resolveRent(game, player, space);
  if (!rentResolved || game.phase === 'auctionPending' || player.bankrupt) {
    return;
  }

  const bankShares = space.shares.filter((share) => share.ownerId === BANK_ID);
  if (bankShares.length > 0) {
    game.pendingOffer = makeBankShareOffer(space, player.id, bankShares);
    game.phase = 'action';
    addLog(game, t('log.bankSharesAvailable', space.name, bankShares.length * SHARE_PERCENT));
    return;
  }

  game.phase = 'end';
  addLog(game, t('log.noBankShares', player.name, space.name));
}

function resolveRent(game, player, property) {
  const payments = calculateRentPayments(game, property.id, player.id);
  for (const payment of payments) {
    const recipient = getPlayer(game, payment.toPlayerId);
    player.cash -= payment.amount;
    recipient.cash += payment.amount;
    addLog(game, t('log.paidRent', player.name, recipient.name, property.name, formatAmount(payment.amount)));
  }
  if (payments.length > 0 && player.cash <= 0) {
    game.pendingOffer = null;
    game.phase = 'cashRecovery';
    addLog(game, t('log.cashRecovery', player.name));
    return false;
  }
  return true;
}

function movePlayerBy(game, player, steps, payLapBonus) {
  const previousPosition = player.position;
  const boardLength = game.board.length;
  const total = previousPosition + steps;
  player.position = ((total % boardLength) + boardLength) % boardLength;

  if (payLapBonus && steps > 0 && total >= boardLength) {
    adjustCash(game, player, LAP_BONUS);
    addLog(game, t('log.lapBonus', player.name, LAP_BONUS));
  }
}

function adjustCash(game, player, amount) {
  player.cash += amount;
  if (amount > 0) {
    addLog(game, t('log.received', player.name, formatAmount(amount)));
  } else if (amount < 0) {
    addLog(game, t('log.paid', player.name, formatAmount(Math.abs(amount))));
  }
}

function applyBuildCostsOrPause(game, property, source) {
  const allocations = makeBuildCostAllocations(game, property);
  const insufficientPlayerIds = insufficientPlayersForAllocations(game, allocations);

  if (insufficientPlayerIds.length > 0) {
    game.pendingConstruction = {
      id: `build${game.nextConstructionId++}`,
      propertyId: property.id,
      source,
      targetHouses: property.houses + 1,
      costAllocations: allocations,
      insufficientPlayerIds,
      status: 'collecting',
    };
    game.phase = 'buildPayment';
    addLog(game, t('log.buildCostPending', property.name));
    return game.pendingConstruction;
  }

  return completeConstructionWithAllocations(game, property, allocations, property.houses + 1);
}

function makeBuildCostAllocations(game, property) {
  return getPropertyShareholders(game, property.id).map((holder) => ({
    playerId: holder.playerId,
    shareCount: holder.shareCount,
    shareIds: [...holder.shareIds],
    amount: (property.houseCost * holder.shareCount) / SHARES_PER_PROPERTY,
    paid: false,
  }));
}

function insufficientPlayersForAllocations(game, allocations) {
  return allocations
    .filter((allocation) => getPlayer(game, allocation.playerId).cash < allocation.amount)
    .map((allocation) => allocation.playerId);
}

function completeConstructionWithAllocations(game, property, allocations, targetHouses) {
  for (const allocation of allocations) {
    const payer = getPlayer(game, allocation.playerId);
    payer.cash -= allocation.amount;
    allocation.paid = true;
  }
  property.houses = targetHouses;
  property.currentRent = property.rent[property.houses];
  game.pendingConstruction = null;
  game.phase = 'end';
  addLog(game, t('log.buildComplete', property.name));
  refreshCashRecoveryPhase(game);
  return property;
}

function applyDemolitionRefunds(game, property, source) {
  if ((property.houses ?? 0) <= 0) {
    throw new Error(t('error.noHouseToDemolish'));
  }
  const allocations = makeBuildCostAllocations(game, property);
  for (const allocation of allocations) {
    const recipient = getPlayer(game, allocation.playerId);
    recipient.cash += allocation.amount;
    allocation.paid = true;
  }
  property.houses -= 1;
  property.currentRent = property.rent[property.houses];
  game.phase = 'end';
  addLog(game, t('log.demolishComplete', property.name));
  refreshCashRecoveryPhase(game);
  return property;
}

function refreshPendingConstructionForShareTransfer(game, affectedPropertyIds) {
  if (!game.pendingConstruction || !affectedPropertyIds.has(game.pendingConstruction.propertyId)) {
    return game.pendingConstruction;
  }
  return refreshPendingConstruction(game);
}

function refreshPendingConstruction(game) {
  const construction = game.pendingConstruction;
  if (!construction) {
    return null;
  }
  const property = assertProperty(game, construction.propertyId);
  const allocations = makeBuildCostAllocations(game, property);
  const insufficientPlayerIds = insufficientPlayersForAllocations(game, allocations);
  construction.costAllocations = allocations;
  construction.insufficientPlayerIds = insufficientPlayerIds;
  if (game.phase === 'auctionPending') {
    return construction;
  }
  if (insufficientPlayerIds.length > 0) {
    game.phase = 'buildPayment';
    return construction;
  }
  return completeConstructionWithAllocations(game, property, allocations, construction.targetHouses);
}

function applyInheritanceOnBankruptcy(game, bankruptPlayerId) {
  for (const contract of game.contracts) {
    if (contract.type !== CONTRACT_TYPES.INHERITANCE || contract.status !== 'active') {
      continue;
    }
    let inheritedAny = false;
    for (const shareRef of contract.shareRefs) {
      const share = getShare(game, shareRef);
      if (share.ownerId === bankruptPlayerId) {
        share.ownerId = contract.holderId;
        share.sold = true;
        share.encumbranceContractIds = share.encumbranceContractIds.filter((id) => id !== contract.id);
        inheritedAny = true;
      }
    }
    if (inheritedAny) {
      contract.status = 'fulfilled';
    }
  }
}

function createShareBoundContract(game, type, holderId, shareRefs) {
  const refs = normalizeShareRefs(shareRefs);
  for (const ref of refs) {
    const share = getShare(game, ref);
    const duplicateContract = share.encumbranceContractIds
      .map((contractId) => game.contracts.find((candidate) => candidate.id === contractId))
      .find((contract) => contract && contract.status === 'active' && contract.type === type);
    if (duplicateContract) {
      throw new Error(t('error.duplicateContractType'));
    }
  }
  const contract = {
    id: `c${game.nextContractId++}`,
    type,
    holderId,
    shareRefs: refs,
    status: 'active',
  };
  game.contracts.push(contract);
  for (const ref of refs) {
    const share = getShare(game, ref);
    if (!share.encumbranceContractIds.includes(contract.id)) {
      share.encumbranceContractIds.push(contract.id);
    }
  }
  return contract;
}

function hasFreePassForShare(game, visitorId, propertyId, shareId) {
  const share = getShare(game, { spaceId: propertyId, shareId });
  return share.encumbranceContractIds.some((contractId) => {
    const contract = game.contracts.find((candidate) => candidate.id === contractId);
    return contract
      && contract.status === 'active'
      && contract.type === CONTRACT_TYPES.FREE_PASS
      && contract.holderId === visitorId;
  });
}

function isShareInheritanceBound(game, share) {
  return share.encumbranceContractIds.some((contractId) => {
    const contract = game.contracts.find((candidate) => candidate.id === contractId);
    return contract && contract.status === 'active' && contract.type === CONTRACT_TYPES.INHERITANCE;
  });
}

function getForcedVoteStance(game, playerId, targetSpaceId, voteType) {
  const contract = game.contracts.find((candidate) => (
    candidate.status === 'active'
    && candidate.type === CONTRACT_TYPES.VOTE_SUPPORT
    && candidate.obligorId === playerId
    && candidate.targetSpaceId === targetSpaceId
    && candidate.voteType === voteType
    && candidate.remainingUses > 0
  ));
  return contract?.stance ?? null;
}

function applyForcedVoteSupportContracts(game, vote) {
  vote.appliedVoteSupportContractIds ??= [];
  for (const contract of game.contracts) {
    if (!isMatchingVoteSupportContract(game, contract, vote)) {
      continue;
    }
    const existingStance = vote.votes[contract.obligorId];
    if (existingStance && existingStance !== contract.stance) {
      throw new Error(t('error.voteSupportConflict'));
    }
    vote.votes[contract.obligorId] = contract.stance;
    if (!vote.appliedVoteSupportContractIds.includes(contract.id)) {
      vote.appliedVoteSupportContractIds.push(contract.id);
    }
  }
}

function isMatchingVoteSupportContract(game, contract, vote) {
  return contract.status === 'active'
    && contract.type === CONTRACT_TYPES.VOTE_SUPPORT
    && contract.targetSpaceId === vote.spaceId
    && contract.voteType === vote.type
    && contract.remainingUses > 0
    && getPlayerShareCount(game, vote.spaceId, contract.obligorId) > 0;
}

function consumeVoteSupportContracts(game, vote) {
  for (const contractId of vote.appliedVoteSupportContractIds ?? []) {
    const contract = game.contracts.find((candidate) => candidate.id === contractId);
    if (contract && contract.status === 'active' && contract.remainingUses > 0) {
      contract.remainingUses -= 1;
      if (contract.remainingUses <= 0) {
        contract.remainingUses = 0;
        contract.status = 'fulfilled';
      }
    }
  }
}

function normalizeTradeAssets(assets = {}) {
  return {
    cash: Number(assets.cash ?? 0),
    shareRefs: normalizeShareRefs(assets.shareRefs ?? []),
    contractIds: [...(assets.contractIds ?? [])],
  };
}

function validateTradeLeg(game, ownerId, assets) {
  const owner = getPlayer(game, ownerId);
  if (assets.cash > 0 && owner.cash < assets.cash) {
    throw new Error(t('error.cashInsufficientForTrade', owner.name));
  }
  for (const shareRef of assets.shareRefs) {
    const share = getShare(game, shareRef);
    if (share.ownerId !== ownerId) {
      throw new Error(t('error.shareNotOwned', share.id, ownerId));
    }
    if (isShareInheritanceBound(game, share)) {
      throw new Error(t('error.inheritanceBound'));
    }
  }
  for (const contractId of assets.contractIds) {
    const contract = getContract(game, contractId);
    if (contract.holderId !== ownerId) {
      throw new Error(t('error.contractNotOwned', contract.id, ownerId));
    }
    if (contract.status !== 'active') {
      throw new Error(t('error.contractNotActive', contract.id));
    }
  }
}

function applyTradeLeg(game, fromPlayerId, toPlayerId, assets) {
  if (assets.cash > 0) {
    const from = getPlayer(game, fromPlayerId);
    const to = getPlayer(game, toPlayerId);
    from.cash -= assets.cash;
    to.cash += assets.cash;
  }
  if (assets.shareRefs.length > 0) {
    transferShares(game, fromPlayerId, toPlayerId, assets.shareRefs);
  }
  for (const contractId of assets.contractIds) {
    transferContract(game, contractId, toPlayerId);
  }
}

function makeBankShareOffer(property, playerId, bankShares) {
  const pricePerShare = property.price / SHARES_PER_PROPERTY;
  return {
    type: 'bankShares',
    spaceId: property.id,
    playerId,
    availableShareIds: bankShares.map((share) => share.id),
    maxShareCount: bankShares.length,
    pricePerShare,
    price: pricePerShare * bankShares.length,
  };
}

function syncPlayerProperties(game) {
  for (const player of game.players) {
    player.properties = getPlayerPropertyHoldings(game, player.id).map((holding) => holding.propertyId);
  }
}

function checkWinner(game) {
  const activePlayers = game.players.filter((player) => !player.bankrupt);
  if (activePlayers.length === 1) {
    game.status = 'gameOver';
    game.phase = 'gameOver';
    game.winnerId = activePlayers[0].id;
    addLog(game, t('log.winner', activePlayers[0].name));
  }
}

function refreshCashRecoveryPhase(game) {
  if (!game || game.status === 'gameOver') {
    return;
  }
  if (game.phase === 'auctionPending' || game.phase === 'buildPayment' || game.phase === 'vote') {
    return;
  }
  const player = getCurrentPlayer(game);
  if (player.bankrupt) {
    return;
  }
  if (player.cash <= 0) {
    game.pendingOffer = null;
    game.phase = 'cashRecovery';
    return;
  }
  if (game.phase === 'cashRecovery') {
    game.phase = 'end';
    addLog(game, t('log.cashRecovered', player.name));
  }
}

function currentSpace(game, player) {
  return game.board[player.position];
}

function findSpace(game, spaceId) {
  return game.board.find((space) => space.id === spaceId);
}

function assertProperty(game, propertyId) {
  const property = findSpace(game, propertyId);
  if (!isPurchasable(property)) {
    throw new Error(t('error.cityNotFound'));
  }
  return property;
}

function getPlayer(game, playerId) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new Error(t('error.playerNotFound', playerId));
  }
  return player;
}

function getShare(game, shareRef) {
  const property = assertProperty(game, shareRef.spaceId);
  const share = property.shares.find((candidate) => candidate.id === shareRef.shareId);
  if (!share) {
    throw new Error(t('error.shareNotFound', shareRef.shareId));
  }
  return share;
}

function getContract(game, contractId) {
  const contract = game.contracts.find((candidate) => candidate.id === contractId);
  if (!contract) {
    throw new Error(t('error.contractNotFound', contractId));
  }
  return contract;
}

function getTrade(game, tradeId) {
  const trade = game.pendingTrades.find((candidate) => candidate.id === tradeId);
  if (!trade) {
    throw new Error(t('error.tradeNotFound', tradeId));
  }
  return trade;
}

function getVote(game, voteId) {
  const vote = game.pendingVote?.id === voteId ? game.pendingVote : null;
  if (!vote) {
    throw new Error(t('error.voteNotFound', voteId));
  }
  return vote;
}

function normalizeShareRefs(shareRefs) {
  return [...(shareRefs ?? [])].map((shareRef) => ({
    spaceId: shareRef.spaceId,
    shareId: shareRef.shareId,
  }));
}

function isPurchasable(space) {
  return space?.type === 'property';
}

function cloneBoard(spaces) {
  return spaces.map((space) => {
    if (space.type === 'start') {
      return { ...space };
    }

    return {
      ...space,
      rent: [...space.rent],
      houses: 0,
      currentRent: space.rent[0],
      shares: Array.from({ length: SHARES_PER_PROPERTY }, (_, index) => ({
        id: `${space.id}:s${index + 1}`,
        index,
        ownerId: BANK_ID,
        sold: false,
        encumbranceContractIds: [],
      })),
    };
  });
}

function normalizePlayerNames(playerNames) {
  const names = playerNames
    .map((name) => String(name).trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);

  if (names.length < 2) {
    return [t('ui.player1') || '玩家 1', t('ui.player2') || '玩家 2'];
  }
  return names;
}

function normalizeDice(dice) {
  if (!Array.isArray(dice) || dice.length === 0) {
    throw new Error(t('error.diceMustBeArray'));
  }
  for (const value of dice) {
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      throw new Error(t('error.diceValueRange'));
    }
  }
  return dice;
}

function assertPlaying(game) {
  if (!game || game.status === 'gameOver') {
    throw new Error(t('error.gameOver'));
  }
}

function buildBlockedMessage(reason) {
  return {
    notFound: t('error.cityNotFound'),
    bankrupt: t('error.cannotBuildBankrupt'),
    maxLevel: t('error.maxHouseLevel'),
    bankSharesRemain: t('error.bankSharesBlockBuild'),
    notColorGroupMajorShareholder: t('error.notColorGroupMajor'),
    voteRequired: t('error.needBuildVote'),
    canDirectBuild: t('error.canDirectBuild'),
  }[reason] ?? t('error.cannotBuildNow');
}

function demolishBlockedMessage(reason) {
  return {
    notFound: t('error.cityNotFound'),
    bankrupt: t('error.cannotDemolishBankrupt'),
    noHouses: t('error.noHouseToDemolish'),
    bankSharesRemain: t('error.bankSharesBlockDemolish'),
    notColorGroupMajorShareholder: t('error.notColorGroupMajor'),
    voteRequired: t('error.needDemolishVote'),
    canDirectDemolish: t('error.canDirectDemolish'),
  }[reason] ?? t('error.cannotDemolishNow');
}

function addLog(game, message) {
  game.log.unshift(message);
  if (game.log.length > 100) {
    game.log.length = 100;
  }
}

function formatAmount(amount) {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
