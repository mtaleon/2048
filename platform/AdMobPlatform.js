/**
 * AdMobPlatform - Platform abstraction for Capacitor AdMob plugin (Android only)
 *
 * Philosophy: Conservative error handling, graceful degradation
 * - Android-only (2048 does not support iOS ads in v1.0)
 * - Native overlay (not DOM insertion)
 * - Uses AdMob plugin's built-in consent API
 * - All errors fail silently, never block app
 */

import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

export class AdMobPlatform {
  constructor(adUnitIds) {
    // Android-only check (not just native, exclude iOS)
    this.isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    this.platform = Capacitor.getPlatform();
    this.adsEnabled = this.isAndroidNative; // Only show ads on Android
    this.initialized = false;
    this.consentObtained = false;

    // Ad unit IDs (use test IDs by default)
    this.adUnitIds = adUnitIds || {
      banner: 'ca-app-pub-3940256099942544/6300978111',  // Test banner ID
      interstitial: 'ca-app-pub-3940256099942544/1033173712'  // Test interstitial ID (v1.1+)
    };
  }

  /**
   * Initialize AdMob SDK with GDPR consent flow
   *
   * ✅ UMP Best Practice: Request consent info at the beginning of each app session
   * and show consent form only if required. Runs after main screen is playable.
   *
   * ⚠️ CRITICAL: Banner must wait until this completes to avoid UI flash/jump
   */
  async initialize() {
    if (!this.adsEnabled) return false;

    try {
      // Step 1: Request consent info update (EU/EEA/UK users)
      // ✅ Following UMP guidance: update consent status on every app session
      await this._requestConsent();

      // Step 2: Initialize AdMob SDK
      await AdMob.initialize({
        testingDevices: [], // Add device IDs during testing if needed
        initializeForTesting: false
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('AdMob init failed:', error);
      this.adsEnabled = false; // Fail gracefully
      return false;
    }
  }

  /**
   * Request GDPR consent using AdMob plugin's built-in API
   *
   * ✅ UMP Pattern: requestConsentInfo() → showConsentForm() if required
   * Called on every app session start per UMP documentation
   *
   * Octile Universe principle: Consent UI shown only if required and does not block
   * app startup. Game becomes playable before any consent UI.
   */
  async _requestConsent() {
    try {
      // Update consent information (checks if form needed)
      const consentInfo = await AdMob.requestConsentInfo();

      // Only show consent form if required AND available
      // ✅ Following UMP guidance: show form only when status = 'REQUIRED'
      if (consentInfo.isConsentFormAvailable && consentInfo.status === 'REQUIRED') {
        await AdMob.showConsentForm();
        this.consentObtained = true;
      } else {
        // Already consented or not required (e.g., non-EEA users)
        this.consentObtained = true;
      }
    } catch (error) {
      console.warn('Consent request failed, continuing with non-personalized ads:', error);
      // Continue with non-personalized ads (graceful degradation)
      this.consentObtained = false;
    }
  }

  /**
   * Show banner ad at bottom of screen
   *
   * ✅ Native overlay: Banner rendered by OS, not in DOM
   * ✅ Fixed BANNER size (320x50) for predictable padding
   * ✅ CSS padding updated to prevent content overlap
   */
  async showBanner() {
    if (!this.adsEnabled || !this.initialized) return;

    try {
      await AdMob.showBanner({
        adId: this.adUnitIds.banner,
        adSize: BannerAdSize.BANNER, // Fixed 320x50 (not ADAPTIVE)
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0
      });

      // Update CSS padding to prevent content overlap (native overlay)
      // Fixed 50px for BANNER size (320x50)
      this._setAdSafePadding('50px');
    } catch (error) {
      console.warn('Banner load failed:', error);
      this._setAdSafePadding('0px');
      throw error; // Re-throw for failure counting in AdMobManager
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner() {
    try {
      await AdMob.hideBanner();
      this._setAdSafePadding('0px');
    } catch (error) {
      console.warn('Banner hide failed:', error);
    }
  }

  /**
   * Remove banner ad (cleanup)
   */
  async removeBanner() {
    try {
      await AdMob.removeBanner();
      this._setAdSafePadding('0px');
    } catch (error) {
      console.warn('Banner remove failed:', error);
    }
  }

  /**
   * Load interstitial ad (v1.1+)
   * Not used in v1.0 (interstitial_ads: false)
   */
  async loadInterstitial() {
    if (!this.adsEnabled || !this.initialized) return;

    try {
      await AdMob.prepareInterstitial({
        adId: this.adUnitIds.interstitial
      });
    } catch (error) {
      console.warn('Interstitial load failed:', error);
      throw error;
    }
  }

  /**
   * Show interstitial ad (v1.1+)
   */
  async showInterstitial() {
    if (!this.adsEnabled || !this.initialized) return;

    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.warn('Interstitial show failed:', error);
      throw error;
    }
  }

  /**
   * Add event listener for ad events
   * Returns PluginListenerHandle for cleanup
   */
  addListener(eventName, callback) {
    if (!this.adsEnabled) {
      // Return dummy handle for web/non-Android platforms
      return { remove: () => {} };
    }

    try {
      return AdMob.addListener(eventName, callback);
    } catch (error) {
      console.warn('Failed to add listener:', eventName, error);
      return { remove: () => {} };
    }
  }

  /**
   * Set CSS custom property for safe area padding (native banner overlay)
   *
   * ⚠️ IMPORTANT: No DOM container exists - banner is native overlay
   * Capacitor AdMob renders banner as native view, not HTML element
   */
  _setAdSafePadding(value) {
    document.documentElement.style.setProperty('--ad-safe-bottom', value);
  }
}
