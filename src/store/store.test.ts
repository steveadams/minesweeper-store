import seedrandom from "seedrandom";
import { GameContext, GameStore } from "../types";
import { setupStore } from "./store";
import { afterEach, assert, beforeEach, describe, it } from "vitest";
import { PRESETS } from "../data";
import { Subscription } from "@xstate/store";
import { match } from "ts-pattern";

const createTestGame = (): GameStore => setupStore(PRESETS[0].config);

const getCell = (store: GameStore, idx: number) => {
  const cell = store.getSnapshot().context.cells[idx];
  assert(cell);

  return cell;
};

const revealCell = (store: GameStore, index: number) =>
  store.send({ type: "revealCell", index: index });

const expectToBeRevealed = (store: GameStore, indices: number[]) =>
  indices.forEach((idx) => expect(getCell(store, idx).revealed).toBe(true));

const toggleFlag = (store: GameStore, idx: number) =>
  store.send({ type: "toggleFlag", index: idx });

const expectFlagsLeft = (store: GameStore, flags: number) =>
  expect(store.getSnapshot().context.flagsLeft).toBe(flags);

const expectToBeFlagged = (store: GameStore, indices: number[]) => {
  indices.forEach((index) => expect(getCell(store, index).flagged).toBe(true));
};

const expectToBeUnflagged = (store: GameStore, indices: number[]) =>
  indices.forEach((idx) => expect(getCell(store, idx).flagged).toBe(false));

const expectNotToBeRevealed = (store: GameStore, indices: number[]) =>
  indices.forEach((idx) => expect(getCell(store, idx).revealed).toBe(false));

const expectToBeRevealedWithAdjacentCount = (
  store: GameStore,
  indices: number[],
  adjacentMines: number
) =>
  indices.forEach((idx) => {
    expectToBeRevealed(store, [idx]);
    expect(getCell(store, idx).adjacentMines).toBe(adjacentMines);
  });

const expectStatus = (store: GameStore, status: GameContext["status"]) =>
  expect(store.getSnapshot().context.status).toBe(status);

let store: GameStore;
let endGameSub: Subscription;

beforeEach(() => {
  // Make Math.random() deterministic in order to predict where mines are placed
  seedrandom("minesweeper", { global: true });

  store = createTestGame();

  endGameSub = store.on("endGame", (event) => {
    match(event.result)
      .with("win", () => store.send({ type: "win" }))
      .with("lose", () => store.send({ type: "lose" }))
      .exhaustive();
  });
});

afterEach(() => {
  endGameSub.unsubscribe();
});

describe("flagging behaviour", () => {
  it("should start with the correct number of flags", () => {
    const ctx = store.getSnapshot().context;
    expect(ctx.flagsLeft).toBe(ctx.config.mines);
  });

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
    expectToBeRevealedWithAdjacentCount(
      store,
      [0, 1, 2, 3, 4, 8, 9, 13, 14],
      0
    );
    // Expect 1 adjacent mines
    expectToBeRevealedWithAdjacentCount(store, [7, 12, 18, 19], 1);
    // Expect 2 adjacent mines
    expectToBeRevealedWithAdjacentCount(store, [5, 6, 17], 2);

    // These cells should not be revealed
    expectNotToBeRevealed(store, [10, 11, 15, 16, 20, 21, 22, 23, 24]);

    revealCell(store, 24);

    // Expect 1 adjacent mine, causing neighbours not to be revealed
    expectToBeRevealedWithAdjacentCount(store, [24], 1);
    expectNotToBeRevealed(store, [23]);
  });
});

describe("game status behaviour", () => {
  it("should start in ready and shift to playing when a safe cell is revealed", () => {
    // Only these cells need to be revealed to win
    expectStatus(store, "ready");
    revealCell(store, 0);
    expectStatus(store, "playing");
  });

  it("should win when all safe cells are revealed", () => {
    expectStatus(store, "ready");

    // Only these cells need to be revealed to win
    revealCell(store, 0);
    expectStatus(store, "playing");
    revealCell(store, 16);
    expectStatus(store, "playing");
    revealCell(store, 21);
    expectStatus(store, "playing");
    revealCell(store, 22);
    expectStatus(store, "playing");
    revealCell(store, 24);
    expectStatus(store, "win");
  });

  it("should lose when a mine is revealed", () => {
    expectStatus(store, "ready");
    revealCell(store, 0);
    expectStatus(store, "playing");

    const mineIndices = store
      .getSnapshot()
      .context.cells.map((cell, index) => (cell.mine ? index : -1))
      .filter((index) => index !== -1);
    const mineCellIndex =
      mineIndices[Math.floor(Math.random() * mineIndices.length)];

    expect(mineCellIndex).toBeDefined();

    // It should lose on any cell from the mineIndices set
    revealCell(store, mineCellIndex!);
    expectStatus(store, "lose");
  });
});

describe("initialize game behaviour", () => {
  it("should start reset the game correctly", () => {
    expectStatus(store, "ready");
    expect(store.getSnapshot().context.timeElapsed).toBe(0);
    expect(store.getSnapshot().context.cellsRevealed).toBe(0);
    revealCell(store, 0);
    expectToBeRevealed(store, [0, 1, 2, 3]);
    expectStatus(store, "playing");

    // Can't test time increments without integrating with a UI, so pretend it's been a few seconds
    store.send({ type: "tick" });
    store.send({ type: "tick" });
    store.send({ type: "tick" });

    expect(store.getSnapshot().context.timeElapsed).toBe(3);
    expect(store.getSnapshot().context.cellsRevealed).toBe(16);

    store.send({ type: "initialize", config: PRESETS[0].config });
    expectStatus(store, "ready");
    expectNotToBeRevealed(store, [0, 1, 2, 3]);
    expect(store.getSnapshot().context.timeElapsed).toBe(0);
  });
});

describe("guards", () => {
  it("should prevent clicking revealed cells from changing game state", () => {
    const snapshot1 = store.getSnapshot();

    revealCell(store, 0);
    expectStatus(store, "playing");

    const snapshot2 = store.getSnapshot();

    revealCell(store, 0);

    const snapshot3 = store.getSnapshot();

    expect(snapshot1).not.toEqual(snapshot2);
    expect(snapshot2).toEqual(snapshot3);
  });

  it("should prevent revealing or flagging cells after losing", () => {
    revealCell(store, 20);
    expectStatus(store, "lose");

    const snapshot1 = store.getSnapshot();

    revealCell(store, 0);
    revealCell(store, 1);
    revealCell(store, 2);

    toggleFlag(store, 0);
    toggleFlag(store, 1);
    toggleFlag(store, 2);

    expect(snapshot1).toEqual(store.getSnapshot());
  });

  it("should prevent revealing or flagging cells after winning", () => {
    expectStatus(store, "ready");
    revealCell(store, 0);
    expectStatus(store, "playing");
    revealCell(store, 16);
    revealCell(store, 21);
    revealCell(store, 22);
    revealCell(store, 24);
    expectStatus(store, "win");

    const snapshot = store.getSnapshot();

    revealCell(store, 0);
    revealCell(store, 1);
    revealCell(store, 2);

    toggleFlag(store, 0);
    toggleFlag(store, 1);
    toggleFlag(store, 2);

    expect(snapshot).toEqual(store.getSnapshot());
  });
});
