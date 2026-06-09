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
  LAP_BONUS,
  MAX_LAP_BONUS,
  MAX_START_CASH,
  MIN_LAP_BONUS,
  MIN_START_CASH,
  normalizeLapBonus,
  normalizeStartCash,
  START_CASH,
  createInheritanceContract,
  createVoteSupportContract,
  declineCurrentShareOffer,
  AUCTION_STARTING_BID,
  advanceBankruptcyAuction,
  declareBankruptcy,
  demolishHouse,
  endTurn,
  expirePendingTrades,
  getAuctionLotLabel,
  getAuctionLotRemainingMs,
  getMinimumAuctionBid,
  isBankruptcyAuctionActive,
  placeAuctionBid,
  getBankShareCount,
  getBuildEligibility,
  getColorGroupProperties,
  getCurrentPlayer,
  getContractDisplayName,
  getDemolishEligibility,
  getPlayerPropertyHoldings,
  getPlayerShareCount,
  getPropertyShareholders,
  getTradeableShareCount,
  getTradeableShareRefs,
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
  initiateKickVote,
  castKickVote,
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
  appShell: document.querySelector('#app-shell'),
  lobbyScreen: document.querySelector('#lobby-screen'),
  gameScreen: document.querySelector('#game-screen'),
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
  lanReturnLobbyButton: document.querySelector('#lan-return-lobby-button'),
  gameSettingsPanel: document.querySelector('#game-settings-panel'),
  startCashInput: document.querySelector('#start-cash'),
  startCashRange: document.querySelector('#start-cash-range'),
  lapBonusInput: document.querySelector('#lap-bonus'),
  lapBonusRange: document.querySelector('#lap-bonus-range'),
  gameSettingsHint: document.querySelector('#game-settings-hint'),
  board: document.querySelector('#board'),
  currentPlayer: document.querySelector('#current-player'),
  currentSpace: document.querySelector('#current-space'),
  roundLabel: document.querySelector('#round-label'),
  phaseLabel: document.querySelector('#phase-label'),
  diceLabel: document.querySelector('#dice-label'),
  diceContainer: document.querySelector('#dice-container'),
  die1: document.querySelector('#die-1'),
  die2: document.querySelector('#die-2'),
  controls: document.querySelector('.controls'),
  rollButton: document.querySelector('#roll-button'),
  buyButton: document.querySelector('#buy-button'),
  declineButton: document.querySelector('#decline-button'),
  endButton: document.querySelector('#end-button'),
  bankruptcyButton: document.querySelector('#bankruptcy-button'),
  kickVoteButton: document.querySelector('#kick-vote-button'),
  kickVoteStatusPanel: document.querySelector('#kick-vote-status-panel'),
  kickVoteTimerSmall: document.querySelector('#kick-vote-timer-small'),
  kickVoteCountSmall: document.querySelector('#kick-vote-count-small'),
  kickVoteVotersSmall: document.querySelector('#kick-vote-voters-small'),
  newGameButton: document.querySelector('#new-game-button'),
  sharePurchaseForm: document.querySelector('#share-purchase-form'),
  shareCount: document.querySelector('#share-count'),
  shareCountRange: document.querySelector('#share-count-range'),
  sharePreview: document.querySelector('#share-preview'),
  offerText: document.querySelector('#offer-text'),
  auctionOverlay: document.querySelector('#auction-overlay'),
  auctionSubtitle: document.querySelector('#auction-subtitle'),
  auctionLotLabel: document.querySelector('#auction-lot-label'),
  auctionCurrentBid: document.querySelector('#auction-current-bid'),
  auctionTimer: document.querySelector('#auction-timer'),
  auctionBidForm: document.querySelector('#auction-bid-form'),
  auctionBidderField: document.querySelector('#auction-bidder-field'),
  auctionBidder: document.querySelector('#auction-bidder'),
  auctionBidAmount: document.querySelector('#auction-bid-amount'),
  auctionBidRange: document.querySelector('#auction-bid-range'),
  auctionMinBid: document.querySelector('#auction-min-bid'),
  auctionBidButton: document.querySelector('#auction-bid-button'),
  auctionProgressLabel: document.querySelector('#auction-progress-label'),
  auctionLotQueue: document.querySelector('#auction-lot-queue'),
  message: document.querySelector('#message'),
  players: document.querySelector('#players'),
  properties: document.querySelector('#properties'),
  votes: document.querySelector('#votes'),
  tradeForm: document.querySelector('#trade-form'),
  tradeFrom: document.querySelector('#trade-from'),
  tradeTo: document.querySelector('#trade-to'),
  tradeOfferCash: document.querySelector('#trade-offer-cash'),
  tradeOfferCashRange: document.querySelector('#trade-offer-cash-range'),
  tradeRequestCash: document.querySelector('#trade-request-cash'),
  tradeRequestCashRange: document.querySelector('#trade-request-cash-range'),
  tradeOfferSharesList: document.querySelector('#trade-offer-shares-list'),
  tradeOfferAddShare: document.querySelector('#trade-offer-add-share'),
  tradeRequestSharesList: document.querySelector('#trade-request-shares-list'),
  tradeRequestAddShare: document.querySelector('#trade-request-add-share'),
  tradeOfferContract: document.querySelector('#trade-offer-contract'),
  tradeRequestContract: document.querySelector('#trade-request-contract'),
  tradeNote: document.querySelector('#trade-note'),
  pendingTrades: document.querySelector('#pending-trades'),
  contractForm: document.querySelector('#contract-form'),
  contractType: document.querySelector('#contract-type'),
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
  openTradeContractButton: document.querySelector('[data-open-trade-contract]'),
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
let gameScreenActive = false;
let playerTokenPositions = {}; // playerId -> { current: number, target: number, animating: boolean }
let lastGameInstance = null;
let lastTurnState = null;
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
  get gameScreenActive() {
    return gameScreenActive;
  },
  enterGameScreen,
  exitGameScreen,
};

elements.board.style.setProperty('--board-side-length', BOARD_SIDE_LENGTH);

let sharePurchaseBinding;
let auctionBidBinding;
let auctionTimerId = null;
let kickVoteTimerId = null;
let lastAutoOpenedVoteTime = 0;
let tradeOfferCashBinding;
let tradeRequestCashBinding;
const tradeShareLineBindings = {
  offer: [],
  request: [],
};

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
      game = createGame(names, readStoredGameSettings());
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

function readLocalGameSettings() {
  return {
    startCash: normalizeStartCash(elements.startCashInput?.value),
    lapBonus: normalizeLapBonus(elements.lapBonusInput?.value),
  };
}

function readStoredGameSettings() {
  return {
    startCash: game.settings?.startCash ?? readLocalGameSettings().startCash,
    lapBonus: game.settings?.lapBonus ?? readLocalGameSettings().lapBonus,
  };
}

function lobbyGameSettings(room) {
  return {
    startCash: normalizeStartCash(room?.lobby?.settings?.startCash),
    lapBonus: normalizeLapBonus(room?.lobby?.settings?.lapBonus),
  };
}

function syncRangeSettingInputs({ input, range, value }) {
  const normalized = String(value);
  if (input) input.value = normalized;
  if (range) range.value = normalized;
}

function getSelectedSetupMode() {
  return elements.modeRadios.find((radio) => radio.checked)?.value ?? 'local';
}

function isCurrentLanHost() {
  if (!isLanMode()) {
    return false;
  }
  const hostPlayerId = networkSession.room?.lobby?.hostPlayerId;
  if (hostPlayerId && networkSession.playerId) {
    return networkSession.playerId === hostPlayerId;
  }
  return Boolean(networkSession.isHost);
}

function shouldShowGameSettings() {
  if (isLanMode()) {
    return isCurrentLanHost();
  }
  return getSelectedSetupMode() !== 'lan-join';
}

function canEditGameSettings() {
  if (!shouldShowGameSettings()) {
    return false;
  }
  if (!isLanMode()) {
    return true;
  }
  return isCurrentLanHost() && !networkSession.room?.lobby?.started;
}

function defaultGameSettingsHint() {
  return `起始资金 $${MIN_START_CASH}–$${MAX_START_CASH}（默认 $${START_CASH}）；经过起始格奖励 $${MIN_LAP_BONUS}–$${MAX_LAP_BONUS}（默认 $${LAP_BONUS}）。`;
}

function renderGameSettings() {
  if (!elements.gameSettingsPanel) return;

  const visible = shouldShowGameSettings();
  elements.gameSettingsPanel.hidden = !visible;
  if (!visible) {
    return;
  }

  const isLan = isLanMode();
  const room = networkSession.room;
  const canEdit = canEditGameSettings();
  const settings = isLan ? lobbyGameSettings(room) : readLocalGameSettings();

  if (document.activeElement !== elements.startCashInput
    && document.activeElement !== elements.startCashRange) {
    syncRangeSettingInputs({
      input: elements.startCashInput,
      range: elements.startCashRange,
      value: settings.startCash,
    });
  }
  if (document.activeElement !== elements.lapBonusInput
    && document.activeElement !== elements.lapBonusRange) {
    syncRangeSettingInputs({
      input: elements.lapBonusInput,
      range: elements.lapBonusRange,
      value: settings.lapBonus,
    });
  }

  if (elements.startCashInput) elements.startCashInput.disabled = !canEdit;
  if (elements.startCashRange) elements.startCashRange.disabled = !canEdit;
  if (elements.lapBonusInput) elements.lapBonusInput.disabled = !canEdit;
  if (elements.lapBonusRange) elements.lapBonusRange.disabled = !canEdit;

  if (elements.gameSettingsHint) {
    if (isLan && room?.lobby?.started) {
      elements.gameSettingsHint.textContent = '游戏进行中，设置已锁定。';
    } else {
      elements.gameSettingsHint.textContent = defaultGameSettingsHint();
    }
  }
}

async function updateLanLobbySettings(settings) {
  if (!networkSession.roomCode || !networkSession.clientId) {
    throw new Error('还没有加入局域网房间。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/settings`, {
    method: 'POST',
    body: {
      clientId: networkSession.clientId,
      settings,
    },
  });
  applyLanSnapshot(snapshot);
}

let lobbySettingsPersistTimer = null;

function scheduleLanLobbySettingsPersist(settings) {
  if (!isLanMode() || !canEditGameSettings()) {
    return;
  }
  window.clearTimeout(lobbySettingsPersistTimer);
  lobbySettingsPersistTimer = window.setTimeout(() => {
    safeAction(() => updateLanLobbySettings(settings));
  }, 250);
}

function bindRangeSettingControls({
  input,
  range,
  normalize,
  buildPersistPayload,
}) {
  input?.addEventListener('input', () => {
    syncRangeSettingInputs({ input, range, value: normalize(input.value) });
  });
  input?.addEventListener('change', () => {
    const normalized = normalize(input.value);
    syncRangeSettingInputs({ input, range, value: normalized });
    scheduleLanLobbySettingsPersist(buildPersistPayload(normalized));
  });
  range?.addEventListener('input', () => {
    const normalized = normalize(range.value);
    syncRangeSettingInputs({ input, range, value: normalized });
    scheduleLanLobbySettingsPersist(buildPersistPayload(normalized));
  });
}

function bindGameSettingsControls() {
  bindRangeSettingControls({
    input: elements.startCashInput,
    range: elements.startCashRange,
    normalize: normalizeStartCash,
    buildPersistPayload: (startCash) => ({ startCash }),
  });
  bindRangeSettingControls({
    input: elements.lapBonusInput,
    range: elements.lapBonusRange,
    normalize: normalizeLapBonus,
    buildPersistPayload: (lapBonus) => ({ lapBonus }),
  });
}

function bindEvents() {
  bindGameSettingsControls();
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
        game = createGame(names.length >= 2 ? names : ['玩家 1', '玩家 2'], readLocalGameSettings());
        enterGameScreen();
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
      enterGameScreen();
      setMessage('联机游戏已开始。');
    });
  });

  elements.lanLeaveButton?.addEventListener('click', () => {
    safeAction(async () => {
      await leaveLanSession();
      setMessage('已退出局域网联机，回到本地模式。');
    });
  });

  elements.lanReturnLobbyButton?.addEventListener('click', () => {
    safeAction(async () => {
      await returnLanToLobby();
      exitGameScreen();
      setMessage('已返回进入游戏界面，房间仍然保留。');
    });
  });

  elements.networkPlayers?.addEventListener('click', (event) => {
    const kickButton = event.target.closest('[data-kick-player]');
    if (!kickButton) return;
    event.preventDefault();
    safeAction(async () => {
      await kickLanPlayer(kickButton.dataset.kickPlayer);
      setMessage(`已踢出 ${networkPlayerName(kickButton.dataset.kickPlayer)}。`);
    });
  });

  elements.players.addEventListener('click', (event) => {
    const kickButton = event.target.closest('[data-kick-player]');
    if (!kickButton) return;
    event.preventDefault();
    event.stopPropagation();
    safeAction(async () => {
      await kickLanPlayer(kickButton.dataset.kickPlayer);
      setMessage(`已踢出 ${networkPlayerName(kickButton.dataset.kickPlayer)}。`);
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
  initRangeBindings();

  elements.auctionBidder?.addEventListener('change', () => {
    auctionBidBinding?.refreshBounds();
    auctionBidBinding?.setValue(getMinimumAuctionBid(game));
  });

  elements.auctionBidForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!isBankruptcyAuctionActive(game)) {
      return;
    }
    const playerId = isLanMode() ? networkSession.playerId : getCurrentAuctionBidderId();
    if (!playerId) {
      setMessage(t('error.notAuctionParticipant'), true);
      return;
    }
    const amount = auctionBidBinding?.getValue() ?? Number(elements.auctionBidAmount.value);
    safeAction(async () => {
      await runGameAction(() => placeAuctionBid(game, playerId, amount, Date.now()), {
        type: 'placeAuctionBid',
        payload: { amount },
      });
      setMessage(t('log.auctionBid', game.players.find((player) => player.id === playerId)?.name ?? playerId, formatMoney(amount), getAuctionLotLabel(game, game.pendingAuction.lots[game.pendingAuction.currentLotIndex])));
    });
  });

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
      skipAllAnimations();
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

  elements.kickVoteButton.addEventListener('click', () => {
    safeAction(async () => {
      if (!isLanMode()) return;

      if (game.pendingKickVote) {
        const voterId = networkSession.playerId;
        if (!voterId) return;
        const hasVoted = game.pendingKickVote.votes[voterId] === 'yes';
        const stance = hasVoted ? 'cancel' : 'yes';
        await runGameAction(() => castKickVote(game, voterId, stance), {
          type: 'castKickVote',
          payload: { voterId, stance }
        });
      } else {
        const initiatorId = networkSession.playerId;
        if (!initiatorId) return;
        await runGameAction(() => initiateKickVote(game, initiatorId), {
          type: 'initiateKickVote',
          payload: { initiatorId }
        });
      }
    });
  });

  elements.newGameButton.addEventListener('click', () => {
    safeAction(async () => {
      if (isLanMode()) {
        await sendLanAction('restart');
      } else {
        const names = game.players.map((player) => player.name);
        game = createGame(names, readStoredGameSettings());
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
      const offer = buildTradeAssets(fromPlayerId, 'offer', elements.tradeOfferCash, elements.tradeOfferContract);
      const request = buildTradeAssets(toPlayerId, 'request', elements.tradeRequestCash, elements.tradeRequestContract);
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
  elements.tradeOfferAddShare?.addEventListener('click', () => addTradeShareLine('offer'));
  elements.tradeRequestAddShare?.addEventListener('click', () => addTradeShareLine('request'));
  elements.tradeOfferSharesList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-trade-share]');
    if (removeButton) removeTradeShareLine('offer', removeButton.dataset.removeTradeShare);
  });
  elements.tradeRequestSharesList?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-trade-share]');
    if (removeButton) removeTradeShareLine('request', removeButton.dataset.removeTradeShare);
  });
  elements.tradeOfferSharesList?.addEventListener('change', (event) => {
    if (event.target.matches('[data-trade-share-property]')) refreshTradeShareLine('offer', event.target.closest('[data-trade-share-line]')?.dataset.tradeShareLine);
  });
  elements.tradeRequestSharesList?.addEventListener('change', (event) => {
    if (event.target.matches('[data-trade-share-property]')) refreshTradeShareLine('request', event.target.closest('[data-trade-share-line]')?.dataset.tradeShareLine);
  });

  elements.contractForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (elements.tradeOverlay?.hidden) {
      setMessage(t('error.contractOnlyDuringTrade'), true);
      return;
    }
    safeAction(async () => {
      const fromPlayerId = isLanMode() ? networkSession.playerId : elements.tradeFrom.value;
      const toPlayerId = elements.tradeTo.value;
      const payload = {
        ...buildContractPayloadFromForm(),
        tradeFromPlayerId: fromPlayerId,
        tradeToPlayerId: toPlayerId,
      };
      game.contractCreationContext = { fromPlayerId, toPlayerId };
      try {
        await runGameAction(() => createContractFromPayload(payload), { type: 'createContract', payload });
      } finally {
        game.contractCreationContext = null;
      }
      const contract = game.contracts.at(-1);
      const newContractId = contract?.id;
      setMessage(t('msg.contractCreated', contract ? getContractDisplayName(game, contract) : ''));
      closeContractOverlay();
      render();
      if (newContractId) selectTradeOfferContract(newContractId);
    });
  });
  elements.contractProperty.addEventListener('change', renderContractFormOptions);
  elements.contractType.addEventListener('change', () => {
    renderContractFormOptions();
    updateContractFormVisibility();
  });
  elements.contractShareOwner.addEventListener('change', renderContractFormOptions);
  elements.contractObligor.addEventListener('change', renderContractFormOptions);

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
    if (isBankruptcyAuctionActive(game)) {
      return;
    }
    const playerCard = event.target.closest('[data-player-id]');
    if (playerCard) {
      openPlayerDetail(playerCard.dataset.playerId);
    }
  });

  document.addEventListener('click', (event) => {
    if (isBankruptcyAuctionActive(game)) {
      if (!event.target.closest('#auction-overlay')) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (event.target.closest('[data-open-trade]')) {
      if (isLanMode() && !isLanStarted()) {
        setMessage('联机游戏开始后才能发起交易。', true);
        return;
      }
      if (isFocusedPlayerBankrupt()) {
        setMessage(t('ui.tradeDisabledBankrupt'), true);
        return;
      }
      renderTradePanel();
      openOverlay(elements.tradeOverlay);
      return;
    }
    if (event.target.closest('[data-open-trade-contract]')) {
      if (isLanMode() && !isLanStarted()) {
        setMessage('联机游戏开始后才能创建合同。', true);
        return;
      }
      if (isFocusedPlayerBankrupt()) {
        setMessage(t('ui.tradeDisabledBankrupt'), true);
        return;
      }
      openContractOverlayFromTrade();
      return;
    }
    if (event.target.closest('[data-close-contract-overlay]')) {
      closeContractOverlay();
      return;
    }
    if (event.target.closest('[data-close-overlay]')) {
      const overlay = event.target.closest('.overlay');
      if (overlay === elements.playerDetailOverlay) {
        elements.playerDetailOverlay.hidden = true;
      } else {
        closeTradeOverlay();
      }
      return;
    }
    if (event.target === elements.contractOverlay) {
      closeContractOverlay();
      return;
    }
    if (event.target.classList?.contains('overlay')) {
      closeOverlays();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !isBankruptcyAuctionActive(game)) {
      closeTopOverlay();
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

function isInGameScreen() {
  return gameScreenActive;
}

function enterGameScreen({ immediate = false } = {}) {
  if (gameScreenActive) return;
  gameScreenActive = true;
  elements.appShell?.classList.add('is-in-game');
  elements.lobbyScreen?.setAttribute('aria-hidden', 'true');
  elements.gameScreen?.setAttribute('aria-hidden', 'false');
  if (immediate) {
    elements.appShell?.classList.add('is-in-game-immediate');
    window.requestAnimationFrame(() => {
      elements.appShell?.classList.remove('is-in-game-immediate');
    });
  }
  render();
}

function exitGameScreen({ immediate = false } = {}) {
  if (!gameScreenActive) return;
  gameScreenActive = false;
  elements.appShell?.classList.remove('is-in-game');
  elements.lobbyScreen?.setAttribute('aria-hidden', 'false');
  elements.gameScreen?.setAttribute('aria-hidden', 'true');
  if (immediate) {
    elements.appShell?.classList.add('is-in-game-immediate');
    window.requestAnimationFrame(() => {
      elements.appShell?.classList.remove('is-in-game-immediate');
    });
  }
}

function syncGameScreenFromSession({ immediate = false } = {}) {
  if (isLanStarted() && !gameScreenActive) {
    enterGameScreen({ immediate });
    return;
  }
  if (isLanMode() && !isLanStarted() && gameScreenActive) {
    exitGameScreen({ immediate });
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

function isFocusedPlayerBankrupt() {
  return Boolean(getFocusedPlayer()?.bankrupt);
}

function canOpenTradePanel() {
  if (actionPending || isBankruptcyAuctionActive(game)) {
    return false;
  }
  if (isLanMode() && !isLanStarted()) {
    return false;
  }
  return !isFocusedPlayerBankrupt();
}

function renderInteractionLocks() {
  const tradeLocked = !canOpenTradePanel();
  const lobbyLocked = isLanMode() && !isLanStarted();
  if (elements.setupSubmit) elements.setupSubmit.disabled = actionPending || isLanMode();
  if (elements.lanStartButton) elements.lanStartButton.disabled = actionPending || (networkSession.room?.lobby?.players ?? []).length < 2;
  if (elements.lanLeaveButton) elements.lanLeaveButton.disabled = actionPending;
  if (elements.lanReturnLobbyButton) {
    elements.lanReturnLobbyButton.disabled = actionPending;
  }
  if (elements.openTradeButton) elements.openTradeButton.disabled = tradeLocked;
  if (elements.openTradeContractButton) elements.openTradeContractButton.disabled = tradeLocked;
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
    body: {
      playerName,
      settings: readLocalGameSettings(),
    },
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

async function returnLanToLobby() {
  if (!networkSession.roomCode || !networkSession.clientId) {
    throw new Error('还没有加入局域网房间。');
  }
  if (!networkSession.isHost) {
    throw new Error('只有房主可以返回进入游戏界面。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/return-lobby`, {
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

async function kickLanPlayer(targetPlayerId) {
  if (!networkSession.roomCode || !networkSession.clientId) {
    throw new Error('你还没有加入局域网房间。');
  }
  if (!networkSession.isHost) {
    throw new Error('只有房主可以踢出玩家。');
  }
  if (networkSession.room?.lobby?.started) {
    throw new Error('游戏已经开始，不能踢出玩家。');
  }
  const snapshot = await apiRequest(`/api/rooms/${encodeURIComponent(networkSession.roomCode)}/kick`, {
    method: 'POST',
    body: {
      clientId: networkSession.clientId,
      targetPlayerId,
    },
  });
  applyLanSnapshot(snapshot);
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
    if (isLanRemovedFromRoomError(error)) {
      await leaveLanSession({ skipServerNotify: true });
      setMessage('你已被房主移出房间。', true);
      render();
      return;
    }
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

async function leaveLanSession({ skipServerNotify = false } = {}) {
  const shouldNotifyServer = !skipServerNotify
    && isLanMode()
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
  exitGameScreen({ immediate: true });
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
  } else if (!networkSession.room?.lobby?.started) {
    const names = networkSession.room?.lobby?.players?.map((player) => player.name) ?? [];
    game = createGame(
      names.length >= 2 ? names : ['玩家 1', '玩家 2'],
      lobbyGameSettings(networkSession.room),
    );
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
    syncGameScreenFromSession({ immediate: true });
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
  renderGameSettings();
}

function isLanRemovedFromRoomError(error) {
  const message = String(error?.message ?? '');
  return /不是该局域网房间的玩家|找不到局域网房间/i.test(message);
}

function renderNetworkPanel() {
  if (!elements.networkPanel || !elements.networkStatus) {
    return;
  }
  if (!isLanMode()) {
    elements.networkPanel.hidden = true;
    elements.networkStatus.textContent = '本地模式';
    renderGameSettings();
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
    .map((player) => {
      const labels = [
        escapeHtml(player.name),
        player.playerId === networkSession.playerId ? '（你）' : '',
        player.isHost ? ' · 房主' : '',
      ].filter(Boolean).join('');
      const canKick = networkSession.isHost
        && !room?.lobby?.started
        && !player.isHost
        && player.playerId !== networkSession.playerId;
      const kickButton = canKick
        ? `<button type="button" class="lan-kick-button danger-button" data-kick-player="${escapeHtml(player.playerId)}" aria-label="踢出 ${escapeHtml(player.name)}">踢出</button>`
        : '';
      return `<span class="network-player-badge badge">${labels}${kickButton}</span>`;
    })
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
  renderGameSettings();
}


let lastRollState = {
  round: 0,
  turn: 0,
  phase: '',
  dice: null
};
let isDiceAnimating = false;

function setDieFace(dieEl, faceVal, zRotation) {
  const targetTransforms = {
    1: 'rotateX(0deg) rotateY(0deg)',
    6: 'rotateX(0deg) rotateY(180deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    2: 'rotateX(-90deg) rotateY(0deg)',
    5: 'rotateX(90deg) rotateY(0deg)',
  };
  const transformStr = (targetTransforms[faceVal] || targetTransforms[1]) + ` rotateZ(${zRotation}deg)`;
  dieEl.style.transform = transformStr;
  dieEl.setAttribute('data-face', faceVal);
}

function renderDice() {
  if (!elements.diceContainer || !elements.die1 || !elements.die2) return;

  elements.diceContainer.hidden = false;

  const currentPlayer = getCurrentPlayer(game);
  const playerIndex = game.players.findIndex(p => p.id === currentPlayer.id);
  const color = playerColors[playerIndex] || 'var(--accent-strong)';
  elements.diceContainer.style.setProperty('--dice-color', color);

  if (game.phase === 'roll') {
    elements.diceContainer.classList.add('waiting');
    if (!isDiceAnimating) {
      setDieFace(elements.die1, 1, -8);
      setDieFace(elements.die2, 1, 10);
    }
    return;
  }

  elements.diceContainer.classList.remove('waiting');

  if (!game.lastDice) {
    if (!isDiceAnimating) {
      setDieFace(elements.die1, 1, -8);
      setDieFace(elements.die2, 1, 10);
    }
    return;
  }

  const isNewRoll = (
    game.round !== lastRollState.round ||
    game.turn !== lastRollState.turn ||
    lastRollState.phase === 'roll' ||
    !lastRollState.dice ||
    game.lastDice[0] !== lastRollState.dice[0] ||
    game.lastDice[1] !== lastRollState.dice[1]
  );

  lastRollState = {
    round: game.round,
    turn: game.turn,
    phase: game.phase,
    dice: [...game.lastDice]
  };

  if (isNewRoll && !isDiceAnimating) {
    isDiceAnimating = true;
    elements.die1.classList.add('rolling');
    elements.die2.classList.add('rolling');

    setTimeout(() => {
      elements.die1.classList.remove('rolling');
      elements.die2.classList.remove('rolling');
      setDieFace(elements.die1, game.lastDice[0], -8);
      setDieFace(elements.die2, game.lastDice[1], 10);
      isDiceAnimating = false;
    }, 600);
  } else if (!isDiceAnimating) {
    setDieFace(elements.die1, game.lastDice[0], -8);
    setDieFace(elements.die2, game.lastDice[1], 10);
  }
}

const MAX_PLAYERS_FOR_UI = 4;

function render() {
  renderModeChrome();
  renderNetworkPanel();
  syncGameScreenFromSession();
  if (!isInGameScreen()) {
    lastTurnState = null;
    return;
  }
  if (isLanMode() && !isLanStarted()) {
    renderLobbyState();
    renderChatPanel();
    elements.board.querySelectorAll('.player-token-wrapper').forEach((el) => el.remove());
    for (const key in playerTokenPositions) {
      delete playerTokenPositions[key];
    }
    lastGameInstance = null;
    lastTurnState = null;
    return;
  }
  if (!isLanMode()) {
    expirePendingTrades(game, Date.now());
  }

  if (!lastTurnState) {
    lastTurnState = {
      turn: game.turn,
      round: game.round
    };
  } else if (game.turn !== lastTurnState.turn || game.round !== lastTurnState.round) {
    skipAllAnimations();
    playTurnSound(lastTurnState.turn, game.turn);
    lastTurnState = {
      turn: game.turn,
      round: game.round
    };
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
  if (elements.diceLabel) {
    elements.diceLabel.textContent = t('ui.dice', game.lastDice ? game.lastDice.join(' + ') : '--');
  }
  elements.aliveCount.textContent = t('ui.aliveCount', alivePlayers.length);

  renderDice();

  renderOffer();
  renderControls();
  renderBoard();
  ensurePlayerTokenWrappers();
  renderPlayers();
  renderProperties();
  renderVotes();
  renderTradePanel();
  renderContracts();
  renderFocusedPlayerPanel();
  renderChatPanel();
  if (isFocusedPlayerBankrupt() && elements.tradeOverlay && !elements.tradeOverlay.hidden) {
    closeTradeOverlay();
  }
  renderAuctionOverlay();
  ensureAuctionTimer();
  
  if (isLanMode()) {
    const vote = game.pendingKickVote;
    if (vote) {
      ensureKickVoteTimer();
      renderKickVoteWidget();
    } else {
      ensureKickVoteTimer();
      if (elements.kickVoteStatusPanel) {
        elements.kickVoteStatusPanel.hidden = true;
      }
    }
  } else {
    ensureKickVoteTimer();
    if (elements.kickVoteButton) {
      elements.kickVoteButton.hidden = true;
    }
    if (elements.kickVoteStatusPanel) {
      elements.kickVoteStatusPanel.hidden = true;
    }
  }

  renderLog();

  window.superMonopolyGame = game;
  checkAndAnimatePlayerCash();
}

function renderLobbyState() {
  const players = networkSession.room?.lobby?.players ?? [];
  elements.currentPlayer.textContent = '局域网大厅';
  elements.currentSpace.textContent = networkSession.roomCode
    ? `房间 ${networkSession.roomCode} · 已加入 ${players.length}/${MAX_PLAYERS_FOR_UI} 人`
    : '选择创建或加入局域网房间。';
  elements.roundLabel.textContent = '等待开始';
  elements.phaseLabel.textContent = networkSession.isHost ? '房主可开始' : '等待房主';
  if (elements.diceLabel) {
    elements.diceLabel.textContent = networkSession.playerId ? `你是 ${networkSession.playerId}` : '未加入';
  }
  if (elements.diceContainer) {
    elements.diceContainer.hidden = true;
  }
  elements.aliveCount.textContent = `${players.length} 人已加入`;
  renderBoard();
  hideTurnControls();
  elements.bankruptcyButton.disabled = true;
  elements.kickVoteButton.disabled = true;
  if (elements.openTradeButton) elements.openTradeButton.disabled = true;
  if (elements.openTradeContractButton) elements.openTradeContractButton.disabled = true;
  elements.offerText.textContent = '';
  elements.sharePurchaseForm.hidden = true;
  elements.players.innerHTML = players.map((player, index) => {
    const canKick = networkSession.isHost
      && !networkSession.room?.lobby?.started
      && !player.isHost
      && player.playerId !== networkSession.playerId;
    const kickButton = canKick
      ? `<button type="button" class="lan-kick-button danger-button" data-kick-player="${escapeHtml(player.playerId)}" aria-label="踢出 ${escapeHtml(player.name)}">踢出</button>`
      : '';
    return `
    <article class="player-card${player.playerId === networkSession.playerId ? ' is-active' : ''}" data-player-id="${player.playerId}">
      <div class="card-topline">
        <strong><span class="player-avatar" style="--dot: ${playerColors[index]}">${index + 1}</span>${escapeHtml(player.name)}</strong>
        <span class="card-topline-actions">
          ${kickButton}
          <span class="badge">${player.isHost ? '房主' : '等待'}${player.playerId === networkSession.playerId ? ' · 你' : ''}</span>
        </span>
      </div>
      <p class="muted">${escapeHtml(player.playerId)}</p>
    </article>
  `;
  }).join('') || '<p class="empty-state">还没有玩家加入。</p>';
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

function openContractOverlayFromTrade() {
  const fromPlayerId = isLanMode() ? networkSession.playerId : elements.tradeFrom.value;
  const toPlayerId = elements.tradeTo.value;
  renderContractFormOptionsForTrade(fromPlayerId, toPlayerId);
  openOverlay(elements.contractOverlay);
}

function closeContractOverlay() {
  if (elements.contractOverlay) elements.contractOverlay.hidden = true;
}

function closeTradeOverlay() {
  closeContractOverlay();
  if (elements.tradeOverlay) elements.tradeOverlay.hidden = true;
}

function closeTopOverlay() {
  if (elements.contractOverlay && !elements.contractOverlay.hidden) {
    closeContractOverlay();
    return;
  }
  if (elements.playerDetailOverlay && !elements.playerDetailOverlay.hidden) {
    elements.playerDetailOverlay.hidden = true;
    return;
  }
  if (elements.tradeOverlay && !elements.tradeOverlay.hidden) {
    closeTradeOverlay();
  }
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
        <strong>${escapeHtml(getContractDisplayName(game, contract))}</strong>
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
  const current = Number(elements.shareCount.value || 1);
  if (current < 1 || current > game.pendingOffer.maxShareCount) {
    sharePurchaseBinding?.setValue(game.pendingOffer.maxShareCount);
  } else {
    sharePurchaseBinding?.refreshBounds();
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
  const gameOver = game.status === 'gameOver';
  const cashLocked = !currentPlayer.bankrupt && currentPlayer.cash <= 0;
  const networkLocked = isLanMode() && (!isLanStarted() || currentPlayer.id !== networkSession.playerId);
  const networkOfferLocked = isLanMode() && game.pendingOffer?.playerId !== networkSession.playerId;
  const canAct = !actionPending && !networkLocked;

  const showRoll = canAct && !gameOver && game.phase === 'roll' && !cashLocked;
  const showPurchase = canAct && !gameOver && game.phase === 'action' && hasOffer && !cashLocked && !networkOfferLocked;
  const showEnd = canAct && !gameOver && game.phase === 'end' && !hasOffer && !cashLocked;
  const showNewGame = gameOver && (!isLanMode() || (networkSession.isHost && isLanStarted()));

  setTurnControlButton(elements.rollButton, showRoll);
  setTurnControlButton(elements.buyButton, showPurchase);
  setTurnControlButton(elements.declineButton, showPurchase);
  setTurnControlButton(elements.endButton, showEnd);
  setTurnControlButton(elements.newGameButton, showNewGame);

  if (elements.controls) {
    elements.controls.hidden = !(showRoll || showPurchase || showEnd || showNewGame);
  }

  elements.bankruptcyButton.disabled = actionPending || gameOver || game.phase === 'auctionPending' || game.phase === 'vote' || currentPlayer.bankrupt || networkLocked;

  if (elements.kickVoteButton) {
    elements.kickVoteButton.hidden = !isLanMode();
  }
  if (elements.kickVoteStatusPanel && !isLanMode()) {
    elements.kickVoteStatusPanel.hidden = true;
  }

  if (isLanMode()) {
    const isVoteActive = Boolean(game.pendingKickVote);
    if (isVoteActive) {
      const myId = networkSession.playerId;
      const targetId = game.pendingKickVote.targetId;
      const localPlayer = game.players.find((p) => p.id === myId);
      const hasVoted = myId ? game.pendingKickVote.votes[myId] === 'yes' : false;
      const targetIsMe = myId === targetId;
      const isBankrupt = localPlayer?.bankrupt ?? false;

      if (targetIsMe) {
        elements.kickVoteButton.textContent = '被投票中';
        elements.kickVoteButton.disabled = true;
        elements.kickVoteButton.classList.add('danger-button');
        elements.kickVoteButton.classList.remove('ghost-button');
      } else if (isBankrupt) {
        elements.kickVoteButton.textContent = '投票进行中';
        elements.kickVoteButton.disabled = true;
        elements.kickVoteButton.classList.add('danger-button');
        elements.kickVoteButton.classList.remove('ghost-button');
      } else if (hasVoted) {
        elements.kickVoteButton.textContent = t('ui.cancelVote') || '取消投票';
        elements.kickVoteButton.disabled = actionPending;
        elements.kickVoteButton.classList.remove('danger-button');
        elements.kickVoteButton.classList.add('ghost-button');
      } else {
        elements.kickVoteButton.textContent = t('ui.kickVoteButton') || '投票踢出';
        elements.kickVoteButton.disabled = actionPending;
        elements.kickVoteButton.classList.add('danger-button');
        elements.kickVoteButton.classList.remove('ghost-button');
      }
    } else {
      elements.kickVoteButton.textContent = t('ui.buttonKickVote') || '发起踢出投票';
      elements.kickVoteButton.classList.add('danger-button');
      elements.kickVoteButton.classList.remove('ghost-button');
      const localPlayer = game.players.find((p) => p.id === networkSession.playerId);
      const isCurrentPlayer = getCurrentPlayer(game).id === networkSession.playerId;
      elements.kickVoteButton.disabled = actionPending || gameOver || isCurrentPlayer || !localPlayer || localPlayer.bankrupt || game.phase === 'auctionPending';
    }
  }
  if (elements.lanReturnLobbyButton) {
    elements.lanReturnLobbyButton.hidden = !(isLanMode() && isLanStarted() && networkSession.isHost);
  }
  renderInteractionLocks();
}

function setTurnControlButton(button, visible) {
  if (!button) return;
  button.hidden = !visible;
  button.disabled = !visible;
}

function hideTurnControls() {
  setTurnControlButton(elements.rollButton, false);
  setTurnControlButton(elements.buyButton, false);
  setTurnControlButton(elements.declineButton, false);
  setTurnControlButton(elements.endButton, false);
  setTurnControlButton(elements.newGameButton, false);
  if (elements.controls) elements.controls.hidden = true;
}

function renderBoard() {
  elements.board.querySelectorAll('.square').forEach((square) => square.remove());
  const currentPlayer = getCurrentPlayer(game);

  game.board.forEach((space, index) => {
    const square = document.createElement('article');
    const grid = gridPosition(index);
    const hasPlayerShares = space.type === 'property' && getPropertyShareholders(game, space.id).length > 0;

    square.className = `square type-${space.type}`;
    if (hasPlayerShares) square.classList.add('is-owned');
    if (currentPlayer.position === index) {
      square.classList.add('is-current');
      const playerIndex = game.players.findIndex((p) => p.id === currentPlayer.id);
      const color = playerColors[playerIndex] || 'var(--accent)';
      square.style.setProperty('--current-player-color', color);
    }
    square.style.gridColumn = String(grid.column);
    square.style.gridRow = String(grid.row);
    square.style.setProperty('--stripe', stripeFor(space));
    square.dataset.index = index;

    const placement = squareDetailPlacement(grid);
    square.innerHTML = `
      ${squareCompactMarkup(space)}
      ${space.type === 'property' ? squareDetailMarkup(space, placement) : ''}
    `;

    elements.board.append(square);
  });
}

function renderPlayers() {
  const activePlayers = game.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => !player.bankrupt);

  elements.players.innerHTML = activePlayers.map(({ player, index }) => {
    const activeClass = index === game.turn && game.status !== 'gameOver' ? ' is-active' : '';

    return `
      <article class="player-card${activeClass}" data-player-id="${player.id}">
        <div class="card-topline" style="margin-bottom: 0;">
          <strong><span class="player-avatar" style="--dot: ${playerColors[index]}">${index + 1}</span>${escapeHtml(player.name)}</strong>
          <span class="badge player-cash-badge" style="font-weight: 700; color: var(--ink);">$${formatMoney(player.cash)}</span>
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

function resetTradeShareLines(side) {
  for (const line of tradeShareLineBindings[side]) {
    line.root.remove();
  }
  tradeShareLineBindings[side] = [];
}

function renderTradePanel() {
  resetTradeShareLines('offer');
  resetTradeShareLines('request');
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
  ensureTradeShareLines('offer');
  ensureTradeShareLines('request');
  refreshTradeShareLines('offer');
  refreshTradeShareLines('request');
  const offerContractIds = selectedContractIds(elements.tradeOfferContract);
  const requestContractIds = selectedContractIds(elements.tradeRequestContract);
  populateContractTradeSelect(elements.tradeOfferContract, elements.tradeFrom.value, offerContractIds);
  populateContractTradeSelect(elements.tradeRequestContract, elements.tradeTo.value, requestContractIds);
  tradeOfferCashBinding?.refreshBounds();
  tradeRequestCashBinding?.refreshBounds();
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
    elements.contracts.innerHTML = `<p class="empty-state">${escapeHtml(focusPlayer.name)} ${t('ui.noContracts')}</p>`;
    return;
  }
  elements.contracts.innerHTML = contracts.map((contract) => `
    <article class="contract-card">
      <strong>${escapeHtml(getContractDisplayName(game, contract))}</strong>
    </article>
  `).join('');
}

function getContractTradeParties() {
  const fromPlayerId = isLanMode() ? networkSession.playerId : (elements.tradeFrom?.value || getCurrentPlayer(game).id);
  const toPlayerId = elements.tradeTo?.value || game.players.find((player) => player.id !== fromPlayerId)?.id || fromPlayerId;
  return { fromPlayerId, toPlayerId };
}

function resolveContractCounterparty(playerId, fromPlayerId, toPlayerId) {
  if (playerId === fromPlayerId) return toPlayerId;
  if (playerId === toPlayerId) return fromPlayerId;
  return null;
}

function renderContractFormOptions() {
  const { fromPlayerId, toPlayerId } = getContractTradeParties();
  renderContractFormOptionsForTrade(fromPlayerId, toPlayerId);
}

function renderContractFormOptionsForTrade(fromPlayerId, toPlayerId) {
  populateTradePartySelect(elements.contractShareOwner, fromPlayerId, toPlayerId, elements.contractShareOwner.value || fromPlayerId);
  populateTradePartySelect(elements.contractObligor, fromPlayerId, toPlayerId, elements.contractObligor.value || toPlayerId);
  populateContractPropertySelect(
    elements.contractProperty,
    elements.contractType.value,
    elements.contractShareOwner.value,
    elements.contractObligor.value,
    elements.contractProperty.value,
  );
  updateContractShareCountLimit();
  updateContractFormVisibility();
}

function updateContractFormVisibility() {
  const isVoteSupport = elements.contractType.value === CONTRACT_TYPES.VOTE_SUPPORT;
  document.querySelectorAll('[data-contract-field]').forEach((field) => {
    const mode = field.dataset.contractField;
    const visible = mode === 'common'
      || (mode === 'shareBound' && !isVoteSupport)
      || (mode === 'voteSupport' && isVoteSupport);
    field.hidden = !visible;
  });
}

function selectedContractIds(contractSelect) {
  if (!contractSelect) return [];
  return [...contractSelect.selectedOptions].map((option) => option.value).filter(Boolean);
}

function populateContractTradeSelect(select, playerId, selectedIds = []) {
  if (!select) return;
  const contracts = game.contracts.filter((contract) => contract.holderId === playerId && contract.status === 'active');
  select.innerHTML = contracts.map((contract) => (
    `<option value="${escapeHtml(contract.id)}">${escapeHtml(getContractDisplayName(game, contract))}</option>`
  )).join('');
  for (const contractId of selectedIds) {
    const option = [...select.options].find((candidate) => candidate.value === contractId);
    if (option) option.selected = true;
  }
}

function selectTradeOfferContract(contractId) {
  if (!contractId || !elements.tradeOfferContract) return;
  const option = [...elements.tradeOfferContract.options].find((candidate) => candidate.value === contractId);
  if (option) option.selected = true;
}

function getCurrentAuctionBidderId() {
  const auction = game.pendingAuction;
  if (!auction) {
    return null;
  }
  if (isLanMode()) {
    return networkSession.playerId;
  }
  const selected = elements.auctionBidder?.value;
  if (selected && auction.participantIds.includes(selected)) {
    return selected;
  }
  return auction.participantIds[0] ?? null;
}

function isAuctionParticipant() {
  const auction = game.pendingAuction;
  if (!auction) {
    return false;
  }
  const playerId = isLanMode() ? networkSession.playerId : getCurrentAuctionBidderId();
  return Boolean(
    playerId
    && playerId !== auction.bankruptPlayerId
    && auction.participantIds.includes(playerId),
  );
}

function canPlaceAuctionBid() {
  if (!isBankruptcyAuctionActive(game) || actionPending) {
    return false;
  }
  if (isLanMode() && !isLanStarted()) {
    return false;
  }
  return isAuctionParticipant();
}

function ensureKickVoteTimer() {
  if (!isLanMode()) {
    if (kickVoteTimerId) {
      clearInterval(kickVoteTimerId);
      kickVoteTimerId = null;
    }
    return;
  }

  const active = Boolean(game.pendingKickVote);
  if (!active) {
    if (kickVoteTimerId) {
      clearInterval(kickVoteTimerId);
      kickVoteTimerId = null;
    }
    return;
  }

  if (kickVoteTimerId) {
    return;
  }

  kickVoteTimerId = window.setInterval(() => {
    const isVoteActive = Boolean(game.pendingKickVote);
    if (!isVoteActive) {
      clearInterval(kickVoteTimerId);
      kickVoteTimerId = null;
      render();
      return;
    }
    renderKickVoteWidget({ timerOnly: true });
  }, 200);
}

function renderKickVoteWidget({ timerOnly = false } = {}) {
  if (!isLanMode() || !elements.kickVoteStatusPanel) {
    return;
  }

  const active = Boolean(game.pendingKickVote);
  elements.kickVoteStatusPanel.hidden = !active;
  if (!active) {
    return;
  }

  const vote = game.pendingKickVote;
  const remainingMs = Math.max(0, vote.duration - (Date.now() - vote.createdAt));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  elements.kickVoteTimerSmall.textContent = timerStr;

  if (!timerOnly) {
    const otherActivePlayers = game.players.filter((p) => !p.bankrupt && p.id !== vote.targetId);
    const yesVotes = otherActivePlayers.filter((p) => vote.votes[p.id] === 'yes');

    elements.kickVoteCountSmall.textContent = t('ui.kickVoteCount', yesVotes.length, otherActivePlayers.length);

    elements.kickVoteVotersSmall.innerHTML = otherActivePlayers.map((player) => {
      const hasVoted = vote.votes[player.id] === 'yes';
      const statusText = hasVoted ? t('ui.kickVotedYes') : t('ui.kickVoteNotVoted');

      return `
        <div class="kick-vote-voter-small-row">
          <span>${escapeHtml(player.name)}: ${escapeHtml(statusText)}</span>
        </div>
      `;
    }).join('');
  }
}

function ensureAuctionTimer() {
  if (!isBankruptcyAuctionActive(game)) {
    document.body.classList.remove('is-auction-active');
    if (auctionTimerId) {
      clearInterval(auctionTimerId);
      auctionTimerId = null;
    }
    return;
  }

  document.body.classList.add('is-auction-active');
  if (auctionTimerId) {
    return;
  }

  auctionTimerId = window.setInterval(() => {
    if (!isBankruptcyAuctionActive(game)) {
      clearInterval(auctionTimerId);
      auctionTimerId = null;
      document.body.classList.remove('is-auction-active');
      render();
      return;
    }
    if (!isLanMode() && advanceBankruptcyAuction(game, Date.now())) {
      render();
      return;
    }
    renderAuctionOverlay({ timerOnly: true });
  }, 200);
}

function renderAuctionOverlay({ timerOnly = false } = {}) {
  const active = isBankruptcyAuctionActive(game);
  if (!elements.auctionOverlay) {
    return;
  }

  elements.auctionOverlay.hidden = !active;
  if (!active || !game.pendingAuction) {
    document.body.classList.remove('is-auction-active');
    return;
  }

  const auction = game.pendingAuction;
  const bankruptPlayer = game.players.find((player) => player.id === auction.bankruptPlayerId);
  const currentLot = auction.lots[auction.currentLotIndex];
  const minimumBid = getMinimumAuctionBid(game);
  const remainingMs = getAuctionLotRemainingMs(game, Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const canBid = canPlaceAuctionBid();

  if (!timerOnly) {
    elements.auctionSubtitle.textContent = t('ui.auctionSubtitle', bankruptPlayer?.name ?? auction.bankruptPlayerId);
    elements.auctionLotLabel.textContent = getAuctionLotLabel(game, currentLot);
    elements.auctionProgressLabel.textContent = t('ui.auctionLotQueue', auction.currentLotIndex + 1, auction.lots.length);
    if (elements.auctionBidderField && elements.auctionBidder) {
      const showBidderSelect = !isLanMode();
      elements.auctionBidderField.hidden = !showBidderSelect;
      if (showBidderSelect) {
        const previous = elements.auctionBidder.value;
        elements.auctionBidder.innerHTML = auction.participantIds.map((playerId) => {
          const player = game.players.find((candidate) => candidate.id === playerId);
          return `<option value="${escapeHtml(playerId)}">${escapeHtml(player?.name ?? playerId)}</option>`;
        }).join('');
        if (auction.participantIds.includes(previous)) {
          elements.auctionBidder.value = previous;
        }
      }
    }
    elements.auctionLotQueue.innerHTML = auction.lots.map((lot, index) => {
      const classes = [
        index === auction.currentLotIndex ? 'is-current' : '',
        index < auction.currentLotIndex ? 'is-done' : '',
      ].filter(Boolean).join(' ');
      return `<li class="${classes}">${escapeHtml(getAuctionLotLabel(game, lot))}</li>`;
    }).join('');
  }

  if (auction.currentBid) {
    const leader = game.players.find((player) => player.id === auction.currentBid.playerId);
    elements.auctionCurrentBid.textContent = t('ui.auctionCurrentBid', `$${formatMoney(auction.currentBid.amount)}`, leader?.name ?? auction.currentBid.playerId);
  } else {
    elements.auctionCurrentBid.textContent = t('ui.auctionNoBidYet', formatMoney(AUCTION_STARTING_BID));
  }
  elements.auctionTimer.textContent = t('ui.auctionTimer', remainingSeconds);
  elements.auctionMinBid.textContent = t('ui.auctionMinBid', formatMoney(minimumBid));

  const canParticipate = isAuctionParticipant();
  if (elements.auctionBidForm) {
    elements.auctionBidForm.hidden = !canParticipate;
  }

  if (!timerOnly && canParticipate) {
    auctionBidBinding?.refreshBounds();
    auctionBidBinding?.setValue(minimumBid);
  }

  if (elements.auctionBidButton) {
    elements.auctionBidButton.disabled = !canBid;
  }
  if (elements.auctionBidAmount) {
    elements.auctionBidAmount.disabled = !canBid;
  }
  if (elements.auctionBidRange) {
    elements.auctionBidRange.disabled = !canBid;
  }

  if (!canParticipate && elements.auctionMinBid) {
    elements.auctionMinBid.textContent = t('ui.auctionSpectator');
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
  const propertyId = elements.contractProperty.value;
  const { fromPlayerId, toPlayerId } = getContractTradeParties();
  if (type === CONTRACT_TYPES.VOTE_SUPPORT) {
    if (!propertyId) {
      throw new Error('没有符合条件的目标地块可绑定合同。');
    }
    const obligorId = elements.contractObligor.value;
    const holderId = resolveContractCounterparty(obligorId, fromPlayerId, toPlayerId);
    if (!holderId) {
      throw new Error('投票义务人必须是本次交易的参与方。');
    }
    return {
      type,
      holderId,
      obligorId,
      targetSpaceId: propertyId,
      stance: elements.contractStance.value,
    };
  }

  if (!propertyId) {
    throw new Error('没有符合条件的目标地块可绑定合同。');
  }
  const ownerId = elements.contractShareOwner.value;
  const holderId = resolveContractCounterparty(ownerId, fromPlayerId, toPlayerId);
  if (!holderId) {
    throw new Error('股份持有人必须是本次交易的参与方。');
  }
  const count = Number(elements.contractShareCount.value || 1);
  const shareRefs = firstEligibleShareRefs(ownerId, propertyId, elements.contractType.value, count);
  if (shareRefs.length < count) {
    throw new Error('该股份持有人没有足够可绑定股份。');
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

function buildTradeAssets(ownerId, side, cashInput, contractInput) {
  return {
    cash: Number(cashInput.value || 0),
    shareRefs: collectTradeShareRefs(ownerId, side),
    contractIds: selectedContractIds(contractInput),
  };
}

function tradeShareSideConfig(side) {
  return side === 'offer'
    ? { list: elements.tradeOfferSharesList, playerId: () => elements.tradeFrom.value }
    : { list: elements.tradeRequestSharesList, playerId: () => elements.tradeTo.value };
}

function ensureTradeShareLines(side) {
  if (tradeShareLineBindings[side].length === 0) {
    addTradeShareLine(side);
  }
}

function addTradeShareLine(side, { propertyId = '', shareCount = 0 } = {}) {
  const { list } = tradeShareSideConfig(side);
  if (!list) return null;
  const lineId = `line-${side}-${Date.now()}-${tradeShareLineBindings[side].length}`;
  const root = document.createElement('div');
  root.className = 'trade-share-line';
  root.dataset.tradeShareLine = lineId;
  root.innerHTML = `
    <label>
      <select data-trade-share-property aria-label="${escapeHtml(t('ui.offerShares'))}"></select>
    </label>
    <label class="range-input-label">
      ${escapeHtml(t('ui.shareCount'))}
      <span class="range-input-group">
        <input data-trade-share-count type="number" min="0" step="1" value="0" />
        <input data-trade-share-range type="range" min="0" max="0" step="1" value="0" aria-label="${escapeHtml(t('ui.shareCount'))}" />
      </span>
    </label>
    <button class="mini-button trade-share-remove" type="button" data-remove-trade-share="${lineId}" aria-label="${escapeHtml(t('ui.removeTradeShare'))}">×</button>
  `;
  list.appendChild(root);
  const propertySelect = root.querySelector('[data-trade-share-property]');
  const countInput = root.querySelector('[data-trade-share-count]');
  const rangeInput = root.querySelector('[data-trade-share-range]');
  const binding = bindRangeAndNumber(rangeInput, countInput, {
    getMin: () => 0,
    getMax: () => {
      const playerId = tradeShareSideConfig(side).playerId();
      const selectedPropertyId = propertySelect.value;
      if (!selectedPropertyId) return 0;
      return getTradeableShareCount(game, selectedPropertyId, playerId);
    },
    getStep: () => 1,
    integer: true,
  });
  const line = { id: lineId, root, propertySelect, binding };
  tradeShareLineBindings[side].push(line);
  propertySelect.addEventListener('change', () => refreshTradeShareLine(side, lineId));
  populateTradeSharePropertySelect(propertySelect, tradeShareSideConfig(side).playerId(), propertyId);
  binding.setValue(shareCount);
  updateTradeShareRemoveButtons(side);
  return line;
}

function removeTradeShareLine(side, lineId) {
  if (tradeShareLineBindings[side].length <= 1) return;
  const index = tradeShareLineBindings[side].findIndex((line) => line.id === lineId);
  if (index === -1) return;
  tradeShareLineBindings[side][index].root.remove();
  tradeShareLineBindings[side].splice(index, 1);
  updateTradeShareRemoveButtons(side);
}

function refreshTradeShareLine(side, lineId) {
  const line = tradeShareLineBindings[side].find((candidate) => candidate.id === lineId);
  if (!line) return;
  populateTradeSharePropertySelect(line.propertySelect, tradeShareSideConfig(side).playerId(), line.propertySelect.value);
  line.binding.refreshBounds();
}

function refreshTradeShareLines(side) {
  for (const line of tradeShareLineBindings[side]) {
    populateTradeSharePropertySelect(line.propertySelect, tradeShareSideConfig(side).playerId(), line.propertySelect.value);
    line.binding.refreshBounds();
  }
  updateTradeShareRemoveButtons(side);
}

function updateTradeShareRemoveButtons(side) {
  const canRemove = tradeShareLineBindings[side].length > 1;
  for (const line of tradeShareLineBindings[side]) {
    const button = line.root.querySelector('[data-remove-trade-share]');
    if (button) button.disabled = !canRemove;
  }
}

function populateTradeSharePropertySelect(select, playerId, selectedValue) {
  const holdings = getPlayerPropertyHoldings(game, playerId)
    .filter((holding) => getTradeableShareCount(game, holding.propertyId, playerId) > 0);
  if (holdings.length === 0) {
    select.innerHTML = '<option value="">无股份</option>';
    select.value = '';
    return;
  }
  const value = selectedValue && holdings.some((holding) => holding.propertyId === selectedValue)
    ? selectedValue
    : holdings[0].propertyId;
  select.innerHTML = holdings
    .map((holding) => {
      const tradeableCount = getTradeableShareCount(game, holding.propertyId, playerId);
      return `<option value="${holding.propertyId}">${escapeHtml(holding.property.name)} · 可交易 ${tradeableCount * SHARE_PERCENT}%</option>`;
    })
    .join('');
  select.value = value;
}

function collectTradeShareRefs(ownerId, side) {
  const countsByProperty = new Map();
  for (const line of tradeShareLineBindings[side]) {
    const propertyId = line.propertySelect.value;
    const shareCount = line.binding.getValue();
    if (!propertyId || shareCount <= 0) continue;
    countsByProperty.set(propertyId, (countsByProperty.get(propertyId) ?? 0) + shareCount);
  }
  const shareRefs = [];
  for (const [propertyId, shareCount] of countsByProperty) {
    shareRefs.push(...getTradeableShareRefs(game, ownerId, propertyId, shareCount));
  }
  return shareRefs;
}

function firstEligibleShareRefs(playerId, propertyId, contractType, count) {
  if (!propertyId || count <= 0) return [];
  const property = game.board.find((space) => space.id === propertyId);
  return eligibleSharesForContract(playerId, propertyId, contractType)
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

function populateTradePartySelect(select, fromPlayerId, toPlayerId, selectedValue) {
  const parties = [fromPlayerId, toPlayerId].filter((playerId, index, list) => list.indexOf(playerId) === index);
  if (parties.length === 0) {
    select.innerHTML = '<option value="">无交易参与方</option>';
    select.value = '';
    return;
  }
  const value = selectedValue && parties.includes(selectedValue) ? selectedValue : parties[0];
  select.innerHTML = parties
    .map((playerId) => {
      const player = game.players.find((candidate) => candidate.id === playerId);
      return `<option value="${playerId}">${escapeHtml(player?.name ?? playerId)}</option>`;
    })
    .join('');
  select.value = value;
}

function eligibleSharesForContract(playerId, propertyId, contractType) {
  const property = game.board.find((space) => space.id === propertyId);
  if (!property || property.type !== 'property') return [];
  return property.shares.filter((share) => {
    if (share.ownerId !== playerId) return false;
    return !share.encumbranceContractIds.some((contractId) => {
      const contract = game.contracts.find((candidate) => candidate.id === contractId);
      return contract?.status === 'active' && contract.type === contractType;
    });
  });
}

function getEligibleContractProperties(contractType, shareOwnerId, obligorId) {
  const properties = game.board.filter((space) => space.type === 'property');
  if (contractType === CONTRACT_TYPES.VOTE_SUPPORT) {
    return properties.filter((property) => getPlayerShareCount(game, property.id, obligorId) > 0);
  }
  return properties.filter((property) => eligibleSharesForContract(shareOwnerId, property.id, contractType).length > 0);
}

function populateContractPropertySelect(select, contractType, shareOwnerId, obligorId, selectedValue) {
  const properties = getEligibleContractProperties(contractType, shareOwnerId, obligorId);
  if (properties.length === 0) {
    select.innerHTML = '<option value="">无可选地块</option>';
    select.value = '';
    return;
  }
  const value = selectedValue && properties.some((property) => property.id === selectedValue)
    ? selectedValue
    : properties[0].id;
  select.innerHTML = properties
    .map((property) => {
      if (contractType === CONTRACT_TYPES.VOTE_SUPPORT) {
        const shareCount = getPlayerShareCount(game, property.id, obligorId);
        return `<option value="${property.id}">${escapeHtml(property.name)} · ${shareCount * SHARE_PERCENT}%</option>`;
      }
      const eligibleCount = eligibleSharesForContract(shareOwnerId, property.id, contractType).length;
      return `<option value="${property.id}">${escapeHtml(property.name)} · 可绑定 ${eligibleCount} 股</option>`;
    })
    .join('');
  select.value = value;
}

function updateContractShareCountLimit() {
  if (!elements.contractShareCount) return;
  if (elements.contractType.value === CONTRACT_TYPES.VOTE_SUPPORT) {
    return;
  }
  const ownerId = elements.contractShareOwner.value;
  const propertyId = elements.contractProperty.value;
  const eligibleCount = propertyId
    ? eligibleSharesForContract(ownerId, propertyId, elements.contractType.value).length
    : 0;
  const max = Math.max(eligibleCount, 1);
  elements.contractShareCount.max = String(max);
  const current = Number(elements.contractShareCount.value || 1);
  if (eligibleCount === 0) {
    elements.contractShareCount.value = '1';
    return;
  }
  if (current < 1 || current > eligibleCount) {
    elements.contractShareCount.value = String(Math.min(eligibleCount, Math.max(current, 1)));
  }
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
  const holders = getPropertyShareholders(game, property.id, { includeBank: true })
    .sort((left, right) => right.shareCount - left.shareCount || left.playerId.localeCompare(right.playerId));
  if (!holders.length) return '';

  const legendRows = holders.map((holder) => {
    const name = holder.playerId === BANK_ID ? t('entity.bank') : playerName(holder.playerId);
    const color = holderColor(holder.playerId);
    return `
      <li class="share-legend-item">
        <span class="share-legend-swatch" style="background: ${color}"></span>
        <span class="share-legend-name">${escapeHtml(name)}</span>
        <span class="share-legend-percent">${holder.percent}%</span>
      </li>
    `;
  }).join('');

  return `
    <div class="share-distribution">
      <p class="share-distribution-label">${escapeHtml(t('ui.shareDistribution'))}</p>
      <div class="share-bar" aria-hidden="true">
        ${holders.map((holder) => `<span class="share-segment" style="flex: ${holder.shareCount}; background: ${holderColor(holder.playerId)}"></span>`).join('')}
      </div>
      <ul class="share-legend">${legendRows}</ul>
    </div>
  `;
}

function holderColor(playerId) {
  if (playerId === BANK_ID) return bankColor;
  const index = game.players.findIndex((player) => player.id === playerId);
  return playerColors[index] ?? 'var(--accent)';
}

function squareCompactMarkup(space) {
  if (space.type === 'start') {
    return `
      <h3 class="square-name">${escapeHtml(cityName(space))}</h3>
      <p class="square-price muted">${escapeHtml(t('ui.passBonusMeta', formatMoney(space.bonus)))}</p>
    `;
  }
  return `
    <h3 class="square-name">${escapeHtml(cityName(space))}</h3>
    <p class="square-price">$${formatMoney(space.price)}</p>
  `;
}

function squareDetailMarkup(space, placement) {
  const rentRows = space.rent.map((rent, index) => {
    const label = index === 0 ? t('ui.rentVacant') : t('ui.rentHouses', index);
    const activeClass = index === (space.houses ?? 0) ? ' is-active' : '';
    return `<li class="square-rent-row${activeClass}"><span>${escapeHtml(label)}</span><span>$${formatMoney(rent)}</span></li>`;
  }).join('');
  return `
    <div class="square-detail detail-${placement}" role="tooltip">
      <p class="square-detail-cost">$${formatMoney(space.price)} · ${escapeHtml(t('ui.houseCostLabel', formatMoney(space.houseCost)))}</p>
      ${shareBarMarkup(space)}
      <ul class="square-rent-table">${rentRows}</ul>
    </div>
  `;
}

function squareDetailPlacement(grid) {
  const side = BOARD_SIDE_LENGTH;
  if (grid.row === 1) return 'below';
  if (grid.row === side) return 'above';
  if (grid.column === side) return 'left';
  if (grid.column === 1) return 'right';
  return 'above';
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

function contractNames(contractIds) {
  return contractIds
    .map((contractId) => {
      const contract = game.contracts.find((candidate) => candidate.id === contractId);
      return contract ? getContractDisplayName(game, contract) : null;
    })
    .filter(Boolean);
}

function assetSummary(assets) {
  const parts = [];
  if (assets.cash) parts.push(`现金 $${formatMoney(assets.cash)}`);
  if (assets.shareRefs?.length) {
    const grouped = new Map();
    for (const shareRef of assets.shareRefs) {
      grouped.set(shareRef.spaceId, (grouped.get(shareRef.spaceId) ?? 0) + 1);
    }
    const shareParts = [...grouped.entries()].map(([spaceId, count]) => {
      const property = game.board.find((space) => space.id === spaceId);
      const label = property ? property.name : spaceId;
      return `${label} ${count * SHARE_PERCENT}%`;
    });
    parts.push(`股份 ${shareParts.join('、')}`);
  }
  const names = contractNames(assets.contractIds ?? []);
  if (names.length) parts.push(`合同 ${names.join('、')}`);
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

function roundToStep(value, step) {
  if (!Number.isFinite(value)) return 0;
  if (step >= 1) return Math.round(value);
  const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function bindRangeAndNumber(range, number, {
  getMin = () => 0,
  getMax = () => 0,
  getStep = () => 1,
  integer = false,
  onUpdate,
} = {}) {
  if (!range || !number) {
    return {
      refreshBounds() {},
      setValue() {},
      getValue: () => 0,
    };
  }

  let syncing = false;

  function applyBounds() {
    const min = getMin();
    const max = Math.max(min, getMax());
    const step = getStep();
    const bounds = { min, max, step };
    for (const input of [range, number]) {
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
    }
    return bounds;
  }

  function normalize(raw, min, max, step) {
    let value = Number(raw);
    if (!Number.isFinite(value)) value = min;
    value = clamp(value, min, max);
    value = roundToStep(value, step);
    if (integer) value = Math.round(value);
    return value;
  }

  function setValue(raw, source) {
    const { min, max, step } = applyBounds();
    const normalized = normalize(raw, min, max, step);
    syncing = true;
    const display = String(normalized);
    number.value = display;
    range.value = display;
    syncing = false;
    onUpdate?.(normalized, source);
    return normalized;
  }

  function handleInput(source, raw) {
    if (syncing) return;
    setValue(raw, source);
  }

  range.addEventListener('input', () => handleInput('range', range.value));
  number.addEventListener('input', () => handleInput('number', number.value));
  number.addEventListener('change', () => handleInput('number', number.value));

  return {
    refreshBounds() {
      setValue(number.value || range.value || getMin(), 'refresh');
    },
    setValue(value) {
      return setValue(value, 'set');
    },
    getValue() {
      return Number(number.value || 0);
    },
  };
}

function initRangeBindings() {
  sharePurchaseBinding = bindRangeAndNumber(elements.shareCountRange, elements.shareCount, {
    getMin: () => 1,
    getMax: () => game.pendingOffer?.maxShareCount ?? 1,
    getStep: () => 1,
    integer: true,
    onUpdate: () => renderSharePurchasePreview(),
  });

  tradeOfferCashBinding = bindRangeAndNumber(elements.tradeOfferCashRange, elements.tradeOfferCash, {
    getMin: () => 0,
    getMax: () => Math.max(0, game.players.find((player) => player.id === elements.tradeFrom.value)?.cash ?? 0),
    getStep: () => 0.1,
  });

  tradeRequestCashBinding = bindRangeAndNumber(elements.tradeRequestCashRange, elements.tradeRequestCash, {
    getMin: () => 0,
    getMax: () => Math.max(0, game.players.find((player) => player.id === elements.tradeTo.value)?.cash ?? 0),
    getStep: () => 0.1,
  });

  auctionBidBinding = bindRangeAndNumber(elements.auctionBidRange, elements.auctionBidAmount, {
    getMin: () => getMinimumAuctionBid(game),
    getMax: () => {
      const playerId = getCurrentAuctionBidderId();
      const player = playerId ? game.players.find((candidate) => candidate.id === playerId) : null;
      return Math.max(getMinimumAuctionBid(game), player?.cash ?? getMinimumAuctionBid(game));
    },
    getStep: () => 0.1,
    onUpdate: () => {},
  });
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

// Player token grid-by-grid movement animation and management
function ensurePlayerTokenWrappers() {
  const boardEl = elements.board;
  if (!boardEl) return;

  if (game !== lastGameInstance) {
    const isBrandNewGame = !game.lastDice && game.round === 1 && game.turn === 0 && game.phase === 'roll';
    const trackedKeys = Object.keys(playerTokenPositions);
    const gamePlayerIds = game.players.map(p => p.id);
    const playersMismatch = trackedKeys.length !== gamePlayerIds.length || !gamePlayerIds.every(id => trackedKeys.includes(id));

    if (isBrandNewGame || playersMismatch) {
      boardEl.querySelectorAll('.player-token-wrapper').forEach((el) => el.remove());
      for (const key in playerTokenPositions) {
        delete playerTokenPositions[key];
      }
    }
    lastGameInstance = game;
  }

  game.players.forEach((player) => {
    if (!playerTokenPositions[player.id]) {
      playerTokenPositions[player.id] = {
        current: player.position,
        target: player.position,
        animating: false
      };
    } else {
      playerTokenPositions[player.id].target = player.position;
    }
  });

  game.players.forEach((player, index) => {
    let wrapper = document.getElementById(`player-token-wrapper-${player.id}`);
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = `player-token-wrapper-${player.id}`;
      wrapper.className = 'player-token-wrapper';
      wrapper.innerHTML = `<span class="token" style="background: ${playerColors[index]}">${index + 1}</span>`;
      boardEl.appendChild(wrapper);
    }

    const state = playerTokenPositions[player.id];
    const grid = gridPosition(state.current);
    wrapper.style.gridColumn = String(grid.column);
    wrapper.style.gridRow = String(grid.row);
    wrapper.hidden = player.bankrupt;
  });

  updateTokenOverlapOffsets();

  // Start animations for any players that need it
  game.players.forEach((player) => {
    const state = playerTokenPositions[player.id];
    if (state && state.current !== state.target && !state.animating && !player.bankrupt) {
      animatePlayerToNextStep(player.id);
    }
  });
}

function updateTokenOverlapOffsets() {
  const counts = {}; // index -> array of playerIds
  for (const playerId in playerTokenPositions) {
    const player = game.players.find(p => p.id === playerId);
    if (player && player.bankrupt) continue;
    const pos = playerTokenPositions[playerId].current;
    counts[pos] ??= [];
    counts[pos].push(playerId);
  }

  for (const pos in counts) {
    const playerIds = counts[pos];
    playerIds.sort();
    playerIds.forEach((playerId, index) => {
      const token = document.querySelector(`#player-token-wrapper-${playerId} .token`);
      if (token) {
        token.style.setProperty('--overlap-offset', `${index * 22}px`);
      }
    });
  }
}

async function animatePlayerToNextStep(playerId) {
  const state = playerTokenPositions[playerId];
  if (!state || state.current === state.target || state.animating) {
    return;
  }

  state.animating = true;

  while (state.current !== state.target) {
    if (!state.animating) {
      break;
    }

    const prevPos = state.current;
    const nextPos = (prevPos + 1) % game.board.length;
    state.current = nextPos;

    await moveTokenDomOneStep(playerId, prevPos, nextPos);
  }

  state.animating = false;
  render();
}

function moveTokenDomOneStep(playerId, prevPos, nextPos) {
  return new Promise((resolve) => {
    const wrapper = document.getElementById(`player-token-wrapper-${playerId}`);
    if (!wrapper) {
      resolve();
      return;
    }

    // 1. First: Get current screen rect
    const rectA = wrapper.getBoundingClientRect();

    // 2. Last: Move in DOM
    const grid = gridPosition(nextPos);
    wrapper.style.gridColumn = String(grid.column);
    wrapper.style.gridRow = String(grid.row);

    // Update the overlap offset for the new positions
    updateTokenOverlapOffsets();

    // Get the new rect after grid repositioning
    const rectB = wrapper.getBoundingClientRect();

    // 3. Invert: apply transform translation
    const dx = rectA.left - rectB.left;
    const dy = rectA.top - rectB.top;

    wrapper.style.transition = 'none';
    wrapper.style.transform = `translate(${dx}px, ${dy}px)`;

    // Force a reflow
    wrapper.offsetHeight;

    // 4. Play: Transition to target offset (0, 0)
    wrapper.style.transition = 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1)';
    wrapper.style.transform = 'translate(0px, 0px)';

    setTimeout(() => {
      resolve();
    }, 300);
  });
}

function skipAllAnimations() {
  for (const playerId in playerTokenPositions) {
    const state = playerTokenPositions[playerId];
    state.current = state.target;
    state.animating = false;

    const wrapper = document.getElementById(`player-token-wrapper-${playerId}`);
    if (wrapper) {
      const grid = gridPosition(state.current);
      wrapper.style.gridColumn = String(grid.column);
      wrapper.style.gridRow = String(grid.row);
      wrapper.style.transition = 'none';
      wrapper.style.transform = 'translate(0px, 0px)';
    }
  }
  updateTokenOverlapOffsets();
}

let lastKnownPlayerCash = {};

function checkAndAnimatePlayerCash() {
  if (!game || !game.players) return;

  const isBrandNewGame = !game.lastDice && game.round === 1 && game.turn === 0 && game.phase === 'roll';

  game.players.forEach((player) => {
    const prevCash = lastKnownPlayerCash[player.id];
    const currentCash = player.cash;

    if (isBrandNewGame) {
      lastKnownPlayerCash[player.id] = currentCash;
      return;
    }

    if (prevCash !== undefined && prevCash !== currentCash) {
      const diff = currentCash - prevCash;
      if (diff !== 0) {
        animateCashChange(player.id, diff);
      }
    }

    lastKnownPlayerCash[player.id] = currentCash;
  });
}

function animateCashChange(playerId, diff) {
  const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
  if (!playerCard) return;

  const badge = playerCard.querySelector('.player-cash-badge');
  if (!badge) return;

  const rect = badge.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + window.scrollY;

  const popup = document.createElement('span');
  popup.className = `cash-animation-popup ${diff > 0 ? 'positive' : 'negative'}`;
  popup.textContent = (diff > 0 ? '+' : '') + formatMoney(diff);
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;

  document.body.appendChild(popup);

  popup.addEventListener('animationend', () => {
    popup.remove();
  });
}

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playAudioTone(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'turnEnd') {
      // Sound 1: Turn ended, next is not me (gentle double beep, e.g. D5 then B4)
      const notes = [587.33, 493.88];
      const durations = [0.08, 0.12];
      const startOffsets = [0, 0.08];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffsets[index]);

        const noteStart = now + startOffsets[index];
        const noteDuration = durations[index];

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.01);
        gain.gain.setValueAtTime(0.08, noteStart + noteDuration - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } else if (type === 'turnStart') {
      // Sound 2: My turn starts (bright ascending chime: C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const delays = [0, 0.07, 0.14, 0.21];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delays[index]);

        const noteStart = now + delays[index];
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    }
  } catch (e) {
    console.warn('Failed to play audio tone:', e);
  }
}

function playTurnSound(prevTurnIndex, nextTurnIndex) {
  if (!game || !game.players) return;
  const prevPlayer = game.players[prevTurnIndex];
  const nextPlayer = game.players[nextTurnIndex];
  if (!prevPlayer || !nextPlayer) return;

  if (isLanMode()) {
    const myPlayerId = networkSession.playerId;
    // Condition: Other player's turn ends (prevPlayer is not local player)
    if (prevPlayer.id !== myPlayerId) {
      if (nextPlayer.id === myPlayerId) {
        // Next player is local player
        playAudioTone('turnStart');
      } else {
        // Next player is not local player
        playAudioTone('turnEnd');
      }
    }
  } else {
    // Local mode: only play Sound 1
    playAudioTone('turnEnd');
  }
}

