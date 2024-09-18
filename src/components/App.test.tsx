import { fireEvent, render, screen } from "@solidjs/testing-library";
import userEvent, { UserEvent } from "@testing-library/user-event";
import {
  expect,
  beforeEach,
  vi,
  describe,
  it,
  afterEach,
  assert,
} from "vitest";
import seedrandom from "seedrandom";

import App from "./App";
import { face } from "../types";

const createUser = () =>
  userEvent.setup({
    advanceTimers: vi.advanceTimersByTimeAsync,
  });

const getCell = (index: number) => {
  const cell = screen.getAllByRole("gridcell")[index];
  assert(cell, `Cell with index ${index} not found`);
  return cell;
};

const getTimer = () => screen.getByRole("timer");
const getStatus = () => screen.getByRole("status");
const getFlags = () => screen.getByRole("meter");

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
  adjacentCount: number,
) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expect(cell).toHaveAttribute("data-revealed", adjacentCount.toString());
    expect(cell).toHaveTextContent(
      adjacentCount === 0 ? "" : adjacentCount.toString(),
    );
  });
}

function expectCoveredCell(cellIndices: number[]) {
  cellIndices.forEach((index) => {
    const cell = getCell(index);
    expectCellTypeToBe(cell, "covered");
  });
}

function expectCellTypeToBe(
  cell: HTMLElement | undefined,
  type: "covered" | "flagged" | "revealed" | "mine",
  value?: string,
) {
  expect(cell).toHaveAttribute(`data-${type}`, value);
}

const expectFaceToBe = (faceKey: keyof typeof face) =>
  expect(getStatus()).toHaveTextContent(face[faceKey]);

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

describe("game state interactions", () => {
  it("starts the game once a cell is revealed", async () => {
    const user = createUser();
    render(() => <App />);

    expectTimeToBe("000");
    expectFaceToBe("okay");

    await user.click(getCell(0));

    await advanceTimersBy(1000);
    expectTimeToBe("001");
  });

  it("starts the game once a cell is flagged", async () => {
    const user = createUser();
    render(() => <App />);

    expectTimeToBe("000");
    expectFaceToBe("okay");

    const cell = getCell(0);

    await user.pointer({ keys: "[MouseRight>]", target: cell });
    await user.pointer({ keys: "[/MouseRight]", target: cell });

    // Covered cell is replaced with a flagged cell
    expectCellTypeToBe(getCell(0), "flagged");
    expectFlagsLeftToBe(4);

    await advanceTimersBy(1100);

    expectTimeToBe("001");
  });

  it("ends the game once a mine is revealed", async () => {
    const cellIndexWithMine = 10;
    const user = createUser();
    render(() => <App />);

    expectTimeToBe("000");
    expectFaceToBe("okay");
    expectCellTypeToBe(getCell(cellIndexWithMine), "covered");

    await user.click(getCell(cellIndexWithMine));

    // Same query should result in a cell with a mine
    expectCellTypeToBe(getCell(cellIndexWithMine), "mine");
    expectFaceToBe("gameOver");
  });

  it("tracks time and ends the game at 999 seconds", async () => {
    const user = createUser();
    render(() => <App />);

    await user.click(getCell(0));
    await advanceTimersBy(5000);

    expectTimeToBe("005");
    expectFaceToBe("okay");

    await advanceTimersBy(5000);

    expectTimeToBe("010");
    expectFaceToBe("okay");

    // Fast-forward time by 990s (should end the game)
    await advanceTimersBy(990_000);

    expectTimeToBe("999");
    expectFaceToBe("gameOver");
  });

  it("shows a worried face as a cell is being revealed", async () => {
    const user = createUser();
    render(() => <App />);

    const cell = getCell(0);
    expectFaceToBe("okay");

    // Press the pointer down
    await user.pointer({ keys: "[MouseLeft>]", target: cell });
    await advanceTimersBy(10);

    expectFaceToBe("scared");

    // Release the pointer
    await user.pointer({ keys: "[/MouseLeft]", target: cell });
    await advanceTimersBy(10);

    expectFaceToBe("okay");
  });

  it("doesn't show a worried face as a cell is being flagged", () => {
    render(() => <App />);

    const cell = getCell(0);
    expectFaceToBe("okay");

    fireEvent.mouseDown(cell, { button: 2 });
    expectFaceToBe("okay");

    fireEvent.mouseUp(cell, { button: 2 });
    expectFaceToBe("okay");

    fireEvent.contextMenu(cell);
    expectFaceToBe("okay");
  });
});

describe("cell interaction behaviours", () => {
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
});

describe("game controls and settings", () => {
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

    const beginnerButton = screen.getByText("Beginner");
    const intermediateButton = screen.getByText("Intermediate");
    const advancedButton = screen.getByText("Advanced");

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

  it("can initialize custom game settings", async () => {
    const user = createUser();
    render(() => <App />);

    const customButton = screen.getByText("Custom");

    expectGridDimensions(5, 5);

    await user.click(customButton);
    await advanceTimersBy(10);

    expect(screen.queryByRole("dialog")).toBeInTheDocument();

    const widthInput = screen.getByLabelText("width");
    const heightInput = screen.getByLabelText("height");
    const minesInput = screen.getByLabelText("mines");

    expect(widthInput).toHaveValue(null);
    expect(heightInput).toHaveValue(null);
    expect(minesInput).toHaveValue(null);

    await user.type(widthInput, "10");
    await user.type(heightInput, "10");
    await user.type(minesInput, "10");
    await user.click(screen.getByText("Start Game"));

    await advanceTimersBy(10);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expectGridDimensions(10, 10);
  });
});
