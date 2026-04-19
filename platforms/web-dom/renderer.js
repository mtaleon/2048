import { IRenderer } from '../../platform/IRenderer.js';
import { TILE_COLORS, TILE_TEXT_COLORS } from '../../core/constants.js';

/**
 * Web DOM Renderer - CSS Grid + Transform animations
 * Implements Fix #4: Animates from prevX/prevY → x/y
 */
export class WebDOMRenderer extends IRenderer {
  constructor() {
    super();
    this.container = null;
    this.gridElement = null;
    this.tileElements = new Map();  // id → HTMLElement
  }

  initialize(container) {
    this.container = container;

    // Create grid container
    this.gridElement = document.createElement('div');
    this.gridElement.className = 'grid-container';

    // Create background grid cells (visual only)
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.gridElement.appendChild(cell);
    }

    this.container.appendChild(this.gridElement);

    // Calculate responsive tile size
    this._calculateTileSize();
    window.addEventListener('resize', () => this._calculateTileSize());
  }

  /**
   * Calculate responsive tile sizing
   * @private
   */
  _calculateTileSize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Calculate grid size to fit viewport
    const maxWidth = Math.min(vw * 0.9, 500);
    const maxHeight = Math.min(vh * 0.7, 500);
    const gridSize = Math.min(maxWidth, maxHeight);

    // Set CSS variables for grid and tile sizing
    document.documentElement.style.setProperty('--grid-size', `${gridSize}px`);
    document.documentElement.style.setProperty('--tile-size', `${(gridSize - 75) / 4}px`);
    document.documentElement.style.setProperty('--gap', '15px');
  }

  renderBoard(board) {
    // Remove old tiles
    this.tileElements.forEach(el => el.remove());
    this.tileElements.clear();

    // Render current tiles
    board.tiles.forEach(tile => {
      const el = this._createTileElement(tile);
      this.gridElement.appendChild(el);
      this.tileElements.set(tile.id, el);
    });
  }

  /**
   * Create tile DOM element with proper initial position
   * Fix #4: Uses prevX/prevY for initial position (before animation)
   * @private
   */
  _createTileElement(tile) {
    const el = document.createElement('div');
    el.className = `tile tile-${tile.value}`;
    el.dataset.id = tile.id;
    el.textContent = tile.value;

    // Style with tile colors
    el.style.backgroundColor = TILE_COLORS[tile.value] || '#3c3a32';
    el.style.color = TILE_TEXT_COLORS[tile.value] || '#f9f6f2';

    // Fix #4: Use prevX/prevY for initial position (before animation)
    // If no prevX/prevY (new tile), use current position
    const startX = tile.prevX !== undefined ? tile.prevX : tile.x;
    const startY = tile.prevY !== undefined ? tile.prevY : tile.y;

    el.style.setProperty('--x', startX);
    el.style.setProperty('--y', startY);

    if (tile.isNew) {
      el.classList.add('tile-new');
    }
    if (tile.merged) {
      el.classList.add('tile-merged');
    }

    return el;
  }

  /**
   * Animate tile movement
   * Fix #4: Animates from prevX/prevY (already set) to x/y
   */
  animateMove(tiles) {
    tiles.forEach(tile => {
      const el = this.tileElements.get(tile.id);
      if (!el) return;

      // Update position - CSS transition handles animation
      el.style.setProperty('--x', tile.x);
      el.style.setProperty('--y', tile.y);
    });
  }

  /**
   * Animate tile merging
   */
  animateMerge(merges) {
    merges.forEach(({ tile, from }) => {
      // Remove old tiles
      from.forEach(oldTile => {
        const el = this.tileElements.get(oldTile.id);
        if (el) {
          el.remove();
          this.tileElements.delete(oldTile.id);
        }
      });

      // Create merged tile with animation
      const el = this._createTileElement(tile);
      el.classList.add('tile-merged');
      this.gridElement.appendChild(el);
      this.tileElements.set(tile.id, el);

      // Move to final position
      requestAnimationFrame(() => {
        el.style.setProperty('--x', tile.x);
        el.style.setProperty('--y', tile.y);
      });
    });
  }

  /**
   * Animate new tile spawn
   */
  animateSpawn(tile) {
    const el = this._createTileElement(tile);
    el.classList.add('tile-new');
    this.gridElement.appendChild(el);
    this.tileElements.set(tile.id, el);

    // Trigger position update for animation
    requestAnimationFrame(() => {
      el.style.setProperty('--x', tile.x);
      el.style.setProperty('--y', tile.y);
    });
  }

  /**
   * Update score display
   */
  updateScore(score, bestScore) {
    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('best-score');

    if (scoreEl) scoreEl.textContent = score;
    if (bestScoreEl) bestScoreEl.textContent = bestScore;
  }

  cleanup() {
    this.tileElements.forEach(el => el.remove());
    this.tileElements.clear();
    if (this.gridElement) this.gridElement.remove();
    window.removeEventListener('resize', this._calculateTileSize);
  }
}
