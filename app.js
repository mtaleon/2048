import { Game } from './core/game.js';
import { EventBus } from './core/events.js';
import { DIRECTIONS } from './core/constants.js';

import { Platform } from './platform/platform.js';
import { WebDOMRenderer } from './platforms/web-dom/renderer.js';
import { WebDOMInput } from './platforms/web-dom/input.js';
import { WebDOMAudio } from './platforms/web-dom/audio.js';
import { WebDOMUI } from './platforms/web-dom/ui.js';

// Fix #1: Storage adapter for web platform (uses localStorage)
class LocalStorageAdapter {
  getItem(key) {
    return localStorage.getItem(key);
  }

  setItem(key, value) {
    localStorage.setItem(key, value);
  }
}

// Create platform components
const renderer = new WebDOMRenderer();
const input = new WebDOMInput();
const audio = new WebDOMAudio();
const ui = new WebDOMUI();
const platform = new Platform(renderer, input, audio);

// Create event bus
const eventBus = new EventBus();

// Create storage adapter and game (Fix #1: inject storage)
const storage = new LocalStorageAdapter();
const game = new Game(eventBus, 4, storage);  // Default browser animation delay

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

eventBus.on('game:won', ({ score, moves }) => {
  audio.playSound('win');
  setTimeout(() => {
    ui.showWinModal(score, moves);
  }, 500);
});

eventBus.on('game:lost', ({ score }) => {
  audio.playSound('lose');
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

// Start game
game.start();

// Debug: expose game to console
window.game = game;
window.DIRECTIONS = DIRECTIONS;

console.log('2048 Game loaded! Use window.game for debugging.');
console.log('Controls: Arrow keys or WASD to move tiles');
