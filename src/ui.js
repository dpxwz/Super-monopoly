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
import {
  applyLanSnapshotToSession,
  clearStoredLanSession,
  isLoopbackOrigin,
  loadStoredLanSession,
  normalizeRoomCode,
  roomCodeFromLocation,
  saveStoredLanSession,
  shareUrlForRoom,
} from './lan-client.js';

const playerColors = ['var(--player-1)', 'var(--player-2)', 'var(--player-3)', 'var(--player-4)'];
const bankColor = 'rgba(174, 184, 199, 0.48)';

const elements = {
  setupForm: document.querySelector('#setup-form'),
  setupSubmit: document.querySelector('#setup-form button[type="submit"]'),
  modeRadios: [...document.querySelectorAll('input[name="game-mode"]')],
  localPlayerFields: [...document.querySelectorAll('[data-local-player-field]')],
  lanOnlyFields: [...document.querySelectorAll('[data-lan-only]')],
  lanPlayerName: document.querySelector('#lan-player-name'),
  roomCode: document.querySelector('#room-code'),
  networkPanel: document.querySelector('#network-panel'),
  networkRoomCode: document.querySelector('#network-room-code'),
  networkPlayers: document.querySelector('#network-players'),
  networkShareUrl: document.querySelector('#network-share-url'),
  networkHint: document.querySelector('#network-hint'),
  networkStatus: document.querySelector('#network-status'),
  lanStartButton: document.querySelector('#lan-start-button'),
  lanLeaveButton: document.querySelector('#lan-leave-button'),
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
  chatForm: document.querySelector('#chat-form'),
  chatInput: document.querySelector('#chat-input'),
  chatSend: document.querySelector('#chat-send'),
  chatLines: document.querySelector('#chat-lines'),
  chatStatus: document.querySelector('#chat-status'),
  openTradeButton: document.querySelector('[data-open-trade]'),
  openContractButton: document.querySelector('[data-open-contract]'),
  rightPlayerName: document.querySelector('#right-player-name'),
  rightPlayerMode: document.querySelector('#right-player-mode'),
  rightPlayerCash: document.querySelector('#right-player-cash'),
  rightPlayerAvatar: document.querySelector('#right-player-avatar'),
  tradeOverlay: document.querySelector('#trade-overlay'),
  contractOverlay: document.querySelector('#contract-overlay'),
  playerDetailOverlay: document.querySelector('#player-detail-overlay'),
  playerDetailName: document.querySelector('#player-detail-name'),
  playerDetailSummary: document.querySelector('#player-detail-summary'),
  playerDetailAvatar: document.querySelector('#player-detail-avatar'),
  playerDetailCash: document.querySelector('#player-detail-cash'),
  playerDetailStatus: document.querySelector('#player-detail-status'),
  playerDetailProperties: document.querySelector('#player-detail-properties'),
  playerDetailContracts: document.querySelector('#player-detail-contracts'),
};

let game = createGame(['玩家 1', '玩家 2']);
let lanServerUrls = [];
let actionPending = false;
let networkSession = {
  mode: 'local',
  roomCode: null,
  clientId: null,
  playerId: null,
  isHost: false,
  room: null,
  pollTimer: null,
};

// Expose a stable debugging handle for browser smoke tests and manual tabletop adjudication.
window.superMonopoly = {
  get game() {
    return game;
  },
  get networkSession() {
    return networkSession;
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
    // Re-create only local games. In LAN mode the server remains authoritative;
    // polling/action snapshots will keep the translated UI on the same game state.
    if (!isLanMode()) {
      const names = game.players.map((p) => p.name);
      game = createGame(names);
    }
    render();
  });
}

applyRoomCodeFromUrl();
initLanguageSwitcher();
applyStaticTranslations();
bindEvents();
renderModeFields();
render();
refreshLanServerInfo()
  .then(() => renderNetworkPanel())
  .catch(() => {});
resumeStoredLanSession();

function bindEvents() {
  elements.modeRadios.forEach((radio) => radio.addEventListener('change', renderModeFields));

  elements.setupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(async () => {
      const formData = new FormData(elements.setupForm);
      const mode = String(formData.get('game-mode') ?? 'local');
      if (mode === 'local') {
        await leaveLanSession();
        const names = [...formData.getAll('player')]
          .map((name) => String(name).trim())
          .filter(Boolean);
        game = createGame(names.length >= 2 ? names : ['玩家 1', '玩家 2']);
        setMessage(t('msg.newGameStarted'));
        return;
      }

      const playerName = String(formData.get('lan-player-name') || formData.getAll('player')[0] || '玩家').trim();
      if (mode === 'lan-host') {
        await createLanRoom(playerName);
      } else {
        const code = String(formData.get('room-code') ?? '').trim();
        await joinLanRoom(code, playerName);
      }
    });
  });

  elements.lanStartButton?.addEventListener('click', () => {
    safeAction(async () => {
      await startLanGame();
      setMessage('联机游戏已开始。');
    });
  });

  elements.lanLeaveButton?.addEventListener('click', () => {
    safeAction(async () => {
      await leaveLanSession();
      setMessage('已退出局域网联机，回到本地模式。');
    });
  });

  elements.rollButton.addEventListener('click', () => {
    safeAction(async () => {
      await runGameAction(() => rollAndMove(game), { type: 'roll' });
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
    safeAction(async () => {
      const propertyId = game.pendingOffer?.spaceId;
      await runGameAction(() => declineCurrentShareOffer(game), { type: 'declineOffer' });
      const property = propertyId ? game.board.find((space) => space.id === propertyId) : null;
      setMessage(property ? t('msg.declinedPurchase', property.name) : t('msg.noSharesToBuy'));
    });
  });

  elements.endButton.addEventListener('click', () => {
    safeAction(async () => {
      await runGameAction(() => endTurn(game), { type: 'endTurn' });
      setMessage(game.status === 'gameOver' ? t('msg.gameOver') : t('msg.turnTo', getCurrentPlayer(game).name));
    });
  });

  elements.bankruptcyButton.addEventListener('click', () => {
    safeAction(async () => {
      const player = getCurrentPlayer(game);
      await runGameAction(() => declareBankruptcy(game, player.id, { type: 'active', reason: '主动破产' }), {
        type: 'declareBankruptcy',
        payload: { reason: '主动破产' },
      });
      setMessage(t('msg.activeBankruptcy', player.name));
    });
  });

  elements.newGameButton.addEventListener('click', () => {
    safeAction(async () => {
      if (isLanMode()) {
        await sendLanAction('restart');
      } else {
        const names = game.players.map((player) => player.name);
        game = createGame(names);
      }
      setMessage(t('msg.restartedWithPlayers'));
    });
  });

  elements.properties.addEventListener('click', (event) => {
    const buildButton = event.target.closest('[data-build]');
    const demolishButton = event.target.closest('[data-demolish]');
    const voteButton = event.target.closest('[data-start-vote]');
    const demolishVoteButton = event.target.closest('[data-start-demolish-vote]');
    if (buildButton) {
      safeAction(async () => {
        const propertyId = buildButton.dataset.build;
        await runGameAction(() => buildHouse(game, propertyId), {
          type: 'buildHouse',
          payload: { propertyId },
        });
        const property = game.board.find((space) => space.id === propertyId);
        if (game.phase === 'buildPayment') {
          setMessage(t('msg.buildPaymentPending'), true);
        } else {
          setMessage(t('msg.upgraded', property.name, property.houses));
        }
      });
    }
    if (demolishButton) {
      safeAction(async () => {
        const propertyId = demolishButton.dataset.demolish;
        await runGameAction(() => demolishHouse(game, propertyId), {
          type: 'demolishHouse',
          payload: { propertyId },
        });
        const property = game.board.find((space) => space.id === propertyId);
        setMessage(t('msg.demolished', property.name, property.houses));
      });
    }
    if (voteButton) {
      safeAction(async () => {
        const propertyId = voteButton.dataset.startVote;
        await runGameAction(() => startBuildVote(game, propertyId), {
          type: 'startBuildVote',
          payload: { propertyId },
        });
        const property = game.board.find((space) => space.id === propertyId);
        setMessage(t('msg.buildVoteStarted', property.name));
      });
    }
    if (demolishVoteButton) {
      safeAction(async () => {
        const propertyId = demolishVoteButton.dataset.startDemolishVote;
        await runGameAction(() => startDemolishVote(game, propertyId), {
          type: 'startDemolishVote',
          payload: { propertyId },
        });
        const property = game.board.find((space) => space.id === propertyId);
        setMessage(t('msg.demolishVoteStarted', property.name));
      });
    }
  });

  elements.votes.addEventListener('click', (event) => {
    const voteButton = event.target.closest('[data-vote-choice]');
    const resolveButton = event.target.closest('[data-resolve-vote]');
    if (voteButton) {
      safeAction(async () => {
        const voterId = isLanMode() ? networkSession.playerId : voteButton.dataset.votePlayer;
        await runGameAction(
          () => castBuildVote(game, voteButton.dataset.voteId, voteButton.dataset.votePlayer, voteButton.dataset.voteChoice),
          {
            type: 'castVote',
            payload: { voteId: voteButton.dataset.voteId, stance: voteButton.dataset.voteChoice },
          },
        );
        setMessage(t('msg.voteRecorded', playerName(voterId)));
      });
    }
    if (resolveButton) {
      safeAction(async () => {
        await runGameAction(() => resolveBuildVote(game, resolveButton.dataset.resolveVote), {
          type: 'resolveVote',
          payload: { voteId: resolveButton.dataset.resolveVote },
        });
        setMessage('投票已结算。');
      });
    }
    const constructionButton = event.target.closest('[data-resolve-construction]');
    if (constructionButton) {
      safeAction(async () => {
        await runGameAction(() => resolvePendingConstruction(game), { type: 'resolveConstruction' });
        const stillCollecting = game.pendingConstruction?.status === 'collecting';
        setMessage(stillCollecting ? t('msg.stillCollecting') : t('msg.constructionSettled'));
      });
    }
  });

  elements.tradeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(async () => {
      const fromPlayerId = isLanMode() ? networkSession.playerId : elements.tradeFrom.value;
      const toPlayerId = elements.tradeTo.value;
      const offer = buildTradeAssets(fromPlayerId, elements.tradeOfferProperty, elements.tradeOfferShares, elements.tradeOfferCash, elements.tradeOfferContract);
      const request = buildTradeAssets(toPlayerId, elements.tradeRequestProperty, elements.tradeRequestShares, elements.tradeRequestCash, elements.tradeRequestContract);
      const draft = {
        fromPlayerId,
        toPlayerId,
        offer,
        request,
        note: elements.tradeNote.value,
      };
      await runGameAction(() => proposeTrade(game, draft), { type: 'proposeTrade', payload: draft });
      const trade = game.pendingTrades.at(-1);
      setMessage(t('msg.tradeProposed', trade?.id ?? ''));
    });
  });

  elements.pendingTrades.addEventListener('click', (event) => {
    const acceptButton = event.target.closest('[data-accept-trade]');
    const rejectButton = event.target.closest('[data-reject-trade]');
    if (acceptButton) {
      safeAction(async () => {
        const tradeId = acceptButton.dataset.acceptTrade;
        await runGameAction(() => acceptTrade(game, tradeId, Date.now()), {
          type: 'acceptTrade',
          payload: { tradeId },
        });
        setMessage(t('msg.tradeAccepted', tradeId));
      });
    }
    if (rejectButton) {
      safeAction(async () => {
        const tradeId = rejectButton.dataset.rejectTrade;
        await runGameAction(() => rejectTrade(game, tradeId), {
          type: 'rejectTrade',
          payload: { tradeId },
        });
        setMessage(t('msg.tradeRejected', tradeId));
      });
    }
  });

  elements.tradeFrom.addEventListener('change', renderTradeAssetOptions);
  elements.tradeTo.addEventListener('change', renderTradeAssetOptions);

  elements.contractForm.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(async () => {
      const payload = buildContractPayloadFromForm();
      await runGameAction(() => createContractFromPayload(payload), { type: 'createContract', payload });
      const contract = game.contracts.at(-1);
      setMessage(t('msg.contractCreated', contract?.id ?? ''));
    });
  });
  elements.contractProperty.addEventListener('change', renderContractFormOptions);
  elements.contractType.addEventListener('change', renderContractFormOptions);

  elements.chatForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    safeAction(async () => {
      const text = elements.chatInput.value.trim();
      if (!text) return;
      await sendLanChat(text);
      elements.chatInput.value = '';
      setMessage('聊天消息已发送。');
    });
  });

  elements.players.addEventListener('dblclick', (event) => {
    const playerCard = event.target.closest('[data-player-id]');
    if (playerCard) {
      openPlayerDetail(playerCard.dataset.playerId);
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-trade]')) {
      if (isLanMode() && !isLanStarted()) {
        setMessage('联机游戏开始后才能发起交易。', true);
        return;
      }
      renderTradePanel();
      openOverlay(elements.tradeOverlay);
      return;
    }
    if (event.target.closest('[data-open-contract]')) {
      if (isLanMode() && !isLanStarted()) {
        setMessage('联机游戏开始后才能创建合同。', true);
        return;
      }
      renderContractFormOptions();
      openOverlay(elements.contractOverlay);
      return;
    }
    if (event.target.closest('[data-close-overlay]')) {
      closeOverlays();
      return;
    }
    if (event.target.classList?.contains('overlay')) {
      closeOverlays();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeOverlays();
    }
  });
}

function buySelectedShares() {
  safeAction(async () => {
    const shareCount = Number(elements.shareCount.value);
    const propertyId = game.pendingOffer?.spaceId;
    await runGameAction(() => buyCurrentShares(game, shareCount), {
      type: 'buyShares',
      payload: { shareCount },
    });
    const property = propertyId ? game.board.find((space) => space.id === propertyId) : null;
    setMessage(property ? t('msg.boughtShares', property.name, shareCount * SHARE_PERCENT) : t('msg.noSharesToBuy'));
  });
}

async function safeAction(action) {
  if (actionPending) return;
  actionPending = true;
  renderInteractionLocks();
  try {
    await action();
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    actionPending = false;
    render();
  }
}

function isLanMode() {
  return networkSession.mode === 'lan';
}

function isLanStarted() {
  return isLanMode() && networkSession.room?.lobby?.started === true && Boolean(networkSession.room?.game);
}

function canControlCurrentPlayer() {
  return !isLanMode() || (isLanStarted() && getCurrentPlayer(game).id === networkSession.playerId);
}

function canVoteFor(playerId) {
  return !isLanMode() || playerId === networkSession.playerId;
}

function renderInteractionLocks() {
  const lobbyLocked = isLanMode() && !isLanStarted();
  if (elements.setupSubmit) elements.setupSubmit.disabled = actionPending || isLanMode();
  if (elements.lanStartButton) elements.lanStartButton.disabled = actionPending || (networkSession.room?.lobby?.players ?? []).length < 2;
  if (elements.lanLeaveButton) elements.lanLeaveButton.disabled = actionPending;
  if (elements.openTradeButton) elements.openTradeButton.disabled = actionPending || lobbyLocked;
  if (elements.openContractButton) elements.openContractButton.disabled = actionPending || lobbyLocked;
}

async function runGameAction(localAction, lanAction) {
  if (isLanMode()) {
    return sendLanAction(lanAction.type, lanAction.payload ?? {});
  }
  return localAction();
}

async function createLanRoom(playerName) {
  await refreshLanServerInfo();
  const snapshot = await apiRequest('/api/rooms', {
    method: 'POST',
    body: { playerName },
  });
  applyLanSnapshot(snapshot);
  rememberRoomInUrl();
  startLanPolling();
  setMessage(`已创建局域网房间 ${networkSession.roomCode}，等待其他玩家加入。`);
}

async function joinLanRoom(roomCode, playerName) {
  if (!roomCode) {
    throw new Error('请输入要加入的局域网房间号。');
  }
  const normalizedCode = normalizeRoomCode(roomCode);
  const knownClientId = (isLanMode() && networkSession.roomCode === normalizedCode
    ? networkSession.clientId
    : null)
    ?? loadStoredLanSession(window.sessionStorage, normalizedCode)?.clientId
    ?? null;

  if (isLanMode() && networkSession.roomCode === normalizedCode && networkSession.clientId) {
    await refreshLanServerInfo();
    const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(normalizedCode)}/resume`, {
      method: 'POST',
      body: { clientId: networkSession.clientId },
    });
    applyLanSnapshot(snapshot);
    rememberRoomInUrl();
    startLanPolling();
    setMessage(`你已在局域网房间 ${networkSession.roomCode} 中。`);
    return;
  }

  await refreshLanServerInfo();
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(normalizedCode)}/join`, {
    method: 'POST',
    body: {
      playerName,
      ...(knownClientId ? { clientId: knownClientId } : {}),
    },
  });
  applyLanSnapshot(snapshot);
  rememberRoomInUrl();
  startLanPolling();
  setMessage(`已加入局域网房间 ${networkSession.roomCode}，等待房主开始。`);
}

async function startLanGame() {
  if (!networkSession.roomCode || !networkSession.clientId) {
    throw new Error('还没有加入局域网房间。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/start`, {
    method: 'POST',
    body: { clientId: networkSession.clientId },
  });
  applyLanSnapshot(snapshot);
}

async function sendLanAction(type, payload = {}) {
  if (!networkSession.roomCode || !networkSession.clientId) {
    throw new Error('还没有加入局域网房间。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/actions`, {
    method: 'POST',
    body: { clientId: networkSession.clientId, action: { type, payload } },
  });
  applyLanSnapshot(snapshot);
  return snapshot;
}

async function sendLanChat(text) {
  if (!isLanMode() || !networkSession.roomCode || !networkSession.clientId) {
    throw new Error('聊天室仅在局域网联机模式下启用。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/chat`, {
    method: 'POST',
    body: { clientId: networkSession.clientId, text },
  });
  applyLanSnapshot(snapshot);
  return snapshot;
}

async function pollLanState() {
  if (actionPending || !networkSession.roomCode || !networkSession.clientId) {
    return;
  }
  try {
    const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/state?clientId=${encodeURIComponent(networkSession.clientId)}`);
    const previousRevision = networkSession.room?.revision;
    applyLanSnapshot(snapshot);
    if (networkSession.room?.revision !== previousRevision) {
      render();
    } else {
      renderNetworkPanel();
    }
  } catch (error) {
    setMessage(`联机同步失败：${error.message}`, true);
    renderNetworkPanel();
  }
}

function startLanPolling() {
  stopLanPolling();
  networkSession.pollTimer = window.setInterval(pollLanState, 1000);
}

function stopLanPolling() {
  if (networkSession.pollTimer) {
    window.clearInterval(networkSession.pollTimer);
  }
  networkSession.pollTimer = null;
}

async function leaveLanSession() {
  const shouldNotifyServer = isLanMode()
    && networkSession.roomCode
    && networkSession.clientId
    && networkSession.room?.lobby?.started !== true;
  const roomCode = networkSession.roomCode;
  const clientId = networkSession.clientId;
  stopLanPolling();
  if (shouldNotifyServer) {
    try {
      await apiRequest(`/api/rooms/${encodeURIComponent(roomCode)}/leave`, {
        method: 'POST',
        body: { clientId },
      });
    } catch (error) {
      console.warn('Unable to notify LAN server about leaving room:', error);
    }
  }
  clearStoredLanSession(window.sessionStorage);
  networkSession = {
    mode: 'local',
    roomCode: null,
    clientId: null,
    playerId: null,
    isHost: false,
    room: null,
    pollTimer: null,
  };
  removeRoomFromUrl();
  elements.modeRadios.forEach((radio) => {
    radio.checked = radio.value === 'local';
  });
  renderModeFields();
}

function applyLanSnapshot(snapshot) {
  const result = applyLanSnapshotToSession(networkSession, snapshot);
  if (!result.applied) return false;
  networkSession = result.session;
  if (result.game) {
    game = result.game;
  }
  saveStoredLanSession(window.sessionStorage, networkSession);
  return true;
}

async function refreshLanServerInfo() {
  const health = await apiRequest('/api/health');
  lanServerUrls = Array.isArray(health.urls) ? health.urls : [];
  return lanServerUrls;
}

async function resumeStoredLanSession() {
  const roomCodeInUrl = roomCodeFromLocation(window.location);
  const stored = loadStoredLanSession(window.sessionStorage, roomCodeInUrl || null);
  if (!stored) return;
  try {
    await refreshLanServerInfo();
    const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(stored.roomCode)}/resume`, {
      method: 'POST',
      body: { clientId: stored.clientId },
    });
    applyLanSnapshot(snapshot);
    rememberRoomInUrl();
    startLanPolling();
    setMessage(`已恢复局域网房间 ${networkSession.roomCode}。`);
    render();
  } catch (error) {
    clearStoredLanSession(window.sessionStorage);
    setMessage(`无法恢复上次联机身份：${error.message}`, true);
    renderNetworkPanel();
  }
}

function rememberRoomInUrl() {
  if (!networkSession.roomCode) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get('room') === networkSession.roomCode) return;
  url.searchParams.set('room', networkSession.roomCode);
  window.history.replaceState(null, '', url);
}

function removeRoomFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('room')) return;
  url.searchParams.delete('room');
  window.history.replaceState(null, '', url);
}

async function apiRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

function applyRoomCodeFromUrl() {
  const code = roomCodeFromLocation(window.location);
  if (!code) return;
  const joinRadio = elements.modeRadios.find((radio) => radio.value === 'lan-join');
  if (joinRadio) joinRadio.checked = true;
  if (elements.roomCode) elements.roomCode.value = code;
}

function renderModeFields() {
  const mode = elements.modeRadios.find((radio) => radio.checked)?.value ?? 'local';
  const isLan = mode.startsWith('lan-');
  const isJoin = mode === 'lan-join';
  elements.localPlayerFields.forEach((field) => {
    field.hidden = isLan;
  });
  elements.lanOnlyFields.forEach((field) => {
    const fieldMode = field.dataset.lanOnly;
    field.hidden = !isLan || (fieldMode === 'join' && !isJoin);
  });
  if (elements.lanPlayerName && !elements.lanPlayerName.value) {
    const firstPlayer = elements.setupForm.querySelector('input[name="player"]');
    elements.lanPlayerName.value = firstPlayer?.value ?? '玩家 1';
  }
  renderNetworkPanel();
}

function renderNetworkPanel() {
  if (!elements.networkPanel || !elements.networkStatus) {
    return;
  }
  if (!isLanMode()) {
    elements.networkPanel.hidden = true;
    elements.networkStatus.textContent = '本地模式';
    return;
  }

  const room = networkSession.room;
  const players = room?.lobby?.players ?? [];
  const shareUrl = shareUrlForRoom({
    origin: window.location.origin,
    pathname: window.location.pathname,
    roomCode: networkSession.roomCode,
    serverUrls: lanServerUrls,
  });
  const shareUrlIsLoopback = shareUrl ? isLoopbackOrigin(shareUrl) : false;
  elements.networkPanel.hidden = false;
  elements.networkRoomCode.textContent = networkSession.roomCode ?? '--';
  elements.networkShareUrl.value = shareUrl;
  elements.networkPlayers.innerHTML = players
    .map((player) => `<span class="badge">${escapeHtml(player.name)}${player.playerId === networkSession.playerId ? '（你）' : ''}${player.isHost ? ' · 房主' : ''}</span>`)
    .join('');
  elements.networkHint.textContent = room?.lobby?.started
    ? `联机游戏进行中。你控制 ${networkPlayerName(networkSession.playerId)}。刷新本页会自动恢复同一玩家身份。`
    : shareUrlIsLoopback
      ? `已加入 ${players.length}/${MAX_PLAYERS_FOR_UI} 人。当前链接仍是本机地址，其他设备需要使用 npm run serve 终端打印的局域网地址。`
      : `已加入 ${players.length}/${MAX_PLAYERS_FOR_UI} 人。复制上面的局域网链接给同一网络内的玩家；刷新本页会自动恢复房间身份。`;
  elements.networkStatus.textContent = room?.lobby?.started
    ? `局域网 ${networkSession.roomCode} · 你是 ${networkPlayerName(networkSession.playerId)}`
    : `局域网大厅 ${networkSession.roomCode}`;
  elements.lanStartButton.hidden = !networkSession.isHost || room?.lobby?.started;
  elements.lanStartButton.disabled = actionPending || players.length < 2;
  elements.lanLeaveButton.disabled = actionPending;
  renderInteractionLocks();
}

const MAX_PLAYERS_FOR_UI = 4;

function render() {
  renderModeChrome();
  renderNetworkPanel();
  if (isLanMode() && !isLanStarted()) {
    renderLobbyState();
    renderChatPanel();
    return;
  }
  if (!isLanMode()) {
    expirePendingTrades(game, Date.now());
  }
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
  renderFocusedPlayerPanel();
  renderChatPanel();
  renderBankruptcyWarning();
  renderLog();

  window.superMonopolyGame = game;
}

function renderLobbyState() {
  const players = networkSession.room?.lobby?.players ?? [];
  elements.currentPlayer.textContent = '局域网大厅';
  elements.currentSpace.textContent = networkSession.roomCode
    ? `房间 ${networkSession.roomCode} · 已加入 ${players.length}/${MAX_PLAYERS_FOR_UI} 人`
    : '选择创建或加入局域网房间。';
  elements.roundLabel.textContent = '等待开始';
  elements.phaseLabel.textContent = networkSession.isHost ? '房主可开始' : '等待房主';
  elements.diceLabel.textContent = networkSession.playerId ? `你是 ${networkSession.playerId}` : '未加入';
  elements.aliveCount.textContent = `${players.length} 人已加入`;
  renderBoard();
  elements.rollButton.disabled = true;
  elements.buyButton.disabled = true;
  elements.declineButton.disabled = true;
  elements.endButton.disabled = true;
  elements.bankruptcyButton.disabled = true;
  elements.newGameButton.disabled = true;
  if (elements.openTradeButton) elements.openTradeButton.disabled = true;
  if (elements.openContractButton) elements.openContractButton.disabled = true;
  elements.offerText.textContent = '';
  elements.sharePurchaseForm.hidden = true;
  elements.players.innerHTML = players.map((player, index) => `
    <article class="player-card${player.playerId === networkSession.playerId ? ' is-active' : ''}" data-player-id="${player.playerId}">
      <div class="card-topline">
        <strong><span class="player-avatar" style="--dot: ${playerColors[index]}">${index + 1}</span>${escapeHtml(player.name)}</strong>
        <span class="badge">${player.isHost ? '房主' : '等待'}${player.playerId === networkSession.playerId ? ' · 你' : ''}</span>
      </div>
      <p class="muted">${escapeHtml(player.playerId)}</p>
    </article>
  `).join('') || '<p class="empty-state">还没有玩家加入。</p>';
  elements.properties.innerHTML = '<p class="empty-state">联机游戏开始后会显示你的地产。</p>';
  elements.votes.innerHTML = '<p class="empty-state">联机游戏开始后会显示投票。</p>';
  elements.pendingTrades.innerHTML = '<p class="empty-state">联机游戏开始后可以交易。</p>';
  elements.contracts.innerHTML = '<p class="empty-state">联机游戏开始后会显示你的合同。</p>';
  elements.log.innerHTML = '<li>等待房主开始联机游戏。</li>';
  renderFocusedPlayerPanel();
  window.superMonopolyGame = game;
}

function renderModeChrome() {
  document.body.classList.toggle('is-lan-mode', isLanMode());
  document.body.classList.toggle('is-local-mode', !isLanMode());
}

function getFocusedPlayer() {
  if (isLanMode() && networkSession.playerId) {
    const ownPlayer = game.players.find((player) => player.id === networkSession.playerId);
    if (ownPlayer) return ownPlayer;
  }
  return getCurrentPlayer(game);
}

function renderFocusedPlayerPanel() {
  if (!elements.rightPlayerName) return;
  if (isLanMode() && !isLanStarted()) {
    const participant = networkSession.room?.lobby?.players?.find((player) => player.playerId === networkSession.playerId);
    const index = networkSession.room?.lobby?.players?.findIndex((player) => player.playerId === networkSession.playerId) ?? 0;
    elements.rightPlayerName.textContent = participant ? `你：${participant.name}` : '你';
    elements.rightPlayerCash.textContent = '等待开始';
    elements.rightPlayerMode.textContent = '联机大厅中；游戏开始后这里会固定显示你的地产和合同。';
    elements.rightPlayerAvatar.textContent = participant ? String(index + 1) : '?';
    elements.rightPlayerAvatar.style.setProperty('--dot', playerColors[Math.max(0, index)] ?? 'var(--accent)');
    return;
  }

  const focusPlayer = getFocusedPlayer();
  const index = game.players.findIndex((player) => player.id === focusPlayer.id);
  elements.rightPlayerName.textContent = isLanMode() ? `你：${focusPlayer.name}` : `当前回合：${focusPlayer.name}`;
  elements.rightPlayerCash.textContent = `$${formatMoney(focusPlayer.cash)}`;
  elements.rightPlayerMode.textContent = isLanMode()
    ? '联机模式下右侧栏目固定展示你自己的地产和合同。'
    : '本地模式下右侧栏目跟随当前回合玩家。';
  elements.rightPlayerAvatar.textContent = String(index + 1);
  elements.rightPlayerAvatar.style.setProperty('--dot', playerColors[index] ?? 'var(--accent)');
}

function renderChatPanel() {
  if (!elements.chatLines) return;
  const enabled = isLanMode() && Boolean(networkSession.roomCode && networkSession.clientId);
  elements.chatStatus.textContent = enabled ? '聊天室已启用' : '本地模式禁用';
  elements.chatInput.disabled = !enabled;
  elements.chatSend.disabled = !enabled;

  const messages = enabled ? (networkSession.room?.chat ?? []) : [];
  if (messages.length === 0) {
    elements.chatLines.innerHTML = enabled
      ? '<p class="empty-state">还没有聊天消息。</p>'
      : '<p class="empty-state">进入局域网联机房间后，聊天室会在这里启用。</p>';
    return;
  }

  elements.chatLines.innerHTML = messages.slice(-24).map((message) => `
    <article class="chat-message">
      <strong>${escapeHtml(message.name ?? playerName(message.playerId))}</strong>
      <span>${escapeHtml(message.text)}</span>
    </article>
  `).join('');
  elements.chatLines.scrollTop = elements.chatLines.scrollHeight;
}

function openOverlay(overlay) {
  if (overlay) overlay.hidden = false;
}

function closeOverlays() {
  [elements.tradeOverlay, elements.contractOverlay, elements.playerDetailOverlay].forEach((overlay) => {
    if (overlay) overlay.hidden = true;
  });
}

function openPlayerDetail(playerId) {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player || !elements.playerDetailOverlay) return;
  const index = game.players.findIndex((candidate) => candidate.id === playerId);
  const holdings = getPlayerPropertyHoldings(game, player.id);
  const contracts = game.contracts.filter((contract) => contract.holderId === player.id);

  elements.playerDetailName.textContent = `${player.name} 的资产档案`;
  elements.playerDetailSummary.textContent = `${player.bankrupt ? '已破产' : '存活'} · 位置：${game.board[player.position]?.name ?? '--'}`;
  elements.playerDetailCash.textContent = `$${formatMoney(player.cash)}`;
  elements.playerDetailStatus.textContent = player.bankrupt ? t('ui.bankrupt') : (index === game.turn ? t('ui.acting') : t('ui.waiting'));
  elements.playerDetailAvatar.textContent = String(index + 1);
  elements.playerDetailAvatar.style.setProperty('--dot', playerColors[index] ?? 'var(--accent)');
  elements.playerDetailProperties.innerHTML = holdings.length
    ? holdings.map((holding) => `
      <article class="property-card" style="--stripe: ${stripeFor(holding.property)}">
        <div class="card-topline">
          <strong>${escapeHtml(holding.property.name)}</strong>
          <span class="badge">${holding.percent}%</span>
        </div>
        <p class="muted">${escapeHtml(countryName(holding.property))} · ${escapeHtml(colorName(holding.property))} · 租 $${formatMoney(getSpaceRent(holding.property))}</p>
      </article>
    `).join('')
    : '<p class="empty-state">没有持股地产。</p>';
  elements.playerDetailContracts.innerHTML = contracts.length
    ? contracts.map((contract) => `
      <article class="contract-card">
        <div class="card-topline">
          <strong>${escapeHtml(contract.id)} · ${contractTypeLabel(contract.type)}</strong>
          <span class="badge">${contract.status}</span>
        </div>
        <p class="muted">${escapeHtml(contractDetail(contract))}</p>
      </article>
    `).join('')
    : '<p class="empty-state">没有合同。</p>';
  openOverlay(elements.playerDetailOverlay);
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
  const networkLocked = isLanMode() && (!isLanStarted() || currentPlayer.id !== networkSession.playerId);
  const networkOfferLocked = isLanMode() && game.pendingOffer?.playerId !== networkSession.playerId;
  elements.rollButton.disabled = actionPending || game.phase !== 'roll' || game.status === 'gameOver' || cashLocked || networkLocked;
  elements.buyButton.disabled = actionPending || !hasOffer || game.status === 'gameOver' || processPaused || cashLocked || networkLocked || networkOfferLocked;
  elements.declineButton.disabled = actionPending || !hasOffer || game.status === 'gameOver' || processPaused || networkLocked || networkOfferLocked;
  elements.endButton.disabled = actionPending || game.phase === 'roll' || hasOffer || game.status === 'gameOver' || processPaused || game.phase === 'vote' || cashLocked || networkLocked;
  elements.bankruptcyButton.disabled = actionPending || game.status === 'gameOver' || game.phase === 'auctionPending' || game.phase === 'vote' || currentPlayer.bankrupt || networkLocked;
  elements.newGameButton.disabled = actionPending || (isLanMode() && (!networkSession.isHost || !isLanStarted()));
  renderInteractionLocks();
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
      <article class="player-card${activeClass}${bankruptClass}" data-player-id="${player.id}">
        <div class="card-topline">
          <strong><span class="player-avatar" style="--dot: ${playerColors[index]}">${index + 1}</span>${escapeHtml(player.name)}</strong>
          <span class="badge">${player.bankrupt ? t('ui.bankrupt') : index === game.turn ? t('ui.acting') : t('ui.waiting')}</span>
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
  const focusPlayer = getFocusedPlayer();
  const currentPlayer = getCurrentPlayer(game);
  const holdings = getPlayerPropertyHoldings(game, focusPlayer.id);

  if (holdings.length === 0) {
    elements.properties.innerHTML = `<p class="empty-state">${escapeHtml(focusPlayer.name)} 还没有股份。落在银行持股城市时，可以按 10% 为单位买入。</p>`;
    return;
  }

  elements.properties.innerHTML = holdings.map((holding) => {
    const property = holding.property;
    const group = getColorGroupProperties(game, property.colorGroup);
    const majorGroup = isColorGroupMajorShareholder(game, property.colorGroup, focusPlayer.id);
    const ownsGroup = ownsCompleteColorGroup(game, focusPlayer.id, property.colorGroup);
    const buildEligibility = getBuildEligibility(game, property.id, focusPlayer.id);
    const demolishEligibility = getDemolishEligibility(game, property.id, focusPlayer.id);
    const canBuild = canBuildHouse(game, property.id, focusPlayer.id);
    const canDemolish = canDemolishHouse(game, property.id, focusPlayer.id);
    const rent = getSpaceRent(property);
    const turnLocked = focusPlayer.id !== currentPlayer.id;
    const networkLocked = isLanMode() && currentPlayer.id !== networkSession.playerId;
    const buildDisabled = game.status === 'gameOver' || Boolean(game.pendingOffer) || game.phase === 'auctionPending' || game.phase === 'buildPayment' || game.phase === 'vote' || game.phase === 'cashRecovery' || turnLocked || networkLocked;
    const demolishDisabled = game.status === 'gameOver' || Boolean(game.pendingOffer) || game.phase === 'auctionPending' || game.phase === 'buildPayment' || game.phase === 'vote' || turnLocked || networkLocked;
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
          <button type="button" data-resolve-construction="${construction.id}" ${canControlCurrentPlayer() ? '' : 'disabled'}>重试结算建房费用</button>
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
  const actionText = vote.type === 'demolish' ? t('action.demolish') : t('action.build');
  const totals = voteTotals(vote);
  const shareholders = getPropertyShareholders(game, property.id);
  const voterRows = shareholders.map((holder) => {
    const forced = forcedVoteStanceForUi(holder.playerId, property.id, vote.type);
    const recorded = vote.votes[holder.playerId];
    const canVote = vote.status === 'open' && game.status !== 'gameOver' && canVoteFor(holder.playerId);
    return `
      <div class="vote-voter-row">
        <span>${escapeHtml(playerName(holder.playerId))} · ${holder.percent}%${forced ? ` · 合同强制${forced === 'yes' ? t('ui.support') : t('ui.oppose')}` : ''}${recorded ? ` · 已投${recorded === 'yes' ? t('ui.support') : t('ui.oppose')}` : ''}</span>
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
        <button type="button" data-resolve-vote="${vote.id}" ${vote.status === 'open' && canControlCurrentPlayer() ? '' : 'disabled'}>结算投票</button>
      </div>
    </article>
  `;
}

function renderTradePanel() {
  const ownPlayerId = isLanMode() ? networkSession.playerId : null;
  populatePlayerSelect(elements.tradeFrom, ownPlayerId || elements.tradeFrom.value || getCurrentPlayer(game).id);
  if (ownPlayerId) {
    elements.tradeFrom.value = ownPlayerId;
    elements.tradeFrom.disabled = true;
  } else {
    elements.tradeFrom.disabled = false;
  }
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
  elements.pendingTrades.innerHTML = trades.map((trade) => {
    const canAcceptTrade = trade.status === 'pending' && (!isLanMode() || trade.toPlayerId === networkSession.playerId);
    const canRejectTrade = trade.status === 'pending' && (!isLanMode() || [trade.fromPlayerId, trade.toPlayerId].includes(networkSession.playerId));
    return `
    <article class="pending-trade-card">
      <div class="card-topline">
        <strong>${escapeHtml(playerName(trade.fromPlayerId))} ⇄ ${escapeHtml(playerName(trade.toPlayerId))}</strong>
        <span class="badge">${trade.status}</span>
      </div>
      <p class="muted">给出：${escapeHtml(assetSummary(trade.offer))}</p>
      <p class="muted">索要：${escapeHtml(assetSummary(trade.request))}</p>
      ${trade.note ? `<p class="muted">备注：${escapeHtml(trade.note)}</p>` : ''}
      <div class="action-row">
        <button type="button" data-accept-trade="${trade.id}" ${canAcceptTrade ? '' : 'disabled'}>接受</button>
        <button type="button" data-reject-trade="${trade.id}" ${canRejectTrade ? '' : 'disabled'}>拒绝</button>
      </div>
    </article>
  `;
  }).join('');
}

function renderContracts() {
  renderContractFormOptions();
  const focusPlayer = getFocusedPlayer();
  const contracts = game.contracts.filter((contract) => contract.holderId === focusPlayer.id);
  if (contracts.length === 0) {
    elements.contracts.innerHTML = `<p class="empty-state">${escapeHtml(focusPlayer.name)} 还没有合同。可点击“创建合同”，或在交易 overlay 中转让合同 ID。</p>`;
    return;
  }
  elements.contracts.innerHTML = contracts.map((contract) => `
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

function buildContractPayloadFromForm() {
  const type = elements.contractType.value;
  const holderId = elements.contractHolder.value;
  const propertyId = elements.contractProperty.value;
  if (type === CONTRACT_TYPES.VOTE_SUPPORT) {
    return {
      type,
      holderId,
      obligorId: elements.contractObligor.value,
      targetSpaceId: propertyId,
      stance: elements.contractStance.value,
    };
  }

  const ownerId = elements.contractShareOwner.value;
  const count = Number(elements.contractShareCount.value || 1);
  const shareRefs = firstShareRefs(ownerId, propertyId, count);
  if (shareRefs.length < count) {
    throw new Error('该股份持有人没有足够股份可绑定合同。');
  }
  return {
    type,
    holderId,
    shareRefs,
  };
}

function createContractFromPayload(payload) {
  if (payload.type === CONTRACT_TYPES.VOTE_SUPPORT) {
    return createVoteSupportContract(game, {
      holderId: payload.holderId,
      obligorId: payload.obligorId,
      targetSpaceId: payload.targetSpaceId,
      stance: payload.stance,
    });
  }
  if (payload.type === CONTRACT_TYPES.FREE_PASS) {
    return createFreePassContract(game, { holderId: payload.holderId, shareRefs: payload.shareRefs });
  }
  return createInheritanceContract(game, { holderId: payload.holderId, shareRefs: payload.shareRefs });
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
    .map((holder) => `${holder.playerId === BANK_ID ? t('entity.bank') : playerName(holder.playerId)} ${holder.percent}%`)
    .join('，') || '无';
}

function shareBarMarkup(property) {
  const holders = getPropertyShareholders(game, property.id, { includeBank: true });
  return `
    <div class="share-bar" aria-label="股份分布">
      ${holders.map((holder) => `<span class="share-segment" title="${escapeHtml(holder.playerId === BANK_ID ? t('entity.bank') : playerName(holder.playerId))} ${holder.percent}%" style="flex: ${holder.shareCount}; background: ${holderColor(holder.playerId)}"></span>`).join('')}
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
    roll: t('ui.phase.roll'),
    action: t('ui.phase.action'),
    end: t('ui.phase.end'),
    vote: t('ui.phase.vote'),
    buildPayment: t('ui.phase.buildPayment'),
    cashRecovery: t('ui.phase.cashRecovery'),
    auctionPending: t('ui.phase.auctionPending'),
    gameOver: t('ui.phase.gameOver'),
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
    const actionText = contract.voteType === 'demolish' ? t('action.demolish') : t('action.build');
    return `${playerName(contract.obligorId)} 下一次 ${property?.name ?? contract.targetSpaceId} ${actionText}投票必须${contract.stance === 'yes' ? t('ui.support') : t('ui.oppose')}；剩余 ${contract.remainingUses} 次。`;
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

function networkPlayerName(playerId) {
  return networkSession.room?.lobby?.players?.find((player) => player.playerId === playerId)?.name ?? playerName(playerId);
}

function playerName(playerId) {
  if (playerId === BANK_ID) return t('entity.bank');
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
