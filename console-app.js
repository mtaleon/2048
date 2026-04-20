#!/usr/bin/env node

/**
 * Console Application Entry Point
 * Runs the 2048 game in terminal with pretty Unicode borders
 */

import { EventBus } from './core/events.js';
import { Game } from './core/game.js';
import { Platform } from './platform/platform.js';
import { ConsoleRenderer } from './platforms/console/renderer.js';
import { ConsoleInput } from './platforms/console/input.js';
import { ConsoleAudio } from './platforms/console/audio.js';

// Storage adapter for localStorage-like behavior in Node.js
class FileStorage {
  constructor() {
    this.data = {};
    // In a real implementation, you could persist to a file
    // For now, just use in-memory storage
  }

  getItem(key) {
    return this.data[key] || null;
  }

  setItem(key, value) {
    this.data[key] = value;
  }
}

// Initialize platform
const eventBus = new EventBus();
const renderer = new ConsoleRenderer();
const input = new ConsoleInput();
const audio = new ConsoleAudio();
const storage = new FileStorage();

const platform = new Platform(renderer, input, audio);

// Create game instance (0ms animation delay for instant console rendering)
const game = new Game(eventBus, 4, storage, 0);

// Wire up event listeners
eventBus.on('game:started', () => {
  renderer.renderBoard(game.board);
  renderer.updateScore(game.score, game.bestScore);
});

eventBus.on('tiles:moved', () => {
  renderer.renderBoard(game.board);
  renderer.updateScore(game.score, game.bestScore);
});

eventBus.on('tile:spawned', () => {
  renderer.renderBoard(game.board);
});

eventBus.on('game:won', () => {
  renderer.renderBoard(game.board);
  renderer.updateScore(game.score, game.bestScore);
  renderer.showGameOver(true);
});

eventBus.on('game:lost', () => {
  renderer.renderBoard(game.board);
  renderer.updateScore(game.score, game.bestScore);
  renderer.showGameOver(false);
});

eventBus.on('move:invalid', () => {
  // No visual feedback for invalid moves in console
});

// Initialize platform components
renderer.initialize();
input.initialize(game);
audio.initialize();

// Start the game
game.start();

// Handle cleanup on exit
process.on('SIGINT', () => {
  input.cleanup();
  renderer.cleanup();
  console.log('\n\nThanks for playing!\n');
  process.exit(0);
});

process.on('exit', () => {
  renderer.cleanup();
});
