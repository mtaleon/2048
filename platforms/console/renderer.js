/**
 * Console Renderer - Beautiful terminal rendering with Unicode borders and colors
 */

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Tile colors matching web version
  tile2: '\x1b[48;2;238;228;218m\x1b[38;2;119;110;101m',      // Light beige bg, dark text
  tile4: '\x1b[48;2;237;224;200m\x1b[38;2;119;110;101m',      // Slightly darker beige
  tile8: '\x1b[48;2;242;177;121m\x1b[38;2;249;246;242m',      // Orange, white text
  tile16: '\x1b[48;2;245;149;99m\x1b[38;2;249;246;242m',      // Darker orange
  tile32: '\x1b[48;2;246;124;95m\x1b[38;2;249;246;242m',      // Red-orange
  tile64: '\x1b[48;2;246;94;59m\x1b[38;2;249;246;242m',       // Red
  tile128: '\x1b[48;2;237;207;114m\x1b[38;2;249;246;242m',    // Yellow
  tile256: '\x1b[48;2;237;204;97m\x1b[38;2;249;246;242m',     // Gold
  tile512: '\x1b[48;2;237;200;80m\x1b[38;2;249;246;242m',     // Dark gold
  tile1024: '\x1b[48;2;237;197;63m\x1b[38;2;249;246;242m',    // Orange-gold
  tile2048: '\x1b[48;2;237;194;46m\x1b[38;2;249;246;242m',    // Bright gold
  tileSuper: '\x1b[48;2;60;58;50m\x1b[38;2;249;246;242m',     // Dark for >2048

  empty: '\x1b[48;2;205;193;180m\x1b[38;2;205;193;180m',      // Empty cell
  background: '\x1b[48;2;187;173;160m',                        // Board background

  // UI colors
  title: '\x1b[38;2;237;194;46m',  // Gold
  score: '\x1b[38;2;119;110;101m', // Dark gray
  text: '\x1b[38;2;249;246;242m',  // White
};

// Pretty Unicode box-drawing characters
const BOX = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  cross: '╬',
  teeDown: '╦',
  teeUp: '╩',
  teeRight: '╠',
  teeLeft: '╣',
};

export class ConsoleRenderer {
  constructor() {
    this.size = 4;
    this.cellWidth = 8;
    this.cellHeight = 3;
  }

  /**
   * Initialize renderer (no container needed for console)
   */
  initialize() {
    // Clear screen
    this.clearScreen();
  }

  /**
   * Clear terminal screen
   */
  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[H');
  }

  /**
   * Move cursor to position
   */
  moveCursor(x, y) {
    process.stdout.write(`\x1b[${y};${x}H`);
  }

  /**
   * Get tile color based on value
   */
  getTileColor(value) {
    if (value === 0) return COLORS.empty;
    const key = `tile${value}`;
    return COLORS[key] || COLORS.tileSuper;
  }

  /**
   * Render entire board
   */
  renderBoard(board) {
    this.clearScreen();
    this.renderTitle();
    this.renderGrid(board);
    this.renderControls();
  }

  /**
   * Render title
   */
  renderTitle() {
    const title = `
${COLORS.title}${COLORS.bold}
╔═══════════════════════════════════════╗
║              2048 GAME                ║
╚═══════════════════════════════════════╝
${COLORS.reset}
`;
    console.log(title);
  }

  /**
   * Render the game grid with pretty borders
   */
  renderGrid(board) {
    const tiles = board.tiles;
    const grid = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

    // Place tiles in grid
    tiles.forEach(tile => {
      grid[tile.y][tile.x] = tile;
    });

    // Build the grid string
    let output = '';

    // Top border
    output += '    ' + BOX.topLeft;
    for (let col = 0; col < this.size; col++) {
      output += BOX.horizontal.repeat(this.cellWidth);
      if (col < this.size - 1) output += BOX.teeDown;
    }
    output += BOX.topRight + '\n';

    // Rows
    for (let row = 0; row < this.size; row++) {
      // Cell content (centered vertically)
      for (let line = 0; line < this.cellHeight; line++) {
        output += '    ' + BOX.vertical;

        for (let col = 0; col < this.size; col++) {
          const tile = grid[row][col];
          const value = tile ? tile.value : 0;
          const color = this.getTileColor(value);

          if (line === Math.floor(this.cellHeight / 2)) {
            // Middle line - show value
            const text = value === 0 ? '' : value.toString();
            const padding = Math.floor((this.cellWidth - text.length) / 2);
            const paddedText = ' '.repeat(padding) + text + ' '.repeat(this.cellWidth - padding - text.length);
            output += color + COLORS.bold + paddedText + COLORS.reset;
          } else {
            // Empty line
            output += color + ' '.repeat(this.cellWidth) + COLORS.reset;
          }

          output += BOX.vertical;
        }
        output += '\n';
      }

      // Row separator or bottom border
      if (row < this.size - 1) {
        output += '    ' + BOX.teeRight;
        for (let col = 0; col < this.size; col++) {
          output += BOX.horizontal.repeat(this.cellWidth);
          if (col < this.size - 1) output += BOX.cross;
        }
        output += BOX.teeLeft + '\n';
      }
    }

    // Bottom border
    output += '    ' + BOX.bottomLeft;
    for (let col = 0; col < this.size; col++) {
      output += BOX.horizontal.repeat(this.cellWidth);
      if (col < this.size - 1) output += BOX.teeUp;
    }
    output += BOX.bottomRight + '\n';

    console.log(output);
  }

  /**
   * Render controls help
   */
  renderControls() {
    const controls = `
${COLORS.dim}Controls:${COLORS.reset}
  ${COLORS.bold}↑/W${COLORS.reset} Up     ${COLORS.bold}↓/S${COLORS.reset} Down
  ${COLORS.bold}←/A${COLORS.reset} Left   ${COLORS.bold}→/D${COLORS.reset} Right
  ${COLORS.bold}Q${COLORS.reset}   Quit   ${COLORS.bold}R${COLORS.reset}   Restart
`;
    console.log(controls);
  }

  /**
   * Update score display
   */
  updateScore(score, bestScore) {
    // Move cursor to score position (line 2)
    this.moveCursor(45, 3);
    process.stdout.write(`${COLORS.score}Score: ${COLORS.bold}${score}${COLORS.reset}  `);
    process.stdout.write(`${COLORS.score}Best: ${COLORS.bold}${bestScore}${COLORS.reset}`);
  }

  /**
   * Animate tile movement (for console, just re-render)
   */
  animateMove(tiles) {
    // Console rendering is instant, no animation
  }

  /**
   * Animate tile merging (for console, just re-render)
   */
  animateMerge(merges) {
    // Console rendering is instant, no animation
  }

  /**
   * Animate new tile spawn (for console, just re-render)
   */
  animateSpawn(tile) {
    // Console rendering is instant, no animation
  }

  /**
   * Show game over message
   */
  showGameOver(won) {
    const message = won
      ? `\n${COLORS.title}${COLORS.bold}🎉 You Win! You reached 2048! 🎉${COLORS.reset}\n`
      : `\n${COLORS.dim}Game Over! No more moves available.${COLORS.reset}\n`;
    console.log(message);
  }

  /**
   * Cleanup renderer resources
   */
  cleanup() {
    // Reset terminal colors
    process.stdout.write(COLORS.reset);
  }
}
