import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHANCE_CARDS,
  BOARD_SPACES,
  applyChanceCard,
  buildHouse,
  buyCurrentProperty,
  createGame,
  endTurn,
  getCurrentPlayer,
  rollAndMove,
} from '../src/game.js';

test('createGame starts every player at Start with money and waits for a roll', () => {
  const game = createGame(['Ada', 'Lin']);

  assert.equal(game.players.length, 2);
  assert.deepEqual(game.players.map((player) => player.name), ['Ada', 'Lin']);
  assert.equal(getCurrentPlayer(game).name, 'Ada');
  assert.equal(game.players[0].cash, 1500);
  assert.equal(game.players[0].position, 0);
  assert.equal(game.phase, 'roll');
  assert.equal(game.status, 'playing');
});

test('rollAndMove lands on an unowned property and creates a purchase offer', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);

  assert.equal(getCurrentPlayer(game).position, 2);
  assert.equal(game.phase, 'action');
  assert.equal(game.pendingOffer.spaceId, BOARD_SPACES[2].id);
  assert.equal(game.pendingOffer.price, BOARD_SPACES[2].price);
});

test('passing Start pays salary before resolving the landing square', () => {
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

test('landing on another player property pays rent to the owner', () => {
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

test('buildHouse upgrades owned property and raises the next rent tier', () => {
  const game = createGame(['Ada', 'Lin']);

  rollAndMove(game, [1, 1]);
  const property = game.board[2];
  buyCurrentProperty(game);
  const cashAfterPurchase = getCurrentPlayer(game).cash;

  buildHouse(game, property.id);

  assert.equal(property.houses, 1);
  assert.equal(getCurrentPlayer(game).cash, cashAfterPurchase - property.houseCost);
  assert.equal(property.currentRent, property.rent[1]);
});

test('applyChanceCard can award and charge money', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);

  applyChanceCard(game, { id: 'bonus', text: 'Bank dividend', money: 90 });
  assert.equal(player.cash, 1590);

  applyChanceCard(game, { id: 'repair', text: 'Street repairs', money: -40 });
  assert.equal(player.cash, 1550);
});

test('go-to-jail sends the player to jail and skips their next turn', () => {
  const game = createGame(['Ada', 'Lin']);
  const player = getCurrentPlayer(game);
  player.position = 18;

  rollAndMove(game, [1, 1]);

  assert.equal(player.position, game.jailIndex);
  assert.equal(player.skipTurns, 1);
  assert.equal(game.phase, 'end');
});

test('chance deck contains playable card definitions', () => {
  assert.ok(CHANCE_CARDS.length >= 6);
  assert.ok(CHANCE_CARDS.every((card) => card.id && card.text));
});
