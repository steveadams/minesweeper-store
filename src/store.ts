import { createStore } from "@xstate/store";
import { match } from "ts-pattern";
import { ReactiveMap } from "@solid-primitives/map";

import {
  coveredCellWithMine,
  coveredCellWithoutMine,
  type Cell,
  type CellCoordinates,
  type Configuration,
  type GameEventMap,
  type Cells,
  type GameState,
  type GameStore,
  type RevealedClearCell,
} from "./types";

const cellKey = (row: number, col: number) => `${row},${col}`;

const createEmptyCell = (): Cell => ({
  x: 0,
  y: 0,
  mine: false,
  revealed: false,
  flagged: false,
  adjacentMines: 0,
});

const randomIndex = (length: number) => Math.floor(Math.random() * length);

const getValidNeighbourCoordinates = (
  width: number,
  height: number,
  row: number,
  col: number
): [number, number][] =>
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
    .map(([dx, dy]) => [row + dx, col + dy])
    .filter(([x, y]) => x >= 0 && y >= 0 && x < height && y < width);

const createCells = (config: Configuration): Cells => {
  const cells: Cells = new ReactiveMap<string, Cell>();

  // Initialize all cells
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      cells.set(cellKey(row, col), createEmptyCell());
    }
  }

  // Randomly place mines
  let minesPlaced = 0;
  while (minesPlaced < config.mines) {
    const row = randomIndex(config.height);
    const col = randomIndex(config.width);
    const key = cellKey(row, col);

    if (!cells.get(key)!.mine) {
      cells.set(key, { ...cells.get(key)!, mine: true });
      minesPlaced++;
    }
  }

  // Calculate adjacent mines for each cell
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      const key = cellKey(row, col);
      const cell = cells.get(key)!;

      if (!cell.mine) {
        const adjacentMines = getValidNeighbourCoordinates(
          config.width,
          config.height,
          row,
          col
        ).reduce(
          (count, [r, c]) => count + (cells.get(cellKey(r, c))!.mine ? 1 : 0),
          0
        );

        cells.set(key, { ...cell, adjacentMines });
      }
    }
  }

  return cells;
};

const revealCell = (grid: Cells, { row, col }: CellCoordinates): Cells => {
  const currentCell = grid[row][col];

  if (currentCell.revealed || currentCell.flagged) {
    return grid;
  }

  // Make a deep copy of the grid once
  const newGrid = grid.map((row) => [...row]);
  const stack = [{ row, col }];

  while (stack.length > 0) {
    const { row, col } = stack.pop();
    const cell = newGrid[row][col];

    if (cell.revealed || cell.flagged) continue;

    const revealedCell = { ...cell, revealed: true };
    newGrid[row][col] = revealedCell as Cell;

    if (revealedCell.adjacentMines === 0 && !revealedCell.mine) {
      getValidNeighbourCoordinates(newGrid, row, col).forEach(([x, y]) => {
        if (!newGrid[x][y].revealed && !newGrid[x][y].flagged) {
          stack.push({ row: x, col: y });
        }
      });
    }
  }

  return newGrid;
};

const revealMines = (cells: Cells): Cells => {
  // iterate over map of cells and set revealed to true for mines
  cells.forEach((cell) => {
    if (cell.mine) {
      cell.revealed = true;
    }
  });
  // for (let row = 0; row < cells.size; row++) {
  //   for (let col = 0; col < cells.size; col++) {
  //     const cell = cells.get(cellKey(row, col));
  //     if (cell.mine) {
  //       cells.set(cellKey(row, col), {
  //         ...cell,
  //         revealed: true,
  //       } as RevealedClearCell);
  //     }
  //   }
  // }

  // grid.map((row) =>
  //   row.map((cell) =>
  //     match(cell)
  //       .with(
  //         coveredCellWithMine,
  //         () => ({ ...cell, revealed: true } as RevealedClearCell)
  //       )
  //       .otherwise((c) => c)
  //   )
  // );
  return cells;
};

export const createMinesweeperStore = (config: Configuration): GameStore =>
  createStore<GameState, GameEventMap>(
    {
      config,
      cells: initialCells,
      gameStatus: "ready",
      cellsRevealed: 0,
      flagsLeft: config.mines,
      playerIsRevealingCell: false,
      timeElapsed: 0,
    },
    {
      initialize: {
        grid: ({ config }) => createCells(config),
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
        console.log("revealing cell", cell);

        return match(cell)
          .with(coveredCellWithoutMine, () => {
            console.log("revealing safe cell");
            return {
              grid: revealCell(ctx.grid, event),
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
