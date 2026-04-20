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
  2: '#2f3238',    /* Dark blue-gray (was #eee4da cream) */
  4: '#353a42',    /* Slightly lighter (was #ede0c8 cream) */
  8: '#3c424c',    /* Medium (was #f2b179 orange) */
  16: '#454c58',   /* Mid-tone (was #f59563 bright orange) */
  32: '#4f5866',   /* Warmer mid (was #f67c5f red-orange) */
  64: '#586273',   /* Light-mid (was #f65e3b red) */
  128: '#6a7382',  /* Cool light (was #edcf72 gold) */
  256: '#7c8491',  /* Lighter (was #edcc61 bright gold) */
  512: '#8e95a0',  /* Light gray-blue (was #edc850 yellow-gold) */
  1024: '#a1a7b0', /* Very light (was #edc53f bright yellow) */
  2048: '#b4b8bf', /* Lightest (was #edc22e bright yellow) */
  4096: '#2a2a2a', /* Dark (was #3c3a32 dark brown) */
  8192: '#2a2a2a', /* Dark (was #3c3a32 dark brown) */
};

// Octile Universe: Text colors adjusted for low-saturation backgrounds
export const TILE_TEXT_COLORS = {
  2: '#8e95a0',      /* Light blue-gray text on dark tiles */
  4: '#99a0a8',
  8: '#a4abb2',
  16: '#b0b6bc',
  32: '#bcc1c6',
  64: '#c8ccd0',
  128: '#d4d7da',
  256: '#e0e2e4',
  512: '#ecedef',
  1024: '#f8f9f9',
  2048: '#ffffff',   /* White on lightest tile */
  4096: '#b4b8bf',   /* Light on dark super tiles */
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
