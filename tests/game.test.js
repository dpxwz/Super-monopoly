import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOARD_SIDE_LENGTH,
  BOARD_SPACES,
  buildHouse,
  buyCurrentProperty,
  createGame,
  endTurn,
  getCurrentPlayer,
  getOwnedProperties,
  ownsCompleteColorGroup,
  rollAndMove,
} from '../src/game.js';

const CITY_NAMES = new Set([
  '雅典', '里斯本', '马德里', '巴塞罗那',
  '巴黎', '里昂', '马赛', '尼斯',
  '伦敦', '曼彻斯特', '爱丁堡', '都柏林',
  '柏林', '慕尼黑', '汉堡', '法兰克福',
  '罗马', '米兰', '威尼斯', '佛罗伦萨',
  '开罗', '开普敦', '内罗毕', '卡萨布兰卡',
  '迪拜', '多哈', '伊斯坦布尔', '耶路撒冷',
  '东京', '大阪', '京都', '札幌',
  '首尔', '釜山', '台北', '香港',
  '纽约', '洛杉矶', '芝加哥', '旧金山',
  '悉尼', '墨尔本', '奥克兰', '温哥华',
]);

function givePropertyTo(game, property, player) {
  property.ownerId = player.id;
  property.houses = 0;
  property.currentRent = property.rent[0];
  if (!player.properties.includes(property.id)) {
    player.properties.push(property.id);
  }
}

test('board has 44 ordinary city properties arranged for a 12 by 12 perimeter', () => {
  assert.equal(BOARD_SIDE_LENGTH, 12);
  assert.equal(BOARD_SPACES.length, 44);
  assert.equal(new Set(BOARD_SPACES.map((space) => space.id)).size, 44);
  assert.equal(new Set(BOARD_SPACES.map((space) => space.name)).size, 44);

  for (const space of BOARD_SPACES) {
    assert.equal(space.type, 'property');
    assert.ok(CITY_NAMES.has(space.name), `${space.name} should be a real city name from the configured city set`);
    assert.match(space.id, /^[a-z0-9-]+$/);
    assert.ok(space.price > 0);
    assert.ok(space.houseCost > 0);
    assert.ok(Array.isArray(space.rent));
    assert.ok(space.rent.length >= 4);
    assert.ok(space.rent.every((rent) => Number.isInteger(rent) && rent > 0));
    assert.ok(space.colorGroup);
    assert.ok(space.colorName);
  }
});

test('every color group has four ordinary fixed-rent properties', () => {
  const groups = Map.groupBy(BOARD_SPACES, (space) => space.colorGroup);

  assert.equal(groups.size, 11);
  for (const [groupName, spaces] of groups) {
    assert.equal(spaces.length, 4, `${groupName} should contain four cities`);
    assert.ok(spaces.every((space) => space.type === 'property'));
    assert.ok(spaces.every((space) => !('amount' in space)));
    assert.ok(spaces.every((space) => !('rentMultiplier' in space)));
    assert.ok(spaces.every((space) => !('diceMultiplier' in space)));
  }
});

test('createGame starts on a normal city property and waits for a roll', () => {
  const game = createGame(['Ada', 'Lin']);

  assert.equal(game.players.length, 2);
  assert.deepEqual(game.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(getCurrentPlayer(game).name, 'Ada');
  assert.equal(game.players[0].cash, 1500);
  assert.equal(game.players[0].position, 0);
  assert.equal(game.board[0].type, 'property');
  assert.equal(game.phase, 'roll');
  assert.equal(game.status, 'playing');
});

test('rollAndMove lands on an unowned city and creates a purchase offer', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);

  assert.equal(getCurrentPlayer(game).position, 2);
  assert.equal(game.phase, 'action');
  assert.equal(game.pendingOffer.spaceId, BOARD_SPACES[2].id);
  assert.equal(game.pendingOffer.price, BOARD_SPACES[2].price);
});

test('passing the map origin pays lap salary before resolving the landing city', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  player.position = BOARD_SPACES.length - 1;

  rollAndMove(game, [1, 1]);

  assert.equal(player.position, 1);
  assert.equal(player.cash, 1700);
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

test('buildHouse rejects a city when the player does not own the full color group', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  const group = game.board.filter((space) => space.colorGroup === game.board[0].colorGroup);

  givePropertyTo(game, group[0], player);

  assert.equal(ownsCompleteColorGroup(game, player.id, group[0].colorGroup), false);
  assert.throws(
    () => buildHouse(game, group[0].id),
    /同色组的全部城市/,
  );
  assert.equal(group[0].houses, 0);
});

test('buildHouse upgrades a city after the player owns the full color group', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  const group = game.board.filter((space) => space.colorGroup === game.board[0].colorGroup);
  group.forEach((property) => givePropertyTo(game, property, player));
  const cashBeforeBuild = player.cash;

  assert.equal(ownsCompleteColorGroup(game, player.id, group[0].colorGroup), true);
  buildHouse(game, group[0].id);

  assert.equal(group[0].houses, 1);
  assert.equal(player.cash, cashBeforeBuild - group[0].houseCost);
  assert.equal(group[0].currentRent, group[0].rent[1]);
});

test('getOwnedProperties only returns ordinary city properties', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  givePropertyTo(game, game.board[0], player);
  givePropertyTo(game, game.board[1], player);

  assert.deepEqual(
    getOwnedProperties(game, player.id).map((space) => space.id),
    [game.board[0].id, game.board[1].id],
  );
});
