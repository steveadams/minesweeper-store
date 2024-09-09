import { createStore } from "@xstate/store";
import { match } from "ts-pattern";

import {
  coveredCellWithMine,
  coveredCellWithoutMine,
  type Cell,
  type Configuration,
  type GameEventMap,
  type Cells,
  type GameState,
  type GameStore,
} from "./types";

// Turn x,y coordinates into an index for a 1D array
function cellIndex(gridWidth: number, x: number, y: number) {
  return y * gridWidth + x;
}

const createEmptyCell = (): Cell => ({
  mine: false,
  revealed: false,
  flagged: false,
  adjacentMines: 0,
});

const randomIndex = (length: number) => Math.floor(Math.random() * length);

function getValidNeighbourIndices(
  gridWidth: number,
  gridHeight: number,
  index: number
): number[] {
  const row = Math.floor(index / gridWidth);
  const col = index % gridWidth;

  const neighbours = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  return neighbours
    .map(([dx, dy]) => {
      const newRow = row + dx;
      const newCol = col + dy;
      return newRow * gridWidth + newCol;
    })
    .filter((neighbourIndex) => {
      const neighbourRow = Math.floor(neighbourIndex / gridWidth);
      const neighbourCol = neighbourIndex % gridWidth;
      return (
        neighbourRow >= 0 &&
        neighbourRow < gridHeight &&
        neighbourCol >= 0 &&
        neighbourCol < gridWidth
      );
    });
}

const createCells = (config: Configuration): Cells => {
  const totalCells = config.width * config.height;
  const cells: Cell[] = new Array(totalCells);

  // Fill the array using a single loop
  for (let i = 0; i < totalCells; i++) {
    cells[i] = createEmptyCell();
  }

  // Randomly place mines
  let minesPlaced = 0;
  while (minesPlaced < config.mines) {
    const row = randomIndex(config.height);
    const col = randomIndex(config.width);
    const idx = cellIndex(config.width, row, col);

    if (!cells[idx]!.mine) {
      cells[idx] = { ...cells[idx], mine: true };
      minesPlaced++;
    }
  }

  // Calculate adjacent mines for each cell
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      const idx = cellIndex(config.width, row, col);
      const cell = cells[idx];

      if (!cell.mine) {
        const adjacentMines = getValidNeighbourIndices(
          config.width,
          config.height,
          idx
        ).reduce(
          (count, innerIdx) => count + (cells[innerIdx]!.mine ? 1 : 0),
          0
        );

        cells[idx] = { ...cell, adjacentMines };
      }
    }
  }

  return cells;
};

const revealCells = (config: Configuration, cells: Cells, index: number) => {
  const updatedCells = [...cells];
  const stack = [index];

  while (stack.length) {
    const idx = stack.pop();
    const cell = updatedCells[idx];

    if (!cell || cell.revealed || cell.flagged) {
      continue;
    }

    updatedCells[idx] = { ...cell, revealed: true } as Cell;

    if (cell.adjacentMines === 0) {
      stack.push(...getValidNeighbourIndices(config.width, config.height, idx));
    }
  }
  return updatedCells;
};

const revealMines = (cells: Cells): Cells => {
  const newCells = [...cells];

  newCells.forEach((cell, index) => {
    if (cell.mine && !cell.revealed) {
      newCells[index] = { ...cell, revealed: true } as Cell;
    }
  });

  return newCells;
};

export const createMinesweeperStore = (config: Configuration): GameStore =>
  createStore<GameState, GameEventMap>(
    {
      config,
      cells: createCells(config),
      gameStatus: "ready",
      cellsRevealed: 0,
      flagsLeft: config.mines,
      playerIsRevealingCell: false,
      timeElapsed: 0,
    },
    {
      initialize: {
        cells: ({ config }) => createCells(config),
        gameStatus: "ready",
      },
      startPlaying: { gameStatus: "playing" },
      win: { gameStatus: "win" },
      gameOver: {
        gameStatus: "game-over",
        cells: (ctx) => revealMines(ctx.cells),
      },
      revealCell: (ctx, event) => {
        const cell = ctx.cells[event.index];

        return match(cell)
          .with(coveredCellWithoutMine, () => {
            return {
              cells: revealCells(ctx.config, ctx.cells, event.index),
              cellsRevealed: ctx.cellsRevealed + 1,
              gameStatus: "playing",
            };
          })
          .with(coveredCellWithMine, () => {
            return {
              cells: revealMines(ctx.cells),
              gameStatus: "game-over",
            };
          })
          .otherwise(() => {
            console.log("Shouldn't happen");
            throw new Error("Unexpected cell state");
            return {};
          });
      },
      toggleFlag: (state, { index }) => {
        const cell = state.cells[index];
        const flagDelta = cell.flagged ? 1 : -1;

        if (!cell.flagged && !state.flagsLeft) {
          return state;
        }

        const newCells = [...state.cells];
        const newCell = {
          ...cell,
          revealed: false,
          flagged: !cell.flagged,
        };
        newCells[index] = newCell as Cell;

        return {
          flagsLeft: state.flagsLeft + flagDelta,
          cells: newCells, // Return the new array
        };
      },

      setIsPlayerRevealing: (_, event) => ({ playerIsRevealingCell: event.to }),
      tick: ({ timeElapsed }) => ({ timeElapsed: timeElapsed + 1 }),
    }
  );
