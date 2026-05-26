export const START_CASH = 1500;
export const LAP_BONUS = 200;
export const START_BONUS = LAP_BONUS;
export const MAX_PLAYERS = 4;
export const BOARD_SIDE_LENGTH = 12;

const START_SPACE = {
  id: 'start',
  type: 'start',
  name: '起始格',
  bonus: LAP_BONUS,
  description: `经过或停在这里获得 $${LAP_BONUS}`,
};

const CITY_GROUPS = [
  {
    colorGroup: 'greece-brown',
    colorName: '棕色',
    countryName: '希腊',
    color: '#8d6e63',
    priceStart: 60,
    houseCost: 50,
    baseRent: 2,
    cities: [
      ['thessaloniki', '塞萨洛尼基'],
      ['patras', '帕特雷'],
      ['heraklion', '伊拉克利翁'],
    ],
  },
  {
    colorGroup: 'portugal-sky',
    colorName: '天蓝色',
    countryName: '葡萄牙',
    color: '#74c0fc',
    priceStart: 100,
    houseCost: 60,
    baseRent: 6,
    cities: [
      ['lisbon', '里斯本'],
      ['porto', '波尔图'],
      ['coimbra', '科英布拉'],
      ['faro', '法鲁'],
    ],
  },
  {
    colorGroup: 'spain-pink',
    colorName: '粉色',
    countryName: '西班牙',
    color: '#f783ac',
    priceStart: 140,
    houseCost: 80,
    baseRent: 10,
    cities: [
      ['madrid', '马德里'],
      ['barcelona', '巴塞罗那'],
      ['valencia', '瓦伦西亚'],
      ['seville', '塞维利亚'],
    ],
  },
  {
    colorGroup: 'france-orange',
    colorName: '橙色',
    countryName: '法国',
    color: '#ffa94d',
    priceStart: 180,
    houseCost: 100,
    baseRent: 14,
    cities: [
      ['paris', '巴黎'],
      ['lyon', '里昂'],
      ['marseille', '马赛'],
      ['nice', '尼斯'],
    ],
  },
  {
    colorGroup: 'uk-red',
    colorName: '红色',
    countryName: '英国',
    color: '#ff6b6b',
    priceStart: 220,
    houseCost: 120,
    baseRent: 18,
    cities: [
      ['london', '伦敦'],
      ['manchester', '曼彻斯特'],
      ['edinburgh', '爱丁堡'],
      ['liverpool', '利物浦'],
    ],
  },
  {
    colorGroup: 'germany-yellow',
    colorName: '黄色',
    countryName: '德国',
    color: '#ffd43b',
    priceStart: 260,
    houseCost: 140,
    baseRent: 22,
    cities: [
      ['berlin', '柏林'],
      ['munich', '慕尼黑'],
      ['hamburg', '汉堡'],
      ['frankfurt', '法兰克福'],
    ],
  },
  {
    colorGroup: 'italy-green',
    colorName: '绿色',
    countryName: '意大利',
    color: '#69db7c',
    priceStart: 300,
    houseCost: 160,
    baseRent: 26,
    cities: [
      ['rome', '罗马'],
      ['milan', '米兰'],
      ['venice', '威尼斯'],
      ['florence', '佛罗伦萨'],
    ],
  },
  {
    colorGroup: 'japan-teal',
    colorName: '青色',
    countryName: '日本',
    color: '#63e6be',
    priceStart: 340,
    houseCost: 180,
    baseRent: 30,
    cities: [
      ['tokyo', '东京'],
      ['osaka', '大阪'],
      ['kyoto', '京都'],
      ['sapporo', '札幌'],
    ],
  },
  {
    colorGroup: 'korea-blue',
    colorName: '蓝色',
    countryName: '韩国',
    color: '#4dabf7',
    priceStart: 380,
    houseCost: 200,
    baseRent: 34,
    cities: [
      ['seoul', '首尔'],
      ['busan', '釜山'],
      ['incheon', '仁川'],
      ['daegu', '大邱'],
    ],
  },
  {
    colorGroup: 'usa-purple',
    colorName: '紫色',
    countryName: '美国',
    color: '#b197fc',
    priceStart: 420,
    houseCost: 220,
    baseRent: 38,
    cities: [
      ['new-york', '纽约'],
      ['los-angeles', '洛杉矶'],
      ['chicago', '芝加哥'],
      ['san-francisco', '旧金山'],
    ],
  },
  {
    colorGroup: 'australia-gold',
    colorName: '金色',
    countryName: '澳大利亚',
    color: '#f3c969',
    priceStart: 460,
    houseCost: 240,
    baseRent: 42,
    cities: [
      ['sydney', '悉尼'],
      ['melbourne', '墨尔本'],
      ['brisbane', '布里斯班'],
      ['perth', '珀斯'],
    ],
  },
];

const PROPERTY_SPACES = CITY_GROUPS.flatMap((group, groupIndex) => (
  group.cities.map(([id, name], cityIndex) => {
    const baseRent = group.baseRent + cityIndex * 2;
    return {
      id,
      type: 'property',
      name,
      countryName: group.countryName,
      colorGroup: group.colorGroup,
      colorName: group.colorName,
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

export function createGame(playerNames = ['玩家 1', '玩家 2']) {
  const names = normalizePlayerNames(playerNames);
  const board = cloneBoard(BOARD_SPACES);

  return {
    status: 'playing',
    phase: 'roll',
    turn: 0,
    round: 1,
    board,
    pendingOffer: null,
    lastDice: null,
    winnerId: null,
    players: names.map((name, index) => ({
      id: `p${index + 1}`,
      name,
      cash: START_CASH,
      position: 0,
      properties: [],
      bankrupt: false,
    })),
    log: ['新游戏开始。经过起始格领钱，买城市，集齐同国家色组后建房。'],
  };
}

export function getCurrentPlayer(game) {
  return game.players[game.turn];
}

export function rollAndMove(game, dice = rollDice()) {
  assertPlaying(game);
  if (game.phase !== 'roll') {
    throw new Error('当前阶段不能掷骰子。');
  }

  const player = getCurrentPlayer(game);
  if (player.bankrupt) {
    throw new Error('破产玩家不能行动。');
  }

  const normalizedDice = normalizeDice(dice);
  const steps = normalizedDice.reduce((sum, value) => sum + value, 0);
  game.lastDice = normalizedDice;

  movePlayerBy(game, player, steps, true);
  addLog(game, `${player.name} 掷出 ${normalizedDice.join(' + ')}，前进 ${steps} 格，来到「${currentSpace(game, player).name}」。`);
  resolveLanding(game, player);

  return game;
}

export function buyCurrentProperty(game) {
  assertPlaying(game);
  if (!game.pendingOffer) {
    throw new Error('当前没有可购买的城市。');
  }

  const player = getCurrentPlayer(game);
  const property = findSpace(game, game.pendingOffer.spaceId);
  if (!isPurchasable(property)) {
    throw new Error('这个格子不能购买。');
  }
  if (property.ownerId) {
    throw new Error('这个城市已经有主人。');
  }
  if (player.cash < property.price) {
    throw new Error(`${player.name} 的现金不足，不能购买「${property.name}」。`);
  }

  player.cash -= property.price;
  property.ownerId = player.id;
  property.houses = 0;
  property.currentRent = property.rent[0];
  player.properties.push(property.id);
  game.pendingOffer = null;
  game.phase = 'end';
  addLog(game, `${player.name} 以 $${property.price} 买下「${property.name}」。`);
  checkWinner(game);

  return property;
}

export function declineCurrentProperty(game) {
  if (!game.pendingOffer) {
    return null;
  }
  const player = getCurrentPlayer(game);
  const property = findSpace(game, game.pendingOffer.spaceId);
  game.pendingOffer = null;
  game.phase = 'end';
  addLog(game, `${player.name} 放弃购买「${property.name}」。`);
  return property;
}

export function buildHouse(game, propertyId) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  const property = findSpace(game, propertyId);

  if (!property) {
    throw new Error('找不到这个城市。');
  }
  if (property.ownerId !== player.id) {
    throw new Error('只能升级自己拥有的城市。');
  }
  if (!isPurchasable(property)) {
    throw new Error('只有普通城市地块可以建房。');
  }
  if (!ownsCompleteColorGroup(game, player.id, property.colorGroup)) {
    throw new Error('必须拥有同色组的全部城市后才能建房。');
  }
  if (property.houses >= property.rent.length - 1) {
    throw new Error('这个城市已经升到最高等级。');
  }
  if (player.cash < property.houseCost) {
    throw new Error(`${player.name} 的现金不足，不能升级「${property.name}」。`);
  }

  player.cash -= property.houseCost;
  property.houses += 1;
  property.currentRent = property.rent[property.houses];
  addLog(game, `${player.name} 花费 $${property.houseCost} 升级「${property.name}」到 ${property.houses} 级。`);

  return property;
}

export function endTurn(game) {
  if (game.status === 'gameOver') {
    return game;
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

    game.phase = 'roll';
    addLog(game, `轮到 ${player.name}。`);
    return game;
  }

  checkWinner(game);
  return game;
}

export function getOwnedProperties(game, playerId) {
  return game.board.filter((space) => isPurchasable(space) && space.ownerId === playerId);
}

export function getColorGroupProperties(game, colorGroup) {
  return game.board.filter((space) => isPurchasable(space) && space.colorGroup === colorGroup);
}

export function ownsCompleteColorGroup(game, playerId, colorGroup) {
  const group = getColorGroupProperties(game, colorGroup);
  return group.length > 0 && group.every((space) => space.ownerId === playerId);
}

export function canBuildHouse(game, propertyId, playerId = getCurrentPlayer(game).id) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  const property = findSpace(game, propertyId);
  return Boolean(
    player
    && property
    && property.ownerId === player.id
    && isPurchasable(property)
    && ownsCompleteColorGroup(game, player.id, property.colorGroup)
    && property.houses < property.rent.length - 1
    && player.cash >= property.houseCost,
  );
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

function resolveLanding(game, player) {
  if (game.status === 'gameOver') {
    return;
  }

  const space = currentSpace(game, player);
  game.pendingOffer = null;

  if (space.type === 'start') {
    game.phase = 'end';
    addLog(game, `${player.name} 停在起始格。`);
    checkWinner(game);
    return;
  }

  resolvePurchasableSpace(game, player, space);
  checkWinner(game);
}

function resolvePurchasableSpace(game, player, space) {
  if (!space.ownerId) {
    game.pendingOffer = { spaceId: space.id, price: space.price };
    game.phase = 'action';
    addLog(game, `「${space.name}」无人拥有，可用 $${space.price} 购买。`);
    return;
  }

  if (space.ownerId === player.id) {
    game.phase = 'end';
    addLog(game, `${player.name} 来到自己的「${space.name}」。`);
    return;
  }

  const owner = game.players.find((candidate) => candidate.id === space.ownerId);
  if (!owner || owner.bankrupt) {
    game.phase = 'end';
    return;
  }

  const rent = getSpaceRent(space);
  transferCash(game, player, owner, rent, `${player.name} 向 ${owner.name} 支付「${space.name}」租金`);
  game.phase = 'end';
}

function movePlayerBy(game, player, steps, payLapBonus) {
  const previousPosition = player.position;
  const boardLength = game.board.length;
  const total = previousPosition + steps;
  player.position = ((total % boardLength) + boardLength) % boardLength;

  if (payLapBonus && steps > 0 && total >= boardLength) {
    adjustCash(game, player, LAP_BONUS, '经过起始格');
    addLog(game, `${player.name} 经过起始格，领取 $${LAP_BONUS}。`);
  }
}

function adjustCash(game, player, amount, reason) {
  player.cash += amount;
  if (amount > 0) {
    addLog(game, `${player.name} 获得 $${amount}。`);
  } else if (amount < 0) {
    addLog(game, `${player.name} 支付 $${Math.abs(amount)}。`);
  }

  if (player.cash < 0) {
    player.cash = 0;
    markBankrupt(game, player, reason);
  }
}

function transferCash(game, from, to, amount, reason) {
  const paid = Math.min(from.cash, amount);
  from.cash -= paid;
  to.cash += paid;
  addLog(game, `${reason}：$${paid}。`);

  if (paid < amount) {
    markBankrupt(game, from, reason);
  }
}

function markBankrupt(game, player, reason) {
  if (player.bankrupt) {
    return;
  }

  player.bankrupt = true;
  player.cash = 0;
  for (const propertyId of player.properties) {
    const property = findSpace(game, propertyId);
    if (property) {
      property.ownerId = null;
      property.houses = 0;
      property.currentRent = property.rent[0];
    }
  }
  player.properties = [];
  addLog(game, `${player.name} 因「${reason}」破产，名下城市回到市场。`);
  checkWinner(game);
}

function checkWinner(game) {
  const activePlayers = game.players.filter((player) => !player.bankrupt);
  if (activePlayers.length === 1) {
    game.status = 'gameOver';
    game.phase = 'gameOver';
    game.winnerId = activePlayers[0].id;
    addLog(game, `${activePlayers[0].name} 获胜。`);
  }
}

function currentSpace(game, player) {
  return game.board[player.position];
}

function findSpace(game, spaceId) {
  return game.board.find((space) => space.id === spaceId);
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
      ownerId: null,
      houses: 0,
      currentRent: space.rent[0],
    };
  });
}

function normalizePlayerNames(playerNames) {
  const names = playerNames
    .map((name) => String(name).trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);

  if (names.length < 2) {
    return ['玩家 1', '玩家 2'];
  }
  return names;
}

function normalizeDice(dice) {
  if (!Array.isArray(dice) || dice.length === 0) {
    throw new Error('骰子必须是数字数组。');
  }
  for (const value of dice) {
    if (!Number.isInteger(value) || value < 1 || value > 6) {
      throw new Error('每个骰子的点数必须在 1 到 6 之间。');
    }
  }
  return dice;
}

function assertPlaying(game) {
  if (!game || game.status === 'gameOver') {
    throw new Error('游戏已经结束。');
  }
}

function addLog(game, message) {
  game.log.unshift(message);
  if (game.log.length > 80) {
    game.log.length = 80;
  }
}
