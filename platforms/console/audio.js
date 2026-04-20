/**
 * Console Audio - Stub implementation (no sound in terminal)
 */

export class ConsoleAudio {
  /**
   * Initialize audio (no-op for console)
   */
  initialize() {
    // No audio in console mode
  }

  /**
   * Play sound (no-op for console)
   */
  playSound(soundName) {
    // Could potentially use system beep or ASCII bell
    // process.stdout.write('\x07'); // Bell character
  }

  /**
   * Set muted state (no-op for console)
   */
  setMuted(muted) {
    // No audio to mute
  }

  /**
   * Get muted state
   */
  isMuted() {
    return true; // Always "muted" in console
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    // Nothing to clean up
  }
}
