import { createStore } from "@xstate/store";
import {
  Cell,
  CoveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  FlaggedCell,
  RevealedCell,
  revealedCellWithMine,
  revealedClearCell,
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
    .filter(
      ([x, y]) => x >= 0 && y >= 0 && x < grid.length && y < grid[0].length
    );

const doReveal = (grid: GameGrid, { row, col }: CellCoordinates) => {
  const newGrid = [...grid];

  revealCell(newGrid, { row, col });

  return newGrid;
};

const revealCell = (
  grid: GameGrid,
  { row, col }: CellCoordinates
): GameGrid => {
  const currentCell = grid[row][col];
  console.log("revealing cell", currentCell);

  if (currentCell.revealed || currentCell.flagged) {
    // If the cell is already revealed or flagged, return the grid as is
    return grid;
  }

  // Reveal the current cell
  const revealedCell = { ...currentCell, revealed: true };
  const newGrid = [...grid];
  newGrid[row][col] = revealedCell;

  // If there are no adjacent mines and the cell is not a mine, reveal neighbors
  if (revealedCell.adjacentMines === 0 && !revealedCell.mine) {
    console.log("revealing neighbors");
    getValidNeighbourCoordinates(newGrid, row, col).forEach(([x, y]) => {
      console.log("revealing neighbor", x, y);
      return revealCell(newGrid, { row: x, col: y });
    });
  }

  return newGrid;
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
        const newGrid = [...ctx.grid];
        const newCell = { ...cell, revealed: true } as RevealedCell;
        newGrid[event.row][event.col] = newCell;

        console.log("revealed cell", newCell);

        return match(newCell)
          .with(revealedClearCell, () => {
            console.log("revealing safe cell");
            return {
              grid: doReveal(ctx.grid, event),
              cellsRevealed: ctx.cellsRevealed + 1,
              gameStatus: "playing",
            };
          })
          .with(revealedCellWithMine, () => {
            console.log("revealing unsafe cell");
            return {
              grid: revealMines(ctx.grid),
              gameStatus: "game-over",
            };
          })
          .otherwise(() => {
            console.log("Shouldn't happen");
            throw new Error("Unexpected cell state");
            return {};
          });
      },
      toggleFlag: (state, { row, col }) => {
        const newGrid = state.grid.map((r) => [...r]);
        const cell = newGrid[row][col];
        const flagDelta = cell.flagged ? 1 : -1;

        // Turn into a guard
        if (!cell.flagged && !state.flagsLeft) {
          return state;
        }

        const newCell = {
          ...cell,
          revealed: false,
          flagged: !cell.flagged,
        };
        newGrid[row][col] = newCell as Cell;

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
