import {
  buildHouse,
  buyCurrentProperty,
  createGame,
  declineCurrentProperty,
  endTurn,
  getCurrentPlayer,
  getOwnedProperties,
  getSpaceRent,
  rollAndMove,
} from './game.js';

const playerColors = ['var(--player-1)', 'var(--player-2)', 'var(--player-3)', 'var(--player-4)'];
const colorStripes = {
  rose: '#ff8fa3',
  amber: '#ffd166',
  violet: '#b197fc',
  teal: '#63e6be',
  green: '#8ce99a',
  blue: '#74c0fc',
};

const elements = {
  setupForm: document.querySelector('#setup-form'),
  board: document.querySelector('#board'),
  currentPlayer: document.querySelector('#current-player'),
  currentSpace: document.querySelector('#current-space'),
  roundLabel: document.querySelector('#round-label'),
  phaseLabel: document.querySelector('#phase-label'),
  diceLabel: document.querySelector('#dice-label'),
  rollButton: document.querySelector('#roll-button'),
  buyButton: document.querySelector('#buy-button'),
  declineButton: document.querySelector('#decline-button'),
  endButton: document.querySelector('#end-button'),
  newGameButton: document.querySelector('#new-game-button'),
  offerText: document.querySelector('#offer-text'),
  message: document.querySelector('#message'),
  players: document.querySelector('#players'),
  properties: document.querySelector('#properties'),
  log: document.querySelector('#log'),
  aliveCount: document.querySelector('#alive-count'),
};

let game = createGame(['玩家 1', '玩家 2']);

bindEvents();
render();

function bindEvents() {
  elements.setupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const names = [...new FormData(elements.setupForm).getAll('player')]
      .map((name) => String(name).trim())
      .filter(Boolean);
    safeAction(() => {
      game = createGame(names.length >= 2 ? names : ['玩家 1', '玩家 2']);
      setMessage('新游戏已开始。');
    });
  });

  elements.rollButton.addEventListener('click', () => {
    safeAction(() => {
      rollAndMove(game);
      const dice = game.lastDice?.join(' + ') ?? '--';
      setMessage(`掷骰结果：${dice}`);
    });
  });

  elements.buyButton.addEventListener('click', () => {
    safeAction(() => {
      const property = buyCurrentProperty(game);
      setMessage(`买下了「${property.name}」。`);
    });
  });

  elements.declineButton.addEventListener('click', () => {
    safeAction(() => {
      const property = declineCurrentProperty(game);
      setMessage(property ? `放弃购买「${property.name}」。` : '没有可购买地块。');
    });
  });

  elements.endButton.addEventListener('click', () => {
    safeAction(() => {
      endTurn(game);
      setMessage(game.status === 'gameOver' ? '游戏结束。' : `轮到 ${getCurrentPlayer(game).name}。`);
    });
  });

  elements.newGameButton.addEventListener('click', () => {
    safeAction(() => {
      const names = game.players.map((player) => player.name);
      game = createGame(names);
      setMessage('已按当前玩家名单重开。');
    });
  });
}

function safeAction(action) {
  try {
    action();
    render();
  } catch (error) {
    setMessage(error.message, true);
    render();
  }
}

function render() {
  const currentPlayer = getCurrentPlayer(game);
  const currentSpace = game.board[currentPlayer.position];
  const alivePlayers = game.players.filter((player) => !player.bankrupt);

  elements.currentPlayer.textContent = game.status === 'gameOver'
    ? `${winnerName()} 获胜`
    : currentPlayer.name;
  elements.currentSpace.textContent = `${currentSpace.name} · 现金 $${currentPlayer.cash}`;
  elements.roundLabel.textContent = `第 ${game.round} 轮`;
  elements.phaseLabel.textContent = phaseText(game.phase);
  elements.diceLabel.textContent = `骰子：${game.lastDice ? game.lastDice.join(' + ') : '--'}`;
  elements.aliveCount.textContent = `${alivePlayers.length} 人未破产`;

  renderOffer();
  renderControls();
  renderBoard();
  renderPlayers();
  renderProperties();
  renderLog();

  window.superMonopolyGame = game;
}

function renderOffer() {
  if (!game.pendingOffer) {
    elements.offerText.textContent = '';
    return;
  }
  const property = game.board.find((space) => space.id === game.pendingOffer.spaceId);
  elements.offerText.textContent = `可购买「${property.name}」：价格 $${property.price}，基础租金 $${getSpaceRent(property)}。`;
}

function renderControls() {
  const hasOffer = Boolean(game.pendingOffer);
  elements.rollButton.disabled = game.phase !== 'roll' || game.status === 'gameOver';
  elements.buyButton.disabled = !hasOffer || game.status === 'gameOver';
  elements.declineButton.disabled = !hasOffer || game.status === 'gameOver';
  elements.endButton.disabled = game.phase === 'roll' || hasOffer || game.status === 'gameOver';
}

function renderBoard() {
  elements.board.querySelectorAll('.square').forEach((square) => square.remove());
  const currentPlayer = getCurrentPlayer(game);

  game.board.forEach((space, index) => {
    const square = document.createElement('article');
    const grid = gridPosition(index);
    const owner = game.players.find((player) => player.id === space.ownerId);
    const tokens = game.players.filter((player) => player.position === index && !player.bankrupt);

    square.className = `square type-${space.type}`;
    if (owner) square.classList.add('is-owned');
    if (currentPlayer.position === index) square.classList.add('is-current');
    square.style.gridColumn = String(grid.column);
    square.style.gridRow = String(grid.row);
    square.style.setProperty('--stripe', stripeFor(space));

    square.innerHTML = `
      <h3 class="square-name">${escapeHtml(space.name)}</h3>
      <p class="square-meta">${spaceMeta(space, owner)}</p>
      <div class="tokens">${tokens.map(tokenMarkup).join('')}</div>
    `;

    elements.board.append(square);
  });
}

function renderPlayers() {
  elements.players.innerHTML = game.players.map((player, index) => {
    const propertyCount = player.properties.length;
    const position = game.board[player.position].name;
    const activeClass = index === game.turn && game.status !== 'gameOver' ? ' is-active' : '';
    const bankruptClass = player.bankrupt ? ' is-bankrupt' : '';

    return `
      <article class="player-card${activeClass}${bankruptClass}">
        <div class="card-topline">
          <strong><span class="player-dot" style="--dot: ${playerColors[index]}"></span>${escapeHtml(player.name)}</strong>
          <span class="badge">${player.bankrupt ? '破产' : index === game.turn ? '行动中' : '等待'}</span>
        </div>
        <div class="card-grid">
          <span><b>$${player.cash}</b>现金</span>
          <span><b>${propertyCount}</b>地块</span>
          <span><b>${escapeHtml(position)}</b>位置</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderProperties() {
  const currentPlayer = getCurrentPlayer(game);
  const properties = getOwnedProperties(game, currentPlayer.id);

  if (properties.length === 0) {
    elements.properties.innerHTML = '<p class="empty-state">当前玩家还没有地块。买下空地后，这里会显示升级按钮。</p>';
    return;
  }

  elements.properties.innerHTML = properties.map((property) => {
    const canBuild = property.type === 'property' && property.houses < property.rent.length - 1;
    const rent = getSpaceRent(property);
    const buildLabel = property.type === 'property'
      ? `升级 $${property.houseCost}`
      : '不能升级';

    return `
      <article class="property-card">
        <div class="card-topline">
          <strong>${escapeHtml(property.name)}</strong>
          <span class="badge">租金 $${rent}</span>
        </div>
        <div class="houses">${property.type === 'property' ? '★'.repeat(property.houses) || '未升级' : property.typeLabel ?? property.type}</div>
        <button type="button" data-build="${property.id}" ${canBuild ? '' : 'disabled'}>${buildLabel}</button>
      </article>
    `;
  }).join('');

  elements.properties.querySelectorAll('[data-build]').forEach((button) => {
    button.addEventListener('click', () => {
      safeAction(() => {
        const property = buildHouse(game, button.dataset.build);
        setMessage(`「${property.name}」升级到 ${property.houses} 级。`);
      });
    });
  });
}

function renderLog() {
  elements.log.innerHTML = game.log
    .slice(0, 12)
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join('');
}

function setMessage(message, isError = false) {
  elements.message.textContent = message;
  elements.message.classList.toggle('is-error', isError);
}

function phaseText(phase) {
  return {
    roll: '等待掷骰',
    action: '等待购买决定',
    end: '可结束回合',
    gameOver: '游戏结束',
  }[phase] ?? phase;
}

function winnerName() {
  const winner = game.players.find((player) => player.id === game.winnerId);
  return winner?.name ?? '胜者';
}

function gridPosition(index) {
  if (index <= 6) return { row: 1, column: index + 1 };
  if (index <= 12) return { row: index - 5, column: 7 };
  if (index <= 18) return { row: 7, column: 20 - index };
  return { row: 25 - index, column: 1 };
}

function stripeFor(space) {
  if (space.color) return colorStripes[space.color] ?? '#f3c969';
  if (space.type === 'chance') return '#f3c969';
  if (space.type === 'tax' || space.type === 'go-to-jail') return '#ff7066';
  if (space.type === 'railroad') return '#ced4da';
  if (space.type === 'utility') return '#74c0fc';
  return 'rgba(255, 255, 255, 0.18)';
}

function spaceMeta(space, owner) {
  if (space.price) {
    const ownerText = owner ? ` · ${escapeHtml(owner.name)}` : '';
    const houseText = space.houses ? ` · ${'★'.repeat(space.houses)}` : '';
    return `$${space.price} · 租 $${getSpaceRent(space)}${ownerText}${houseText}`;
  }
  if (space.amount) return `支付 $${space.amount}`;
  return escapeHtml(space.description ?? space.type);
}

function tokenMarkup(player) {
  const index = Number(player.id.replace('p', '')) - 1;
  return `<span class="token" style="background: ${playerColors[index]}">${index + 1}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
