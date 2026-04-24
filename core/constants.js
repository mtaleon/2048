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

// Octile Universe: Low-saturation blue-gray progression
// NOT pure grayscale - maintains visual hierarchy for playability
// Cool tones replace warm orange/gold from classic 2048
export const TILE_COLORS = {
  2: '#3a4048',
  4: '#3d4450',
  8: '#404858',
  16: '#464b52',
  32: '#4c525c',
  64: '#565d68',
  128: '#61666d',
  256: '#6d7279',
  512: '#7a8088',
  1024: '#8a9098',
  2048: '#9ca2aa',
  4096: '#2a2a2a',
  8192: '#2a2a2a',
};

// Octile Universe: Text colors adjusted for low-saturation backgrounds
export const TILE_TEXT_COLORS = {
  2: '#e5e7eb',
  4: '#e5e7eb',
  8: '#e8eaed',
  16: '#f1f5f9',
  32: '#f1f5f9',
  64: '#f4f6f8',
  128: '#f8f9fa',
  256: '#fafbfc',
  512: '#fdfefe',
  1024: '#ffffff',
  2048: '#ffffff',
  4096: '#b4b8bf',
  8192: '#b4b8bf',
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
