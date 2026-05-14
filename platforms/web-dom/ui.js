/**
 * Web DOM UI - Modals, buttons, controls
 * Handles win/lose modals and game controls
 */
export class WebDOMUI {
  constructor(eventBus) {
    this.eventBus = eventBus;
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

    // Help modal
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
      const helpCloseBtn = document.getElementById('help-close');
      if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', () => this.hideHelpModal());
      }
    }

    // About modal
    const aboutModal = document.getElementById('about-modal');
    if (aboutModal) {
      const aboutCloseBtn = document.getElementById('about-close');
      if (aboutCloseBtn) {
        aboutCloseBtn.addEventListener('click', () => this.hideAboutModal());
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

    // Language button
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
      langBtn.addEventListener('click', () => this.toggleLanguage());
    }

    // Help button
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showHelpModal());
    }

    // About button
    const aboutBtn = document.getElementById('about-btn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => this.showAboutModal());
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

    // Emit events for modal state
    if (this.eventBus) {
      this.eventBus.emit('modal:opened', { modal: 'win' });
    }
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide win modal
   */
  hideWinModal() {
    const modal = document.getElementById('win-modal');
    if (modal) {
      modal.classList.remove('show');

      // Emit events for modal state
      if (this.eventBus) {
        this.eventBus.emit('modal:closed', { modal: 'win' });
      }
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

    // Emit events for modal state
    if (this.eventBus) {
      this.eventBus.emit('modal:opened', { modal: 'lose' });
    }
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide lose modal
   */
  hideLoseModal() {
    const modal = document.getElementById('lose-modal');
    if (modal) {
      modal.classList.remove('show');

      // Emit events for modal state
      if (this.eventBus) {
        this.eventBus.emit('modal:closed', { modal: 'lose' });
      }
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

  /**
   * Show help modal
   */
  showHelpModal() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    modal.classList.add('show');

    // Emit events for modal state
    if (this.eventBus) {
      this.eventBus.emit('modal:opened', { modal: 'help' });
    }
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide help modal
   */
  hideHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) {
      modal.classList.remove('show');

      // Emit events for modal state
      if (this.eventBus) {
        this.eventBus.emit('modal:closed', { modal: 'help' });
      }
      window.dispatchEvent(new CustomEvent('modalHidden'));
    }
  }

  /**
   * Show about modal
   */
  showAboutModal() {
    const modal = document.getElementById('about-modal');
    if (!modal) return;

    // Update version in about modal (will be set by app.js during initialization)
    const versionEl = document.getElementById('about-version');
    if (versionEl && window.otaVersion) {
      versionEl.textContent = `Version ${window.otaVersion}`;
    }

    modal.classList.add('show');

    // Emit events for modal state
    if (this.eventBus) {
      this.eventBus.emit('modal:opened', { modal: 'about' });
    }
    window.dispatchEvent(new CustomEvent('modalShown'));
  }

  /**
   * Hide about modal
   */
  hideAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) {
      modal.classList.remove('show');

      // Emit events for modal state
      if (this.eventBus) {
        this.eventBus.emit('modal:closed', { modal: 'about' });
      }
      window.dispatchEvent(new CustomEvent('modalHidden'));
    }
  }

  /**
   * Toggle language between en and zh
   */
  async toggleLanguage() {
    const currentLang = localStorage.getItem('2048-language') || 'en';
    const newLang = currentLang === 'en' ? 'zh' : 'en';

    try {
      const { applyLanguage } = await import('../../core/i18n.js');
      applyLanguage(newLang);
      localStorage.setItem('2048-language', newLang);
    } catch (e) {
      console.error('Failed to switch language:', e);
    }
  }
}
