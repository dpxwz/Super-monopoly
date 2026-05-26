export const START_CASH = 1500;
export const START_BONUS = 200;
export const MAX_PLAYERS = 4;

export const BOARD_SPACES = [
  { id: 'start', type: 'start', name: '起点', description: '经过或停在这里获得 $200' },
  { id: 'sakura-road', type: 'property', name: '樱花路', color: 'rose', price: 60, rent: [2, 10, 30, 90], houseCost: 50 },
  { id: 'birch-cafe', type: 'property', name: '白桦咖啡馆', color: 'rose', price: 70, rent: [4, 20, 60, 180], houseCost: 50 },
  { id: 'chance-1', type: 'chance', name: '机会', description: '抽一张机会卡' },
  { id: 'harbor-station', type: 'railroad', name: '港湾车站', price: 200, rent: [25, 50, 100, 200], houseCost: 0 },
  { id: 'income-tax', type: 'tax', name: '所得税', amount: 100, description: '支付 $100' },
  { id: 'platform-garden', type: 'property', name: '月台花园', color: 'amber', price: 100, rent: [6, 30, 90, 270], houseCost: 50 },
  { id: 'starlamp-street', type: 'property', name: '星灯街', color: 'amber', price: 110, rent: [8, 40, 100, 300], houseCost: 50 },
  { id: 'jail', type: 'jail', name: '监狱 / 探监', description: '只是路过时不会受罚' },
  { id: 'neon-cinema', type: 'property', name: '霓虹影院', color: 'violet', price: 140, rent: [10, 50, 150, 450], houseCost: 100 },
  { id: 'chance-2', type: 'chance', name: '机会', description: '抽一张机会卡' },
  { id: 'old-town-books', type: 'property', name: '旧城区书店', color: 'violet', price: 150, rent: [12, 60, 180, 500], houseCost: 100 },
  { id: 'free-parking', type: 'parking', name: '免费停车', description: '安全休息一回合' },
  { id: 'coral-apartment', type: 'property', name: '珊瑚公寓', color: 'teal', price: 180, rent: [14, 70, 200, 550], houseCost: 100 },
  { id: 'spruce-plaza', type: 'property', name: '云杉广场', color: 'teal', price: 190, rent: [16, 80, 220, 600], houseCost: 100 },
  { id: 'utility', type: 'utility', name: '水电公司', price: 150, rent: [20, 40, 80, 120], houseCost: 0 },
  { id: 'loop-rail', type: 'railroad', name: '环城铁路', price: 200, rent: [25, 50, 100, 200], houseCost: 0 },
  { id: 'mint-villa', type: 'property', name: '薄荷别墅', color: 'green', price: 220, rent: [18, 90, 250, 700], houseCost: 150 },
  { id: 'chance-3', type: 'chance', name: '机会', description: '抽一张机会卡' },
  { id: 'golden-tower', type: 'property', name: '黄金塔', color: 'green', price: 260, rent: [22, 110, 330, 800], houseCost: 150 },
  { id: 'go-to-jail', type: 'go-to-jail', name: '去监狱', description: '直接移动到监狱，下次轮到你时暂停一次' },
  { id: 'blue-harbor', type: 'property', name: '蓝港码头', color: 'blue', price: 300, rent: [26, 130, 390, 900], houseCost: 200 },
  { id: 'luxury-tax', type: 'tax', name: '奢侈税', amount: 150, description: '支付 $150' },
  { id: 'stellar-hotel', type: 'property', name: '星际酒店', color: 'blue', price: 350, rent: [35, 175, 500, 1100], houseCost: 200 },
];

export const CHANCE_CARDS = [
  { id: 'salary-bonus', text: '股票分红，收取 $120。', money: 120 },
  { id: 'street-repair', text: '道路维修分摊，支付 $80。', money: -80 },
  { id: 'advance-start', text: '前进到起点，并领取 $200。', moveTo: 0, collectStart: true },
  { id: 'speeding', text: '超速被拦，直接去监狱。', goToJail: true },
  { id: 'street-fair', text: '街头市集大卖，每名对手付你 $25。', collectFromEach: 25 },
  { id: 'charity', text: '慈善捐款，支付 $50。', money: -50 },
  { id: 'shortcut', text: '发现近路，前进三格。', moveBy: 3 },
];

export function createGame(playerNames = ['玩家 1', '玩家 2'], options = {}) {
  const names = normalizePlayerNames(playerNames);
  const board = cloneBoard(BOARD_SPACES);
  const chanceDeck = [...(options.chanceDeck ?? CHANCE_CARDS)];

  return {
    status: 'playing',
    phase: 'roll',
    turn: 0,
    round: 1,
    board,
    chanceDeck,
    chanceCursor: 0,
    jailIndex: board.findIndex((space) => space.type === 'jail'),
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
      skipTurns: 0,
    })),
    log: ['新游戏开始。掷骰子，买地，收租，活到最后。'],
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

  if (player.skipTurns > 0) {
    player.skipTurns -= 1;
    game.phase = 'end';
    addLog(game, `${player.name} 在监狱暂停一次。`);
    return game;
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
    throw new Error('当前没有可购买的地块。');
  }

  const player = getCurrentPlayer(game);
  const property = findSpace(game, game.pendingOffer.spaceId);
  if (!isPurchasable(property)) {
    throw new Error('这个格子不能购买。');
  }
  if (property.ownerId) {
    throw new Error('这个地块已经有主人。');
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
    throw new Error('找不到这个地块。');
  }
  if (property.ownerId !== player.id) {
    throw new Error('只能升级自己拥有的地块。');
  }
  if (property.type !== 'property') {
    throw new Error('车站和水电公司不能建造房屋。');
  }
  if (property.houses >= property.rent.length - 1) {
    throw new Error('这个地块已经升到最高等级。');
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
    if (player.skipTurns > 0) {
      player.skipTurns -= 1;
      addLog(game, `${player.name} 在监狱暂停一次。`);
      continue;
    }

    game.phase = 'roll';
    addLog(game, `轮到 ${player.name}。`);
    return game;
  }

  checkWinner(game);
  return game;
}

export function applyChanceCard(game, card) {
  assertPlaying(game);
  const player = getCurrentPlayer(game);
  addLog(game, `机会卡：${card.text}`);

  if (typeof card.money === 'number') {
    adjustCash(game, player, card.money, card.text);
  }

  if (typeof card.collectFromEach === 'number') {
    for (const other of game.players) {
      if (other.id !== player.id && !other.bankrupt) {
        transferCash(game, other, player, card.collectFromEach, `${other.name} 支付给 ${player.name}`);
      }
    }
  }

  if (card.goToJail) {
    sendToJail(game, player);
    return game;
  }

  if (Number.isInteger(card.moveTo)) {
    const previousPosition = player.position;
    player.position = card.moveTo;
    if (card.collectStart || card.moveTo < previousPosition) {
      adjustCash(game, player, START_BONUS, '经过起点');
    }
    resolveLanding(game, player, { fromChance: true });
    return game;
  }

  if (Number.isInteger(card.moveBy)) {
    movePlayerBy(game, player, card.moveBy, true);
    resolveLanding(game, player, { fromChance: true });
    return game;
  }

  checkWinner(game);
  return game;
}

export function getOwnedProperties(game, playerId) {
  return game.board.filter((space) => isPurchasable(space) && space.ownerId === playerId);
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

function resolveLanding(game, player, options = {}) {
  if (game.status === 'gameOver') {
    return;
  }

  const space = currentSpace(game, player);
  game.pendingOffer = null;

  switch (space.type) {
    case 'start':
      game.phase = 'end';
      addLog(game, `${player.name} 停在起点。`);
      break;
    case 'property':
    case 'railroad':
    case 'utility':
      resolvePurchasableSpace(game, player, space);
      break;
    case 'chance':
      drawChanceCard(game);
      if (!game.pendingOffer && game.phase !== 'action') {
        game.phase = 'end';
      }
      break;
    case 'tax':
      adjustCash(game, player, -space.amount, space.name);
      game.phase = 'end';
      addLog(game, `${player.name} 支付「${space.name}」$${space.amount}。`);
      break;
    case 'jail':
      game.phase = 'end';
      addLog(game, `${player.name} 只是探监，没有处罚。`);
      break;
    case 'parking':
      game.phase = 'end';
      addLog(game, `${player.name} 在免费停车休息。`);
      break;
    case 'go-to-jail':
      sendToJail(game, player);
      game.phase = 'end';
      break;
    default:
      game.phase = 'end';
      addLog(game, `${player.name} 停在「${space.name}」。`);
  }

  if (!options.fromChance) {
    checkWinner(game);
  }
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

function drawChanceCard(game) {
  if (game.chanceDeck.length === 0) {
    game.phase = 'end';
    return null;
  }
  const card = game.chanceDeck[game.chanceCursor % game.chanceDeck.length];
  game.chanceCursor += 1;
  applyChanceCard(game, card);
  return card;
}

function movePlayerBy(game, player, steps, payStartBonus) {
  const previousPosition = player.position;
  const boardLength = game.board.length;
  const total = previousPosition + steps;
  player.position = ((total % boardLength) + boardLength) % boardLength;

  if (payStartBonus && steps > 0 && total >= boardLength) {
    adjustCash(game, player, START_BONUS, '经过起点');
    addLog(game, `${player.name} 经过起点，领取 $${START_BONUS}。`);
  }
}

function sendToJail(game, player) {
  player.position = game.jailIndex;
  player.skipTurns = Math.max(player.skipTurns, 1);
  game.phase = 'end';
  addLog(game, `${player.name} 被送进监狱，下次轮到时暂停一次。`);
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
      property.currentRent = property.rent?.[0] ?? 0;
    }
  }
  player.properties = [];
  addLog(game, `${player.name} 因「${reason}」破产，名下资产回到市场。`);
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
  return ['property', 'railroad', 'utility'].includes(space?.type);
}

function cloneBoard(spaces) {
  return spaces.map((space) => ({
    ...space,
    rent: space.rent ? [...space.rent] : undefined,
    ownerId: null,
    houses: 0,
    currentRent: space.rent?.[0] ?? 0,
  }));
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
