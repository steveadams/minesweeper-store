import { fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { expect, beforeEach, vi, describe, it } from "vitest";
import seedrandom from "seedrandom";

import App from "./App";
import { face } from "../types";

function getCell(index: number) {
  return screen.getAllByRole("gridcell")[index];
}

function getTimer() {
  return screen.getByRole("timer");
}

function getStatus() {
  return screen.getByRole("status");
}

function expectCellsToBeRevealed(cellIndices: number[]) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expect(cell).toHaveAttribute("data-revealed");
  });
}

function expectCellsToBeRevealedWithAdjacentCount(
  cellIndices: number[],
  count: number
) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expect(cell).toHaveAttribute("data-revealed", count.toString());
    expect(cell).toHaveTextContent(count === 0 ? "" : count.toString());
  });
}

function expectCellsToBeCovered(cellIndices: number[]) {
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
function expectTime(time: `${Digit}${Digit}${Digit}`) {
  const timer = getTimer();
  expect(timer).toHaveTextContent(time);
  expect(timer).toHaveAttribute("datetime", `PT${parseInt(time).toString()}S`);
}

beforeEach(() => {
  // Make Math.random() deterministic in order to predict where mines are placed
  seedrandom("minesweeper", { global: true });
  vi.useFakeTimers();
});

describe("minesweeper", () => {
  it("starts the game once a cell is revealed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    expectTime("000");
    expectFace(face.okay);

    const cell = getCell(0);
    await user.click(cell);

    vi.advanceTimersByTime(1000);
    expectTime("001");

    vi.useRealTimers();
  });

  it("starts the game once a cell is flagged", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    // Game is not started
    expectTime("000");
    expectFace(face.okay);

    const cell = getCell(0);
    await user.pointer({ keys: "[MouseRight>]", target: cell });
    await user.pointer({ keys: "[/MouseRight]", target: cell });

    // Covered cell is replaced with a flagged cell
    expectCellType(getCell(0), "flagged");
    vi.advanceTimersByTime(1100);
    expectTime("001");

    vi.useRealTimers();
  });

  it("ends the game once a mine is revealed", async () => {
    const cellIndexWithMine = 10;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    expectTime("000");
    expectFace(face.okay);

    await user.click(getCell(cellIndexWithMine));

    expectCellType(getCell(cellIndexWithMine), "mine");
    expectFace(face.gameOver);

    vi.useRealTimers();
  });

  it("should track time and end the game at 999 seconds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    await user.click(getCell(0));

    // Fast-forward time by 5000ms
    vi.advanceTimersByTime(5000);

    // Check the timer display after time manipulation
    expectTime("005");
    expectFace(face.okay);

    // Fast-forward time by 5000ms
    vi.advanceTimersByTime(5000);
    expectTime("010");
    expectFace(face.okay);

    // Fast-forward time by 990s (should end the game)
    vi.advanceTimersByTime(990_000);

    expectTime("999");
    expectFace(face.gameOver);

    // Restore real timers to prevent side effects
    vi.useRealTimers();
  });

  it("shows a worried face as a cell is being revealed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    expectFace(face.okay);

    const cell = getCell(0);

    // Press the pointer down...
    await user.pointer({ keys: "[MouseLeft>]", target: cell });

    // Add a delay to allow for state updates
    await vi.advanceTimersByTimeAsync(10);

    expectFace(face.scared);

    // Release the pointer
    await user.pointer({ keys: "[/MouseLeft]", target: cell });

    // Add another delay
    await vi.advanceTimersByTimeAsync(10);

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

  it("reveals all neighbouring cells with adjacent mines", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    await user.click(getCell(0));

    vi.advanceTimersByTime(1000);

    expectCellsToBeRevealed([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 17, 18, 19,
    ]);

    expectCellsToBeCovered([10, 11, 15, 16, 20]);
  });

  it("revealed neighbouring cells with adjacent mines show adjacent count", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    await user.click(getCell(0));

    vi.advanceTimersByTime(1000);

    expectCellsToBeRevealedWithAdjacentCount([0, 1, 2, 3, 4, 8, 9, 13, 14], 0);
    expectCellsToBeRevealedWithAdjacentCount([7, 12, 18, 19], 1);
    expectCellsToBeRevealedWithAdjacentCount([5, 6, 17], 2);
  });

  it("reveals no neighbouring cells if target has adjacent mines", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(() => <App />);

    await user.click(getCell(5));

    vi.advanceTimersByTime(1000);

    expectCellsToBeRevealedWithAdjacentCount([5], 2);
    expectCellsToBeCovered([
      0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24,
    ]);
  });
});
