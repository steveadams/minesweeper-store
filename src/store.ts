import { createStore } from "@xstate/store";
import {
  Cell,
  CoveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  type CellCoordinates,
  type Configuration,
  type GameEventMap,
  type GameGrid,
  type GameState,
  type GameStore,
  type RevealedClearCell,
} from "./types";
import { match } from "ts-pattern";

const createEmptyCell = () =>
  ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacentMines: 0,
  } as Cell);

const randomIndex = (length: number) => Math.floor(Math.random() * length);

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
      grid[row][col] = { ...grid[row][col], mine: true } as Cell;
      minesPlaced++;
    }
  }

  // Update each cell with its adjacent mine count
  grid.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      const adjacentMines = getValidNeighbourCoordinates(
        grid,
        rowIndex,
        colIndex
      ).reduce((count, [r, c]) => count + (grid[r][c].mine ? 1 : 0), 0);

      grid[rowIndex][colIndex] = { ...cell, adjacentMines };
    })
  );

  return grid;
};

const getValidNeighbourCoordinates = (
  grid: GameState["grid"],
  row: number,
  col: number
) =>
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
    .map(([x, y]) => [row + x, col + y])
    .filter(([x, y]) => grid[x] !== undefined && grid[x][y] !== undefined);

const isCellMine = (grid: GameGrid, { row, col }: CellCoordinates) =>
  grid[row][col].mine;

const doReveal = (grid: GameGrid, { row, col }: CellCoordinates) => {
  const newGrid = [...grid];

  revealCell(newGrid, { row, col });

  return newGrid;
};

const revealCell = (
  grid: GameGrid,
  { row, col }: CellCoordinates
): GameGrid => {
  const cell = grid[row][col];

  cell.revealed = true;

  if (cell.adjacentMines === 0 && !cell.mine) {
    getValidNeighbourCoordinates(grid, row, col).forEach(([x, y]) => {
      if (grid[x][y].revealed) {
        return grid;
      }

      return revealCell(grid, { row: x, col: y });
    });
  }

  return grid;
};

const revealMines = (grid: GameGrid): GameGrid =>
  grid.map((row) =>
    row.map((cell) =>
      match(cell)
        .with(
          coveredCellWithMine,
          () => ({ ...cell, revealed: true } as RevealedClearCell)
        )
        .otherwise((c) => c)
    )
  );

export const createMinesweeperStore = (config: Configuration): GameStore => {
  const initialGrid = createGrid(config);

  return createStore<GameState, GameEventMap>(
    {
      config,
      grid: initialGrid,
      gameStatus: "ready",
      cellsRevealed: 0,
      flagsLeft: config.mines,
      playerIsRevealingCell: false,
      timeElapsed: 0,
    },
    {
      initialize: {
        grid: ({ config }) => createGrid(config),
        gameStatus: "ready",
      },
      startPlaying: { gameStatus: "playing" },
      win: { gameStatus: "win" },
      gameOver: {
        gameStatus: "game-over",
        grid: (ctx) => revealMines(ctx.grid),
      },
      revealCell: (ctx, event) => {
        const cell = ctx.grid[event.row][event.col];

        return match(cell)
          .with(coveredCellWithoutMine, () => {
            console.log("revealing safe cell");
            return {
              grid: doReveal(ctx.grid, event),
              cellsRevealed: ctx.cellsRevealed + 1,
              gameStatus: "playing",
            };
          })
          .with(coveredCellWithMine, () => {
            console.log("revealing unsafe cell");
            return {
              grid: revealMines(ctx.grid),
              gameStatus: "game-over",
            };
          })
          .otherwise(() => ({}));
      },
      toggleFlag: (state, { row, col }) => {
        const newGrid = state.grid.map((r) => [...r]);
        const cell = newGrid[row][col];
        const flagDelta = cell.flagged ? 1 : -1;

        // Turn into a guard
        if (!cell.flagged && !state.flagsLeft) {
          return state;
        }

        cell.flagged = !cell.flagged;

        return {
          flagsLeft: state.flagsLeft + flagDelta,
          grid: newGrid,
        };
      },
      setIsPlayerRevealing: (_, event) => ({ playerIsRevealingCell: event.to }),
      tick: ({ timeElapsed }) => ({ timeElapsed: timeElapsed + 1 }),
    }
  );
};
