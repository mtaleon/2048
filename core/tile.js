import { GAME_CONFIG } from './constants.js';

/**
 * Tile class representing a single tile on the board
 * Includes prevX/prevY for animation support (Fix #4)
 */
export class Tile {
  constructor(value, x, y, id = null) {
    this.id = id || `tile_${Date.now()}_${Math.random()}`;
    this.value = value;  // 2, 4, 8, 16, ... 2048
    this.x = x;
    this.y = y;
    this.prevX = x;  // Previous position for animation
    this.prevY = y;
    this.merged = false;  // Flag for merge animation and merge-once protection
    this.isNew = true;    // Flag for spawn animation
  }

  /**
   * Update tile position and track previous position for animation
   */
  updatePosition(x, y) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x = x;
    this.y = y;
  }

  /**
   * Save current position as previous (used by board.prepareTiles())
   */
  savePosition() {
    this.prevX = this.x;
    this.prevY = this.y;
  }
}

/**
 * Factory function to create a tile with random value (2 or 4)
 * @param {number|null} value - Force specific value, or null for random
 * @param {number} x - Grid x position
 * @param {number} y - Grid y position
 * @param {SeededRandom|null} rng - Seeded RNG for reproducible games
 */
export function createTile(x, y, value = null, rng = null) {
  let tileValue = value;

  if (tileValue === null) {
    // 90% chance of 2, 10% chance of 4
    const rand = rng ? rng.next() : Math.random();
    tileValue = rand < GAME_CONFIG.spawnProbability2 ? 2 : 4;
  }

  return new Tile(tileValue, x, y);
}
