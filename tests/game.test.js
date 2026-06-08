import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BANK_ID,
  BOARD_SIDE_LENGTH,
  BOARD_SPACES,
  CONTRACT_TYPES,
  DIRECT_BUILD_SHARES,
  LAP_BONUS,
  MAJOR_SHAREHOLDER_SHARES,
  SHARE_PERCENT,
  SHARES_PER_PROPERTY,
  acceptTrade,
  buildHouse,
  buyBackContract,
  buyCurrentProperty,
  buyCurrentShares,
  calculateRentPayments,
  canBuildHouse,
  canDemolishHouse,
  castBuildVote,
  createFreePassContract,
  createGame,
  createInheritanceContract,
  createVoteSupportContract,
  advanceBankruptcyAuction,
  AUCTION_LOT_TIMEOUT_MS,
  AUCTION_STARTING_BID,
  declareBankruptcy,
  getMinimumAuctionBid,
  isBankruptcyAuctionActive,
  placeAuctionBid,
  getContractDisplayName,
  declineCurrentShareOffer,
  demolishHouse,
  endTurn,
  expirePendingTrades,
  getBankShareCount,
  getBuildEligibility,
  getColorGroupProperties,
  getCurrentPlayer,
  getDemolishEligibility,
  getOwnedProperties,
  getPlayerPropertyHoldings,
  getPlayerShareCount,
  getPropertyShareholders,
  getTradeableShareCount,
  getTradeableShareRefs,
  getSpaceRent,
  isColorGroupMajorShareholder,
  isFullyPlayerOwned,
  isMajorShareholder,
  ownsCompleteColorGroup,
  proposeTrade,
  rejectTrade,
  resolveBuildVote,
  resolvePendingConstruction,
  rollAndMove,
  startBuildVote,
  startDemolishVote,
  transferContract,
  transferShares,
} from '../src/game.js';

const CITY_COUNTRY = new Map([
  ['塞萨洛尼基', '希腊'], ['帕特雷', '希腊'], ['伊拉克利翁', '希腊'],
  ['里斯本', '葡萄牙'], ['波尔图', '葡萄牙'], ['科英布拉', '葡萄牙'], ['法鲁', '葡萄牙'],
  ['马德里', '西班牙'], ['巴塞罗那', '西班牙'], ['瓦伦西亚', '西班牙'], ['塞维利亚', '西班牙'],
  ['巴黎', '法国'], ['里昂', '法国'], ['马赛', '法国'], ['尼斯', '法国'],
  ['伦敦', '英国'], ['曼彻斯特', '英国'], ['爱丁堡', '英国'], ['利物浦', '英国'],
  ['柏林', '德国'], ['慕尼黑', '德国'], ['汉堡', '德国'], ['法兰克福', '德国'],
  ['罗马', '意大利'], ['米兰', '意大利'], ['威尼斯', '意大利'], ['佛罗伦萨', '意大利'],
  ['东京', '日本'], ['大阪', '日本'], ['京都', '日本'], ['札幌', '日本'],
  ['首尔', '韩国'], ['釜山', '韩国'], ['仁川', '韩国'], ['大邱', '韩国'],
  ['纽约', '美国'], ['洛杉矶', '美国'], ['芝加哥', '美国'], ['旧金山', '美国'],
  ['悉尼', '澳大利亚'], ['墨尔本', '澳大利亚'], ['布里斯班', '澳大利亚'], ['珀斯', '澳大利亚'],
]);

function propertySpaces(spaces = BOARD_SPACES) {
  return spaces.filter((space) => space.type === 'property');
}

function firstProperty(game) {
  return game.board.find((space) => space.type === 'property');
}

function propertyById(game, id) {
  return game.board.find((space) => space.id === id);
}

function shares(property, start, count) {
  return property.shares.slice(start, start + count).map((share) => ({
    spaceId: property.id,
    shareId: share.id,
  }));
}

function shareIds(property, start, count) {
  return property.shares.slice(start, start + count).map((share) => share.id);
}

function withTradeContractContext(game, fn, fromPlayerId = 'p1', toPlayerId = 'p2') {
  game.contractCreationContext = { fromPlayerId, toPlayerId };
  try {
    return fn();
  } finally {
    game.contractCreationContext = null;
  }
}

function grantShares(game, property, playerId, start, count) {
  transferShares(game, BANK_ID, playerId, shares(property, start, count));
}

function grantWholeProperty(game, property, playerId) {
  grantShares(game, property, playerId, 0, SHARES_PER_PROPERTY);
}

function grantColorGroupMajority(game, colorGroup, playerId, sharesPerProperty = MAJOR_SHAREHOLDER_SHARES) {
  for (const property of getColorGroupProperties(game, colorGroup)) {
    grantShares(game, property, playerId, 0, sharesPerProperty);
  }
}

test('board keeps a 44-space 12 by 12 perimeter with ordinary property pricing only', () => {
  assert.equal(BOARD_SIDE_LENGTH, 12);
  assert.equal(BOARD_SPACES.length, 44);
  assert.equal(new Set(BOARD_SPACES.map((space) => space.id)).size, 44);
  assert.equal(new Set(BOARD_SPACES.map((space) => space.name)).size, 44);

  assert.deepEqual(
    { id: BOARD_SPACES[0].id, type: BOARD_SPACES[0].type, name: BOARD_SPACES[0].name },
    { id: 'start', type: 'start', name: '起始格' },
  );
  assert.equal(BOARD_SPACES[0].bonus, LAP_BONUS);

  const allowedTypes = new Set(BOARD_SPACES.map((space) => space.type));
  assert.deepEqual([...allowedTypes].sort(), ['property', 'start']);

  const properties = propertySpaces();
  assert.equal(properties.length, 43);
  for (const space of properties) {
    assert.ok(CITY_COUNTRY.has(space.name), `${space.name} should be a configured real city`);
    assert.equal(space.countryName, CITY_COUNTRY.get(space.name));
    assert.match(space.id, /^[a-z0-9-]+$/);
    assert.ok(space.price > 0);
    assert.ok(space.houseCost > 0);
    assert.ok(Array.isArray(space.rent));
    assert.ok(space.rent.length >= 4);
    assert.ok(space.rent.every((rent) => Number.isFinite(rent) && rent > 0));
    assert.ok(space.colorGroup);
    assert.ok(space.colorName);
    assert.ok(!('amount' in space));
    assert.ok(!('rentMultiplier' in space));
    assert.ok(!('diceMultiplier' in space));
    assert.ok(!('mortgageValue' in space));
  }
});

test('createGame initializes ten unsold bank shares on every property and no player holdings', () => {
  assert.equal(BANK_ID, 'bank');
  assert.equal(SHARES_PER_PROPERTY, 10);
  assert.equal(SHARE_PERCENT, 10);
  assert.equal(MAJOR_SHAREHOLDER_SHARES, 3);
  assert.equal(DIRECT_BUILD_SHARES, 5);

  const game = createGame(['Ada', 'Lin']);

  assert.equal(game.players.length, 2);
  assert.equal(getCurrentPlayer(game).name, 'Ada');
  assert.equal(game.phase, 'roll');
  assert.equal(game.status, 'playing');
  assert.deepEqual(game.pendingTrades, []);
  assert.deepEqual(game.contracts, []);

  for (const property of propertySpaces(game.board)) {
    assert.equal(property.shares.length, SHARES_PER_PROPERTY);
    assert.equal(new Set(property.shares.map((share) => share.id)).size, SHARES_PER_PROPERTY);
    property.shares.forEach((share, index) => {
      assert.equal(share.index, index);
      assert.equal(share.ownerId, BANK_ID);
      assert.equal(share.sold, false);
      assert.deepEqual(share.encumbranceContractIds, []);
    });
    assert.equal(getBankShareCount(game, property.id), SHARES_PER_PROPERTY);
    assert.equal(isFullyPlayerOwned(game, property.id), false);
  }

  for (const player of game.players) {
    assert.equal(player.position, 0);
    assert.equal(player.cash, 1500);
    assert.equal(getOwnedProperties(game, player.id).length, 0);
    assert.deepEqual(getPlayerPropertyHoldings(game, player.id), []);
  }
});

test('buyCurrentShares buys a partial bank stake and buyCurrentProperty buys the whole current offer', () => {
  const partialGame = createGame(['Ada', 'Lin']);
  rollAndMove(partialGame, [1, 1]);
  const partialProperty = partialGame.board[2];

  assert.equal(partialGame.pendingOffer.type, 'bankShares');
  assert.equal(partialGame.pendingOffer.playerId, 'p1');
  assert.equal(partialGame.pendingOffer.spaceId, partialProperty.id);
  assert.equal(partialGame.pendingOffer.maxShareCount, SHARES_PER_PROPERTY);
  assert.equal(partialGame.pendingOffer.pricePerShare, partialProperty.price / SHARES_PER_PROPERTY);
  assert.equal(partialGame.pendingOffer.price, partialProperty.price);

  buyCurrentShares(partialGame, 3);

  assert.equal(getPlayerShareCount(partialGame, partialProperty.id, 'p1'), 3);
  assert.equal(getBankShareCount(partialGame, partialProperty.id), 7);
  assert.equal(partialGame.players[0].cash, 1500 - (partialProperty.price * 3) / SHARES_PER_PROPERTY);
  assert.equal(partialProperty.shares.filter((share) => share.ownerId === 'p1' && share.sold).length, 3);
  assert.equal(partialGame.pendingOffer, null);
  assert.equal(partialGame.phase, 'end');

  const wrapperGame = createGame(['Ada', 'Lin']);
  rollAndMove(wrapperGame, [1, 1]);
  const wrapperProperty = wrapperGame.board[2];
  const returnedProperty = buyCurrentProperty(wrapperGame);

  assert.equal(returnedProperty.id, wrapperProperty.id);
  assert.equal(getPlayerShareCount(wrapperGame, wrapperProperty.id, 'p1'), SHARES_PER_PROPERTY);
  assert.equal(getBankShareCount(wrapperGame, wrapperProperty.id), 0);
  assert.equal(wrapperGame.players[0].cash, 1500 - wrapperProperty.price);
});

test('declineCurrentShareOffer clears a bank-share purchase offer', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);
  const property = game.board[2];
  const declined = declineCurrentShareOffer(game);

  assert.equal(declined.id, property.id);
  assert.equal(game.pendingOffer, null);
  assert.equal(game.phase, 'end');
  assert.equal(getBankShareCount(game, property.id), SHARES_PER_PROPERTY);
});

test('landing on a partly sold property settles rent first and then offers remaining bank shares', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = game.board[2];
  grantShares(game, property, 'p1', 0, 3);
  endTurn(game);

  rollAndMove(game, [1, 1]);

  const rentToAda = getSpaceRent(property) * 0.3;
  assert.equal(game.players[1].cash, 1500 - rentToAda);
  assert.equal(game.players[0].cash, 1500 + rentToAda);
  assert.equal(game.pendingOffer.type, 'bankShares');
  assert.equal(game.pendingOffer.playerId, 'p2');
  assert.equal(game.pendingOffer.maxShareCount, 7);
  assert.equal(game.pendingOffer.price, (property.price * 7) / SHARES_PER_PROPERTY);
});

test('rent is split per share: bank never collects, visitors do not pay themselves, shareholders still pay other shareholders', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = game.board[2];
  grantShares(game, property, 'p1', 0, 3);
  grantShares(game, property, 'p2', 3, 5);
  const rent = getSpaceRent(property);

  const paymentsForAda = calculateRentPayments(game, property.id, 'p1');
  assert.deepEqual(paymentsForAda.map((payment) => [payment.toPlayerId, payment.shareCount, payment.amount]), [
    ['p2', 5, rent * 0.5],
  ]);

  rollAndMove(game, [1, 1]);

  assert.equal(game.players[0].cash, 1500 - rent * 0.5);
  assert.equal(game.players[1].cash, 1500 + rent * 0.5);
  assert.equal(game.players[2].cash, 1500);
  assert.equal(game.pendingOffer.maxShareCount, 2);
});

test('contracts expose human-readable display names for the UI', () => {
  const game = createGame(['Ada', 'Lin']);
  const madrid = propertyById(game, 'madrid');
  const paris = propertyById(game, 'paris');
  grantShares(game, madrid, 'p1', 0, 1);
  grantShares(game, paris, 'p2', 0, 3);

  const freePass = withTradeContractContext(game, () => createFreePassContract(game, {
    holderId: 'p1',
    shareRefs: shares(madrid, 0, 1),
  }));
  const inheritance = withTradeContractContext(game, () => createInheritanceContract(game, {
    holderId: 'p1',
    shareRefs: shares(madrid, 0, 4),
  }));
  const voteSupport = withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: paris.id,
    stance: 'yes',
  }));

  assert.equal(getContractDisplayName(game, freePass), '马德里10%免费通行权');
  assert.equal(getContractDisplayName(game, inheritance), '马德里40%继承权');
  assert.equal(getContractDisplayName(game, voteSupport), '法国投票支持合同');
});

test('free pass waives bound-share rent, follows share transfers, and buyback restores rent', () => {
  const game = createGame(['Ada', 'Lin', 'Grace', 'Mira']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 5);
  grantShares(game, property, 'p2', 5, 5);
  const coveredShares = shares(property, 0, 5);
  const contract = withTradeContractContext(game, () => createFreePassContract(game, { holderId: 'p3', shareRefs: coveredShares }), 'p1', 'p3');

  assert.equal(contract.type, CONTRACT_TYPES.FREE_PASS);
  assert.equal(property.shares[0].encumbranceContractIds.includes(contract.id), true);
  assert.deepEqual(calculateRentPayments(game, property.id, 'p3').map((payment) => [payment.toPlayerId, payment.shareCount]), [
    ['p2', 5],
  ]);

  transferShares(game, 'p1', 'p4', coveredShares);
  assert.equal(getPlayerShareCount(game, property.id, 'p4'), 5);
  assert.deepEqual(calculateRentPayments(game, property.id, 'p3').map((payment) => [payment.toPlayerId, payment.shareCount]), [
    ['p2', 5],
  ]);

  buyBackContract(game, contract.id, 'p4');
  assert.equal(contract.status, 'void');
  assert.equal(property.shares[0].encumbranceContractIds.includes(contract.id), false);
  assert.deepEqual(calculateRentPayments(game, property.id, 'p3').map((payment) => [payment.toPlayerId, payment.shareCount]), [
    ['p4', 5],
    ['p2', 5],
  ]);
});

test('inheritance-bound shares cannot be traded and transfer directly to holder on bankruptcy', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 5);
  const inheritedRefs = shares(property, 0, 4);
  const inheritedIds = shareIds(property, 0, 4);
  const unboundShareId = property.shares[4].id;
  const contract = withTradeContractContext(game, () => createInheritanceContract(game, { holderId: 'p2', shareRefs: inheritedRefs }));

  assert.equal(contract.type, CONTRACT_TYPES.INHERITANCE);
  assert.throws(() => transferShares(game, 'p1', 'p3', inheritedRefs), /继承权/);

  declareBankruptcy(game, 'p1', { type: 'passive', reason: '测试继承' });

  for (const shareId of inheritedIds) {
    const share = property.shares.find((candidate) => candidate.id === shareId);
    assert.equal(share.ownerId, 'p2');
  }
  assert.equal(property.shares.find((share) => share.id === unboundShareId).ownerId, 'p1');
  assert.equal(game.phase, 'auctionPending');
  assert.equal(game.pendingAuction.bankruptPlayerId, 'p1');
  const shareLot = game.pendingAuction.lots.find((lot) => lot.type === 'propertyShares');
  assert.ok(shareLot);
  assert.ok(shareLot.shareIds.includes(unboundShareId));
  assert.ok(shareLot.shareIds.every((shareId) => !inheritedIds.includes(shareId)));
});

test('trades can be proposed in any phase, rejected, expired, and only accepted with currently available assets', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 3);
  const freePass = withTradeContractContext(game, () => createFreePassContract(game, { holderId: 'p1', shareRefs: shares(property, 0, 1) }));
  game.phase = 'buildPayment';

  const rejected = proposeTrade(game, {
    fromPlayerId: 'p2',
    toPlayerId: 'p1',
    offer: { cash: 0 },
    request: { cash: 10 },
    note: 'non-current player can propose',
    now: 1_000,
  });
  assert.equal(rejectTrade(game, rejected.id).status, 'rejected');

  const expiring = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: 0 },
    request: { cash: 0 },
    now: 2_000,
  });
  assert.deepEqual(expirePendingTrades(game, 62_001).map((trade) => trade.id), [expiring.id]);
  assert.equal(expiring.status, 'expired');

  const stale = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: 0, shareRefs: shares(property, 0, 2) },
    request: { cash: 0 },
    now: 3_000,
  });
  transferShares(game, 'p1', 'p3', shares(property, 0, 1));
  assert.throws(() => acceptTrade(game, stale.id, 3_001), /不属于/);
  assert.equal(stale.status, 'pending');

  const accepted = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: 0, shareRefs: shares(property, 1, 2), contractIds: [freePass.id] },
    request: { cash: 25 },
    now: 4_000,
  });
  acceptTrade(game, accepted.id, 4_001);

  assert.equal(accepted.status, 'accepted');
  assert.equal(getPlayerShareCount(game, property.id, 'p2'), 2);
  assert.equal(game.players[0].cash, 1525);
  assert.equal(game.players[1].cash, 1475);
  assert.equal(freePass.holderId, 'p2');

  transferContract(game, freePass.id, 'p3');
  assert.equal(freePass.holderId, 'p3');
});

test('trades can include shares from multiple properties in one offer', () => {
  const game = createGame(['Ada', 'Lin']);
  const first = firstProperty(game);
  const second = getColorGroupProperties(game, first.colorGroup).find((property) => property.id !== first.id);
  grantShares(game, first, 'p1', 0, 2);
  grantShares(game, second, 'p1', 0, 3);

  const trade = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: {
      shareRefs: [
        ...getTradeableShareRefs(game, 'p1', first.id, 2),
        ...getTradeableShareRefs(game, 'p1', second.id, 1),
      ],
    },
    request: { cash: 40 },
    now: 1_000,
  });
  acceptTrade(game, trade.id, 1_001);

  assert.equal(getPlayerShareCount(game, first.id, 'p2'), 2);
  assert.equal(getPlayerShareCount(game, second.id, 'p2'), 1);
  assert.equal(getPlayerShareCount(game, first.id, 'p1'), 0);
  assert.equal(getPlayerShareCount(game, second.id, 'p1'), 2);
});

test('inheritance-bound shares are excluded from tradeable share helpers', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 3);
  withTradeContractContext(game, () => createInheritanceContract(game, {
    holderId: 'p2',
    shareRefs: shares(property, 0, 1),
  }));

  assert.equal(getTradeableShareCount(game, property.id, 'p1'), 2);
  assert.equal(getTradeableShareRefs(game, 'p1', property.id, 3).length, 2);
});

test('expired pending trades cannot be accepted even if assets are still available', () => {
  const game = createGame(['Ada', 'Lin']);
  const trade = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: 10 },
    request: { cash: 0 },
    now: 1_000,
  });

  assert.throws(() => acceptTrade(game, trade.id, 61_001), /过期/);
  assert.equal(trade.status, 'expired');
  assert.equal(game.players[0].cash, 1500);
  assert.equal(game.players[1].cash, 1500);
});

test('sold shares cannot be transferred back to the bank', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  assert.throws(() => transferShares(game, 'p1', BANK_ID, shares(property, 0, 1)), /银行/);
});

test('major-shareholder selectors use three shares for properties and every property in a color group', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  grantShares(game, group[0], 'p1', 0, 3);
  grantShares(game, group[0], 'p2', 3, 2);

  assert.equal(isMajorShareholder(game, group[0].id, 'p1'), true);
  assert.equal(isMajorShareholder(game, group[0].id, 'p2'), false);
  assert.equal(isColorGroupMajorShareholder(game, group[0].colorGroup, 'p1'), false);

  for (let index = 1; index < group.length; index += 1) {
    grantShares(game, group[index], 'p1', 0, 3);
  }

  assert.equal(isColorGroupMajorShareholder(game, group[0].colorGroup, 'p1'), true);
  assert.deepEqual(getPropertyShareholders(game, group[0].id).map((holder) => [holder.playerId, holder.shareCount]), [
    ['p1', 3],
    ['p2', 2],
  ]);
  assert.deepEqual(getPropertyShareholders(game, group[0].id, { includeBank: true }).map((holder) => [holder.playerId, holder.shareCount]), [
    ['p1', 3],
    ['p2', 2],
    [BANK_ID, 5],
  ]);
});

test('direct building requires no bank shares and charges every target shareholder by share count', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, DIRECT_BUILD_SHARES);
  grantShares(game, target, 'p2', DIRECT_BUILD_SHARES, DIRECT_BUILD_SHARES);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }

  assert.equal(getBankShareCount(game, target.id), 0);
  assert.equal(isFullyPlayerOwned(game, target.id), true);
  assert.equal(canBuildHouse(game, target.id, 'p1'), true);
  assert.deepEqual(getBuildEligibility(game, target.id, 'p1'), {
    canDirectBuild: true,
    canStartVote: false,
    reason: 'canDirectBuild',
  });

  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;
  buildHouse(game, target.id);

  assert.equal(target.houses, 1);
  assert.equal(target.currentRent, target.rent[1]);
  assert.equal(game.players[0].cash, p1Cash - target.houseCost * 0.5);
  assert.equal(game.players[1].cash, p2Cash - target.houseCost * 0.5);

  const completeGroupGame = createGame(['Ada', 'Lin']);
  const completeGroup = getColorGroupProperties(completeGroupGame, firstProperty(completeGroupGame).colorGroup);
  completeGroup.forEach((property) => grantWholeProperty(completeGroupGame, property, 'p1'));
  assert.equal(ownsCompleteColorGroup(completeGroupGame, 'p1', completeGroup[0].colorGroup), true);
  assert.equal(canBuildHouse(completeGroupGame, completeGroup[0].id, 'p1'), true);
});

test('direct demolition requires the same 50% rule and refunds every target shareholder by share count', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, DIRECT_BUILD_SHARES);
  grantShares(game, target, 'p2', DIRECT_BUILD_SHARES, DIRECT_BUILD_SHARES);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  target.houses = 2;
  target.currentRent = target.rent[2];

  assert.equal(canDemolishHouse(game, target.id, 'p1'), true);
  assert.deepEqual(getDemolishEligibility(game, target.id, 'p1'), {
    canDirectDemolish: true,
    canStartVote: false,
    reason: 'canDirectDemolish',
  });
  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;
  demolishHouse(game, target.id);

  assert.equal(target.houses, 1);
  assert.equal(target.currentRent, target.rent[1]);
  assert.equal(game.players[0].cash, p1Cash + target.houseCost * 0.5);
  assert.equal(game.players[1].cash, p2Cash + target.houseCost * 0.5);
  assert.equal(game.phase, 'end');
});

test('a color-group major shareholder below 50% must pass a demolition vote before refunding shareholders', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  target.houses = 2;
  target.currentRent = target.rent[2];

  assert.deepEqual(getDemolishEligibility(game, target.id, 'p1'), {
    canDirectDemolish: false,
    canStartVote: true,
    reason: 'voteRequired',
  });
  assert.throws(() => demolishHouse(game, target.id), /投票|拆房/);

  const vote = startDemolishVote(game, target.id);
  assert.equal(vote.type, 'demolish');
  castBuildVote(game, vote.id, 'p1', 'yes');
  castBuildVote(game, vote.id, 'p2', 'yes');
  castBuildVote(game, vote.id, 'p3', 'no');
  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;
  const p3Cash = game.players[2].cash;
  const result = resolveBuildVote(game, vote.id);

  assert.equal(result.passed, true);
  assert.equal(vote.status, 'passed');
  assert.equal(target.houses, 1);
  assert.equal(target.currentRent, target.rent[1]);
  assert.equal(game.players[0].cash, p1Cash + target.houseCost * 0.4);
  assert.equal(game.players[1].cash, p2Cash + target.houseCost * 0.3);
  assert.equal(game.players[2].cash, p3Cash + target.houseCost * 0.3);
});

test('direct building with an underfunded shareholder enters buildPayment and does not upgrade or charge anyone yet', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  game.players[1].cash = target.houseCost * 0.5 - 1;
  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;

  buildHouse(game, target.id);

  assert.equal(target.houses, 0);
  assert.equal(target.currentRent, target.rent[0]);
  assert.equal(game.phase, 'buildPayment');
  assert.equal(game.players[0].cash, p1Cash);
  assert.equal(game.players[1].cash, p2Cash);
  assert.equal(game.pendingConstruction.propertyId, target.id);
  assert.deepEqual(game.pendingConstruction.insufficientPlayerIds, ['p2']);
});

test('pending construction cost obligation follows target shares when they are traded', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  game.players[1].cash = target.houseCost * 0.5 - 1;
  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;

  buildHouse(game, target.id);
  transferShares(game, 'p2', 'p1', shares(target, 5, 5));

  assert.equal(target.houses, 1);
  assert.equal(target.currentRent, target.rent[1]);
  assert.equal(game.phase, 'end');
  assert.equal(game.pendingConstruction, null);
  assert.equal(getPlayerShareCount(game, target.id, 'p1'), 10);
  assert.equal(game.players[0].cash, p1Cash - target.houseCost);
  assert.equal(game.players[1].cash, p2Cash);
});

test('accepting a trade defers construction settlement so later cash legs cannot create negative cash', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  game.players[0].cash = 60;
  game.players[1].cash = target.houseCost * 0.5 - 1;
  buildHouse(game, target.id);

  const trade = proposeTrade(game, {
    fromPlayerId: 'p2',
    toPlayerId: 'p1',
    offer: { shareRefs: shares(target, 5, 5) },
    request: { cash: 60 },
    now: 1_000,
  });
  acceptTrade(game, trade.id, 1_001);

  assert.equal(game.players[0].cash, 0);
  assert.equal(game.players[1].cash, target.houseCost * 0.5 - 1 + 60);
  assert.equal(target.houses, 0);
  assert.equal(game.phase, 'buildPayment');
  assert.equal(game.pendingConstruction.insufficientPlayerIds[0], 'p1');
});

test('auctionPending state is not cleared by construction refresh after a bankrupt shareholder transfer', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  game.players[1].cash = target.houseCost * 0.5 - 1;
  buildHouse(game, target.id);
  declareBankruptcy(game, 'p2', { type: 'passive', reason: '建房费用不足' });

  transferShares(game, 'p2', 'p1', shares(target, 5, 5));

  assert.equal(game.phase, 'auctionPending');
  assert.equal(game.pendingAuction.bankruptPlayerId, 'p2');
  assert.equal(target.houses, 0);
  assert.equal(game.pendingConstruction.propertyId, target.id);
});

test('a color-group major shareholder below 50% can start a build vote; vote support forces stance and expires after resolution', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  const support = withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: target.id,
    stance: 'yes',
  }));

  assert.deepEqual(getBuildEligibility(game, target.id, 'p1'), {
    canDirectBuild: false,
    canStartVote: true,
    reason: 'voteRequired',
  });
  const vote = startBuildVote(game, target.id);

  assert.equal(game.pendingVote.id, vote.id);
  assert.throws(() => castBuildVote(game, vote.id, 'p2', 'no'), /投票支持/);
  castBuildVote(game, vote.id, 'p1', 'yes');
  castBuildVote(game, vote.id, 'p2', 'yes');
  castBuildVote(game, vote.id, 'p3', 'no');
  const p1Cash = game.players[0].cash;
  const p2Cash = game.players[1].cash;
  const p3Cash = game.players[2].cash;
  const result = resolveBuildVote(game, vote.id);

  assert.equal(result.passed, true);
  assert.equal(vote.status, 'passed');
  assert.equal(target.houses, 1);
  assert.equal(game.players[0].cash, p1Cash - target.houseCost * 0.4);
  assert.equal(game.players[1].cash, p2Cash - target.houseCost * 0.3);
  assert.equal(game.players[2].cash, p3Cash - target.houseCost * 0.3);
  assert.equal(support.remainingUses, 0);
  assert.equal(support.status, 'fulfilled');
});

test('vote support contracts force matching votes even when the obligor does not manually vote', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, 3);
  }
  const support = withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: target.id,
    stance: 'yes',
  }));

  const vote = startBuildVote(game, target.id);
  castBuildVote(game, vote.id, 'p1', 'yes');
  castBuildVote(game, vote.id, 'p3', 'no');
  const result = resolveBuildVote(game, vote.id);

  assert.equal(result.passed, true);
  assert.equal(result.yesShareCount, 7);
  assert.equal(vote.votes.p2, 'yes');
  assert.equal(support.remainingUses, 0);
  assert.equal(support.status, 'fulfilled');
});

test('conflicting active vote support contracts for the same obligation are rejected', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p2', 0, 3);

  withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: property.id,
    stance: 'yes',
  }));

  assert.throws(() => withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: property.id,
    stance: 'no',
  })), /冲突/);
});

test('bankruptcy pauses for auction without returning sold shares to the bank', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 4);
  property.houses = 2;
  property.currentRent = property.rent[2];

  declareBankruptcy(game, 'p1', { type: 'passive', reason: '现金不足' });

  assert.equal(game.players[0].bankrupt, true);
  assert.equal(game.players[0].cash, 0);
  assert.equal(game.status, 'playing');
  assert.equal(game.phase, 'auctionPending');
  assert.equal(getPlayerShareCount(game, property.id, 'p1'), 4);
  assert.equal(getBankShareCount(game, property.id), 6);
  assert.equal(property.houses, 2);
  assert.equal(property.currentRent, property.rent[2]);
  const shareLot = game.pendingAuction.lots.find((lot) => lot.type === 'propertyShares' && lot.propertyId === property.id);
  assert.ok(shareLot);
  assert.deepEqual(shareLot.shareIds, shareIds(property, 0, 4));
  assert.equal(isBankruptcyAuctionActive(game), true);
});

test('rent that would make the current player negative does not auto-bankrupt and locks the turn until cash is positive', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = game.board[2];
  grantWholeProperty(game, property, 'p1');
  property.houses = 4;
  property.currentRent = property.rent[4];
  game.players[1].cash = property.currentRent - 1;
  endTurn(game);

  rollAndMove(game, [1, 1]);

  assert.equal(game.players[1].bankrupt, false);
  assert.equal(game.players[1].cash, -1);
  assert.equal(game.players[0].cash, 1500 + property.currentRent);
  assert.equal(game.status, 'playing');
  assert.equal(game.phase, 'cashRecovery');
  assert.equal(game.pendingAuction, null);
  assert.equal(game.pendingOffer, null);
  assert.equal(game.turn, 1);
  assert.throws(() => endTurn(game), /现金.*正/);

  const rescueTrade = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: 2 },
    request: { cash: 0 },
    now: 1_000,
  });
  acceptTrade(game, rescueTrade.id, 1_001);

  assert.equal(game.players[1].cash, 1);
  assert.equal(game.phase, 'end');
  endTurn(game);
  assert.equal(game.turn, 2);
  assert.equal(getCurrentPlayer(game).id, 'p3');
});

test('active bankruptcy remains the explicit way to end a cash-locked two-player game', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = game.board[2];
  grantWholeProperty(game, property, 'p1');
  property.houses = 4;
  property.currentRent = property.rent[4];
  game.players[1].cash = property.currentRent - 1;
  endTurn(game);

  rollAndMove(game, [1, 1]);
  declareBankruptcy(game, 'p2', { type: 'active', reason: '主动破产' });

  assert.equal(game.players[1].bankrupt, true);
  assert.equal(game.status, 'gameOver');
  assert.equal(game.winnerId, 'p1');
});

test('vote phase locks the turn until the pending vote is resolved', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }

  const vote = startBuildVote(game, target.id);

  assert.throws(() => endTurn(game), /投票|阶段|暂停|phase/i);
  assert.equal(game.turn, 0);
  assert.equal(game.phase, 'vote');
  assert.equal(game.pendingVote.id, vote.id);
  assert.equal(game.pendingVote.status, 'open');
});

test('build payment blocks new construction until the pending cost is resolved', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const [target, second, third] = group;

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  grantWholeProperty(game, second, 'p1');
  grantShares(game, third, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  game.players[1].cash = target.houseCost * 0.5 - 1;

  buildHouse(game, target.id);

  assert.equal(game.phase, 'buildPayment');
  assert.equal(game.pendingConstruction.propertyId, target.id);
  assert.throws(() => buildHouse(game, second.id), /待支付|暂停|阶段|phase/i);
  assert.equal(game.pendingConstruction.propertyId, target.id);
  assert.equal(second.houses, 0);
});

test('stale build votes are invalidated if the target reaches max level before resolution', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  const vote = startBuildVote(game, target.id);
  castBuildVote(game, vote.id, 'p1', 'yes');
  castBuildVote(game, vote.id, 'p2', 'yes');

  target.houses = target.rent.length - 1;
  target.currentRent = target.rent[target.houses];
  const result = resolveBuildVote(game, vote.id);

  assert.equal(result.passed, false);
  assert.equal(result.reason, 'invalidated');
  assert.equal(vote.status, 'failed');
  assert.equal(target.houses, target.rent.length - 1);
  assert.equal(target.currentRent, target.rent.at(-1));
  assert.equal(game.pendingVote, null);
  assert.equal(game.phase, 'end');
});

test('bankruptcy cancels related pending trades and freezes auction assets', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  const trade = proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { shareRefs: shares(property, 0, 1) },
    request: { cash: 0 },
    now: 1_000,
  });
  declareBankruptcy(game, 'p1', { type: 'active', reason: '测试破产冻结' });

  assert.equal(trade.status, 'cancelled');
  assert.throws(() => acceptTrade(game, trade.id, 1_001), /待处理|取消|破产|拍卖|pending/i);
  assert.throws(() => proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { shareRefs: shares(property, 0, 1) },
    request: { cash: 0 },
    now: 1_002,
  }), /破产|拍卖|暂停|auction/i);
  assert.equal(property.shares[0].ownerId, 'p1');
  const shareLot = game.pendingAuction.lots.find((lot) => lot.type === 'propertyShares');
  assert.ok(shareLot?.shareIds.includes(property.shares[0].id));
});

test('trade cash must be a finite non-negative number', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  assert.throws(() => proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { shareRefs: shares(property, 0, 1) },
    request: { cash: -100 },
  }), /现金|金额|cash|finite/i);
  assert.throws(() => proposeTrade(game, {
    fromPlayerId: 'p1',
    toPlayerId: 'p2',
    offer: { cash: Number.NaN },
    request: { cash: 0 },
  }), /现金|金额|cash|finite/i);
});

test('rollAndMove accepts exactly two six-sided dice', () => {
  const game = createGame(['Ada', 'Lin']);

  assert.throws(() => rollAndMove(game, [1]), /骰子|dice/i);
  assert.throws(() => rollAndMove(game, [1, 1, 1]), /骰子|dice/i);
  assert.throws(() => rollAndMove(game, [0, 7]), /骰子|dice/i);
});

test('gameOver is terminal for bankruptcy mutations', () => {
  const game = createGame(['Ada', 'Lin']);

  declareBankruptcy(game, 'p2', { type: 'active', reason: '主动破产' });

  assert.equal(game.status, 'gameOver');
  assert.equal(game.phase, 'gameOver');
  assert.equal(game.winnerId, 'p1');
  assert.throws(() => declareBankruptcy(game, 'p1', { type: 'active', reason: '终局后破产' }), /结束|game/i);
  assert.equal(game.players[0].bankrupt, false);
  assert.equal(game.phase, 'gameOver');
});

test('gameOver is terminal for direct share transfers', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  declareBankruptcy(game, 'p2', { type: 'active', reason: '主动破产' });

  assert.equal(game.status, 'gameOver');
  assert.throws(() => transferShares(game, 'p1', 'p2', shares(property, 0, 1)), /结束|game/i);
  assert.equal(property.shares[0].ownerId, 'p1');
});

test('pending share offers must be resolved before construction or votes can change phase', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  rollAndMove(game, [2, 2]);

  assert.equal(game.phase, 'action');
  assert.equal(game.pendingOffer.type, 'bankShares');
  assert.throws(() => startBuildVote(game, target.id), /购买机会|offer|阶段|phase/i);
  assert.equal(game.phase, 'action');
  assert.equal(game.pendingVote, null);
});

test('share offers cannot be bought or declined outside the purchase action phase', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);
  game.phase = 'vote';

  assert.throws(() => buyCurrentShares(game, 1), /阶段|phase/i);
  assert.throws(() => declineCurrentShareOffer(game), /阶段|phase/i);
  assert.equal(game.pendingOffer.type, 'bankShares');
});

test('resolvePendingConstruction cannot mutate a finished game', () => {
  const game = createGame(['Ada', 'Lin']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 5);
  grantShares(game, target, 'p2', 5, 5);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  game.players[1].cash = target.houseCost * 0.5 - 1;
  buildHouse(game, target.id);
  declareBankruptcy(game, 'p2', { type: 'active', reason: '费用不足' });

  assert.equal(game.status, 'playing');
  assert.equal(isBankruptcyAuctionActive(game), true);

  const openedAt = game.pendingAuction.lotOpenedAt;
  placeAuctionBid(game, 'p1', 1, openedAt + 1_000);
  advanceBankruptcyAuction(game, openedAt + 1_000 + AUCTION_LOT_TIMEOUT_MS);

  assert.equal(game.status, 'gameOver');
  assert.equal(game.phase, 'gameOver');
  assert.throws(() => resolvePendingConstruction(game), /结束|game/i);
  assert.equal(game.phase, 'gameOver');
});

test('vote support contracts cannot be created after a matching vote has already started', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const group = getColorGroupProperties(game, firstProperty(game).colorGroup);
  const target = group[0];

  grantShares(game, target, 'p1', 0, 4);
  grantShares(game, target, 'p2', 4, 3);
  grantShares(game, target, 'p3', 7, 3);
  for (const property of group.slice(1)) {
    grantShares(game, property, 'p1', 0, MAJOR_SHAREHOLDER_SHARES);
  }
  startBuildVote(game, target.id);

  assert.throws(() => withTradeContractContext(game, () => createVoteSupportContract(game, {
    holderId: 'p1',
    obligorId: 'p2',
    targetSpaceId: target.id,
    stance: 'yes',
  })), /投票|阶段|phase/i);
});

test('contracts can only be created during an active trade negotiation', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  assert.throws(
    () => createFreePassContract(game, { holderId: 'p2', shareRefs: shares(property, 0, 1) }),
    /交易|trade/i,
  );
});

test('bankruptcy auction groups property shares into a single lot and resolves by highest bid', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 4);
  const openedAt = 10_000;

  declareBankruptcy(game, 'p1', { type: 'passive', reason: '现金不足' });
  game.pendingAuction.lotOpenedAt = openedAt;

  assert.equal(game.pendingAuction.lots.length, 1);
  assert.deepEqual(game.pendingAuction.lots[0].shareIds, shareIds(property, 0, 4));
  assert.equal(getMinimumAuctionBid(game), AUCTION_STARTING_BID);

  placeAuctionBid(game, 'p2', 5, openedAt + 1_000);
  assert.equal(game.pendingAuction.currentBid.amount, 5);
  assert.equal(getMinimumAuctionBid(game), 6);

  assert.equal(advanceBankruptcyAuction(game, openedAt + 1_000), false);
  assert.equal(advanceBankruptcyAuction(game, openedAt + 1_000 + AUCTION_LOT_TIMEOUT_MS), true);

  assert.equal(getPlayerShareCount(game, property.id, 'p2'), 4);
  assert.equal(game.players[1].cash, 1500 - 5);
  assert.equal(game.pendingAuction, null);
  assert.equal(game.phase, 'roll');
});

test('bankruptcy auction gifts unsold lots to a random surviving player', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 2);
  const openedAt = 20_000;

  declareBankruptcy(game, 'p1', { type: 'passive', reason: '现金不足' });
  game.pendingAuction.lotOpenedAt = openedAt;

  advanceBankruptcyAuction(game, openedAt + AUCTION_LOT_TIMEOUT_MS, { random: () => 0 });

  assert.equal(getPlayerShareCount(game, property.id, 'p2'), 2);
  assert.equal(getPlayerShareCount(game, property.id, 'p3'), 0);
  assert.equal(game.pendingAuction, null);
});

test('bankrupt player is excluded from bankruptcy auction participation', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 2);

  declareBankruptcy(game, 'p1', { type: 'passive', reason: '测试' });

  assert.ok(!game.pendingAuction.participantIds.includes('p1'));
  assert.throws(() => placeAuctionBid(game, 'p1', 1), /参与者|participant|破产|bankrupt/i);
});

test('bankruptcy auction blocks ordinary actions until complete', () => {
  const game = createGame(['Ada', 'Lin', 'Grace']);
  const property = firstProperty(game);
  grantShares(game, property, 'p1', 0, 1);

  declareBankruptcy(game, 'p1', { type: 'active', reason: '测试' });

  assert.throws(() => declareBankruptcy(game, 'p2', { type: 'active', reason: '重复' }), /拍卖|auction/i);
  assert.throws(() => proposeTrade(game, {
    fromPlayerId: 'p2',
    toPlayerId: 'p3',
    offer: { cash: 1 },
    request: { cash: 0 },
    now: 1_000,
  }), /拍卖|auction/i);
});

test('active bankruptcy in a two-player game with assets waits for auction before game over', () => {
  const game = createGame(['Ada', 'Lin']);
  const property = firstProperty(game);
  grantShares(game, property, 'p2', 0, 4);

  declareBankruptcy(game, 'p2', { type: 'active', reason: '主动破产' });

  assert.equal(game.players[1].bankrupt, true);
  assert.equal(game.status, 'playing');
  assert.equal(isBankruptcyAuctionActive(game), true);

  const openedAt = game.pendingAuction.lotOpenedAt;
  advanceBankruptcyAuction(game, openedAt + AUCTION_LOT_TIMEOUT_MS, { random: () => 0 });

  assert.equal(game.status, 'gameOver');
  assert.equal(game.winnerId, 'p1');
  assert.equal(getPlayerShareCount(game, property.id, 'p1'), 4);
});
