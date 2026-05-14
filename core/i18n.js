const translations = {
  en: {
    // Game UI
    'game.score': 'Score',
    'game.best': 'Best',
    'game.moves': 'Moves',
    'game.newGame': 'New Game',
    'game.gameOver': 'Game Over',
    'game.youWon': 'You Won!',
    'game.keepPlaying': 'Keep playing',
    'game.tryAgain': 'Try again',
    'game.noMovesAvailable': 'No moves available',

    // Help modal
    'help.title': 'How to Play',
    'help.rule': 'Rule',
    'help.ruleDesc': 'Use arrow keys to slide tiles. When two tiles with the same number touch, they merge into one. Reach 2048 to win!',
    'help.controls': 'Controls',
    'help.keyboard': 'Keyboard: Arrow keys or WASD',
    'help.touch': 'Touch: Swipe in any direction',
    'help.newGameTip': 'New Game: Click button to restart',
    'help.contact': 'Contact',
    'help.privacy': 'Privacy Policy',
    'help.done': 'Done',

    // About modal
    'about.title': 'About',
    'about.name': '2048',
    'about.version': 'Version {version}',
    'about.byOctile': 'An Octile Universe game',
    'about.contactLink': 'Contact',
    'about.privacyLink': 'Privacy Policy',
    'about.done': 'Done',

    // OTA updates
    'ota.updateAvailable': 'Update available',
    'ota.updateRequired': 'Update required',
    'ota.updateReady': 'Update ready. Restart to apply.',
    'ota.restart': 'Restart',
    'ota.later': 'Later',
    'ota.downloading': 'Downloading update...',

    // UI elements
    'ui.mute': 'Mute',
    'ui.unmute': 'Unmute',
    'ui.help': 'Help',
    'ui.about': 'About',
  },

  zh: {
    // Game UI
    'game.score': '分數',
    'game.best': '最佳',
    'game.moves': '步數',
    'game.newGame': '新遊戲',
    'game.gameOver': '遊戲結束',
    'game.youWon': '你贏了！',
    'game.keepPlaying': '繼續玩',
    'game.tryAgain': '再試一次',
    'game.noMovesAvailable': '沒有可用的移動',

    // Help modal
    'help.title': '玩法說明',
    'help.rule': '規則',
    'help.ruleDesc': '使用方向鍵滑動方塊。當兩個數字相同的方塊碰觸時，它們會合併成一個。達到 2048 即可獲勝！',
    'help.controls': '操作方式',
    'help.keyboard': '鍵盤：方向鍵或 WASD',
    'help.touch': '觸控：任意方向滑動',
    'help.newGameTip': '新遊戲：點擊按鈕重新開始',
    'help.contact': '聯絡我們',
    'help.privacy': '隱私權政策',
    'help.done': '完成',

    // About modal
    'about.title': '關於',
    'about.name': '2048',
    'about.version': '版本 {version}',
    'about.byOctile': 'Octile Universe 出品',
    'about.contactLink': '聯絡我們',
    'about.privacyLink': '隱私權政策',
    'about.done': '完成',

    // OTA updates
    'ota.updateAvailable': '有可用更新',
    'ota.updateRequired': '需要更新',
    'ota.updateReady': '更新已準備就緒。重新啟動以套用。',
    'ota.restart': '重新啟動',
    'ota.later': '稍後',
    'ota.downloading': '正在下載更新...',

    // UI elements
    'ui.mute': '靜音',
    'ui.unmute': '取消靜音',
    'ui.help': '說明',
    'ui.about': '關於',
  }
};

let currentLang = 'en';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('2048-language', lang);
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key, params) {
  let str = translations[currentLang]?.[key] || translations['en'][key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export function applyLanguage(lang) {
  setLanguage(lang);

  // Apply translations to all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Apply translations to aria labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });

  // Apply translations to placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
}

/**
 * Detect system locale and return 'zh' or 'en'
 */
export function detectSystemLocale() {
  const browserLang = navigator.language || navigator.userLanguage || 'en';

  // Check if system locale starts with 'zh' (zh-TW, zh-CN, zh-HK, etc.)
  if (browserLang.toLowerCase().startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}

/**
 * Get initial language: localStorage → system locale → 'en'
 */
export function getInitialLanguage() {
  // 1. Check localStorage first
  const savedLang = localStorage.getItem('2048-language');
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }

  // 2. Detect system locale
  const systemLang = detectSystemLocale();

  // 3. Save detected locale to localStorage for future visits
  localStorage.setItem('2048-language', systemLang);

  return systemLang;
}

// Initialize language from localStorage or system locale
const initialLang = getInitialLanguage();
setLanguage(initialLang);
