// OTA RULE: Download in background, apply ONLY on app restart.
// No hot-swap during active session. Updates take effect on next app launch.

/**
 * OTA (Over-The-Air) Update System for 2048
 *
 * Android-only feature for rapid updates without Play Store delays
 * - Background version check 3 seconds after app startup
 * - Downloads happen in background
 * - Updates apply only on app restart (never mid-session)
 * - Hash verification for integrity
 * - Graceful fallback to bundled assets on failure
 */

let config = {
  siteUrl: 'https://2048.octile.eu.cc/',
  enabled: true
};

/**
 * Apply configuration from config.json
 */
export function applyOtaConfig(cfg) {
  if (cfg.siteUrl) {
    config.siteUrl = cfg.siteUrl;
  }
  if (cfg.features?.ota_updates === false) {
    config.enabled = false;
  }
}

/**
 * Check for OTA updates (called 3 seconds after app startup)
 * Fetches version.json and compares with current version
 * Shows banner if update available
 */
export async function checkForUpdate() {
  if (!config.enabled) return;

  try {
    const versionUrl = config.siteUrl + 'version.json?t=' + Date.now();
    const response = await fetch(versionUrl, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('OTA version check failed:', response.status);
      return;
    }

    const versionData = await response.json();
    const remoteVersion = versionData.otaVersionCode || 0;
    const currentVersion = window.otaVersion || 0;

    if (remoteVersion <= currentVersion) {
      console.log('OTA: Up to date (current=' + currentVersion + ', remote=' + remoteVersion + ')');
      return;
    }

    // New version available - check if user dismissed this version
    const dismissedKey = 'update_dismissed_v' + remoteVersion;
    if (localStorage.getItem(dismissedKey) === 'true') {
      console.log('OTA: Update v' + remoteVersion + ' dismissed by user');
      return;
    }

    // Show update banner
    showUpdateBanner(versionData, false);

    // Notify MainActivity to download in background (Android only)
    if (typeof window.AndroidOTA !== 'undefined') {
      window.AndroidOTA.downloadUpdate(
        versionData.bundleUrl,
        versionData.bundleHash,
        remoteVersion,
        versionData.otaVersionName || String(remoteVersion)
      );
    }
  } catch (error) {
    console.warn('OTA check failed:', error.message);
  }
}

/**
 * Called by MainActivity after OTA download completes
 * Shows "Restart to apply" banner
 * window.onOtaUpdateReady is called via evaluateJavascript from Java
 */
window.onOtaUpdateReady = function(versionCode, versionName) {
  console.log('OTA update ready:', versionCode, versionName);

  const versionData = {
    otaVersionCode: versionCode,
    otaVersionName: versionName || String(versionCode)
  };

  showOtaReadyBanner(versionData);
};

/**
 * Show update banner (update available, not yet downloaded)
 */
function showUpdateBanner(versionData, isForceUpdate) {
  const banner = createBanner(
    isForceUpdate,
    getUpdateMessage(versionData),
    [
      {
        text: 'Later',
        action: () => {
          dismissUpdate(versionData.otaVersionCode);
          hideBanner();
        },
        visible: !isForceUpdate
      },
      {
        text: 'Learn More',
        action: () => {
          window.open(versionData.playStoreUrl || 'https://2048.octile.eu.cc/', '_blank');
        },
        visible: true
      }
    ]
  );

  document.body.appendChild(banner);
}

/**
 * Show OTA ready banner (download complete, restart to apply)
 */
function showOtaReadyBanner(versionData) {
  const banner = createBanner(
    false, // not force
    'Update ready. Restart to apply.',
    [
      {
        text: 'Restart',
        action: () => {
          // Reload the app (on Android, this will load from OTA directory)
          window.location.reload();
        },
        visible: true
      }
    ]
  );

  document.body.appendChild(banner);
}

/**
 * Get update message text
 */
function getUpdateMessage(versionData) {
  const releaseNotes = versionData.releaseNotes?.en || 'A new version is available';
  return 'Update available: ' + releaseNotes;
}

/**
 * Create update banner element
 */
function createBanner(isForceUpdate, message, buttons) {
  const existingBanner = document.getElementById('update-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner' + (isForceUpdate ? ' force-update' : '');

  const messageEl = document.createElement('p');
  messageEl.className = 'update-message';
  messageEl.textContent = message;
  banner.appendChild(messageEl);

  const actions = document.createElement('div');
  actions.className = 'update-actions';

  buttons.forEach(btn => {
    if (!btn.visible) return;

    const button = document.createElement('button');
    button.className = 'update-btn';
    button.textContent = btn.text;
    button.addEventListener('click', btn.action);
    actions.appendChild(button);
  });

  banner.appendChild(actions);

  // Add styles dynamically (in case styles.css doesn't have them)
  addBannerStyles();

  return banner;
}

/**
 * Add banner styles dynamically
 */
function addBannerStyles() {
  if (document.getElementById('ota-banner-styles')) return;

  const style = document.createElement('style');
  style.id = 'ota-banner-styles';
  style.textContent = `
    .update-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #3a3a3a;
      color: #cccccc;
      padding: 12px 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .update-banner.force-update {
      background: #b85c00;
    }
    .update-message {
      margin: 0;
      font-size: 14px;
      flex: 1;
    }
    .update-actions {
      display: flex;
      gap: 8px;
    }
    .update-btn {
      padding: 6px 12px;
      background: #4a4a4a;
      color: #cccccc;
      border: none;
      border-radius: 3px;
      font-size: 14px;
      cursor: pointer;
    }
    .update-btn:hover {
      background: #5a5a5a;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Dismiss update banner for specific version
 */
function dismissUpdate(versionCode) {
  const dismissedKey = 'update_dismissed_v' + versionCode;
  localStorage.setItem(dismissedKey, 'true');
}

/**
 * Hide update banner
 */
function hideBanner() {
  const banner = document.getElementById('update-banner');
  if (banner) {
    banner.remove();
  }
}
