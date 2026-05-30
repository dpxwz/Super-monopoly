import {
  BANK_ID,
  BOARD_SIDE_LENGTH,
  CONTRACT_TYPES,
  SHARE_PERCENT,
  buildHouse,
  buyCurrentShares,
  canBuildHouse,
  canDemolishHouse,
  castBuildVote,
  createFreePassContract,
  createGame,
  createInheritanceContract,
  createVoteSupportContract,
  declineCurrentShareOffer,
  declareBankruptcy,
  demolishHouse,
  endTurn,
  expirePendingTrades,
  getBankShareCount,
  getBuildEligibility,
  getColorGroupProperties,
  getCurrentPlayer,
  getDemolishEligibility,
  getPlayerPropertyHoldings,
  getPlayerShareCount,
  getPropertyShareholders,
  getSpaceRent,
  isColorGroupMajorShareholder,
  ownsCompleteColorGroup,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  resolveBuildVote,
  resolvePendingConstruction,
  rollAndMove,
  startBuildVote,
  startDemolishVote,
} from './game.js';
import { t, setLocale, getLocale, cityName, countryName, colorName, detectLocale } from './i18n.js';

const playerColors = ['var(--player-1)', 'var(--player-2)', 'var(--player-3)', 'var(--player-4)'];
const bankColor = 'rgba(174, 184, 199, 0.48)';

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
  bankruptcyButton: document.querySelector('#bankruptcy-button'),
  newGameButton: document.querySelector('#new-game-button'),
  sharePurchaseForm: document.querySelector('#share-purchase-form'),
  shareCount: document.querySelector('#share-count'),
  sharePreview: document.querySelector('#share-preview'),
  offerText: document.querySelector('#offer-text'),
  auctionWarning: document.querySelector('#auction-warning'),
  message: document.querySelector('#message'),
  players: document.querySelector('#players'),
  properties: document.querySelector('#properties'),
  votes: document.querySelector('#votes'),
  tradeForm: document.querySelector('#trade-form'),
  tradeFrom: document.querySelector('#trade-from'),
  tradeTo: document.querySelector('#trade-to'),
  tradeOfferCash: document.querySelector('#trade-offer-cash'),
  tradeRequestCash: document.querySelector('#trade-request-cash'),
  tradeOfferProperty: document.querySelector('#trade-offer-property'),
  tradeOfferShares: document.querySelector('#trade-offer-shares'),
  tradeRequestProperty: document.querySelector('#trade-request-property'),
  tradeRequestShares: document.querySelector('#trade-request-shares'),
  tradeOfferContract: document.querySelector('#trade-offer-contract'),
  tradeRequestContract: document.querySelector('#trade-request-contract'),
  tradeNote: document.querySelector('#trade-note'),
  pendingTrades: document.querySelector('#pending-trades'),
  contractForm: document.querySelector('#contract-form'),
  contractType: document.querySelector('#contract-type'),
  contractHolder: document.querySelector('#contract-holder'),
  contractProperty: document.querySelector('#contract-property'),
  contractShareCount: document.querySelector('#contract-share-count'),
  contractShareOwner: document.querySelector('#contract-share-owner'),
  contractObligor: document.querySelector('#contract-obligor'),
  contractStance: document.querySelector('#contract-stance'),
  contracts: document.querySelector('#contracts'),
  log: document.querySelector('#log'),
  aliveCount: document.querySelector('#alive-count'),
};

let game = createGame(['玩家 1', '玩家 2']);

// Expose a stable debugging handle for browser smoke tests and manual tabletop adjudication.
window.superMonopoly = {
  get game() {
    return game;
  },
};

elements.board.style.setProperty('--board-side-length', BOARD_SIDE_LENGTH);

// ── Static HTML translation ──
// Translates elements with data-i18n, data-i18n-label, data-i18n-placeholder attributes.
function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated !== key) el.textContent = translated;
  });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-label');
    const translated = t(key);
    if (translated !== key) {
      // For <label> elements, update only the text node before the child input
      const textNode = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (textNode) {
        textNode.textContent = translated + '\n            ';
      } else {
        el.childNodes[0].textContent = translated;
      }
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key);
    if (translated !== key) el.placeholder = translated;
  });
  // Update option elements inside selects
  const contractTypeSelect = document.querySelector('#contract-type');
  if (contractTypeSelect) {
    contractTypeSelect.innerHTML = `
      <option value="freePass">${t('ui.freePass')}</option>
      <option value="inheritance">${t('ui.inheritance')}</option>
      <option value="voteSupport">${t('ui.voteSupport')}</option>
    `;
  }
  const stanceSelect = document.querySelector('#contract-stance');
  if (stanceSelect) {
    stanceSelect.innerHTML = `
      <option value="yes">${t('ui.support')}</option>
      <option value="no">${t('ui.oppose')}</option>
    `;
  }
}

// Language switcher
function initLanguageSwitcher() {
  const switcher = document.querySelector('#lang-switcher');
  if (!switcher) return;
  // Set initial value based on detected locale
  switcher.value = getLocale();
  switcher.addEventListener('change', (e) => {
    setLocale(e.target.value);
    applyStaticTranslations();
    // Re-create game with localized default names
    const names = game.players.map((p) => p.name);
    game = createGame(names);
    render();
  });
}

initLanguageSwitcher();
applyStaticTranslations();
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
      setMessage(t('msg.newGameStarted'));
    });
  });

  elements.rollButton.addEventListener('click', () => {
    safeAction(() => {
      rollAndMove(game);
      const dice = game.lastDice?.join(' + ') ?? '--';
      setMessage(t('msg.diceResult', dice));
    });
  });

  elements.buyButton.addEventListener('click', () => buySelectedShares());
  elements.sharePurchaseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    buySelectedShares();
  });
  elements.shareCount.addEventListener('input', renderSharePurchasePreview);

  elements.declineButton.addEventListener('click', () => {
    safeAction(() => {
      const property = declineCurrentShareOffer(game);
      setMessage(property ? t('msg.declinedPurchase', property.name) : t('msg.noSharesToBuy'));
    });
  });

  elements.endButton.addEventListener('click', () => {
    safeAction(() => {
      endTurn(game);
      setMessage(game.status === 'gameOver' ? t('msg.gameOver') : t('msg.turnTo', getCurrentPlayer(game).name));
    });
  });

  elements.bankruptcyButton.addEventListener('click', () => {
    safeAction(() => {
      const player = getCurrentPlayer(game);
      declareBankruptcy(game, player.id, { type: 'active', reason: '主动破产' });
      setMessage(t('msg.activeBankruptcy', player.name));
    });
  });

  elements.newGameButton.addEventListener('click', () => {
    safeAction(() => {
      const names = game.players.map((player) => player.name);
      game = createGame(names);
      setMessage(t('msg.restartedWithPlayers'));
    });
  });

  elements.properties.addEventListener('click', (event) => {
    const buildButton = event.target.closest('[data-build]');
    const demolishButton = event.target.closest('[data-demolish]');
    const voteButton = event.target.closest('[data-start-vote]');
    const demolishVoteButton = event.target.closest('[data-start-demolish-vote]');
    if (buildButton) {
      safeAction(() => {
        const property = buildHouse(game, buildButton.dataset.build);
        if (game.phase === 'buildPayment') {
          setMessage(t('msg.buildPaymentPending'), true);
        } else {
          setMessage(t('msg.upgraded', property.name, property.houses));
        }
      });
    }
    if (demolishButton) {
      safeAction(() => {
        const property = demolishHouse(game, demolishButton.dataset.demolish);
        setMessage(t('msg.demolished', property.name, property.houses));
      });
    }
    if (voteButton) {
      safeAction(() => {
        const vote = startBuildVote(game, voteButton.dataset.startVote);
        const property = game.board.find((space) => space.id === vote.spaceId);
        setMessage(t('msg.buildVoteStarted', property.name));
      });
    }
    if (demolishVoteButton) {
      safeAction(() => {
        const vote = startDemolishVote(game, demolishVoteButton.dataset.startDemolishVote);
        const property = game.board.find((space) => space.id === vote.spaceId);
        setMessage(t('msg.demolishVoteStarted', property.name));
      });
    }
  });

  elements.votes.addEventListener('click', (event) => {
    const voteButton = event.target.closest('[data-vote-choice]');
    const resolveButton = event.target.closest('[data-resolve-vote]');
    if (voteButton) {
      safeAction(() => {
        castBuildVote(game, voteButton.dataset.voteId, voteButton.dataset.votePlayer, voteButton.dataset.voteChoice);
        setMessage(t('msg.voteRecorded', playerName(voteButton.dataset.votePlayer)));
      });
    }
    if (resolveButton) {
      safeAction(() => {
        const vote = game.pendingVote;
        const result = resolveBuildVote(game, resolveButton.dataset.resolveVote);
        const actionText = vote?.type === 'demolish' ? t('button.demolish') : t('button.build');
        const successText = vote?.type === 'demolish'
          ? '投票通过，已按股份分配拆房返还费用。'
          : '投票通过，已尝试按股份分摊建房费用。';
        setMessage(result.passed ? successText : `${actionText}投票未通过。`);
      });
    }
    const constructionButton = event.target.closest('[data-resolve-construction]');
    if (constructionButton) {
      safeAction(() => {
        const result = resolvePendingConstruction(game);
        setMessage(result?.status === 'collecting' ? t('msg.stillCollecting') : t('msg.constructionSettled'));
      });
    }
  });

  elements.tradeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(() => {
      const fromPlayerId = elements.tradeFrom.value;
      const toPlayerId = elements.tradeTo.value;
      const offer = buildTradeAssets(fromPlayerId, elements.tradeOfferProperty, elements.tradeOfferShares, elements.tradeOfferCash, elements.tradeOfferContract);
      const request = buildTradeAssets(toPlayerId, elements.tradeRequestProperty, elements.tradeRequestShares, elements.tradeRequestCash, elements.tradeRequestContract);
      const trade = proposeTrade(game, {
        fromPlayerId,
        toPlayerId,
        offer,
        request,
        note: elements.tradeNote.value,
      });
      setMessage(t('msg.tradeProposed', trade.id));
    });
  });

  elements.pendingTrades.addEventListener('click', (event) => {
    const acceptButton = event.target.closest('[data-accept-trade]');
    const rejectButton = event.target.closest('[data-reject-trade]');
    if (acceptButton) {
      safeAction(() => {
        const trade = acceptTrade(game, acceptButton.dataset.acceptTrade, Date.now());
        setMessage(t('msg.tradeAccepted', trade.id));
      });
    }
    if (rejectButton) {
      safeAction(() => {
        const trade = rejectTrade(game, rejectButton.dataset.rejectTrade);
        setMessage(t('msg.tradeRejected', trade.id));
      });
    }
  });

  elements.tradeFrom.addEventListener('change', renderTradeAssetOptions);
  elements.tradeTo.addEventListener('change', renderTradeAssetOptions);

  elements.contractForm.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(() => {
      const contract = createContractFromForm();
      setMessage(t('msg.contractCreated', contract.id));
    });
  });
  elements.contractProperty.addEventListener('change', renderContractFormOptions);
  elements.contractType.addEventListener('change', renderContractFormOptions);
}

function buySelectedShares() {
  safeAction(() => {
    const shareCount = Number(elements.shareCount.value);
    const property = buyCurrentShares(game, shareCount);
    setMessage(t('msg.boughtShares', property.name, shareCount * SHARE_PERCENT));
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
  expirePendingTrades(game, Date.now());
  const currentPlayer = getCurrentPlayer(game);
  const currentSpace = game.board[currentPlayer.position];
  const alivePlayers = game.players.filter((player) => !player.bankrupt);

  elements.currentPlayer.textContent = game.status === 'gameOver'
    ? `${winnerName()} 获胜`
    : currentPlayer.name;
  elements.currentSpace.textContent = currentSpace.type === 'start'
    ? `${currentSpace.name} · 经过奖励 $${formatMoney(currentSpace.bonus)} · 现金 $${formatMoney(currentPlayer.cash)}`
    : `${currentSpace.name} · ${currentSpace.countryName} · ${currentSpace.colorName} · 租金 $${formatMoney(getSpaceRent(currentSpace))} · 现金 $${formatMoney(currentPlayer.cash)}`;
  elements.roundLabel.textContent = t('ui.round', game.round);
  elements.phaseLabel.textContent = phaseText(game.phase);
  elements.diceLabel.textContent = t('ui.dice', game.lastDice ? game.lastDice.join(' + ') : '--');
  elements.aliveCount.textContent = t('ui.aliveCount', alivePlayers.length);

  renderOffer();
  renderControls();
  renderBoard();
  renderPlayers();
  renderProperties();
  renderVotes();
  renderTradePanel();
  renderContracts();
  renderBankruptcyWarning();
  renderLog();

  window.superMonopolyGame = game;
}

function renderOffer() {
  if (!game.pendingOffer) {
    elements.offerText.textContent = '';
    elements.sharePurchaseForm.hidden = true;
    return;
  }
  const property = game.board.find((space) => space.id === game.pendingOffer.spaceId);
  elements.offerText.textContent = `可购买「${property.name}」银行剩余股份：最多 ${game.pendingOffer.maxShareCount * SHARE_PERCENT}%，每 10% $${formatMoney(game.pendingOffer.pricePerShare)}。`;
  elements.sharePurchaseForm.hidden = false;
  elements.shareCount.max = String(game.pendingOffer.maxShareCount);
  const current = Number(elements.shareCount.value || 1);
  if (current < 1 || current > game.pendingOffer.maxShareCount) {
    elements.shareCount.value = String(game.pendingOffer.maxShareCount);
  }
  renderSharePurchasePreview();
}

function renderSharePurchasePreview() {
  if (!game.pendingOffer) {
    elements.sharePreview.textContent = t('ui.noPurchaseOpportunity');
    return;
  }
  const count = clamp(Number(elements.shareCount.value || 1), 1, game.pendingOffer.maxShareCount);
  const cost = count * game.pendingOffer.pricePerShare;
  elements.sharePreview.textContent = `${count * SHARE_PERCENT}% · $${formatMoney(cost)}`;
}

function renderControls() {
  const hasOffer = Boolean(game.pendingOffer);
  const currentPlayer = getCurrentPlayer(game);
  const processPaused = game.phase === 'auctionPending' || game.phase === 'buildPayment';
  const cashLocked = !currentPlayer.bankrupt && currentPlayer.cash <= 0;
  elements.rollButton.disabled = game.phase !== 'roll' || game.status === 'gameOver' || cashLocked;
  elements.buyButton.disabled = !hasOffer || game.status === 'gameOver' || processPaused || cashLocked;
  elements.declineButton.disabled = !hasOffer || game.status === 'gameOver' || processPaused;
  elements.endButton.disabled = game.phase === 'roll' || hasOffer || game.status === 'gameOver' || processPaused || game.phase === 'vote' || cashLocked;
  elements.bankruptcyButton.disabled = game.status === 'gameOver' || game.phase === 'auctionPending' || currentPlayer.bankrupt;
}

function renderBoard() {
  elements.board.querySelectorAll('.square').forEach((square) => square.remove());
  const currentPlayer = getCurrentPlayer(game);

  game.board.forEach((space, index) => {
    const square = document.createElement('article');
    const grid = gridPosition(index);
    const hasPlayerShares = space.type === 'property' && getPropertyShareholders(game, space.id).length > 0;
    const tokens = game.players.filter((player) => player.position === index && !player.bankrupt);

    square.className = `square type-${space.type}`;
    if (hasPlayerShares) square.classList.add('is-owned');
    if (currentPlayer.position === index) square.classList.add('is-current');
    square.style.gridColumn = String(grid.column);
    square.style.gridRow = String(grid.row);
    square.style.setProperty('--stripe', stripeFor(space));

    square.innerHTML = `
      <h3 class="square-name">${escapeHtml(cityName(space))}</h3>
      <p class="square-meta">${spaceMeta(space)}</p>
      ${space.type === 'property' ? shareBarMarkup(space) : ''}
      <div class="tokens">${tokens.map(tokenMarkup).join('')}</div>
    `;

    elements.board.append(square);
  });
}

function renderPlayers() {
  elements.players.innerHTML = game.players.map((player, index) => {
    const holdings = getPlayerPropertyHoldings(game, player.id);
    const shareCount = holdings.reduce((sum, holding) => sum + holding.shareCount, 0);
    const contractCount = game.contracts.filter((contract) => contract.holderId === player.id && contract.status === 'active').length;
    const position = game.board[player.position].name;
    const activeClass = index === game.turn && game.status !== 'gameOver' ? ' is-active' : '';
    const bankruptClass = player.bankrupt ? ' is-bankrupt' : '';

    return `
      <article class="player-card${activeClass}${bankruptClass}">
        <div class="card-topline">
          <strong><span class="player-dot" style="--dot: ${playerColors[index]}"></span>${escapeHtml(player.name)}</strong>
          <span class="badge">${player.bankrupt ? t('button.bankrupt') : index === game.turn ? t('phase.action') : t('ui.waiting')}</span>
        </div>
        <div class="card-grid">
          <span><b>$${formatMoney(player.cash)}</b>现金</span>
          <span><b>${shareCount}</b>股份</span>
          <span><b>${holdings.length}</b>持股地块</span>
          <span><b>${contractCount}</b>合同</span>
          <span><b>${escapeHtml(position)}</b>位置</span>
          <span><b>${player.bankrupt ? t('ui.paused') : t('ui.available')}</b>状态</span>
        </div>
      </article>
    `;
  }).join('');
}

function renderProperties() {
  const currentPlayer = getCurrentPlayer(game);
  const holdings = getPlayerPropertyHoldings(game, currentPlayer.id);

  if (holdings.length === 0) {
    elements.properties.innerHTML = '<p class="empty-state">当前玩家还没有股份。落在银行持股城市时，可以按 10% 为单位买入。</p>';
    return;
  }

  elements.properties.innerHTML = holdings.map((holding) => {
    const property = holding.property;
    const group = getColorGroupProperties(game, property.colorGroup);
    const majorGroup = isColorGroupMajorShareholder(game, property.colorGroup, currentPlayer.id);
    const ownsGroup = ownsCompleteColorGroup(game, currentPlayer.id, property.colorGroup);
    const buildEligibility = getBuildEligibility(game, property.id, currentPlayer.id);
    const demolishEligibility = getDemolishEligibility(game, property.id, currentPlayer.id);
    const canBuild = canBuildHouse(game, property.id, currentPlayer.id);
    const canDemolish = canDemolishHouse(game, property.id, currentPlayer.id);
    const rent = getSpaceRent(property);
    const buildDisabled = game.status === 'gameOver' || game.phase === 'auctionPending' || game.phase === 'buildPayment' || game.phase === 'vote' || game.phase === 'cashRecovery';
    const demolishDisabled = game.status === 'gameOver' || game.phase === 'auctionPending' || game.phase === 'buildPayment' || game.phase === 'vote';
    const shareholders = shareholderText(property);

    return `
      <article class="property-card" style="--stripe: ${stripeFor(property)}">
        <div class="card-topline">
          <strong>${escapeHtml(property.name)}</strong>
          <span class="badge">${holding.percent}% · 租 $${formatMoney(rent)}</span>
        </div>
        <div class="property-detail is-column">
          <span>${escapeHtml(countryName(property))} · ${escapeHtml(colorName(property))} · 同组 ${group.length} 地块</span>
          <span>银行 ${getBankShareCount(game, property.id) * SHARE_PERCENT}% · ${majorGroup ? t('ui.isColorGroupMajor') : t('ui.notColorGroupMajor')} · ${ownsGroup ? t('ui.ownsColorGroup') : t('ui.notFullColorGroup')}</span>
          <span>股东：${escapeHtml(shareholders)}</span>
          <span>${'★'.repeat(property.houses) || t('ui.noHouse')} · 建房：${buildEligibilityLabel(buildEligibility)} · 拆房：${demolishEligibilityLabel(demolishEligibility)}</span>
        </div>
        <div class="action-row">
          <button type="button" data-build="${property.id}" ${canBuild && !buildDisabled ? '' : 'disabled'}>直接建房 $${formatMoney(property.houseCost)}</button>
          <button type="button" data-start-vote="${property.id}" ${buildEligibility.canStartVote && !buildDisabled ? '' : 'disabled'}>发起建房投票</button>
          <button type="button" data-demolish="${property.id}" ${canDemolish && !demolishDisabled ? '' : 'disabled'}>直接拆房 +$${formatMoney(property.houseCost)}</button>
          <button type="button" data-start-demolish-vote="${property.id}" ${demolishEligibility.canStartVote && !demolishDisabled ? '' : 'disabled'}>发起拆房投票</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderVotes() {
  if (game.pendingConstruction) {
    const construction = game.pendingConstruction;
    const property = game.board.find((space) => space.id === construction.propertyId);
    elements.votes.innerHTML = `
      <article class="vote-card">
        <div class="card-topline">
          <strong>${escapeHtml(property.name)} 建房费用待支付</strong>
          <span class="badge">buildPayment</span>
        </div>
        <p class="muted">费用义务按当前股份重新计算。股份交易后，义务会跟随目标股份转给新持有人。</p>
        <div class="property-detail is-column">
          ${construction.costAllocations.map((allocation) => `<span>${escapeHtml(playerName(allocation.playerId))}: ${allocation.shareCount * SHARE_PERCENT}% · 应付 $${formatMoney(allocation.amount)}${construction.insufficientPlayerIds.includes(allocation.playerId) ? ' · 现金不足' : ''}</span>`).join('')}
        </div>
        <div class="action-row">
          <button type="button" data-resolve-construction="${construction.id}">重试结算建房费用</button>
        </div>
      </article>
    `;
    return;
  }

  const vote = game.pendingVote;
  if (!vote) {
    elements.votes.innerHTML = '<p class="empty-state">当前没有建房或拆房投票。目标地块银行股份为 0 且发起人是同色组主要持股人时，才可能发起。</p>';
    return;
  }
  const property = game.board.find((space) => space.id === vote.spaceId);
  const actionText = vote.type === 'demolish' ? t('button.demolish') : t('button.build');
  const totals = voteTotals(vote);
  const shareholders = getPropertyShareholders(game, property.id);
  const voterRows = shareholders.map((holder) => {
    const forced = forcedVoteStanceForUi(holder.playerId, property.id, vote.type);
    const recorded = vote.votes[holder.playerId];
    const canVote = vote.status === 'open' && game.status !== 'gameOver';
    return `
      <div class="vote-voter-row">
        <span>${escapeHtml(playerName(holder.playerId))} · ${holder.percent}%${forced ? ` · 合同强制${forced === 'yes' ? t('vote.yes') : t('vote.no')}` : ''}${recorded ? ` · 已投${recorded === 'yes' ? t('vote.yes') : t('vote.no')}` : ''}</span>
        <span class="action-row">
          <button type="button" data-vote-id="${vote.id}" data-vote-player="${holder.playerId}" data-vote-choice="yes" ${canVote ? '' : 'disabled'}>支持</button>
          <button type="button" data-vote-id="${vote.id}" data-vote-player="${holder.playerId}" data-vote-choice="no" ${canVote ? '' : 'disabled'}>反对</button>
        </span>
      </div>
    `;
  }).join('');

  elements.votes.innerHTML = `
    <article class="vote-card">
      <div class="card-topline">
        <strong>${escapeHtml(property.name)} ${actionText}投票</strong>
        <span class="badge">${vote.status}</span>
      </div>
      <div class="vote-progress" aria-label="同意股份 ${totals.yes * SHARE_PERCENT}%">
        <span style="flex: ${totals.yes}; background: var(--success)"></span>
        <span style="flex: ${totals.no}; background: var(--danger)"></span>
        <span style="flex: ${Math.max(0, 10 - totals.yes - totals.no)}; background: ${bankColor}"></span>
      </div>
      <p class="muted">${actionText}同意 ${totals.yes * SHARE_PERCENT}% / 通过门槛 50%。股东：${escapeHtml(shareholderText(property))}</p>
      <div class="voter-list">${voterRows}</div>
      <div class="action-row">
        <button type="button" data-resolve-vote="${vote.id}" ${vote.status === 'open' ? '' : 'disabled'}>结算投票</button>
      </div>
    </article>
  `;
}

function renderTradePanel() {
  populatePlayerSelect(elements.tradeFrom, elements.tradeFrom.value || getCurrentPlayer(game).id);
  const fallbackTo = game.players.find((player) => player.id !== elements.tradeFrom.value)?.id ?? game.players[0].id;
  populatePlayerSelect(elements.tradeTo, elements.tradeTo.value || fallbackTo);
  if (elements.tradeFrom.value === elements.tradeTo.value) {
    elements.tradeTo.value = fallbackTo;
  }
  renderTradeAssetOptions();
  renderPendingTrades();
}

function renderTradeAssetOptions() {
  populateHoldingSelect(elements.tradeOfferProperty, elements.tradeFrom.value);
  populateHoldingSelect(elements.tradeRequestProperty, elements.tradeTo.value);
}

function renderPendingTrades() {
  const trades = game.pendingTrades.slice().reverse().slice(0, 8);
  if (trades.length === 0) {
    elements.pendingTrades.innerHTML = '<p class="empty-state">还没有待处理交易。交易可在任意阶段发起；接受时会重新校验资产仍可用。</p>';
    return;
  }
  elements.pendingTrades.innerHTML = trades.map((trade) => `
    <article class="pending-trade-card">
      <div class="card-topline">
        <strong>${escapeHtml(playerName(trade.fromPlayerId))} ⇄ ${escapeHtml(playerName(trade.toPlayerId))}</strong>
        <span class="badge">${trade.status}</span>
      </div>
      <p class="muted">给出：${escapeHtml(assetSummary(trade.offer))}</p>
      <p class="muted">索要：${escapeHtml(assetSummary(trade.request))}</p>
      ${trade.note ? `<p class="muted">备注：${escapeHtml(trade.note)}</p>` : ''}
      <div class="action-row">
        <button type="button" data-accept-trade="${trade.id}" ${trade.status === 'pending' ? '' : 'disabled'}>接受</button>
        <button type="button" data-reject-trade="${trade.id}" ${trade.status === 'pending' ? '' : 'disabled'}>拒绝</button>
      </div>
    </article>
  `).join('');
}

function renderContracts() {
  renderContractFormOptions();
  if (game.contracts.length === 0) {
    elements.contracts.innerHTML = '<p class="empty-state">还没有合同。创建合同后，可将合同 ID 填入交易面板进行转让。</p>';
    return;
  }
  elements.contracts.innerHTML = game.contracts.map((contract) => `
    <article class="contract-card">
      <div class="card-topline">
        <strong>${escapeHtml(contract.id)} · ${contractTypeLabel(contract.type)}</strong>
        <span class="badge">${contract.status}</span>
      </div>
      <p class="muted">持有人：${escapeHtml(playerName(contract.holderId))}</p>
      <p class="muted">${escapeHtml(contractDetail(contract))}</p>
    </article>
  `).join('');
}

function renderContractFormOptions() {
  populatePlayerSelect(elements.contractHolder, elements.contractHolder.value || getCurrentPlayer(game).id);
  populatePlayerSelect(elements.contractShareOwner, elements.contractShareOwner.value || getCurrentPlayer(game).id);
  populatePlayerSelect(elements.contractObligor, elements.contractObligor.value || game.players.find((player) => player.id !== getCurrentPlayer(game).id)?.id || getCurrentPlayer(game).id);
  populatePropertySelect(elements.contractProperty, elements.contractProperty.value);
}

function renderBankruptcyWarning() {
  elements.auctionWarning.hidden = game.phase !== 'auctionPending';
  if (game.phase === 'auctionPending' && game.pendingAuction) {
    const assetCount = game.pendingAuction.assets.length;
    elements.auctionWarning.querySelector('span').textContent = `待拍卖资产 ${assetCount} 项；拍卖参与者、起拍价、现金处理仍未制定。`;
  }
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

function createContractFromForm() {
  const type = elements.contractType.value;
  const holderId = elements.contractHolder.value;
  const propertyId = elements.contractProperty.value;
  if (type === CONTRACT_TYPES.VOTE_SUPPORT) {
    return createVoteSupportContract(game, {
      holderId,
      obligorId: elements.contractObligor.value,
      targetSpaceId: propertyId,
      stance: elements.contractStance.value,
    });
  }

  const ownerId = elements.contractShareOwner.value;
  const count = Number(elements.contractShareCount.value || 1);
  const shareRefs = firstShareRefs(ownerId, propertyId, count);
  if (shareRefs.length < count) {
    throw new Error('该股份持有人没有足够股份可绑定合同。');
  }
  if (type === CONTRACT_TYPES.FREE_PASS) {
    return createFreePassContract(game, { holderId, shareRefs });
  }
  return createInheritanceContract(game, { holderId, shareRefs });
}

function buildTradeAssets(ownerId, propertySelect, sharesInput, cashInput, contractInput) {
  const propertyId = propertySelect.value;
  const shareCount = Number(sharesInput.value || 0);
  return {
    cash: Number(cashInput.value || 0),
    shareRefs: propertyId ? firstShareRefs(ownerId, propertyId, shareCount) : [],
    contractIds: contractInput.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function firstShareRefs(playerId, propertyId, count) {
  if (!propertyId || count <= 0) return [];
  const property = game.board.find((space) => space.id === propertyId);
  return property.shares
    .filter((share) => share.ownerId === playerId)
    .slice(0, count)
    .map((share) => ({ spaceId: property.id, shareId: share.id }));
}

function populatePlayerSelect(select, selectedValue) {
  const value = selectedValue && game.players.some((player) => player.id === selectedValue)
    ? selectedValue
    : game.players[0]?.id;
  select.innerHTML = game.players
    .map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`)
    .join('');
  select.value = value;
}

function populatePropertySelect(select, selectedValue) {
  const properties = game.board.filter((space) => space.type === 'property');
  const value = selectedValue && properties.some((property) => property.id === selectedValue)
    ? selectedValue
    : properties[0]?.id;
  select.innerHTML = properties
    .map((property) => `<option value="${property.id}">${escapeHtml(property.name)}</option>`)
    .join('');
  select.value = value;
}

function populateHoldingSelect(select, playerId) {
  const holdings = getPlayerPropertyHoldings(game, playerId);
  if (holdings.length === 0) {
    select.innerHTML = '<option value="">无股份</option>';
    select.value = '';
    return;
  }
  const previous = select.value;
  select.innerHTML = holdings
    .map((holding) => `<option value="${holding.propertyId}">${escapeHtml(holding.property.name)} ${holding.percent}%</option>`)
    .join('');
  select.value = holdings.some((holding) => holding.propertyId === previous) ? previous : holdings[0].propertyId;
}

function voteTotals(vote) {
  let yes = 0;
  let no = 0;
  for (const [playerId, stance] of Object.entries(vote.votes)) {
    if (stance === 'yes') yes += getPlayerShareCount(game, vote.spaceId, playerId);
    if (stance === 'no') no += getPlayerShareCount(game, vote.spaceId, playerId);
  }
  return { yes, no };
}

function forcedVoteStanceForUi(playerId, targetSpaceId, voteType) {
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

function shareholderText(property) {
  return getPropertyShareholders(game, property.id, { includeBank: true })
    .map((holder) => `${holder.playerId === BANK_ID ? t('label.bank') : playerName(holder.playerId)} ${holder.percent}%`)
    .join('，') || '无';
}

function shareBarMarkup(property) {
  const holders = getPropertyShareholders(game, property.id, { includeBank: true });
  return `
    <div class="share-bar" aria-label="股份分布">
      ${holders.map((holder) => `<span class="share-segment" title="${escapeHtml(holder.playerId === BANK_ID ? t('label.bank') : playerName(holder.playerId))} ${holder.percent}%" style="flex: ${holder.shareCount}; background: ${holderColor(holder.playerId)}"></span>`).join('')}
    </div>
  `;
}

function holderColor(playerId) {
  if (playerId === BANK_ID) return bankColor;
  const index = game.players.findIndex((player) => player.id === playerId);
  return playerColors[index] ?? 'var(--accent)';
}

function spaceMeta(space) {
  if (space.type === 'start') {
    return escapeHtml(space.description ?? `经过获得 $${formatMoney(space.bonus)}`);
  }
  const houseText = space.houses ? ` · ${'★'.repeat(space.houses)}` : '';
  return `${escapeHtml(space.countryName)} · ${escapeHtml(space.colorName)} · $${formatMoney(space.price)} · 租 $${formatMoney(getSpaceRent(space))} · 银行 ${getBankShareCount(game, space.id) * SHARE_PERCENT}%${houseText}`;
}

function tokenMarkup(player) {
  const index = Number(player.id.replace('p', '')) - 1;
  return `<span class="token" style="background: ${playerColors[index]}">${index + 1}</span>`;
}

function stripeFor(space) {
  if (space.type === 'start') return 'var(--accent)';
  return space.color ?? 'rgba(255, 255, 255, 0.18)';
}

function buildEligibilityLabel(eligibility) {
  return {
    canDirectBuild: '可直接建房',
    voteRequired: '可发起投票',
    bankSharesRemain: '银行仍持股，不能建设',
    notColorGroupMajorShareholder: '需要同色组主要持股',
    maxLevel: '已满级',
    bankrupt: '破产玩家不能建设',
    notFound: '找不到地块',
  }[eligibility.reason] ?? eligibility.reason;
}

function demolishEligibilityLabel(eligibility) {
  return {
    canDirectDemolish: '可直接拆房',
    voteRequired: '可发起投票',
    bankSharesRemain: '银行仍持股，不能拆房',
    notColorGroupMajorShareholder: '需要同色组主要持股',
    noHouses: '没有房屋可拆',
    bankrupt: '破产玩家不能拆房',
    notFound: '找不到地块',
  }[eligibility.reason] ?? eligibility.reason;
}

function phaseText(phase) {
  return {
    roll: t('phase.roll'),
    action: '等待购买决定',
    end: '可结束回合',
    vote: '建房/拆房投票中',
    buildPayment: '建房费用待支付',
    cashRecovery: '现金为负，等待自救',
    auctionPending: '破产拍卖待制定',
    gameOver: t('message.gameOver'),
  }[phase] ?? phase;
}

function contractTypeLabel(type) {
  return {
    [CONTRACT_TYPES.FREE_PASS]: t('contract.freePass'),
    [CONTRACT_TYPES.INHERITANCE]: t('contract.inheritance'),
    [CONTRACT_TYPES.VOTE_SUPPORT]: t('contract.voteSupport'),
  }[type] ?? type;
}

function contractDetail(contract) {
  if (contract.type === CONTRACT_TYPES.VOTE_SUPPORT) {
    const property = game.board.find((space) => space.id === contract.targetSpaceId);
    const actionText = contract.voteType === 'demolish' ? t('button.demolish') : t('button.build');
    return `${playerName(contract.obligorId)} 下一次 ${property?.name ?? contract.targetSpaceId} ${actionText}投票必须${contract.stance === 'yes' ? t('vote.yes') : t('vote.no')}；剩余 ${contract.remainingUses} 次。`;
  }
  const refs = contract.shareRefs ?? [];
  const property = refs[0] ? game.board.find((space) => space.id === refs[0].spaceId) : null;
  return `${property?.name ?? '未知地块'} ${refs.length * SHARE_PERCENT}% 绑定股份。`;
}

function assetSummary(assets) {
  const parts = [];
  if (assets.cash) parts.push(`现金 $${formatMoney(assets.cash)}`);
  if (assets.shareRefs?.length) parts.push(`股份 ${assets.shareRefs.length * SHARE_PERCENT}%`);
  if (assets.contractIds?.length) parts.push(`合同 ${assets.contractIds.join(', ')}`);
  return parts.join(' + ') || '无';
}

function playerName(playerId) {
  if (playerId === BANK_ID) return t('label.bank');
  return game.players.find((player) => player.id === playerId)?.name ?? playerId;
}

function winnerName() {
  const winner = game.players.find((player) => player.id === game.winnerId);
  return winner?.name ?? '胜者';
}

function gridPosition(index) {
  const side = BOARD_SIDE_LENGTH;
  const rightStart = side;
  const bottomStart = rightStart + side - 1;
  const leftStart = bottomStart + side - 1;

  if (index < rightStart) {
    return { row: 1, column: index + 1 };
  }

  if (index < bottomStart) {
    return { row: index - rightStart + 2, column: side };
  }

  if (index < leftStart) {
    return { row: side, column: side - (index - bottomStart) - 1 };
  }

  return { row: side - (index - leftStart) - 1, column: 1 };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatMoney(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// Language switcher
document.getElementById('lang-switcher')?.addEventListener('change', (e) => {
  setLocale(e.target.value);
  render(); // Re-render UI with new locale
});


// Language switcher handler
document.getElementById('lang-switcher')?.addEventListener('change', (e) => {
  setLocale(e.target.value);
  // Recreate game with new locale names
  gameState = createGame([t('ui.player1') || '玩家1', t('ui.player2') || '玩家2']);
  render();
});
