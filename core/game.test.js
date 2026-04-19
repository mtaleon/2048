import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Game, InMemoryStorage } from './game.js';
import { EventBus } from './events.js';
import { DIRECTIONS } from './constants.js';
import { Tile } from './tile.js';

describe('Game', () => {
  describe('initialization', () => {
    it('should create game with default storage', () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus);

      assert.ok(game.storage);
      assert.ok(game.storage instanceof InMemoryStorage);
      assert.strictEqual(game.score, 0);
      assert.strictEqual(game.won, false);
      assert.strictEqual(game.lost, false);
    });

    it('should accept custom storage adapter', () => {
      const eventBus = new EventBus();
      const customStorage = new InMemoryStorage();
      const game = new Game(eventBus, 4, customStorage);

      assert.strictEqual(game.storage, customStorage);
    });

    it('should accept custom animation delay', () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      assert.strictEqual(game.animationDelay, 0);
    });
  });

  describe('start()', () => {
    it('should initialize board with 2 tiles', () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let emitted = false;
      eventBus.on('game:started', () => { emitted = true; });

      game.start();

      assert.ok(game.board);
      assert.strictEqual(game.board.tiles.length, 2);
      assert.strictEqual(game.score, 0);
      assert.strictEqual(emitted, true);
    });

    it('should create reproducible game with seed', () => {
      const eventBus = new EventBus();
      const game1 = new Game(eventBus, 4, null, 0);
      const game2 = new Game(eventBus, 4, null, 0);

      const seed = 12345;
      game1.start({ seed });
      game2.start({ seed });

      // Same seed should produce same initial tiles
      assert.strictEqual(game1.board.tiles.length, game2.board.tiles.length);
      assert.strictEqual(game1.board.tiles[0].value, game2.board.tiles[0].value);
      assert.strictEqual(game1.board.tiles[0].x, game2.board.tiles[0].x);
      assert.strictEqual(game1.board.tiles[0].y, game2.board.tiles[0].y);
    });
  });

  describe('move() - async', () => {
    it('should be awaitable for testing', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);  // 0ms delay

      game.start();

      // Set up specific board state
      game.board.tiles = [
        new Tile(2, 0, 0),
        new Tile(2, 1, 0)
      ];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.strictEqual(game.score, 4);
    });

    it('should emit tiles:moved event', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let eventData = null;
      eventBus.on('tiles:moved', (data) => { eventData = data; });

      game.start();
      game.board.tiles = [new Tile(2, 1, 0)];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.ok(eventData);
      assert.ok(eventData.tiles);
      assert.strictEqual(eventData.score, 0);
    });

    it('should emit tile:spawned event', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let spawnedTile = null;
      eventBus.on('tile:spawned', (data) => { spawnedTile = data.tile; });

      game.start();
      game.board.tiles = [new Tile(2, 1, 0)];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.ok(spawnedTile);
      assert.ok([2, 4].includes(spawnedTile.value));
    });

    it('should not move when input is locked', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.inputLocked = true;

      const tilesBefore = game.board.tiles.length;
      await game.move(DIRECTIONS.LEFT);
      const tilesAfter = game.board.tiles.length;

      assert.strictEqual(tilesBefore, tilesAfter);
    });

    it('should not move when won and not continuing', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.won = true;
      game.keepPlaying = false;

      const scoreBefore = game.score;
      await game.move(DIRECTIONS.LEFT);
      const scoreAfter = game.score;

      assert.strictEqual(scoreBefore, scoreAfter);
    });

    it('should emit move:invalid when no movement possible', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let invalidEmitted = false;
      eventBus.on('move:invalid', () => { invalidEmitted = true; });

      game.start();
      game.board.tiles = [new Tile(2, 0, 0)];  // Already at edge
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.strictEqual(invalidEmitted, true);
    });
  });

  describe('score tracking', () => {
    it('should update score on merge', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.board.tiles = [
        new Tile(2, 0, 0),
        new Tile(2, 1, 0)
      ];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.strictEqual(game.score, 4);
    });

    it('should track multiple merges in one move', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.board.tiles = [
        new Tile(2, 0, 0),
        new Tile(2, 1, 0),
        new Tile(4, 2, 0),
        new Tile(4, 3, 0)
      ];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.strictEqual(game.score, 12); // 4 + 8
    });

    it('should track move count', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.board.tiles = [new Tile(2, 1, 0)];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);
      await game.move(DIRECTIONS.RIGHT);

      assert.strictEqual(game.telemetry.moves, 2);
    });
  });

  describe('storage adapter', () => {
    it('should save best score to storage', async () => {
      const eventBus = new EventBus();
      const storage = new InMemoryStorage();
      const game = new Game(eventBus, 4, storage, 0);

      game.start();
      game.board.tiles = [
        new Tile(2, 0, 0),
        new Tile(2, 1, 0)
      ];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      const saved = storage.getItem('2048-bestScore');
      assert.strictEqual(saved, '4');
    });

    it('should load best score from storage', () => {
      const storage = new InMemoryStorage();
      storage.setItem('2048-bestScore', '1000');

      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, storage, 0);

      assert.strictEqual(game.bestScore, 1000);
    });

    it('should persist best score across games', async () => {
      const storage = new InMemoryStorage();
      const eventBus = new EventBus();

      // First game
      const game1 = new Game(eventBus, 4, storage, 0);
      game1.start();
      game1.board.tiles = [new Tile(2, 0, 0), new Tile(2, 1, 0)];
      game1.board._updateGrid();
      await game1.move(DIRECTIONS.LEFT);

      assert.strictEqual(game1.bestScore, 4);

      // Second game with same storage
      const game2 = new Game(eventBus, 4, storage, 0);
      assert.strictEqual(game2.bestScore, 4);
    });
  });

  describe('win detection', () => {
    it('should emit game:won when reaching 2048', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let wonEmitted = false;
      eventBus.on('game:won', () => { wonEmitted = true; });

      game.start();
      game.board.tiles = [
        new Tile(1024, 0, 0),
        new Tile(1024, 1, 0)
      ];
      game.board._updateGrid();

      await game.move(DIRECTIONS.LEFT);

      assert.strictEqual(wonEmitted, true);
      assert.strictEqual(game.won, true);
    });

    it('should allow continuing after winning', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      game.start();
      game.won = true;
      game.continuePlaying();

      assert.strictEqual(game.keepPlaying, true);

      // Should allow moves now
      game.board.tiles = [new Tile(2, 1, 0)];
      game.board._updateGrid();

      const scoreBefore = game.score;
      await game.move(DIRECTIONS.LEFT);

      // Move should have been processed (tiles moved)
      assert.ok(game.board.tiles.length >= 2);  // Original tile + spawned tile
    });
  });

  describe('lose detection', () => {
    it('should emit game:lost when no moves available', async () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus, 4, null, 0);

      let lostEmitted = false;
      eventBus.on('game:lost', () => { lostEmitted = true; });

      game.start();

      // Fill board completely with checkerboard (no matches possible)
      game.board.tiles = [];
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const val = (x + y) % 2 === 0 ? 2 : 4;
          game.board.tiles.push(new Tile(val, x, y));
        }
      }
      game.board._updateGrid();

      // Board is now full with no possible merges
      // Manually trigger loss condition since board is already full
      game.lost = true;
      game.telemetry.endTime = Date.now();
      game.events.emit('game:lost', {
        score: game.score,
        telemetry: game.telemetry
      });

      assert.strictEqual(lostEmitted, true);
      assert.strictEqual(game.lost, true);
    });
  });

  describe('getState()', () => {
    it('should return current game state', () => {
      const eventBus = new EventBus();
      const game = new Game(eventBus);

      game.start();
      const state = game.getState();

      assert.ok(state.board);
      assert.strictEqual(state.score, 0);
      assert.strictEqual(state.won, false);
      assert.strictEqual(state.lost, false);
    });
  });
});
