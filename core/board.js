import { Tile, createTile } from './tile.js';
import { GAME_CONFIG } from './constants.js';

/**
 * Board class managing the 4×4 grid and tile movement logic
 * Implements merge-once-per-turn protection (Fix #3)
 * Includes prepareTiles() for animation support (Fix #4)
 */
export class Board {
  constructor(size = GAME_CONFIG.gridSize) {
    this.size = size;
    this.tiles = [];  // Flat array of all tiles
    this.grid = this._buildGrid();  // 2D grid for fast lookup
  }

  /**
   * Build empty 2D grid for tile lookup
   * @private
   */
  _buildGrid() {
    return Array(this.size).fill(null).map(() => Array(this.size).fill(null));
  }

  /**
   * CRITICAL (Fix #4): Save current positions as previous for animation
   * MUST be called BEFORE move() so renderer can animate from prevX/prevY → x/y
   */
  prepareTiles() {
    this.tiles.forEach(tile => {
      tile.savePosition();
    });
  }

  /**
   * Core movement algorithm
   * CRITICAL (Fix #3): Implements merge-once-per-turn protection
   *
   * @param {object} direction - { dx, dy } from DIRECTIONS
   * @returns {object} { moved: boolean, merges: [{ tile, from: [tile1, tile2] }] }
   */
  move(direction) {
    const { dx, dy } = direction;
    const vector = { x: dx, y: dy };

    let moved = false;
    const merges = [];

    // 1. Build traversal order (iterate from direction edge)
    const traversals = this._buildTraversals(vector);

    // 2. Clear merge flags from previous turn
    this.tiles.forEach(t => { t.merged = false; t.isNew = false; });

    // 3. Process each cell in traversal order
    traversals.y.forEach(y => {
      traversals.x.forEach(x => {
        const tile = this.getTileAt(x, y);
        if (!tile) return;

        // Find farthest position in direction
        const positions = this._findFarthestPosition(tile, vector);
        const next = this.getTileAt(positions.next.x, positions.next.y);

        // CRITICAL (Fix #3): Check !next.merged to prevent double-merge
        // If next is already result of a merge THIS TURN, skip
        if (next && next.value === tile.value && !next.merged) {
          const merged = new Tile(tile.value * 2, positions.next.x, positions.next.y);

          // ⚠️ CRITICAL: Mark merged tile to prevent re-merging this turn
          merged.merged = true;

          // Set prevX/prevY for animation (merge animation needs source positions)
          merged.prevX = tile.x;
          merged.prevY = tile.y;

          this._removeTile(tile);
          this._removeTile(next);
          this._addTile(merged);

          merges.push({ tile: merged, from: [tile, next] });
          moved = true;
        } else {
          // Just move tile
          if (positions.farthest.x !== tile.x || positions.farthest.y !== tile.y) {
            tile.updatePosition(positions.farthest.x, positions.farthest.y);
            this._updateGrid();
            moved = true;
          }
        }
      });
    });

    return { moved, merges };
  }

  /**
   * Build traversal order based on movement direction
   * Ensures tiles are processed from the direction edge first
   * @private
   */
  _buildTraversals(vector) {
    const traversals = { x: [], y: [] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    // Reverse traversal for opposite direction
    // LEFT: process x from 0→3 (left edge first)
    // RIGHT: process x from 3→0 (right edge first)
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();

    return traversals;
  }

  /**
   * Find farthest empty position in movement direction
   * @private
   */
  _findFarthestPosition(tile, vector) {
    let previous;
    let cell = { x: tile.x, y: tile.y };

    // Keep moving in direction until we hit a wall or another tile
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this._withinBounds(cell) && this._cellAvailable(cell));

    return {
      farthest: previous,  // Last valid empty position
      next: cell           // First blocked position (for merge check)
    };
  }

  /**
   * Get all empty cells for spawning new tiles
   * @returns {Array} Array of { x, y } positions
   */
  getAvailableCells() {
    const cells = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.grid[y][x]) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  /**
   * Add a random tile (2 or 4) to an empty cell
   * @param {SeededRandom|null} rng - Seeded RNG for reproducible games
   * @returns {Tile|null} The spawned tile, or null if no space
   */
  addRandomTile(rng = null) {
    const cells = this.getAvailableCells();
    if (cells.length === 0) return null;

    // Pick random cell
    const rand = rng ? rng.next() : Math.random();
    const cell = cells[Math.floor(rand * cells.length)];

    // Create tile (2 or 4 based on probability)
    const tile = createTile(cell.x, cell.y, null, rng);
    tile.isNew = true;

    this._addTile(tile);
    return tile;
  }

  /**
   * Check if any moves are possible
   * @returns {boolean}
   */
  hasMovesAvailable() {
    return this.getAvailableCells().length > 0 || this._hasTileMatchesAvailable();
  }

  /**
   * Check if any adjacent tiles can be merged
   * @private
   */
  _hasTileMatchesAvailable() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const tile = this.grid[y][x];
        if (!tile) continue;

        // Check all 4 directions
        const directions = [
          { x: 0, y: -1 },  // UP
          { x: 0, y: 1 },   // DOWN
          { x: -1, y: 0 },  // LEFT
          { x: 1, y: 0 }    // RIGHT
        ];

        for (const dir of directions) {
          const nx = x + dir.x;
          const ny = y + dir.y;
          const neighbor = this.getTileAt(nx, ny);

          if (neighbor && neighbor.value === tile.value) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if board contains winning tile (2048)
   * @returns {boolean}
   */
  hasWon() {
    return this.tiles.some(tile => tile.value >= GAME_CONFIG.winTile);
  }

  /**
   * Get tile at position, or null if empty/out of bounds
   * @param {number} x
   * @param {number} y
   * @returns {Tile|null}
   */
  getTileAt(x, y) {
    if (!this._withinBounds({ x, y })) return null;
    return this.grid[y][x];
  }

  /**
   * Add tile to board
   * @private
   */
  _addTile(tile) {
    this.tiles.push(tile);
    this.grid[tile.y][tile.x] = tile;
  }

  /**
   * Remove tile from board
   * @private
   */
  _removeTile(tile) {
    this.tiles = this.tiles.filter(t => t.id !== tile.id);
    this.grid[tile.y][tile.x] = null;
  }

  /**
   * Rebuild grid from tiles array
   * @private
   */
  _updateGrid() {
    this.grid = this._buildGrid();
    this.tiles.forEach(tile => {
      this.grid[tile.y][tile.x] = tile;
    });
  }

  /**
   * Check if position is within board bounds
   * @private
   */
  _withinBounds(cell) {
    return cell.x >= 0 && cell.x < this.size &&
           cell.y >= 0 && cell.y < this.size;
  }

  /**
   * Check if cell is empty
   * @private
   */
  _cellAvailable(cell) {
    return !this.getTileAt(cell.x, cell.y);
  }
}
