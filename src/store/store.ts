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
  RevealedCell,
} from "../types";
import { gameIsNotOver, guard } from "./guard";

// Convert (x, y) coordinates to an index for a 1D array
function coordinatesToIndex(gridWidth: number, x: number, y: number) {
  return y * gridWidth + x; // Only need gridWidth, not gridHeight
}

// Convert an index back to (x, y) coordinates
function indexToCoordinates(gridWidth: number, index: number) {
  const y = Math.floor(index / gridWidth);
  const x = index % gridWidth;
  return { x, y };
}

const randomIndex = (length: number) => Math.floor(Math.random() * length);

function getValidNeighbourIndices(
  gridWidth: number,
  gridHeight: number,
  index: number
): number[] {
  const { x, y } = indexToCoordinates(gridWidth, index);

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
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
        return coordinatesToIndex(gridWidth, newX, newY);
      }
      return -1;
    })
    .filter((neighbourIndex) => neighbourIndex !== -1);
}

const createCells = (config: Configuration): Cells => {
  const totalCells = config.width * config.height;
  const cells: Cell[] = new Array(totalCells).fill(null).map(() => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacentMines: 0,
  }));

  let minesPlaced = 0;
  while (minesPlaced < config.mines) {
    const row = randomIndex(config.height);
    const col = randomIndex(config.width);
    const idx = coordinatesToIndex(config.width, col, row);

    if (idx >= totalCells || idx < 0) {
      // Skip invalid indices
      continue;
    }

    if (!cells[idx]!.mine) {
      cells[idx] = { ...cells[idx], mine: true };
      minesPlaced++;
    }
  }

  // Calculate adjacent mines for each cell
  for (let row = 0; row < config.height; row++) {
    for (let col = 0; col < config.width; col++) {
      const idx = coordinatesToIndex(config.width, col, row);

      if (idx >= totalCells || idx < 0) {
        // Skip invalid indices
        continue;
      }

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

const revealMines = (cells: Cells): Cells => {
  const newCells = [...cells];

  newCells.forEach((cell, index) => {
    if (cell.mine && !cell.revealed) {
      newCells[index] = {
        ...cell,
        flagged: false,
        revealed: true,
      } as RevealedCell;
    }
  });

  return newCells;
};

const configureStoreContext = (config: Configuration): GameState => ({
  config,
  cells: createCells(config),
  visitedCells: new Set<number>(),
  gameStatus: "ready",
  cellsRevealed: 0,
  flagsLeft: config.mines,
  playerIsRevealingCell: false,
  timeElapsed: 0,
});

export const setupStore = (config: Configuration): GameStore =>
  createStore<GameState, GameEventMap>(configureStoreContext(config), {
    initialize: (_, event) => configureStoreContext(event.config),
    startPlaying: { gameStatus: "playing" },
    win: { gameStatus: "win" },
    gameOver: {
      gameStatus: "game-over",
      cells: (ctx) => revealMines(ctx.cells),
    },
    revealCell: guard(gameIsNotOver, (ctx, event) => {
      const cell = ctx.cells[event.index];
      let cellsRevealed = 0;

      return match(cell)
        .with(coveredCellWithoutMine, () => {
          const updatedCells = [...ctx.cells];
          const visitedCells = new Set<number>(ctx.visitedCells);
          const stack = [event.index];

          while (stack.length) {
            const idx = stack.pop();
            const cell = updatedCells[idx];

            if (visitedCells.has(idx) || cell.flagged) {
              // Skip already visited or flagged cells
              console.log("skip because visited or flagged");
              continue;
            }

            visitedCells.add(idx);

            updatedCells[idx] = { ...cell, revealed: true } as Cell;
            cellsRevealed++;

            // If the cell has no adjacent mines, reveal neighbors
            if (cell.adjacentMines === 0) {
              const neighbors = getValidNeighbourIndices(
                ctx.config.width,
                ctx.config.height,
                idx
              );

              neighbors.forEach((neighbourIdx) => {
                const neighbourCell = updatedCells[neighbourIdx];
                // Add neighbors to the stack if they haven't been visited or flagged
                if (!visitedCells.has(neighbourIdx) && !neighbourCell.flagged) {
                  stack.push(neighbourIdx);
                }
              });
            }
          }

          const totalCellsRevealed = ctx.cellsRevealed + cellsRevealed;
          const playerWon =
            totalCellsRevealed ===
            ctx.config.width * ctx.config.height - ctx.config.mines;

          return {
            cells: updatedCells,
            cellsRevealed: totalCellsRevealed,
            visitedCells: visitedCells,
            gameStatus: playerWon ? "win" : "playing",
          };
        })
        .with(coveredCellWithMine, () => ({
          cells: revealMines(ctx.cells),
          gameStatus: "game-over",
        }))
        .otherwise((c) => ({})); // Do nothing
    }),
    toggleFlag: guard(gameIsNotOver, (ctx, { index }) => {
      const cell = ctx.cells[index];
      const flagDelta = cell.flagged ? 1 : -1;
      const newCells = [...ctx.cells];

      if (!cell.flagged && ctx.flagsLeft === 0) {
        return ctx;
      }

      newCells[index] = {
        ...cell,
        revealed: false,
        flagged: !cell.flagged,
      } as Cell;

      return {
        flagsLeft: ctx.flagsLeft + flagDelta,
        cells: newCells,
      };
    }),
    setIsPlayerRevealing: guard(gameIsNotOver, (_, event) => ({
      playerIsRevealingCell: event.to,
    })),
    tick: ({ timeElapsed }) => ({ timeElapsed: timeElapsed + 1 }),
  });
