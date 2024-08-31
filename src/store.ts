import { createStore } from "@xstate/store";
import {
  coveredCellWithMine,
  type CellCoordinates,
  type Configuration,
  type EmptyCell,
  type GameEventMap,
  type GameGrid,
  type GameState,
  type GameStore,
  type RevealedClearCell,
} from "./types";
import { match, P } from "ts-pattern";
import { guard } from "./guard";

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

const randomIndex = (length: number) => Math.floor(Math.random() * length);

const doReveal = (grid: GameGrid, { row, col }: CellCoordinates) => {
  const newGrid = [...grid];

  revealCell(newGrid, { row, col });

  return newGrid;
};

const revealCell = (
  grid: GameState["grid"],
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
      gameStatus: "idle",
      minesLeft: config.mines,
      flagsLeft: config.mines,
      interacting: false,
      time: 0,
    },
    {
      initialize: {
        grid: ({ config }) => createGrid(config),
        gameStatus: "idle",
      },
      startGame: { gameStatus: "playing" },
      endGame: {
        gameStatus: "lost",
        grid: (ctx) => revealMines(ctx.grid),
      },
      winGame: { gameStatus: "won" },
      revealCell: guard(
        ({ gameStatus }) => gameStatus === "playing",
        ({ grid }, event) => ({
          grid: doReveal(grid, event),
        })
      ),
      toggleFlag: guard(
        ({ gameStatus }) => gameStatus === "playing",
        (state, { row, col }) => {
          const newGrid = state.grid.map((r) => [...r]);
          const cell = newGrid[row][col];
          const flagDelta = cell.flagged ? 1 : -1;

          if (!cell.flagged && !state.flagsLeft) {
            return state;
          }

          cell.flagged = !cell.flagged;

          return {
            flagsLeft: state.flagsLeft + flagDelta,
            minesLeft: state.minesLeft + flagDelta,
            grid: newGrid,
          };
        }
      ),
      startInteract: () => ({ interacting: true }),
      endInteract: () => ({ interacting: false }),
      tick: (state) => ({ time: state.time + 1 }),
    }
  );
};
