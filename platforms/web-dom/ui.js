/**
 * Web DOM UI - Modals, buttons, controls
 * Handles win/lose modals and game controls
 */
export class WebDOMUI {
  constructor() {
    this.audio = null;
    this.newGameCallback = null;
    this.continueCallback = null;
    this.octileNudgeShown = false;
  }

  initialize() {
    this._setupModals();
    this._setupControls();
  }

  /**
   * Set audio reference for mute button
   */
  setAudio(audio) {
    this.audio = audio;
  }

  /**
   * Register new game callback
   */
  onNewGame(callback) {
    this.newGameCallback = callback;
  }

  /**
   * Register continue playing callback
   */
  onContinue(callback) {
    this.continueCallback = callback;
  }

  /**
   * Setup win/lose modals
   * @private
   */
  _setupModals() {
    // Win modal
    const winModal = document.getElementById('win-modal');
    if (winModal) {
      const continueBtn = winModal.querySelector('.continue-btn');
      const newGameBtn = winModal.querySelector('.new-game-btn');

      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          this.hideWinModal();
          if (this.continueCallback) this.continueCallback();
        });
      }

      if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
          this.hideWinModal();
          if (this.newGameCallback) this.newGameCallback();
        });
      }
    }

    // Lose modal
    const loseModal = document.getElementById('lose-modal');
    if (loseModal) {
      const tryAgainBtn = loseModal.querySelector('.try-again-btn');

      if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
          this.hideLoseModal();
          if (this.newGameCallback) this.newGameCallback();
        });
      }
    }
  }

  /**
   * Setup game controls
   * @private
   */
  _setupControls() {
    // New game button
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        if (this.newGameCallback) this.newGameCallback();
      });
    }

    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (this.audio) {
          const newMuted = !this.audio.isMuted();
          this.audio.setMuted(newMuted);
          this.updateMuteButton();
        }
      });
    }
  }

  /**
   * Show win modal
   */
  showWinModal(score, moves) {
    const modal = document.getElementById('win-modal');
    if (!modal) return;

    const scoreEl = modal.querySelector('.final-score');
    const movesEl = modal.querySelector('.final-moves');
    const nudgeEl = modal.querySelector('.octile-nudge');

    if (scoreEl) scoreEl.textContent = score;
    if (movesEl) movesEl.textContent = moves;

    if (nudgeEl) {
      nudgeEl.style.display = this.octileNudgeShown ? 'none' : 'block';
      this.octileNudgeShown = true;
    }

    modal.classList.add('show');
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide win modal
   */
  hideWinModal() {
    const modal = document.getElementById('win-modal');
    if (modal) {
      modal.classList.remove('show');
      window.dispatchEvent(new CustomEvent('modalHidden'));
    }
  }

  /**
   * Show lose modal
   */
  showLoseModal(score) {
    const modal = document.getElementById('lose-modal');
    if (!modal) return;

    const scoreEl = modal.querySelector('.final-score');
    if (scoreEl) scoreEl.textContent = score;

    modal.classList.add('show');
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide lose modal
   */
  hideLoseModal() {
    const modal = document.getElementById('lose-modal');
    if (modal) {
      modal.classList.remove('show');
      window.dispatchEvent(new CustomEvent('modalHidden'));
    }
  }

  /**
   * Update mute button icon
   */
  updateMuteButton() {
    const muteBtn = document.getElementById('mute-btn');
    if (!muteBtn || !this.audio) return;

    muteBtn.textContent = this.audio.isMuted() ? '🔇' : '🔊';
  }
}
