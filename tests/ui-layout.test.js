import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

function expectMarkup(fragment, label = fragment) {
  assert.ok(indexHtml.includes(fragment), `index.html should include ${label}`);
}

test('main play screen uses the cinematic map three-column layout', () => {
  expectMarkup('class="left-rail"', 'left rail for players and chat');
  expectMarkup('class="board-stage"', 'central board stage');
  expectMarkup('class="right-rail"', 'right rail for trade/properties/contracts');
  expectMarkup('class="center-log-panel"', 'event log panel inside board center');
  expectMarkup('id="log"', 'event log remains render target');

  const logIndex = indexHtml.indexOf('id="log"');
  const centerIndex = indexHtml.lastIndexOf('center-log-panel', logIndex);
  assert.notEqual(centerIndex, -1, 'event log should live inside the map center panel');
});

test('trade controls and player detail live in overlays instead of the home sidebar', () => {
  expectMarkup('id="trade-overlay"', 'trade overlay');
  expectMarkup('data-open-trade', 'trade button trigger');
  expectMarkup('id="player-detail-overlay"', 'player detail overlay');
  expectMarkup('data-player-detail-name', 'player detail render target');

  const tradeOverlayIndex = indexHtml.indexOf('id="trade-overlay"');
  const tradeFormIndex = indexHtml.indexOf('id="trade-form"');
  assert.ok(tradeOverlayIndex >= 0 && tradeFormIndex > tradeOverlayIndex, 'trade form should be inside the overlay markup');
});

test('right rail has separate current-player property and contract boxes plus LAN-only chat UI', () => {
  expectMarkup('id="right-player-name"', 'right rail focused player name');
  expectMarkup('id="right-player-mode"', 'right rail local/LAN mode hint');
  expectMarkup('id="properties"', 'current player properties box');
  expectMarkup('id="contracts"', 'current player contracts box');
  expectMarkup('id="chat-form"', 'LAN chat form');
  expectMarkup('id="chat-input"', 'LAN chat input');
  expectMarkup('id="chat-status"', 'LAN/local chat status');
});
