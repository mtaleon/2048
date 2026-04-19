// 2048 Game Constants

export const GAME_CONFIG = {
  gridSize: 4,
  winTile: 2048,
  initialTiles: 2,
  animationDuration: 200, // ms for tile movement
  mergeDelay: 100, // ms before merge animation
  newTileDelay: 200, // ms before spawning new tile
  spawnProbability2: 0.9, // 90% chance of spawning 2 (vs 4)
};

export const TILE_COLORS = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
  4096: '#3c3a32',
  8192: '#3c3a32',
};

export const TILE_TEXT_COLORS = {
  2: '#776e65',
  4: '#776e65',
  8: '#f9f6f2',
  16: '#f9f6f2',
  32: '#f9f6f2',
  64: '#f9f6f2',
  128: '#f9f6f2',
  256: '#f9f6f2',
  512: '#f9f6f2',
  1024: '#f9f6f2',
  2048: '#f9f6f2',
  4096: '#f9f6f2',
  8192: '#f9f6f2',
};

export const DIRECTIONS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

// Sleep helper for async timing (Fix #2: enables clean testing)
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// For reproducible games
export class SeededRandom {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  next() {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  // Random integer between min (inclusive) and max (exclusive)
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }
}
