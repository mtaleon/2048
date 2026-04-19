import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { Board } from './board.js';
import { Tile } from './tile.js';
import { DIRECTIONS } from './constants.js';

describe('Board', () => {
  describe('initialization', () => {
    it('should create empty 4x4 grid', () => {
      const board = new Board();
      assert.strictEqual(board.size, 4);
      assert.strictEqual(board.tiles.length, 0);
      assert.strictEqual(board.getAvailableCells().length, 16);
    });
  });

  describe('prepareTiles()', () => {
    it('should save current positions as previous', () => {
      const board = new Board();
      const tile = new Tile(2, 1, 1);
      board._addTile(tile);

      tile.x = 2;
      tile.y = 2;
      board.prepareTiles();

      assert.strictEqual(tile.prevX, 2);
      assert.strictEqual(tile.prevY, 2);
    });
  });

  describe('move() - basic movement', () => {
    it('should move tile left to edge', () => {
      const board = new Board();
      const tile = new Tile(2, 2, 1);
      board._addTile(tile);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(tile.x, 0);
      assert.strictEqual(tile.y, 1);
      assert.strictEqual(tile.prevX, 2); // Previous position saved
    });

    it('should move tile up to edge', () => {
      const board = new Board();
      const tile = new Tile(2, 1, 2);
      board._addTile(tile);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.UP);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(tile.x, 1);
      assert.strictEqual(tile.y, 0);
    });

    it('should not move tile if already at edge', () => {
      const board = new Board();
      const tile = new Tile(2, 0, 0);
      board._addTile(tile);

      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, false);
    });

    it('should move multiple tiles in same direction', () => {
      const board = new Board();
      const tile1 = new Tile(2, 2, 0);
      const tile2 = new Tile(4, 3, 1);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(tile1.x, 0);
      assert.strictEqual(tile2.x, 0);
    });
  });

  describe('move() - merging', () => {
    it('should merge two adjacent tiles with same value', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 1, 0);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 1);
      assert.strictEqual(result.merges[0].tile.value, 4);
      assert.strictEqual(board.tiles.length, 1); // 2 tiles → 1 merged tile
    });

    it('should merge tiles that collide after movement', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 3, 0);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 1);
      assert.strictEqual(result.merges[0].tile.value, 4);
      assert.strictEqual(result.merges[0].tile.x, 0);
    });

    it('should not merge tiles with different values', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(4, 1, 0);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, false); // Already at edge
      assert.strictEqual(result.merges.length, 0);
      assert.strictEqual(board.tiles.length, 2);
    });

    it('should merge-once-per-turn: [2][2][2] → [4][2] not [8]', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 1, 0);
      const tile3 = new Tile(2, 2, 0);
      board._addTile(tile1);
      board._addTile(tile2);
      board._addTile(tile3);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 1);
      assert.strictEqual(board.tiles.length, 2); // [4] + [2]

      // Find the tiles
      const tile4 = board.tiles.find(t => t.value === 4);
      const tile2remaining = board.tiles.find(t => t.value === 2);

      assert.ok(tile4, 'Should have merged tile with value 4');
      assert.ok(tile2remaining, 'Should have unmerged tile with value 2');
      assert.strictEqual(tile4.x, 0);
      assert.strictEqual(tile2remaining.x, 1);
    });

    it('should mark merged tile with merged=true', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 1, 0);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      const merged = result.merges[0].tile;
      assert.strictEqual(merged.merged, true);
    });
  });

  describe('move() - complex scenarios', () => {
    it('should handle [2][2][4][4] → [4][8]', () => {
      const board = new Board();
      board._addTile(new Tile(2, 0, 0));
      board._addTile(new Tile(2, 1, 0));
      board._addTile(new Tile(4, 2, 0));
      board._addTile(new Tile(4, 3, 0));

      board.prepareTiles();
      const result = board.move(DIRECTIONS.LEFT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 2);
      assert.strictEqual(board.tiles.length, 2);

      const tiles = board.tiles.sort((a, b) => a.value - b.value);
      assert.strictEqual(tiles[0].value, 4);
      assert.strictEqual(tiles[0].x, 0);
      assert.strictEqual(tiles[1].value, 8);
      assert.strictEqual(tiles[1].x, 1);
    });

    it('should move tiles right correctly', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 1, 0);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.RIGHT);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 1);

      const merged = result.merges[0].tile;
      assert.strictEqual(merged.value, 4);
      assert.strictEqual(merged.x, 3); // Merged at right edge
    });

    it('should move tiles down correctly', () => {
      const board = new Board();
      const tile1 = new Tile(2, 0, 0);
      const tile2 = new Tile(2, 0, 1);
      board._addTile(tile1);
      board._addTile(tile2);

      board.prepareTiles();
      const result = board.move(DIRECTIONS.DOWN);

      assert.strictEqual(result.moved, true);
      assert.strictEqual(result.merges.length, 1);

      const merged = result.merges[0].tile;
      assert.strictEqual(merged.value, 4);
      assert.strictEqual(merged.y, 3); // Merged at bottom edge
    });
  });

  describe('addRandomTile()', () => {
    it('should add tile to empty cell', () => {
      const board = new Board();
      const tile = board.addRandomTile();

      assert.ok(tile);
      assert.strictEqual(board.tiles.length, 1);
      assert.ok([2, 4].includes(tile.value));
      assert.strictEqual(tile.isNew, true);
    });

    it('should return null when board is full', () => {
      const board = new Board();

      // Fill board
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          board._addTile(new Tile(2, x, y));
        }
      }

      const tile = board.addRandomTile();
      assert.strictEqual(tile, null);
    });
  });

  describe('hasWon()', () => {
    it('should return true when 2048 tile exists', () => {
      const board = new Board();
      board._addTile(new Tile(2048, 0, 0));

      assert.strictEqual(board.hasWon(), true);
    });

    it('should return false when no 2048 tile', () => {
      const board = new Board();
      board._addTile(new Tile(1024, 0, 0));
      board._addTile(new Tile(1024, 1, 0));

      assert.strictEqual(board.hasWon(), false);
    });
  });

  describe('hasMovesAvailable()', () => {
    it('should return true when empty cells exist', () => {
      const board = new Board();
      board._addTile(new Tile(2, 0, 0));

      assert.strictEqual(board.hasMovesAvailable(), true);
    });

    it('should return true when merge is possible', () => {
      const board = new Board();

      // Fill board with pattern that has adjacent matches
      board._addTile(new Tile(2, 0, 0));
      board._addTile(new Tile(2, 1, 0)); // Can merge
      board._addTile(new Tile(4, 2, 0));
      board._addTile(new Tile(8, 3, 0));
      // ... fill rest with different values

      assert.strictEqual(board.hasMovesAvailable(), true);
    });

    it('should return false when no moves possible', () => {
      const board = new Board();

      // Fill board with checkerboard pattern (no adjacent matches)
      // 2 4 2 4
      // 4 2 4 2
      // 2 4 2 4
      // 4 2 4 2
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const val = (x + y) % 2 === 0 ? 2 : 4;
          board._addTile(new Tile(val, x, y));
        }
      }

      assert.strictEqual(board.hasMovesAvailable(), false);
    });
  });

  describe('getTileAt()', () => {
    it('should return tile at position', () => {
      const board = new Board();
      const tile = new Tile(2, 1, 1);
      board._addTile(tile);

      assert.strictEqual(board.getTileAt(1, 1), tile);
    });

    it('should return null for empty cell', () => {
      const board = new Board();
      assert.strictEqual(board.getTileAt(0, 0), null);
    });

    it('should return null for out of bounds', () => {
      const board = new Board();
      assert.strictEqual(board.getTileAt(-1, 0), null);
      assert.strictEqual(board.getTileAt(4, 0), null);
    });
  });
});
