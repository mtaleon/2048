# 2048 Game

**A sliding tile puzzle game** - Combine tiles to reach 2048! Built with a clean, platform-agnostic architecture that runs on web and mobile.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎮 Features

- **🌐 Progressive Web App (PWA)** - Install on your device, works offline
- **📱 Cross-Platform** - Web browser, Android app (iOS coming soon)
- **⌨️ Multiple Input Methods** - Keyboard (Arrow keys, WASD), touch swipe, gamepad support
- **🎨 Responsive Design** - Adapts to mobile portrait, landscape, and desktop
- **🔊 Sound Effects** - Synthesized audio feedback with mute toggle
- **💾 Score Persistence** - Best score saved locally
- **🎯 Smooth Animations** - GPU-accelerated CSS transforms
- **🧪 Well-Tested** - 45 unit tests covering core game logic

## 🕹️ How to Play

1. Use **arrow keys** or **WASD** to move tiles
2. When two tiles with the same number touch, they **merge into one**
3. Reach the **2048 tile** to win!
4. Keep playing to reach higher tiles (4096, 8192...)

**Scoring:** Each merge adds the new tile's value to your score.

## 🚀 Quick Start

### Play Online

Visit the live demo: **[Your GitLab Pages URL]** (Coming soon after deployment)

Or run locally:

```bash
# Clone repository
git clone https://github.com/yourusername/2048.git
cd 2048

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8000 in your browser
```

### Install as PWA

1. Visit the web app in Chrome, Edge, or Safari
2. Click the **install prompt** or menu → "Install 2048"
3. App launches as standalone application
4. Works offline after first visit!

## 📱 Platforms

### Web (Browser)

**Requirements:** Modern browser with ES modules support (Chrome 61+, Firefox 60+, Safari 11+)

**Run locally:**
```bash
npm run dev
# Open http://localhost:8000
```

### Android

**Download APK:**
- Check [Releases](https://github.com/yourusername/2048/releases) for latest APK
- Or build locally (see below)

**Build locally:**
```bash
# Requirements: Node.js 22+, Android Studio, JDK 21

# Build debug APK
npm run android:build

# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Open in Android Studio
npm run android:open
```

See [ANDROID.md](ANDROID.md) for detailed Android build instructions.

### iOS (Coming Soon)

iOS support is planned. The architecture supports it - just needs Capacitor iOS platform added.

## 🎮 Controls

### Keyboard
- **Arrow Keys** or **WASD** - Move tiles in direction
- **Spacebar** - (Reserved for future features)

### Touch/Mouse
- **Swipe** - Swipe in any direction to move tiles
- **Tap buttons** - New Game, Mute

### Gamepad (Experimental)
- **D-Pad / Left Stick** - Move tiles
- **A button** - (Reserved for future features)

## 🏗️ Architecture

Built with a **3-layer architecture** for cross-platform support:

### Layer 1: Core Game Logic (`core/`)
- **Pure JavaScript** with zero DOM dependencies
- Runs in any JS environment (Node.js, browser, mobile)
- Fully unit tested (45 tests)
- Platform-agnostic design

### Layer 2: Platform Abstraction (`platform/`)
- Interfaces for renderer, input, and audio
- Dependency injection pattern
- Easy to add new platforms

### Layer 3: Platform Implementations (`platforms/`)
- `web-dom/` - Web browser implementation
  - CSS Grid + CSS transforms for rendering
  - Keyboard + touch input
  - Web Audio API for sound effects
  - Responsive design

This architecture allows the same core game to run on **web, Android, iOS, desktop, or even terminal** by implementing platform interfaces.

## 🛠️ Development

### Prerequisites
- **Node.js 22+** (for ES modules and native test runner)
- **npm** or **yarn**

### Setup
```bash
git clone https://github.com/yourusername/2048.git
cd 2048
npm install
```

### Commands
```bash
npm test              # Run unit tests
npm run dev           # Start development server (port 8000)
npm run build         # Build for production (outputs to www/)
```

### Testing
```bash
npm test              # Run all tests
# Tests use Node.js built-in test runner (--test flag)
# 45 tests covering core game logic
```

### Project Structure
```
2048/
├── core/              # Pure game logic (platform-agnostic)
│   ├── constants.js
│   ├── events.js
│   ├── tile.js
│   ├── board.js
│   ├── game.js
│   └── *.test.js
├── platform/          # Platform interfaces
│   ├── IRenderer.js
│   ├── IInput.js
│   ├── IAudio.js
│   └── platform.js
├── platforms/
│   └── web-dom/       # Web implementation
│       ├── renderer.js
│       ├── input.js
│       ├── audio.js
│       ├── ui.js
│       └── styles.css
├── app.js             # Application entry point
├── index.html         # HTML template
├── manifest.json      # PWA manifest
├── sw.js              # Service worker
└── package.json
```

## 🚢 Deployment

### Web (GitLab Pages)

**Automatic deployment** via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions mirrors code to GitLab
3. GitLab CI builds and deploys to Pages
4. Visit: `https://username.gitlab.io/2048`

**Setup:**
Configure GitHub secrets: `GITLAB_DEPLOY_TOKEN`, `GITLAB_DEPLOY_USERNAME`, `GITLAB_REPO_URL`

See [.github/workflows/deploy-gitlab.yml](.github/workflows/deploy-gitlab.yml)

### Android (GitHub Releases)

**Automatic APK builds** via GitHub Actions:

1. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub Actions builds release APK
3. Creates GitHub release with APK attached
4. Download from Releases page

See [.github/workflows/android-build.yml](.github/workflows/android-build.yml)

### Self-Hosting

```bash
# Build production files
npm run build

# Serve www/ directory with any static file server
cd www
python3 -m http.server 8080
# or
npx serve
```

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. **Keep core pure** - No DOM/platform-specific code in `core/`
2. **Write tests** - Add tests for new features in core logic
3. **Follow architecture** - Use event bus for core-platform communication
4. **Test platforms** - Verify changes work on web and Android

### Areas for Contribution
- [ ] iOS platform support
- [ ] Terminal/CLI renderer
- [ ] Undo functionality
- [ ] Leaderboard/multiplayer
- [ ] Different board sizes (3×3, 5×5)
- [ ] Themes and customization
- [ ] More sound effects
- [ ] Internationalization (i18n)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Credits

- **Game concept**: Original 2048 by Gabriele Cirulli
- **Architecture**: Inspired by clean architecture principles
- **Built with**: Vanilla JavaScript, Capacitor, Web Audio API

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Architecture guide for developers and Claude Code
- **[ANDROID.md](ANDROID.md)** - Android build and deployment guide
- **[.github/workflows/](.github/workflows/)** - CI/CD workflows

## 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/yourusername/2048/issues) with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Platform (web/Android) and browser/device info

## 💡 Feature Requests

Have an idea? [Open an issue](https://github.com/yourusername/2048/issues) with the "enhancement" label!

## ⭐ Show Your Support

If you like this project, please give it a ⭐ on GitHub!

---

**Made with ❤️ and clean architecture**
