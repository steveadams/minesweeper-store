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

beforeEach(() => {
  // Make Math.random() deterministic in order to predict where mines are placed
  seedrandom("minesweeper", { global: true });
  vi.useFakeTimers();
});

describe("minesweeper", () => {
  it("starts the game once a cell is revealed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }); // Sync user events with fake timers
    render(() => <App />);

    const cell = getCell(0);
    const timer = getTimer();
    const status = getStatus();

    expect(timer).toHaveTextContent("000");
    expect(status).toHaveTextContent(face.okay);

    await user.click(cell);

    vi.advanceTimersByTime(1000);

    expect(timer).toHaveTextContent("001");

    // Restore real timers to prevent side effects
    vi.useRealTimers();
  });

  it("starts the game once a cell is flagged", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }); // Sync user events with fake timers
    render(() => <App />);

    const cell = getCell(0);
    const timer = getTimer();
    const status = getStatus();

    expect(timer).toHaveTextContent("000");
    expect(status).toHaveTextContent(face.okay);

    await user.pointer({ keys: "[MouseRight]", target: cell });
    await user.pointer({ keys: "[MouseRight>]", target: cell });

    const updatedCell = getCell(0);
    const updatedTimer = getTimer();
    expect(updatedCell).toContainElement(screen.getByRole("img"));

    vi.advanceTimersByTime(1500);

    expect(updatedTimer).toHaveTextContent("001");

    // Restore real timers to prevent side effects
    vi.useRealTimers();
  });

  it("should track time and eventually end the game", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }); // Sync user events with fake timers
    render(() => <App />);

    const cell = getCell(0);
    const timer = getTimer();
    const status = getStatus();

    await user.click(cell);

    // Fast-forward time by 5000ms
    vi.advanceTimersByTime(5000);

    // Check the timer display after time manipulation
    expect(timer).toHaveTextContent("005");
    expect(status).toHaveTextContent(face.okay);

    // Fast-forward time by 5000ms
    vi.advanceTimersByTime(5000);

    expect(timer).toHaveTextContent("010");
    expect(status).toHaveTextContent(face.okay);

    // Fast-forward time by 990s (should end the game)
    vi.advanceTimersByTime(990_000);

    expect(timer).toHaveTextContent("999");
    expect(status).toHaveTextContent(face.gameOver);

    // Restore real timers to prevent side effects
    vi.useRealTimers();
  });
});