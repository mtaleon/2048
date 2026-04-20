/**
 * Console Input - Keyboard handling for terminal
 */

import { DIRECTIONS } from '../../core/constants.js';

export class ConsoleInput {
  constructor() {
    this.game = null;
    this.handleKeypress = this.handleKeypress.bind(this);
  }

  /**
   * Initialize input handling
   */
  initialize(game) {
    this.game = game;

    // Setup raw mode to capture keypresses
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', this.handleKeypress);

    // Resume stdin (it's paused by default)
    process.stdin.resume();
  }

  /**
   * Handle keypress events
   */
  handleKeypress(key) {
    // Ctrl+C to exit
    if (key === '\u0003') {
      this.cleanup();
      process.exit(0);
    }

    // Check if game is locked
    if (this.game.inputLocked) {
      return;
    }

    // Arrow keys and WASD
    switch (key) {
      // Arrow keys
      case '\u001b[A': // Up arrow
      case 'w':
      case 'W':
        this.game.move(DIRECTIONS.UP);
        break;

      case '\u001b[B': // Down arrow
      case 's':
      case 'S':
        this.game.move(DIRECTIONS.DOWN);
        break;

      case '\u001b[D': // Left arrow
      case 'a':
      case 'A':
        this.game.move(DIRECTIONS.LEFT);
        break;

      case '\u001b[C': // Right arrow
      case 'd':
      case 'D':
        this.game.move(DIRECTIONS.RIGHT);
        break;

      // Restart
      case 'r':
      case 'R':
        this.game.start();
        break;

      // Quit
      case 'q':
      case 'Q':
        this.cleanup();
        console.log('\nThanks for playing!\n');
        process.exit(0);
        break;
    }
  }

  /**
   * Enable input handling
   */
  enable() {
    // Input is always enabled in console mode
  }

  /**
   * Disable input handling
   */
  disable() {
    // Input is always enabled in console mode
  }

  /**
   * Cleanup input resources
   */
  cleanup() {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    process.stdin.removeListener('data', this.handleKeypress);
  }
}
