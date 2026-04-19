import { IInput } from '../../platform/IInput.js';
import { DIRECTIONS } from '../../core/constants.js';

/**
 * Web DOM Input Handler - Keyboard + Touch support
 * Handles arrow keys and swipe gestures
 */
export class WebDOMInput extends IInput {
  constructor() {
    super();
    this.game = null;
    this.enabled = false;
    this.modalShown = false;

    // Touch handling
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;  // pixels

    // Bind methods
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);
    this._handleModalShown = this._handleModalShown.bind(this);
    this._handleModalHidden = this._handleModalHidden.bind(this);
  }

  initialize(game) {
    this.game = game;
    this.enable();

    // Listen for modal events to block input
    window.addEventListener('modalShown', this._handleModalShown);
    window.addEventListener('modalHidden', this._handleModalHidden);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;

    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('touchstart', this._handleTouchStart, { passive: false });
    document.addEventListener('touchend', this._handleTouchEnd, { passive: false });
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;

    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('touchstart', this._handleTouchStart);
    document.removeEventListener('touchend', this._handleTouchEnd);
  }

  /**
   * Handle keyboard input
   * @private
   */
  _handleKeyDown(e) {
    if (this.modalShown || !this.enabled) return;

    const keyMap = {
      'ArrowUp': DIRECTIONS.UP,
      'ArrowDown': DIRECTIONS.DOWN,
      'ArrowLeft': DIRECTIONS.LEFT,
      'ArrowRight': DIRECTIONS.RIGHT,
      'w': DIRECTIONS.UP,
      'W': DIRECTIONS.UP,
      's': DIRECTIONS.DOWN,
      'S': DIRECTIONS.DOWN,
      'a': DIRECTIONS.LEFT,
      'A': DIRECTIONS.LEFT,
      'd': DIRECTIONS.RIGHT,
      'D': DIRECTIONS.RIGHT
    };

    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      this.game.move(direction);
    }
  }

  /**
   * Handle touch start
   * @private
   */
  _handleTouchStart(e) {
    if (this.modalShown || !this.enabled) return;

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  /**
   * Handle touch end - detect swipe direction
   * @private
   */
  _handleTouchEnd(e) {
    if (this.modalShown || !this.enabled) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Check if swipe distance is sufficient
    if (Math.max(absDx, absDy) < this.minSwipeDistance) return;

    // Determine direction (prioritize larger delta)
    let direction;
    if (absDx > absDy) {
      direction = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
      direction = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }

    e.preventDefault();
    this.game.move(direction);
  }

  /**
   * Handle modal shown event
   * @private
   */
  _handleModalShown() {
    this.modalShown = true;
  }

  /**
   * Handle modal hidden event
   * @private
   */
  _handleModalHidden() {
    this.modalShown = false;
  }

  cleanup() {
    this.disable();
    window.removeEventListener('modalShown', this._handleModalShown);
    window.removeEventListener('modalHidden', this._handleModalHidden);
  }
}
