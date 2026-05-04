import { Game } from './core/game.js';
import { EventBus } from './core/events.js';
import { DIRECTIONS } from './core/constants.js';

import { Platform } from './platform/platform.js';
import { WebDOMRenderer } from './platforms/web-dom/renderer.js';
import { WebDOMInput } from './platforms/web-dom/input.js';
import { WebDOMAudio } from './platforms/web-dom/audio.js';
import { WebDOMUI } from './platforms/web-dom/ui.js';

// 0. Capacitor polyfill for web mode
// In web mode, Capacitor is not available, so provide a minimal polyfill
const Capacitor = window.Capacitor || {
  isNativePlatform: () => false,
  getPlatform: () => 'web'
};

// 0a. Define Android-only detection (⚠️ CRITICAL FIX #22)
// Must use both checks to exclude iOS
const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// v1.0 canonical defaults (match plan: score+OTA+banner ON, interstitial OFF)
const DEFAULT_CONFIG = {
  features: {
    score_submission: true,
    ota_updates: true,
    admob: true,
    interstitial_ads: false,
  },
  workerUrl: 'https://api.octile.eu.cc',
  siteUrl: 'https://2048.octile.eu.cc/',
  scoreQueueRetryMs: 35000,
  debug: false,
};

/**
 * Load configuration with fallback to defaults
 * Runtime platform override for Web/PWA to match Feature Matrix semantics
 */
async function loadConfig() {
  let config = DEFAULT_CONFIG;
  try {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (res.ok) {
      config = await res.json();
    } else {
      console.warn('config.json fetch non-200, using defaults:', res.status);
    }
  } catch (e) {
    console.warn('Config fetch failed, using defaults:', e);
  }

  // Runtime platform override to match Feature Matrix semantics
  // Web/PWA: core-only, no analytics/OTA/ads
  if (!isAndroidNative) {
    config.features.score_submission = false;
    config.features.ota_updates = false;
    config.features.admob = false;
    config.features.interstitial_ads = false;
  }

  return config;
}

// Fix #1: Storage adapter for web platform (uses localStorage)
class LocalStorageAdapter {
  getItem(key) {
    return localStorage.getItem(key);
  }

  setItem(key, value) {
    localStorage.setItem(key, value);
  }
}

/**
 * Bootstrap application with all systems
 */
async function bootstrap() {
  // Load configuration
  const config = await loadConfig();
  window.config = config;

  console.log('2048 starting...', {
    platform: Capacitor.getPlatform(),
    isAndroidNative,
    features: config.features
  });

  // Create event bus
  const eventBus = new EventBus();

  // Create platform components
  const renderer = new WebDOMRenderer();
  const input = new WebDOMInput();
  const audio = new WebDOMAudio();
  const ui = new WebDOMUI(eventBus);
  const platform = new Platform(renderer, input, audio);

  // Create storage adapter and game
  const storage = new LocalStorageAdapter();
  const game = new Game(eventBus, 4, storage);

  // 1. Initialize i18n (always)
  const { applyLanguage, getInitialLanguage } = await import('./core/i18n.js');
  const initialLang = getInitialLanguage();
  applyLanguage(initialLang);

  // 2. Initialize AdMob (Android only)
  if (config.features.admob && isAndroidNative) {
    try {
      const { AdMobManager } = await import('./core/AdMobManager.js');
      const { AdMobPlatform } = await import('./platform/AdMobPlatform.js');
      window.adMobManager = new AdMobManager(eventBus, config);
      await window.adMobManager.initialize(); // Consent-gated banner inside
      console.log('AdMob initialized');
    } catch (e) {
      console.error('AdMob initialization failed:', e);
    }
  }

  // 3. Score submission (Android only)
  let submitScore; // Declare for use in event handlers
  if (config.features.score_submission && isAndroidNative) {
    try {
      const api = await import('./core/api.js');
      const { getBrowserUUID } = await import('./core/uuid.js');
      const health = await import('./core/health.js');

      api.applyConfig(config);
      health.applyConfig(config);
      submitScore = api.submitScore;

      // Check backend health on startup
      health.refreshBackendStatus().then(ok => {
        console.log('Backend health check:', ok ? 'online' : 'offline');
      });

      // Start periodic health polling (every 10 minutes)
      health.startHealthPoll();

      // Flush queue on network reconnection
      window.addEventListener('online', api.flushQueue);

      console.log('Score submission enabled');
    } catch (e) {
      console.error('Score API initialization failed:', e);
    }
  }

  // 4. OTA (Android only) — delayed check
  if (config.features.ota_updates && isAndroidNative) {
    try {
      const { checkForUpdate, applyOtaConfig } = await import('./core/ota.js');
      applyOtaConfig(config);
      setTimeout(checkForUpdate, 3000); // Check 3 seconds after startup
      console.log('OTA update check scheduled');
    } catch (e) {
      console.error('OTA initialization failed:', e);
    }
  }

  // Wire up event listeners (platform responds to core events)
  eventBus.on('game:started', ({ board, score }) => {
    renderer.renderBoard(board);
    renderer.updateScore(score, game.bestScore);
  });

  eventBus.on('tiles:moved', ({ tiles, merges, score }) => {
    renderer.animateMove(tiles);

    // Play merge sound and animate merges
    if (merges.length > 0) {
      setTimeout(() => {
        renderer.animateMerge(merges);
        audio.playSound('merge');
      }, 100);
    } else {
      audio.playSound('move');
    }

    renderer.updateScore(score, game.bestScore);
  });

  eventBus.on('tile:spawned', ({ tile }) => {
    renderer.animateSpawn(tile);
    audio.playSound('spawn');
  });

  eventBus.on('game:won', async ({ score, moves }) => {
    audio.playSound('win');

    // Wait for ad (max 5s) - v1.0: interstitial_ads: false, so this skips quickly
    if (window.adMobManager && config.features.interstitial_ads) {
      try {
        await window.adMobManager.onGameCompleted();
      } catch (e) {
        console.warn('Ad display failed:', e);
      }
    }

    setTimeout(() => {
      ui.showWinModal(score, moves);
    }, 500);
  });

  eventBus.on('game:lost', async ({ score }) => {
    audio.playSound('lose');

    // Wait for ad (max 5s) - v1.0: interstitial_ads: false
    if (window.adMobManager && config.features.interstitial_ads) {
      try {
        await window.adMobManager.onGameCompleted();
      } catch (e) {
        console.warn('Ad display failed:', e);
      }
    }

    // Submit score (Android only) ⚠️ TRIPLE GUARD REQUIRED
    // 1. Config flag enabled
    // 2. Android platform only (not iOS, not Web)
    // 3. Function exists (defensive check)
    if (
      window.config?.features?.score_submission &&
      isAndroidNative &&
      typeof submitScore === 'function'
    ) {
      try {
        const { getBrowserUUID } = await import('./core/uuid.js');
        submitScore({
          final_score: game.score,
          max_tile: game.board.getMaxTile(),
          moves: game.telemetry.moves,
          time_seconds: Math.floor((Date.now() - game.telemetry.startTime) / 1000),
          browser_uuid: getBrowserUUID(),
          timestamp_utc: new Date().toISOString(),
          ota_version_code: window.otaVersion || 0,
          platform: Capacitor.getPlatform(),
        });
      } catch (e) {
        console.warn('Score submission failed:', e);
      }
    }

    setTimeout(() => {
      ui.showLoseModal(score);
    }, 500);
  });

  eventBus.on('move:invalid', () => {
    audio.playSound('invalid');
  });

  // Initialize platform
  platform.initialize(game, document.getElementById('game-container'));

  // Initialize UI
  ui.initialize();
  ui.setAudio(audio);
  ui.updateMuteButton();

  // Wire up UI controls
  ui.onNewGame(() => game.start());
  ui.onContinue(() => game.continuePlaying());

  // Update best score display on initial load (before game starts)
  renderer.updateScore(0, game.bestScore);

  // 5. Start game
  game.start();

  // Debug: expose game to console
  window.game = game;
  window.DIRECTIONS = DIRECTIONS;

  console.log('2048 Game loaded! Use window.game for debugging.');
  console.log('Controls: Arrow keys or WASD to move tiles');
}

// Start bootstrap
bootstrap().catch((e) => {
  console.error('Bootstrap failed:', e);
  alert('Failed to start game. Please refresh the page.');
});
