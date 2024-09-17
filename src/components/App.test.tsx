import { fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { expect, beforeEach, vi, describe, it, afterEach } from "vitest";
import seedrandom from "seedrandom";

import App from "./App";
import { face } from "../types";

function createUser() {
  return userEvent.setup({
    advanceTimers: vi.advanceTimersByTimeAsync,
  });
}

function getCell(index: number) {
  return screen.getAllByRole("gridcell")[index];
}

function getTimer() {
  return screen.getByRole("timer");
}

function getStatus() {
  return screen.getByRole("status");
}

function getFlags() {
  return screen.getByRole("meter");
}

// TODO: This is not very thorough
function expectGridDimensions(width: number, height: number) {
  const cells = screen.getAllByRole("gridcell");

  // Check the total number of cells
  expect(cells.length).toBe(width * height);
}

function expectCellsToBeRevealed(cellIndices: number[]) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expect(cell).toHaveAttribute("data-revealed");
  });
}

function expectRevealedCellWithAdjacentCount(
  cellIndices: number[],
  adjacentCount: number
) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expect(cell).toHaveAttribute("data-revealed", adjacentCount.toString());
    expect(cell).toHaveTextContent(
      adjacentCount === 0 ? "" : adjacentCount.toString()
    );
  });
}

function expectCoveredCell(cellIndices: number[]) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expectCellType(cell, "covered");
  });
}

function expectCellType(
  cell: HTMLElement,
  type: "covered" | "flagged" | "revealed" | "mine",
  value?: string
) {
  expect(cell).toHaveAttribute(`data-${type}`, value);
}

function expectFace(f: keyof typeof face) {
  const status = getStatus();
  expect(status).toHaveTextContent(f);
}

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
function expectTimeToBe(time: `${Digit}${Digit}${Digit}`) {
  const timer = getTimer();
  expect(timer).toHaveTextContent(time);
  expect(timer).toHaveAttribute("datetime", `PT${parseInt(time).toString()}S`);
}

function expectFlagsLeftToBe(num: number) {
  expect(getFlags()).toHaveTextContent(num.toString());
}

async function advanceTimersBy(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
}

async function resetGame(user: UserEvent) {
  const status = getStatus();
  await user.click(status);
}

beforeEach(() => {
  // Make Math.random() deterministic in order to predict where mines are placed
  seedrandom("minesweeper", { global: true });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("minesweeper", () => {
  it("starts the game once a cell is revealed", async () => {
    const user = createUser();
    render(() => <App />);

    expectTimeToBe("000");
    expectFace(face.okay);

    const cell = getCell(0);
    await user.click(cell);

    await advanceTimersBy(1000);
    expectTimeToBe("001");
  });

  it("starts the game once a cell is flagged", async () => {
    const user = createUser();
    render(() => <App />);

    // Game is not started
    expectTimeToBe("000");
    expectFace(face.okay);

    const cell = getCell(0);
    await user.pointer({ keys: "[MouseRight>]", target: cell });
    await user.pointer({ keys: "[/MouseRight]", target: cell });

    // Covered cell is replaced with a flagged cell
    expectCellType(getCell(0), "flagged");
    expectFlagsLeftToBe(4);
    await advanceTimersBy(1100);
    expectTimeToBe("001");
  });

  it("ends the game once a mine is revealed", async () => {
    const cellIndexWithMine = 10;
    const user = createUser();
    render(() => <App />);

    expectTimeToBe("000");
    expectFace(face.okay);

    await user.click(getCell(cellIndexWithMine));

    expectCellType(getCell(cellIndexWithMine), "mine");
    expectFace(face.gameOver);
  });

  it("tracks time and ends the game at 999 seconds", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(0));

    // Fast-forward time by 5000ms
    await advanceTimersBy(5000);

    // Check the timer display after time manipulation
    expectTimeToBe("005");
    expectFace(face.okay);

    // Fast-forward time by 5000ms
    await advanceTimersBy(5000);
    expectTimeToBe("010");
    expectFace(face.okay);

    // Fast-forward time by 990s (should end the game)
    await advanceTimersBy(990_000);

    expectTimeToBe("999");
    expectFace(face.gameOver);
  });

  it("shows a worried face as a cell is being revealed", async () => {
    const user = createUser();
    render(() => <App />);

    expectFace(face.okay);

    const cell = getCell(0);

    // Press the pointer down...
    await user.pointer({ keys: "[MouseLeft>]", target: cell });

    // Add a delay to allow for state updates
    await advanceTimersBy(10);

    expectFace(face.scared);

    // Release the pointer
    await user.pointer({ keys: "[/MouseLeft]", target: cell });

    await advanceTimersBy(10);

    expectFace(face.okay);
  });

  it("doesn't show a worried face as a cell is being flagged", () => {
    render(() => <App />);

    const cell = getCell(0);

    expectFace(face.okay);

    fireEvent.mouseDown(cell, { button: 2 });
    expectFace(face.okay);

    fireEvent.mouseUp(cell, { button: 2 });
    expectFace(face.okay);

    fireEvent.contextMenu(cell);
    expectFace(face.okay);
  });

  it("reveals neighbouring cells with adjacent mines", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(0));

    await advanceTimersBy(1000);
    expectCellsToBeRevealed([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 17, 18, 19,
    ]);
    expectCoveredCell([10, 11, 15, 16, 20]);
  });

  it("revealing neighbouring cells with adjacent mines shows adjacent mine count", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(0));

    await advanceTimersBy(1000);
    expectRevealedCellWithAdjacentCount([0, 1, 2, 3, 4, 8, 9, 13, 14], 0);
    expectRevealedCellWithAdjacentCount([7, 12, 18, 19], 1);
    expectRevealedCellWithAdjacentCount([5, 6, 17], 2);
  });

  it("reveals no neighbouring cells if target has adjacent mines", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(5));
    await advanceTimersBy(1000);
    expectRevealedCellWithAdjacentCount([5], 2);
    expectCoveredCell([
      0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24,
    ]);
  });

  it("resets the game when the face is clicked", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(5));

    await advanceTimersBy(1500);
    expectRevealedCellWithAdjacentCount([5], 2);

    await user.click(getCell(2));

    await advanceTimersBy(1200);
    expectRevealedCellWithAdjacentCount([0, 1, 2, 3, 4, 8, 9, 13, 14], 0);
    expectRevealedCellWithAdjacentCount([7, 12, 18, 19], 1);
    expectRevealedCellWithAdjacentCount([5, 6, 17], 2);
    expectTimeToBe("002");

    await resetGame(user);

    await advanceTimersBy(1000);
    expectTimeToBe("000");
    expectFlagsLeftToBe(5);
    expectCoveredCell([
      0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24,
    ]);
  });

  it("can initialize preset games", async () => {
    const user = createUser();
    render(() => <App />);

    const beginnerButton = screen.getByText("beginner");
    const intermediateButton = screen.getByText("intermediate");
    const advancedButton = screen.getByText("advanced");

    expectGridDimensions(5, 5);

    await user.click(intermediateButton);
    await advanceTimersBy(10);
    expectGridDimensions(15, 15);

    await user.click(beginnerButton);
    await advanceTimersBy(10);
    expectGridDimensions(5, 5);

    await user.click(advancedButton);
    await advanceTimersBy(10);
    expectGridDimensions(20, 20);
  });
});
