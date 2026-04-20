
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**2048** is a classic sliding tile puzzle game implemented with a platform-agnostic architecture.

Within the **Octile Universe**, this project serves as a **free entry puzzle**, designed to:
- provide immediate, intuitive gameplay without tutorial friction
- introduce calm, logic-driven thinking
- act as a low-friction gateway into deeper Octile experiences

This game is intentionally **not positioned as a competitive or score-driven product**.

---

## Octile Universe Context (Important)

This 2048 implementation is a **free entry game** within the Octile Universe.

Design intent:
- calm
- reflective
- non-competitive
- respectful of player intelligence

The purpose is NOT:
- to promote high scores
- to encourage speed or performance comparison
- to create tension or urgency

The game should feel **complete**, but intentionally **not as deep or long-term** as Octile.

---

## Explicit Non‑Goals (Do NOT Add)

The following are intentionally avoided:

- Leaderboards or online rankings
- Time pressure mechanics
- Competitive framing (“best score”, “beat your record” emphasis)
- Daily challenges, streaks, or meta progression
- Gamified rewards or hype‑driven feedback
- Aggressive animations or celebratory effects

If a feature increases urgency, comparison, or excitement,
it likely does NOT belong in this project.

---

## UI / Tone Alignment (Octile Universe)

### Tone Guidelines

UI copy and feedback must be:
- calm
- neutral
- restrained
- informational

Avoid:
- exclamation marks
- “Game Over” dramatization
- praise‑heavy or failure‑heavy messaging
- imperative calls to action (“Try Again”, “Beat your best”)

Preferred framing:
- neutral state descriptions
- quiet transitions
- respectful closure

Example:
❌ “Game Over! No more moves!”
✅ “No moves available.”

❌ “Try Again”
✅ “New game”

---

## Score & Statistics Philosophy

Scores and statistics exist as **informational feedback only**.

Rules:
- Score must not dominate the visual hierarchy
- “Best” score should be de‑emphasized or hidden by default
- Numbers should support reflection, not competition

**Key principle:** Scores exist for reflection, not comparison.

This game should feel like **playing with numbers**, not chasing them.

---

## Cross‑Promotion Rules (2048 → Octile)

This project may reference Octile in a **single, soft, non‑intrusive location**.

Rules:
- At most ONE entry point
- Only after a satisfaction or completion state
- Not mid‑play
- No buttons, no calls to action

Allowed phrasing example:
> “This type of puzzle can be explored more deeply in Octile.”

The goal is awareness, not conversion.



## Core Architecture: 3-Layer Design

The codebase is organized into three distinct layers to enable cross-platform support:

### Layer 1: Core Game Logic (`core/`)
Pure JavaScript with **zero DOM/UI dependencies**. Can run in any JavaScript environment (Node.js, browser, React Native).

- **`constants.js`**: Game configuration, tile colors, animation timing, SeededRandom class, **sleep helper for async timing**
- **`events.js`**: Simple event bus for decoupling core from platform (pub-sub pattern)
- **`tile.js`**: Tile data structure with prevX/prevY for animation support, createTile factory
- **`board.js`**: 4×4 grid management, movement algorithm, merge detection, win/lose conditions
- **`game.js`**: Game lifecycle orchestration, score tracking, storage adapter pattern, async move()

### Layer 2: Platform Abstraction (`platform/`)
Interfaces that core logic calls but doesn't implement:

- **`IRenderer.js`**: Rendering contract (renderBoard, animateMove, animateMerge, animateSpawn)
- **`IInput.js`**: Input contract (initialize, enable, disable, cleanup)
- **`IAudio.js`**: Audio contract (playSound, setMuted, isMuted)
- **`platform.js`**: Dependency injection container for platform components

### Layer 3: Platform Implementations (`platforms/`)
Concrete implementations for specific platforms. **Easy to swap or add new platforms** (Canvas, Terminal, Native, etc.).

**Web DOM Platform** (`platforms/web-dom/`)
- **`renderer.js`**: CSS Grid + CSS transforms for tiles, responsive sizing, animation from prevX/prevY → x/y
- **`input.js`**: Unified keyboard (Arrow keys, WASD) and touch swipe detection, modal-aware input blocking
- **`audio.js`**: Web Audio API synthesis for sound effects, persists mute state to localStorage
- **`ui.js`**: Win/lose modals, controls, mute button
- **`styles.css`**: Responsive CSS Grid, tile animations (spawn, merge, move), mobile-friendly

**Console Platform** (`platforms/console/`)
- **`renderer.js`**: Terminal rendering with pretty Unicode borders (╔═╗║╚╝╬), ANSI RGB colors matching web tiles
- **`input.js`**: Raw keyboard input (Arrow keys, WASD, R for restart, Q for quit)
- **`audio.js`**: Stub implementation (no sound in terminal)
- **Entry**: `console-app.js` - Node.js entry point with FileStorage adapter

**Critical: Event Flow**
```
User Input (input.js) → Core Game (game.js) → Event Bus → Platform Listeners (renderer/audio/ui)
```

Example: User presses arrow key → `input.js` calls `game.move()` → Core validates move → Emits `tiles:moved` event → `renderer.js` animates movement, `audio.js` plays sound, score updates.

## Common Commands

### Development
```bash
npm test                    # Run all core tests (Node.js native test runner)
npm run console            # Play in terminal (pretty Unicode borders!)
npm run play               # Alias for console
npm run dev                 # Start local web server on port 8000
npm run build              # Build for production (copies to www/)
```

### Android
```bash
npm run android:prepare    # Build + sync to Android project
npm run android:build      # Build debug APK
npm run android:release    # Build release APK (requires signing)
npm run android:open       # Open in Android Studio
```

**Output**: `android/app/build/outputs/apk/debug/app-debug.apk`

See [ANDROID.md](ANDROID.md) for detailed Android setup and troubleshooting.

## Key Design Patterns

### 1. Platform-Agnostic Core
**Rule**: Core modules (`core/`) must never import from `platform/` or `platforms/`. They communicate only via event emission.

**Why**: Enables the same game logic to run on any platform (web, mobile, terminal, native) by implementing platform interfaces.

### 2. Event-Driven Communication
Core game emits events, platform modules listen:
- `game:started` → Renderer draws board, score initialized
- `tiles:moved` → Renderer animates movement, audio plays move/merge sound
- `tile:spawned` → Renderer animates spawn, audio plays spawn sound
- `game:won` → Audio plays win sound, UI shows modal
- `game:lost` → Audio plays lose sound, UI shows modal
- `move:invalid` → Audio plays invalid sound

**Implementation**: `core/events.js` (simple pub-sub)

### 3. Storage Adapter Pattern (Fix #1)
Core doesn't directly use `localStorage` (breaks purity). Game accepts storage interface:
```javascript
// core/game.js - Core stays pure
class InMemoryStorage {
  constructor() { this.data = {}; }
  getItem(key) { return this.data[key] || null; }
  setItem(key, value) { this.data[key] = value; }
}

export class Game {
  constructor(eventBus, size = 4, storage = null) {
    this.storage = storage || new InMemoryStorage();
  }
}

// app.js - Web platform injects localStorage
class LocalStorageAdapter {
  getItem(key) { return localStorage.getItem(key); }
  setItem(key, value) { localStorage.setItem(key, value); }
}

const game = new Game(eventBus, 4, new LocalStorageAdapter());
```

### 4. Async Move with Timing Injection (Fix #2)
Use async/await instead of setTimeout for easier testing:
```javascript
// core/constants.js
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// core/game.js
export class Game {
  constructor(eventBus, size = 4, storage = null, animationDelay = 200) {
    this.animationDelay = animationDelay;  // Inject 0 for tests
  }

  async move(direction) {
    // ... move logic
    await sleep(this.animationDelay);
    // ... spawn new tile
  }
}

// Browser usage (fire and forget)
game.move(DIRECTIONS.LEFT);

// Test usage (sequential)
const game = new Game(eventBus, 4, storage, 0);
await game.move(DIRECTIONS.LEFT);
assert(game.score === 4);
```

### 5. Seeded Randomness
Tile spawn uses `SeededRandom` class (LCG algorithm) for reproducible games:
```javascript
game.start({ seed: 12345 }); // Same game every time
```

### 6. Input Locking
`game.inputLocked` flag prevents race conditions during animations. Input handlers check `this.modalShown` to block input during modals.

### 7. Merge-Once-Per-Turn (Fix #3)
Tiles can only merge once per turn. Newly merged tiles are marked `merged=true` to prevent double-merging:
```javascript
// Example: [2][2][2] moving LEFT
// Result: [4][2][_][_]  (NOT [8][_][_][_])
if (next && next.value === tile.value && !next.merged) {
  const merged = new Tile(tile.value * 2, positions.next.x, positions.next.y);
  merged.merged = true;  // ⚠️ CRITICAL: Mark immediately
  // ...
}
```

### 8. Position Preparation for Animation (Fix #4)
`board.prepareTiles()` saves current positions as previous BEFORE move, enabling smooth animations:
```javascript
// core/game.js
async move(direction) {
  this.board.prepareTiles();  // ✅ Save positions BEFORE move
  const { moved, merges } = this.board.move(direction);
  // ...
}

// platforms/web-dom/renderer.js
_createTileElement(tile) {
  const startX = tile.prevX !== undefined ? tile.prevX : tile.x;
  el.style.setProperty('--x', startX);  // Start at previous position
}

animateMove(tiles) {
  tiles.forEach(tile => {
    el.style.setProperty('--x', tile.x);  // Animate to new position
  });
}
```

## Critical Architecture Details

### Movement Algorithm (`board.js`)
```javascript
move(direction) {
  const { dx, dy } = direction;
  const vector = { x: dx, y: dy };
  
  // 1. Build traversal order (iterate from direction edge)
  const traversals = this._buildTraversals(vector);
  
  // 2. Clear merge flags from previous turn
  this.tiles.forEach(t => { t.merged = false; });
  
  // 3. Process each cell in traversal order
  traversals.y.forEach(y => {
    traversals.x.forEach(x => {
      const tile = this.getTileAt(x, y);
      if (!tile) return;
      
      // Find farthest position in direction
      const positions = this._findFarthestPosition(tile, vector);
      const next = this.getTileAt(positions.next.x, positions.next.y);
      
      // CRITICAL: Check !next.merged to prevent double-merge
      if (next && next.value === tile.value && !next.merged) {
        const merged = new Tile(tile.value * 2, positions.next.x, positions.next.y);
        merged.merged = true;  // ⚠️ Mark immediately
        // ... remove old tiles, add merged tile
      } else {
        // Just move tile
        tile.updatePosition(positions.farthest.x, positions.farthest.y);
      }
    });
  });
}
```

**Traversal order determines merge behavior:**
- **LEFT**: iterate x from 0→3, process left edge first
- **RIGHT**: iterate x from 3→0, process right edge first
- **UP**: iterate y from 0→3, process top edge first
- **DOWN**: iterate y from 3→0, process bottom edge first

### Animation Timing
- **Tile movement**: 200ms (CSS transition on transform)
- **Merge animation**: 300ms (CSS scale pulse)
- **Spawn animation**: 200ms (CSS scale from 0 to 1)
- **Input lock duration**: 200ms (matches animation)

### Telemetry Tracking
`game.telemetry` object tracks:
- `moves`: Total moves
- `mergeCount`: Number of merges
- `maxTile`: Highest tile reached
- `startTime`, `endTime`: Timestamps for time calculation

## File Structure Conventions

- **Tests**: Co-located with source files (e.g., `board.test.js` next to `board.js`)
- **Entry point**: `app.js` (wires core + platform together)
- **HTML entry**: `index.html` (loads app.js as ES module)
- **Build output**: `www/` directory (gitignored)

## Adding a New Platform

1. Create `platforms/<platform-name>/` directory
2. Implement `IRenderer`, `IInput`, `IAudio` interfaces
3. Update `app.js` to instantiate new platform components
4. Zero changes needed in `core/` modules

Example: Adding Canvas renderer would create `platforms/web-canvas/renderer.js` implementing `IRenderer` with Canvas 2D/WebGL drawing instead of DOM manipulation.

## PWA & Service Worker (Fix #5)

**Service worker** (`sw.js`) includes `skipWaiting()` and `clients.claim()` for proper updates:
```javascript
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())  // ✅ Force activate immediately
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // ... clean old caches
    .then(() => self.clients.claim())  // ✅ Take control immediately
  );
});
```

**Why this matters:**
- Without `skipWaiting()`: New SW waits for old SW to close (user must close all tabs)
- Without `clients.claim()`: New SW doesn't control existing pages until reload
- With both: Updates apply immediately on next page load

## CI/CD Workflows

### GitHub Actions

**`.github/workflows/android-build.yml`** - Automated Android builds
- Trigger: Push to main, git tags (v*)
- Output: Debug APK as artifact, release APK attached to GitHub releases

**`.github/workflows/deploy-gitlab.yml`** (Fix #6: Mode A)
- Trigger: Push to main
- Action: Mirror source to GitLab → GitLab CI builds and deploys to Pages

### GitLab CI/CD

**`.gitlab-ci.yml`** (Fix #6: Mode A - GitLab builds)
- Image: node:22-alpine
- Actions: `npm ci` → `npm run build` → `mv www public`
- Artifacts: `public/` served as GitLab Pages

**Deployment flow:**
1. Push to GitHub main
2. GitHub Action mirrors source to GitLab
3. GitLab CI picks up `.gitlab-ci.yml` and builds
4. GitLab Pages serves from `public/` directory

**Setup requirements:**
- GitLab repository with CI/CD enabled
- GitHub secrets: `GITLAB_DEPLOY_TOKEN`, `GITLAB_DEPLOY_USERNAME`, `GITLAB_REPO_URL`

## Visual Design Notes

- **Grid**: CSS Grid with 4×4 cells, responsive sizing based on viewport
- **Tiles**: Absolute positioning with CSS transforms for smooth animations
- **Colors**: Different background colors for each tile value (2, 4, 8, ... 2048)
- **Animations**: 
  - Spawn: Scale from 0 to 1 (200ms)
  - Move: Transform position change (200ms)
  - Merge: Scale pulse 1 → 1.1 → 1 (300ms)
- **Responsive**: Adapts to mobile portrait, mobile landscape, desktop
- **Touch-friendly**: Large tap targets, swipe detection with 30px threshold

## Critical Implementation Fixes

### Fix #1: Storage Adapter Pattern
**Problem**: Core shouldn't directly use `localStorage` (breaks purity)  
**Solution**: Game accepts storage interface (defaults to in-memory, web platform injects `LocalStorageAdapter`)

### Fix #2: Async move() for Testing
**Problem**: `setTimeout()` makes Node tests awkward  
**Solution**: `async move()` with `await sleep(animationDelay)`, inject `animationDelay=0` for tests

### Fix #3: Merge-Once-Per-Turn
**Problem**: Tiles could merge multiple times in single turn  
**Solution**: Mark merged tiles `merged=true` immediately, check `!next.merged` before merging

### Fix #4: prepareTiles() for Animations
**Problem**: Renderer needs `prevX/prevY` to animate from old position  
**Solution**: `board.prepareTiles()` saves positions BEFORE `move()`, called by `game.move()`

### Fix #5: Service Worker Updates
**Problem**: SW updates get stuck without explicit activation  
**Solution**: Add `skipWaiting()` in install, `clients.claim()` in activate

### Fix #6: GitLab Pages Mode A
**Problem**: Deployment mode unclear  
**Solution**: GitHub Action mirrors source → GitLab, `.gitlab-ci.yml` in repo handles build

## Testing Strategy

### Unit Tests (Node.js test runner)
```bash
npm test
# Tests:
# - Tile creation with prevX/prevY
# - Board prepareTiles() saves positions
# - Board movement in all 4 directions
# - Merge-once-per-turn (3x[2] → [4][2] not [8])
# - Win condition (2048 tile)
# - Lose condition (no moves available)
# - Score calculation
# - Storage adapter best score persistence
# - Seeded random reproducibility
```

**Testing with async move() and storage adapter:**
```javascript
// core/game.test.js
const storage = new InMemoryStorage();
const game = new Game(eventBus, 4, storage, 0);  // 0ms animation for testing

game.start();
game.board.tiles = [new Tile(2, 0, 0), new Tile(2, 1, 0)];
game.board._updateGrid();

await game.move(DIRECTIONS.LEFT);  // ✅ await for sequential testing

assert.strictEqual(game.score, 4);
```

### Manual Testing
- Browser: Arrow keys, WASD, touch swipe, score persistence, PWA installation, offline mode
- Android: APK on device, touch swipe, performance, app icon, persistence

## Common Pitfalls

### 1. Movement Algorithm Complexity
**Risk**: Incorrect traversal order causes wrong merges  
**Mitigation**: Comprehensive tests, validate against 2048 reference implementation

### 2. Animation Coordination
**Risk**: Timing issues cause visual glitches  
**Mitigation**: Use CSS transitions, lock input during animations, test on real devices

### 3. Touch Input Conflicts
**Risk**: Swipes trigger browser navigation  
**Mitigation**: `preventDefault` on touch events, test on mobile browsers

### 4. Android Build Issues
**Risk**: SDK/Gradle version conflicts  
**Mitigation**: Use exact versions from `capacitor.config.json`, test locally first

### 5. PWA Caching
**Risk**: Stale cache after updates  
**Mitigation**: Version cache name (`2048-v1`), implement `skipWaiting()`/`clients.claim()`

## Performance Considerations

### Optimizations
1. **Rendering**: Use CSS transforms (GPU-accelerated), minimize DOM manipulations, track tiles in Map
2. **Animation**: Use CSS transitions over JavaScript animation, limit concurrent animations
3. **Input**: Lock input during animations, use passive event listeners where possible
4. **Memory**: Clean up event listeners, remove merged tiles from DOM, clear Map entries

## Accessibility Considerations

1. **Keyboard navigation**: Full support via arrow keys and WASD
2. **Screen reader**: ARIA labels for score, buttons, modals
3. **Color contrast**: WCAG AA compliance for tile colors and text
4. **Focus indicators**: Visible focus on interactive elements
5. **Touch targets**: Minimum 44×44px for mobile buttons

## Contributing Guidelines

When contributing to this project:

1. **Maintain architecture**: Keep core pure JavaScript, use event bus for communication
2. **Write tests**: All core logic changes require tests (`npm test` must pass)
3. **Follow patterns**: Use existing patterns (storage adapter, async move, etc.)
4. **Document changes**: Update CLAUDE.md for architectural changes
5. **Test platforms**: Verify web and Android builds work

## Debug Tips

### Browser Console
```javascript
window.game               // Access game instance
window.DIRECTIONS         // Direction constants
game.start({ seed: 123 }) // Reproducible game
game.getState()           // Current game state
```

### Service Worker
```javascript
// Check SW status
navigator.serviceWorker.ready.then(reg => console.log('SW ready:', reg));

// Force update
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.update()));
```

### Android Debugging
```bash
# View Android logs
adb logcat | grep -i capacitor

# Chrome DevTools for WebView
chrome://inspect
```

## Score & Statistics Philosophy
Scores exist for reflection, not comparison.
- Score must not dominate the visual hierarchy
- “Best” is hidden by default
