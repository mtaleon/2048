# Console Platform for 2048

Beautiful terminal/console implementation of the 2048 game with:
- ✨ Pretty Unicode box-drawing borders (╔═╗║╚╝╬)
- 🎨 ANSI color codes matching the web version
- ⌨️  Arrow keys and WASD support
- 🎮 Instant rendering (no animation delays)

## Running the Console Version

```bash
npm run console
# or
npm run play
# or
node console-app.js
```

## Controls

- **Arrow Keys** or **WASD**: Move tiles
- **R**: Restart game
- **Q** or **Ctrl+C**: Quit

## Architecture

The console platform follows the same 3-layer architecture as the web platform:

### Layer 1: Core (Shared)
Uses the same pure JavaScript game logic from `core/`:
- `board.js` - Grid management
- `game.js` - Game lifecycle
- `tile.js` - Tile data structures
- `events.js` - Event bus

### Layer 2: Platform Abstraction (Shared)
Implements the platform interfaces from `platform/`:
- `IRenderer` - Rendering contract
- `IInput` - Input handling contract
- `IAudio` - Audio contract

### Layer 3: Console Implementation
Platform-specific implementations in `platforms/console/`:

#### `renderer.js`
- **ANSI Colors**: RGB color codes matching web tiles
- **Unicode Borders**: Pretty box-drawing characters (╔═╗║╚╝╬╠╣╦╩)
- **Grid Layout**: 4×4 grid with 8-char wide cells, 3-line tall cells
- **Score Display**: Positioned in title area using cursor movement

**Tile Colors:**
- 2, 4: Beige tones
- 8-64: Orange-red gradient
- 128-2048: Yellow-gold gradient
- >2048: Dark background

#### `input.js`
- **Raw Mode**: Captures keypresses without requiring Enter
- **Arrow Keys**: Standard terminal escape sequences (ESC[A/B/C/D)
- **WASD**: Alternative controls
- **Graceful Exit**: Cleanup on Ctrl+C or Q

#### `audio.js`
- **Stub Implementation**: No sound in terminal mode
- **Optional**: Could add system bell (\x07) for feedback

## Technical Details

### Terminal Requirements
- **UTF-8 encoding**: For Unicode box-drawing characters
- **True color support**: For RGB ANSI codes (most modern terminals)
- **Raw mode**: For capturing keypresses

### Tested Terminals
- ✅ macOS Terminal.app
- ✅ iTerm2
- ✅ VS Code integrated terminal
- ✅ Most Linux terminals (GNOME Terminal, Konsole, etc.)
- ⚠️ Windows CMD (limited color support, use Windows Terminal instead)

### Performance
- **Instant rendering**: No animation delays (0ms)
- **Efficient**: Only re-renders on state changes
- **Lightweight**: No dependencies beyond Node.js built-ins

## Rendering Example

```
╔═══════════════════════════════════════╗
║              2048 GAME                ║
╚═══════════════════════════════════════╝

    ╔════════╦════════╦════════╦════════╗
    ║        ║        ║   2    ║   4    ║
    ║        ║        ║        ║        ║
    ║        ║        ║        ║        ║
    ╠════════╬════════╬════════╬════════╣
    ║        ║   8    ║  16    ║  32    ║
    ║        ║        ║        ║        ║
    ║        ║        ║        ║        ║
    ╠════════╬════════╬════════╬════════╣
    ║  64    ║  128   ║  256   ║  512   ║
    ║        ║        ║        ║        ║
    ║        ║        ║        ║        ║
    ╠════════╬════════╬════════╬════════╣
    ║ 1024   ║ 2048   ║        ║        ║
    ║        ║        ║        ║        ║
    ║        ║        ║        ║        ║
    ╚════════╩════════╩════════╩════════╝

Controls:
  ↑/W Up     ↓/S Down
  ←/A Left   →/D Right
  Q   Quit   R   Restart
```

## Advantages over Web Version

1. **Lightweight**: No browser, no HTML, no CSS
2. **Fast**: Instant startup, no page load
3. **Scriptable**: Can be automated or integrated into other tools
4. **Portable**: Works anywhere with Node.js
5. **Retro**: Classic terminal aesthetic

## Future Enhancements

Potential improvements:
- [ ] Color themes (classic, dark, solarized)
- [ ] Animation support (smooth tile movement)
- [ ] Sound effects (system beep on moves)
- [ ] Save/load game state to file
- [ ] Replay mode
- [ ] Statistics tracking
- [ ] Multiplayer over network
- [ ] AI solver integration

## Comparison with Web Version

| Feature | Console | Web |
|---------|---------|-----|
| **Rendering** | ANSI + Unicode | HTML + CSS |
| **Animation** | Instant | Smooth CSS transitions |
| **Input** | Keyboard only | Keyboard + Touch + Gamepad |
| **Audio** | None (stub) | Web Audio API |
| **Offline** | Always | PWA with service worker |
| **Install** | npm install | Add to Home Screen |
| **Performance** | Instant | Fast |
| **Portability** | Node.js | Any browser |

## Development

The console platform demonstrates the power of the 3-layer architecture:
- **Same core logic**: Zero changes to game rules
- **Clean separation**: Platform-specific code isolated
- **Easy testing**: No DOM, no browser required

This makes it easy to create new platforms (Canvas, Native, React Native, etc.) by implementing the three interfaces.
