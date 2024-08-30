import { createStore, SnapshotFromStore } from "@xstate/store";
import { match, P } from "ts-pattern";
import {
  Configuration,
  EmptyCell,
  GameEventMap,
  GameGrid,
  GameState,
  GameStore,
} from "./types";

const createEmptyCell = (): EmptyCell => ({
  mine: false,
  revealed: false,
  flagged: false,
  adjacentMines: 0,
});

const createGrid = (config: Configuration): GameGrid => {
  const grid: GameGrid = Array.from({ length: config.height }, () =>
    Array.from({ length: config.width }, createEmptyCell)
  );

  // Randomly place mines into cells
  let minesPlaced = 0;
  while (minesPlaced < config.mines) {
    const row = randomIndex(config.height);
    const col = randomIndex(config.width);

    if (!grid[row][col].mine) {
      grid[row][col] = { ...grid[row][col], mine: true };
      minesPlaced++;
    }
  }

  // Update each cell with its adjacent mine count
  grid.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      const adjacentMines = getValidNeighbors(
        config,
        rowIndex,
        colIndex
      ).reduce((count, [r, c]) => count + (grid[r][c].mine ? 1 : 0), 0);

      grid[rowIndex][colIndex] = { ...cell, adjacentMines };
    })
  );

  return grid;
};

const getValidNeighbors = (config: Configuration, row: number, col: number) =>
  [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(
      ([r, c]) => r >= 0 && r < config.height && c >= 0 && c < config.width
    );

const randomIndex = (length: number) => Math.floor(Math.random() * length);

const revealCell = (
  state: GameState,
  row: number,
  col: number,
  force: boolean = false
): GameGrid => {
  const newGrid = state.grid.map((r) => [...r]);
  const cell = newGrid[row][col];

  cell.revealed = true;

  // if (!cell.adjacentMines && !cell.mine) {
  //   revealNeighbors(state, row, col);
  // }

  return newGrid;
};

const revealNeighbors = (
  state: GameState,
  row: number,
  col: number,
  force: boolean = false
) => {
  const cell = state.grid[row][col];

  if ((cell.adjacentMines === 0 && !cell.mine) || force) {
    getValidNeighbors(state.config, row, col).forEach(([r, c]) =>
      revealCell(state, r, c, force)
    );
  }
};

const checkWin = (grid: GameGrid): boolean =>
  grid.every((row) => row.every((cell) => cell.mine || cell.revealed));

export const createMinesweeperStore = (config: Configuration): GameStore => {
  const initialGrid = createGrid(config);

  return createStore<GameState, GameEventMap>(
    {
      config,
      grid: initialGrid,
      gameStatus: "idle",
      face: "smile",
      minesLeft: config.mines,
      flagsLeft: config.mines,
      time: 0,
    },
    {
      initialize: {
        grid: ({ config }) => createGrid(config),
      },
      startGame: {
        gameStatus: "playing",
      },
      setGameStatus: {
        gameStatus: (_, e) => e.gameStatus,
      },
      revealCell: {
        grid: (ctx, { row, col }) => revealCell(ctx, row, col),
      },
      toggleFlag: (state, { row, col }) => {
        const newGrid = state.grid.map((r) => [...r]);
        const cell = newGrid[row][col];
        const flagDelta = cell.flagged ? 1 : -1;

        if (!cell.flagged && !state.flagsLeft) {
          return state;
        }

        cell.flagged = !cell.flagged;

        return {
          ...state,
          flagsLeft: state.flagsLeft + flagDelta,
          minesLeft: state.minesLeft + flagDelta,
          grid: newGrid,
        };
      },
      tick: (state) => ({ ...state, time: state.time + 1 }),
    }
  );
};
