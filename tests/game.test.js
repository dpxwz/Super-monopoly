import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOARD_SIDE_LENGTH,
  BOARD_SPACES,
  LAP_BONUS,
  buildHouse,
  buyCurrentProperty,
  createGame,
  endTurn,
  getCurrentPlayer,
  getOwnedProperties,
  ownsCompleteColorGroup,
  rollAndMove,
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

function givePropertyTo(game, property, player) {
  property.ownerId = player.id;
  property.houses = 0;
  property.currentRent = property.rent[0];
  if (!player.properties.includes(property.id)) {
    player.properties.push(property.id);
  }
}

test('board keeps a 44-space 12 by 12 perimeter with a classic start square first', () => {
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
});

test('property spaces are real cities with ordinary fixed-rent pricing', () => {
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
    assert.ok(space.rent.every((rent) => Number.isInteger(rent) && rent > 0));
    assert.ok(space.colorGroup);
    assert.ok(space.colorName);
    assert.ok(!('amount' in space));
    assert.ok(!('rentMultiplier' in space));
    assert.ok(!('diceMultiplier' in space));
  }
});

test('every color group contains cities from one country only', () => {
  const groups = Map.groupBy(propertySpaces(), (space) => space.colorGroup);

  assert.equal(groups.size, 11);
  for (const [groupName, spaces] of groups) {
    assert.ok(spaces.length >= 3, `${groupName} should contain at least three cities`);
    assert.ok(spaces.length <= 4, `${groupName} should contain no more than four cities`);
    assert.equal(new Set(spaces.map((space) => space.countryName)).size, 1, `${groupName} should not mix countries`);
    assert.ok(spaces.every((space) => space.type === 'property'));
    assert.ok(spaces.every((space) => space.groupSize === spaces.length));
  }
});

test('createGame starts every player on 起始格 and waits for a roll', () => {
  const game = createGame(['Ada', 'Lin']);

  assert.equal(game.players.length, 2);
  assert.deepEqual(game.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(getCurrentPlayer(game).name, 'Ada');
  assert.equal(game.players[0].cash, 1500);
  assert.equal(game.players[0].position, 0);
  assert.equal(game.board[0].type, 'start');
  assert.equal(game.board[0].name, '起始格');
  assert.equal(game.phase, 'roll');
  assert.equal(game.status, 'playing');
});

test('rollAndMove lands on an unowned city and creates a purchase offer', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);

  assert.equal(getCurrentPlayer(game).position, 2);
  assert.equal(game.board[2].type, 'property');
  assert.equal(game.phase, 'action');
  assert.equal(game.pendingOffer.spaceId, BOARD_SPACES[2].id);
  assert.equal(game.pendingOffer.price, BOARD_SPACES[2].price);
});

test('landing exactly on 起始格 pays salary and does not create a purchase offer', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  player.position = BOARD_SPACES.length - 2;

  rollAndMove(game, [1, 1]);

  assert.equal(player.position, 0);
  assert.equal(player.cash, 1500 + LAP_BONUS);
  assert.equal(game.pendingOffer, null);
  assert.equal(game.phase, 'end');
});

test('passing 起始格 pays salary before resolving the landing city', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  player.position = BOARD_SPACES.length - 1;

  rollAndMove(game, [1, 1]);

  assert.equal(player.position, 1);
  assert.equal(player.cash, 1500 + LAP_BONUS);
  assert.equal(game.pendingOffer.spaceId, BOARD_SPACES[1].id);
});

test('buyCurrentProperty spends cash, assigns ownership, and ends the action', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);
  const property = game.board[2];
  buyCurrentProperty(game);

  assert.equal(property.ownerId, 'p1');
  assert.equal(getCurrentPlayer(game).cash, 1500 - property.price);
  assert.deepEqual(getCurrentPlayer(game).properties, [property.id]);
  assert.equal(game.pendingOffer, null);
  assert.equal(game.phase, 'end');
});

test('landing on another player city pays fixed rent to the owner', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);
  const property = game.board[2];
  buyCurrentProperty(game);
  endTurn(game);

  rollAndMove(game, [1, 1]);

  assert.equal(game.players[1].cash, 1500 - property.rent[0]);
  assert.equal(game.players[0].cash, 1500 - property.price + property.rent[0]);
  assert.equal(game.phase, 'end');
});

test('buildHouse rejects a city when the player does not own the full country color group', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  const firstProperty = game.board.find((space) => space.type === 'property');
  const group = game.board.filter((space) => space.colorGroup === firstProperty.colorGroup);

  givePropertyTo(game, group[0], player);

  assert.equal(ownsCompleteColorGroup(game, player.id, group[0].colorGroup), false);
  assert.throws(
    () => buildHouse(game, group[0].id),
    /同色组的全部城市/,
  );
  assert.equal(group[0].houses, 0);
});

test('buildHouse upgrades a city after the player owns the full country color group', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  const firstProperty = game.board.find((space) => space.type === 'property');
  const group = game.board.filter((space) => space.colorGroup === firstProperty.colorGroup);
  group.forEach((property) => givePropertyTo(game, property, player));
  const cashBeforeBuild = player.cash;

  assert.equal(ownsCompleteColorGroup(game, player.id, group[0].colorGroup), true);
  buildHouse(game, group[0].id);

  assert.equal(group[0].houses, 1);
  assert.equal(player.cash, cashBeforeBuild - group[0].houseCost);
  assert.equal(group[0].currentRent, group[0].rent[1]);
});

test('getOwnedProperties excludes 起始格 and only returns cities', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  game.board[0].ownerId = player.id;
  givePropertyTo(game, game.board[1], player);
  givePropertyTo(game, game.board[2], player);

  assert.deepEqual(
    getOwnedProperties(game, player.id).map((space) => space.id),
    [game.board[1].id, game.board[2].id],
  );
});
