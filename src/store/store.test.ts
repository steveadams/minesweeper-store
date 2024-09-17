import seedrandom from "seedrandom";
import { Cell, GameState, GameStore } from "../types";
import { setupStore } from "./store";

const testGameConfig = { width: 5, height: 5, mines: 5 };
function create5x5x5Game(): GameStore {
  return setupStore(testGameConfig);
}

function getCell(store: GameStore, index: number) {
  return store.getSnapshot().context.cells[index];
}

function revealCell(store: GameStore, index: number) {
  store.send({ type: "revealCell", index });
}

function expectToBeRevealed(store: GameStore, index: number[]) {
  for (const idx of index) {
    expect(getCell(store, idx).revealed).toBe(true);
  }
}

function toggleFlag(store: GameStore, index: number) {
  store.send({ type: "toggleFlag", index });
}

function expectFlagsLeft(store: GameStore, flagsLeft: number) {
  expect(store.getSnapshot().context.flagsLeft).toBe(flagsLeft);
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

function expectGameStatus(store: GameStore, status: GameState["gameStatus"]) {
  expect(store.getSnapshot().context.gameStatus).toBe(status);
}

const { beforeEach, describe, it, expect } = import.meta.vitest;
let store: GameStore;
let mineIndices: Set<number>;

beforeEach(() => {
  // Make Math.random() deterministic in order to predict where mines are placed
  seedrandom("minesweeper", { global: true });

  store = create5x5x5Game();
  mineIndices = store
    .getSnapshot()
    .context.cells.reduce((indices: Set<number>, cell: Cell, idx: number) => {
      if (cell.mine) {
        indices.add(idx);
      }
      return indices;
    }, new Set<number>());
});

describe("flagging behaviour", () => {
  it("should flag and unflag a cell", () => {
    expectToBeUnflagged(store, [0]);
    toggleFlag(store, 0);
    expectToBeFlagged(store, [0]);
    toggleFlag(store, 0);
    expectToBeUnflagged(store, [0]);
  });

  it("should not reveal a cell if it is flagged", () => {
    expectNotToBeRevealed(store, [0]);
    expectToBeUnflagged(store, [0]);

    // Flag the cell
    toggleFlag(store, 0);
    expectToBeFlagged(store, [0]);

    // Try to reveal the cell
    revealCell(store, 0);

    // The cell should still be flagged and not revealed
    expectToBeFlagged(store, [0]);
    expectNotToBeRevealed(store, [0]);
  });

  it("should not place more flags than are available", () => {
    expectFlagsLeft(store, 5);
    toggleFlag(store, 0);
    expectFlagsLeft(store, 4);
    toggleFlag(store, 1);
    expectFlagsLeft(store, 3);
    toggleFlag(store, 2);
    expectFlagsLeft(store, 2);
    toggleFlag(store, 3);
    expectFlagsLeft(store, 1);
    toggleFlag(store, 4);
    expectFlagsLeft(store, 0);

    // The 5th index should not get flagged
    toggleFlag(store, 5);
    expectFlagsLeft(store, 0);

    // Indexes 0-4 should be flagged. Index 5 should not be.
    expectToBeFlagged(store, [0, 1, 2, 3, 4]);
    expectToBeUnflagged(store, [5]);
  });

  it("should return flags to the pool when removed from the grid", () => {
    expectFlagsLeft(store, 5);
    toggleFlag(store, 0);
    expectFlagsLeft(store, 4);
    toggleFlag(store, 1);
    expectFlagsLeft(store, 3);
    toggleFlag(store, 2);
    expectFlagsLeft(store, 2);
    toggleFlag(store, 3);
    expectFlagsLeft(store, 1);
    toggleFlag(store, 4);
    expectFlagsLeft(store, 0);

    expectToBeFlagged(store, [0, 1, 2, 3, 4]);

    // This should return the flags to the pool
    toggleFlag(store, 4);
    expectFlagsLeft(store, 1);
    toggleFlag(store, 3);
    expectFlagsLeft(store, 2);

    // The remaining cells should be flagged
    expectToBeFlagged(store, [0, 1, 2]);
    // The flags returns to the pool should create unflagged cells
    expectToBeUnflagged(store, [3, 4, 5]);
  });

  it("should not reveal a cell if it is flagged", () => {
    expectNotToBeRevealed(store, [0]);
    expectToBeUnflagged(store, [0]);

    // Flag the cell
    toggleFlag(store, 0);
    expectToBeFlagged(store, [0]);
    expectNotToBeRevealed(store, [0]);

    // Try to reveal the cell, and assert that it is not revealed and is still flagged
    revealCell(store, 0);
    expectNotToBeRevealed(store, [0]);
    expectToBeFlagged(store, [0]);
  });
});

describe("reveal behaviour", () => {
  it("should reveal a cell", () => {
    expectNotToBeRevealed(store, [0]);
    revealCell(store, 0);

    // We can make these assertions based on deterministic 'random' mine placement
    // Expect 0 adjacent mines
    expectToBeRevealedWithAdjacentMines(
      store,
      [0, 1, 2, 3, 4, 8, 9, 13, 14],
      0
    );
    // Expect 1 adjacent mines
    expectToBeRevealedWithAdjacentMines(store, [7, 12, 18, 19], 1);
    // Expect 2 adjacent mines
    expectToBeRevealedWithAdjacentMines(store, [5, 6, 17], 2);

    // These cells should not be revealed
    expectNotToBeRevealed(store, [10, 11, 15, 16, 20, 21, 22, 23, 24]);

    revealCell(store, 24);

    // Expect 1 adjacent mine, causing neighbours not to be revealed
    expectToBeRevealedWithAdjacentMines(store, [24], 1);
    expectNotToBeRevealed(store, [23]);
  });
});

describe("game status behaviour", () => {
  it("should start in ready and shift to playing when a safe cell is revealed", () => {
    // Only these cells need to be revealed to win
    expectGameStatus(store, "ready");
    revealCell(store, 0);
    expectGameStatus(store, "playing");
  });

  it("should win when all safe cells are revealed", () => {
    expectGameStatus(store, "ready");

    // Only these cells need to be revealed to win
    revealCell(store, 0);
    expectGameStatus(store, "playing");
    revealCell(store, 16);
    expectGameStatus(store, "playing");
    revealCell(store, 21);
    expectGameStatus(store, "playing");
    revealCell(store, 22);
    expectGameStatus(store, "playing");
    revealCell(store, 24);
    expectGameStatus(store, "win");
  });

  it("should lose when a mine is revealed", () => {
    expectGameStatus(store, "ready");
    revealCell(store, 0);
    expectGameStatus(store, "playing");

    // It should lose on any cell from the mineIndices set
    revealCell(
      store,
      Array.from(mineIndices)[Math.floor(Math.random() * mineIndices.size)]
    );
    expectGameStatus(store, "game-over");
  });
});

describe("initialize game behaviour", () => {
  it("should start reset the game correctly", () => {
    expectGameStatus(store, "ready");
    expect(store.getSnapshot().context.timeElapsed).toBe(0);
    expect(store.getSnapshot().context.cellsRevealed).toBe(0);
    revealCell(store, 0);
    expectToBeRevealed(store, [0, 1, 2, 3]);
    expectGameStatus(store, "playing");

    // Can't test time increments without integrating with a UI, so pretend it's been a few seconds
    store.send({ type: "tick" });
    store.send({ type: "tick" });
    store.send({ type: "tick" });

    expect(store.getSnapshot().context.timeElapsed).toBe(3);
    expect(store.getSnapshot().context.cellsRevealed).toBe(16);

    store.send({ type: "initialize", config: testGameConfig });
    expectGameStatus(store, "ready");
    expectNotToBeRevealed(store, [0, 1, 2, 3]);
    expect(store.getSnapshot().context.timeElapsed).toBe(0);
  });
});

describe("game status behaviour", () => {
  it("should begin with the ready state", () => {
    expectGameStatus(store, "ready");
  });

  it("should win when all safe cells are revealed", () => {
    expectGameStatus(store, "ready");

    // Only these cells need to be revealed to win
    revealCell(store, 0);
    expectGameStatus(store, "playing");
    revealCell(store, 16);
    expectGameStatus(store, "playing");
    revealCell(store, 21);
    expectGameStatus(store, "playing");
    revealCell(store, 22);
    expectGameStatus(store, "playing");
    revealCell(store, 24);
    expectGameStatus(store, "win");
  });

  it("should lose when a mine is revealed", () => {
    expectGameStatus(store, "ready");
    revealCell(store, 0);
    expectGameStatus(store, "playing");

    // It should lose on any cell from the mineIndices set
    revealCell(
      store,
      Array.from(mineIndices)[Math.floor(Math.random() * mineIndices.size)]
    );
    expectGameStatus(store, "game-over");
  });
});
