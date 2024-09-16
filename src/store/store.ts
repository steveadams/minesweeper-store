import { createStore } from "@xstate/store";
import { match } from "ts-pattern";
import seedrandom from "seedrandom";

seedrandom("minesweeper", { global: true });

import {
  coveredCellWithMine,
  coveredCellWithoutMine,
  type Cell,
  type Configuration,
  type GameEventMap,
  type Cells,
  type GameState,
  type GameStore,
  RevealedCell,
  RevealCellEvent,
  ToggleFlagEvent,
} from "../types";
import { gameIsNotOver, guard } from "./guard";

// Convert (x, y) coordinates to an index for a 1D array
export function coordinatesToIndex(gridWidth: number, x: number, y: number) {
  return y * gridWidth + x; // Only need gridWidth, not gridHeight
}

// Convert an index back to (x, y) coordinates
export function indexToCoordinates(gridWidth: number, index: number) {
  const y = Math.floor(index / gridWidth);
  const x = index % gridWidth;
  return { x, y };
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function getValidNeighbourIndices(
  gridWidth: number,
  gridHeight: number,
  index: number
): number[] {
  const { x, y } = indexToCoordinates(gridWidth, index);

  const neighbours = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  return neighbours
    .map(([dx, dy]) => {
      const nextX = x + dx;
      const nextY = y + dy;
      if (nextX >= 0 && nextX < gridWidth && nextY >= 0 && nextY < gridHeight) {
        return coordinatesToIndex(gridWidth, nextX, nextY);
      }
      return -1;
    })
    .filter((neighbourIndex) => neighbourIndex !== -1);
}

function getMineIndices(config: Configuration) {
  const gridWidth = config.width;
  const gridHeight = config.height;
  const mines = config.mines;

  const totalCells = gridWidth * gridHeight;
  const mineIndices = new Set<number>();

  while (mines > mineIndices.size) {
    const row = randomIndex(gridHeight);
    const col = randomIndex(gridWidth);
    const idx = coordinatesToIndex(gridWidth, col, row);

    if (idx >= totalCells || idx < 0) {
      // Skip invalid indices
      continue;
    }

    if (!mineIndices.has(idx)) {
      mineIndices.add(idx);
    }
  }

  return mineIndices;
}

function createGrid(config: Configuration): Cells {
  const totalCells = config.width * config.height;
  const cells: Cell[] = new Array(totalCells).fill(null).map(() => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacentMines: 0,
  }));

  const mineIndices = getMineIndices(config);

  for (const idx of mineIndices) {
    cells[idx] = { ...cells[idx], mine: true };
  }

  // Calculate adjacent mines for each cell
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      const idx = coordinatesToIndex(config.width, col, row);

      if (idx >= totalCells || idx < 0) {
        // Skip invalid indices
        continue;
      }

      const cell = cells[idx];

      if (!cell.mine) {
        const adjacentMines = getValidNeighbourIndices(
          config.width,
          config.height,
          idx
        ).reduce(
          (count, innerIdx) => count + (cells[innerIdx]!.mine ? 1 : 0),
          0
        );

        cells[idx] = { ...cell, adjacentMines };
      }
    }
  }

  return cells;
}

function toggleFlagLogic(
  ctx: GameState,
  { index }: ToggleFlagEvent
): { flagsLeft: number; cells: Cells } {
  const cell = ctx.cells[index];
  const flagDelta = cell.flagged ? 1 : -1;
  const updatedCells = [...ctx.cells];

  if (!cell.flagged && ctx.flagsLeft === 0) {
    return ctx;
  }

  updatedCells[index] = {
    ...cell,
    revealed: false,
    flagged: !cell.flagged,
  } as Cell;

  return {
    flagsLeft: ctx.flagsLeft + flagDelta,
    cells: updatedCells,
  };
}

function revealCellLogic(ctx: GameState, event: RevealCellEvent) {
  const cell = ctx.cells[event.index];
  let cellsRevealed = 0;

  return match(cell)
    .with(coveredCellWithoutMine, () => {
      const updatedCells = [...ctx.cells];
      const visitedCells = new Set<number>(ctx.visitedCells);
      const stack = [event.index];

      while (stack.length) {
        const idx = stack.pop();
        const cell = updatedCells[idx];

        if (visitedCells.has(idx) || cell.flagged) {
          // Skip already visited or flagged cells
          continue;
        }

        visitedCells.add(idx);

        const revealedCell = { ...cell, revealed: true } as RevealedCell;
        updatedCells[idx] = revealedCell;
        cellsRevealed++;

        // If the cell has no adjacent mines, reveal neighbors
        if (revealedCell.adjacentMines === 0) {
          const neighbors = getValidNeighbourIndices(
            ctx.config.width,
            ctx.config.height,
            idx
          );

          neighbors.forEach((neighbourIdx) => {
            const neighbourCell = updatedCells[neighbourIdx];
            // Add neighbors to the stack if they haven't been visited or flagged
            if (!visitedCells.has(neighbourIdx) && !neighbourCell.flagged) {
              stack.push(neighbourIdx);
            }
          });
        }
      }

      const totalCellsRevealed = ctx.cellsRevealed + cellsRevealed;
      const playerWon =
        totalCellsRevealed ===
        ctx.config.width * ctx.config.height - ctx.config.mines;

      return {
        cells: updatedCells,
        cellsRevealed: totalCellsRevealed,
        visitedCells: visitedCells,
        gameStatus: playerWon ? "win" : "playing",
      };
    })
    .with(coveredCellWithMine, () => ({
      cells: revealMinesLogic(ctx.cells),
      gameStatus: "game-over",
    }))
    .otherwise((c) => ({}));
}

function revealMinesLogic(cells: Cells): Cells {
  const updatedCells = [...cells];

  updatedCells.forEach((cell, index) => {
    if (cell.mine && !cell.revealed) {
      updatedCells[index] = {
        ...cell,
        flagged: false,
        revealed: true,
      } as RevealedCell;
    }
  });

  return updatedCells;
}

function gameOverLogic(ctx: GameState): {
  gameStatus: "game-over";
  cells: Cells;
} {
  return {
    gameStatus: "game-over",
    cells: revealMinesLogic(ctx.cells),
  };
}

function configureStoreContext(config: Configuration): GameState {
  return {
    config,
    cells: createGrid(config),
    visitedCells: new Set<number>(),
    gameStatus: "ready",
    cellsRevealed: 0,
    flagsLeft: config.mines,
    playerIsRevealingCell: false,
    timeElapsed: 0,
  };
}

export function setupStore(config: Configuration): GameStore {
  return createStore<GameState, GameEventMap>(configureStoreContext(config), {
    initialize: (_, event) => configureStoreContext(event.config),
    startPlaying: { gameStatus: "playing" },
    win: { gameStatus: "win" },
    gameOver: gameOverLogic,
    revealCell: guard(gameIsNotOver, revealCellLogic),
    toggleFlag: guard(gameIsNotOver, toggleFlagLogic),
    setIsPlayerRevealing: guard(gameIsNotOver, (_, event) => ({
      playerIsRevealingCell: event.to,
    })),
    tick: ({ timeElapsed }) => ({ timeElapsed: timeElapsed + 1 }),
  });
}

if (import.meta.vitest) {
  const testGameConfig = { width: 5, height: 5, mines: 5 };
  function create5x5x5Game(): [store: GameStore, mineIndices: Set<number>] {
    return [setupStore(testGameConfig), getMineIndices(testGameConfig)];
  }

  function getCell(store: GameStore, index: number) {
    return store.getSnapshot().context.cells[index];
  }

  function expectToBeRevealed(store: GameStore, index: number[]) {
    for (const idx of index) {
      expect(getCell(store, idx).revealed).toBe(true);
    }
  }

  function expectToBeFlagged(store: GameStore, index: number[]) {
    for (const idx of index) {
      expect(getCell(store, idx).flagged).toBe(true);
    }
  }

  function expectToBeUnflagged(store: GameStore, index: number[]) {
    for (const idx of index) {
      expect(getCell(store, idx).flagged).toBe(false);
    }
  }

  function expectNotToBeRevealed(store: GameStore, index: number[]) {
    for (const idx of index) {
      console.log(idx, getCell(store, idx).revealed);
      expect(getCell(store, idx).revealed).toBe(false);
    }
  }

  function expectToBeRevealedWithAdjacentMines(
    store: GameStore,
    index: number[],
    adjacentMines: number
  ) {
    for (const idx of index) {
      expectToBeRevealed(store, [idx]);
      expect(getCell(store, idx).adjacentMines).toBe(adjacentMines);
    }
  }

  const { beforeEach, describe, it, expect } = import.meta.vitest;
  let store: GameStore;
  let mineIndices: Set<number>;
  let safeIndices: Set<number>;

  // Safe indices should match this set:
  // Set(20) { 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25 }

  beforeEach(() => {
    // Make Math.random() deterministic in order to predict where mines are placed
    seedrandom("minesweeper", { global: true });

    [store, mineIndices] = create5x5x5Game();
    safeIndices = new Set(
      Array.from(
        { length: testGameConfig.width * testGameConfig.height },
        (_, i) => i + 1
      ).filter((idx) => !mineIndices.has(idx))
    );
  });

  describe("flagging behaviour", () => {
    it("should flag and unflag a cell", () => {
      expect(getCell(store, 0).flagged).toBe(false);
      store.send({ type: "toggleFlag", index: 0 });
      expect(getCell(store, 0).flagged).toBe(true);
      store.send({ type: "toggleFlag", index: 0 });
      expect(getCell(store, 0).flagged).toBe(false);
    });

    it("should not reveal a cell if it is flagged", () => {
      expect(getCell(store, 0).revealed).toBe(false);
      expect(getCell(store, 0).flagged).toBe(false);
      store.send({ type: "toggleFlag", index: 0 });
      expect(getCell(store, 0).flagged).toBe(true);
      store.send({ type: "revealCell", index: 0 });
      expect(getCell(store, 0).flagged).toBe(true);
      expect(getCell(store, 0).revealed).toBe(false);
    });

    it("should not place more flags than are available", () => {
      expect(store.getSnapshot().context.flagsLeft).toBe(5);
      store.send({ type: "toggleFlag", index: 0 });
      expect(store.getSnapshot().context.flagsLeft).toBe(4);
      store.send({ type: "toggleFlag", index: 1 });
      expect(store.getSnapshot().context.flagsLeft).toBe(3);
      store.send({ type: "toggleFlag", index: 2 });
      expect(store.getSnapshot().context.flagsLeft).toBe(2);
      store.send({ type: "toggleFlag", index: 3 });
      expect(store.getSnapshot().context.flagsLeft).toBe(1);
      store.send({ type: "toggleFlag", index: 4 });
      expect(store.getSnapshot().context.flagsLeft).toBe(0);
      store.send({ type: "toggleFlag", index: 5 });
      expect(store.getSnapshot().context.flagsLeft).toBe(0);
      store.send({ type: "toggleFlag", index: 5 });
      expect(store.getSnapshot().context.flagsLeft).toBe(0);

      expectToBeFlagged(store, [0, 1, 2, 3, 4]);
      expectToBeUnflagged(store, [5]);
    });

    it("should return flags to the pool when removed from the grid", () => {
      expect(store.getSnapshot().context.flagsLeft).toBe(5);
      store.send({ type: "toggleFlag", index: 0 });
      expect(store.getSnapshot().context.flagsLeft).toBe(4);
      store.send({ type: "toggleFlag", index: 1 });
      expect(store.getSnapshot().context.flagsLeft).toBe(3);
      store.send({ type: "toggleFlag", index: 2 });
      expect(store.getSnapshot().context.flagsLeft).toBe(2);
      store.send({ type: "toggleFlag", index: 3 });
      expect(store.getSnapshot().context.flagsLeft).toBe(1);
      store.send({ type: "toggleFlag", index: 4 });
      expect(store.getSnapshot().context.flagsLeft).toBe(0);
      expectToBeFlagged(store, [0, 1, 2, 3, 4]);
      store.send({ type: "toggleFlag", index: 4 });
      expect(store.getSnapshot().context.flagsLeft).toBe(1);
      store.send({ type: "toggleFlag", index: 3 });
      expect(store.getSnapshot().context.flagsLeft).toBe(2);

      expectToBeFlagged(store, [0, 1, 2]);
      expectToBeUnflagged(store, [3, 4, 5]);
    });

    it("should not reveal a cell if it is flagged", () => {
      expect(getCell(store, 0).revealed).toBe(false);
      expect(getCell(store, 0).flagged).toBe(false);

      store.send({ type: "toggleFlag", index: 0 });
      expect(getCell(store, 0).revealed).toBe(false);
      expect(getCell(store, 0).flagged).toBe(true);

      store.send({ type: "revealCell", index: 0 });
      expect(getCell(store, 0).revealed).toBe(false);
      expect(getCell(store, 0).flagged).toBe(true);
    });
  });

  describe("reveal behaviour", () => {
    it("should reveal a cell", () => {
      expect(getCell(store, 0).revealed).toBe(false);
      store.send({ type: "revealCell", index: 0 });

      expectToBeRevealedWithAdjacentMines(
        store,
        [0, 1, 2, 3, 4, 8, 9, 13, 14],
        0
      );
      expectToBeRevealedWithAdjacentMines(store, [7, 12, 18, 19], 1);
      expectToBeRevealedWithAdjacentMines(store, [5, 6, 17], 2);
      expectNotToBeRevealed(store, [10, 11, 15, 16, 20, 21, 22, 23, 24]);

      store.send({ type: "revealCell", index: 24 });

      expectToBeRevealedWithAdjacentMines(store, [24], 1);
      expectNotToBeRevealed(store, [23]);
    });

    it("should reveal neighboring cells with no mines", () => {
      const safeIndex = 0;
      console.log(safeIndices);

      expect(getCell(store, 0).revealed).toBe(false);
      store.send({ type: "revealCell", index: safeIndex });
      expect(getCell(store, 0).revealed).toBe(true);
    });
  });
}
