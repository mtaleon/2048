import { Board } from './board.js';
import { GAME_CONFIG, SeededRandom, sleep } from './constants.js';

/**
 * In-memory storage (default for core - keeps it pure)
 * Fix #1: Storage adapter pattern
 */
export class InMemoryStorage {
  constructor() {
    this.data = {};
  }

  getItem(key) {
    return this.data[key] || null;
  }

  setItem(key, value) {
    this.data[key] = value;
  }
}

/**
 * Game class managing game lifecycle, score, and win/lose detection
 * Fix #1: Accepts storage adapter (no direct localStorage)
 * Fix #2: Async move() with injected animationDelay for clean testing
 */
export class Game {
  constructor(eventBus, size = GAME_CONFIG.gridSize, storage = null, animationDelay = GAME_CONFIG.animationDuration) {
    this.board = null;
    this.size = size;
    this.score = 0;
    this.won = false;
    this.lost = false;
    this.inputLocked = false;
    this.keepPlaying = false;  // Continue after winning

    // Fix #1: Storage adapter (defaults to in-memory)
    this.storage = storage || new InMemoryStorage();
    this.bestScore = this._loadBestScore();

    // Fix #2: Inject animation delay (0 for tests, 200 for browser)
    this.animationDelay = animationDelay;

    // Event bus for platform communication
    this.events = eventBus;

    // Seeded RNG for reproducible games
    this.seed = null;
    this.rng = null;

    // Telemetry
    this.telemetry = {
      moves: 0,
      mergeCount: 0,
      maxTile: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Start new game
   * @param {object} options - { seed: number } for reproducible games
   */
  start(options = {}) {
    this.seed = options.seed || null;
    this.rng = this.seed ? new SeededRandom(this.seed) : null;

    this.board = new Board(this.size);
    this.score = 0;
    this.won = false;
    this.lost = false;
    this.keepPlaying = false;
    this.inputLocked = false;

    // Spawn initial tiles
    this.board.addRandomTile(this.rng);
    this.board.addRandomTile(this.rng);

    // Reset telemetry
    this.telemetry = {
      moves: 0,
      mergeCount: 0,
      maxTile: 0,
      startTime: Date.now(),
      endTime: null
    };

    this.events.emit('game:started', {
      board: this.board,
      score: this.score
    });
  }

  /**
   * Move tiles in direction
   * Fix #2: Async with injected delay for clean testing
   * Fix #4: Calls board.prepareTiles() before move
   *
   * @param {object} direction - { dx, dy } from DIRECTIONS
   */
  async move(direction) {
    if (this.inputLocked || (this.won && !this.keepPlaying) || this.lost) {
      return;
    }

    // Fix #4: Save previous positions BEFORE move (for animations)
    this.board.prepareTiles();

    const { moved, merges } = this.board.move(direction);
    if (!moved) {
      this.events.emit('move:invalid');
      return;
    }

    this.inputLocked = true;

    // Calculate score
    let moveScore = 0;
    merges.forEach(merge => {
      moveScore += merge.tile.value;
      this.telemetry.mergeCount++;
    });
    this.score += moveScore;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this._saveBestScore();
    }

    // Update max tile
    const maxTile = Math.max(...this.board.tiles.map(t => t.value), 0);
    if (maxTile > this.telemetry.maxTile) {
      this.telemetry.maxTile = maxTile;
    }

    this.telemetry.moves++;

    this.events.emit('tiles:moved', {
      tiles: this.board.tiles,
      merges,
      score: this.score,
      moveScore
    });

    // Wait for animation (can be 0 in tests)
    await sleep(this.animationDelay);

    const newTile = this.board.addRandomTile(this.rng);
    if (newTile) {
      this.events.emit('tile:spawned', { tile: newTile });
    }

    // Check win/lose conditions
    if (!this.won && this.board.hasWon()) {
      this.won = true;
      this.events.emit('game:won', {
        score: this.score,
        moves: this.telemetry.moves
      });
    }

    if (!this.board.hasMovesAvailable()) {
      this.lost = true;
      this.telemetry.endTime = Date.now();
      this.events.emit('game:lost', {
        score: this.score,
        telemetry: this.telemetry
      });
    }

    this.inputLocked = false;
  }

  /**
   * Continue playing after winning (reach 4096, 8192, etc.)
   */
  continuePlaying() {
    this.keepPlaying = true;
    this.events.emit('game:continued');
  }

  /**
   * Get current game state
   */
  getState() {
    return {
      board: this.board,
      score: this.score,
      bestScore: this.bestScore,
      won: this.won,
      lost: this.lost,
      inputLocked: this.inputLocked
    };
  }

  /**
   * Load best score from storage
   * @private
   */
  _loadBestScore() {
    const stored = this.storage.getItem('2048-bestScore');
    return stored ? parseInt(stored, 10) : 0;
  }

  /**
   * Save best score to storage
   * @private
   */
  _saveBestScore() {
    this.storage.setItem('2048-bestScore', this.bestScore.toString());
  }
}
