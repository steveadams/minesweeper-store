import { createStore } from "@xstate/store";
import { match } from "ts-pattern";

import type {
  Cell,
  GameEventMap,
  Cells,
  EmittedEvents,
  GameContext,
  GameStore,
  RevealedCell,
} from "../types";
import { coveredCellWithMine, coveredCellWithoutMine } from "../data";

// Convert (x, y) coordinates to an index for a 1D array
export const coordinatesToIndex = (gridWidth: number, x: number, y: number) =>
  y * gridWidth + x;

// Convert an index back to (x, y) coordinates
const indexToCoordinates = (gridWidth: number, index: number) => ({
  x: index % gridWidth,
  y: Math.floor(index / gridWidth),
});

const getValidNeighbourIndices = (
  width: number,
  height: number,
  index: number
): number[] => {
  const { x, y } = indexToCoordinates(width, index);

  return (
    [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ] as const
  )
    .filter(([nx, ny]) => nx >= 0 && nx < width && ny >= 0 && ny < height)
    .map(([nx, ny]) => ny * width + nx);
};

function createGrid(config: GameContext["config"]): Cells {
  const totalCells = config.width * config.height;

  // Create locations for the mines
  const mineIndices = new Set<number>();
  while (config.mines > mineIndices.size) {
    const row = Math.floor(Math.random() * config.height);
    const col = Math.floor(Math.random() * config.width);
    const idx = coordinatesToIndex(config.width, col, row);

    if (!mineIndices.has(idx)) {
      mineIndices.add(idx);
    }
  }

  const cells: Cell[] = Array.from({ length: totalCells }, (_, index) => ({
    revealed: false,
    flagged: false,
    mine: mineIndices.has(index),
    adjacentMines: getValidNeighbourIndices(
      config.width,
      config.height,
      index
    ).filter((neighbourIndex) => mineIndices.has(neighbourIndex)).length,
  }));

  return cells;
}

const revealMines = (cells: Cells): Cells =>
  cells.map((cell) =>
    match(cell)
      .with(
        coveredCellWithMine,
        (c) =>
          ({
            ...c,
            flagged: false,
            revealed: true,
          } as RevealedCell)
      )
      .otherwise((c) => c)
  );

function playerCanInteract(ctx: GameContext) {
  return ctx.gameStatus !== "game-over" && ctx.gameStatus !== "win";
}

function configureStoreContext(config: GameContext["config"]): GameContext {
  return {
    config,
    cells: createGrid(config),
    visitedCells: new Set<number>(),
    gameStatus: "ready",
    cellsRevealed: 0,
    flagsLeft: config.mines,
    playerIsRevealingCell: false,
    timeElapsed: 0,
  };
}

export function setupStore(config: GameContext["config"]): GameStore {
  return createStore<GameContext, GameEventMap, { emitted: EmittedEvents }>({
    types: {} as { emitted: EmittedEvents },
    context: configureStoreContext(config),
    on: {
      initialize: (_, event) => configureStoreContext(event.config),
      startPlaying: { gameStatus: "playing" },
      win: { gameStatus: "win" },
      gameOver: (ctx) => ({
        gameStatus: "game-over",
        cells: revealMines(ctx.cells),
      }),
      revealCell: (ctx, event, { emit }) => {
        if (!playerCanInteract(ctx)) {
          console.log("Reveal cell not allowed");
          return ctx;
        }

        const cell = ctx.cells[event.index];
        let revealed = 0;

        return match(cell)
          .with(coveredCellWithoutMine, () => {
            const updatedCells = [...ctx.cells];
            const visited = new Set<number>(ctx.visitedCells);
            const stack: number[] = [event.index];

            while (stack.length > 0) {
              const idx = stack.pop();

              if (idx === undefined) {
                continue;
              }

              const cell = updatedCells[idx];

              if (!cell || cell.flagged || visited.has(idx)) {
                continue;
              }

              visited.add(idx);

              const revealedCell = { ...cell, revealed: true } as RevealedCell;
              updatedCells[idx] = revealedCell;
              revealed++;

              // If the cell has no adjacent mines, reveal neighbors
              if (revealedCell.adjacentMines === 0) {
                const neighbors = getValidNeighbourIndices(
                  ctx.config.width,
                  ctx.config.height,
                  idx
                );

                neighbors.forEach((neighbourIdx) => {
                  const neighbourCell = updatedCells[neighbourIdx];

                  if (!neighbourCell) {
                    console.log("Neighbor cell not found");
                    return;
                  }

                  // Add neighbors to the stack if they haven't been visited or flagged
                  if (!visited.has(neighbourIdx) && !neighbourCell.flagged) {
                    stack.push(neighbourIdx);
                  }
                });
              }
            }

            const totalCellsRevealed = ctx.cellsRevealed + revealed;
            const playerWon =
              totalCellsRevealed ===
              ctx.config.width * ctx.config.height - ctx.config.mines;

            if (playerWon) {
              emit({ type: "endGame", result: "win" });
            }

            return {
              cells: updatedCells,
              cellsRevealed: totalCellsRevealed,
              visitedCells: visited,
              gameStatus: playerWon ? "win" : "playing",
            };
          })
          .with(coveredCellWithMine, () => {
            emit({ type: "endGame", result: "lose" });

            return {
              cells: revealMines(ctx.cells),
              gameStatus: "game-over",
            };
          })
          .otherwise(() => ({}));
      },
      toggleFlag: (ctx, event) => {
        if (!playerCanInteract(ctx)) {
          return ctx;
        }

        const cell = ctx.cells[event.index];

        if (!cell) {
          return ctx;
        }

        const flagDelta = cell.flagged ? 1 : -1;
        const updatedCells = [...ctx.cells];

        if (!cell.flagged && ctx.flagsLeft === 0) {
          return ctx;
        }

        updatedCells[event.index] = {
          ...cell,
          revealed: false,
          flagged: !cell.flagged,
        } as Cell;

        return {
          flagsLeft: ctx.flagsLeft + flagDelta,
          cells: updatedCells,
          gameStatus: ctx.gameStatus === "ready" ? "playing" : ctx.gameStatus,
        };
      },
      setIsPlayerRevealing: (ctx, event) => {
        if (!playerCanInteract(ctx)) {
          return ctx;
        }

        return {
          playerIsRevealingCell: event.to,
        };
      },
      tick: ({ timeElapsed }) => {
        const inc = timeElapsed + 1;

        return {
          timeElapsed: inc,
          gameStatus: inc < 999 ? "playing" : "game-over",
        };
      },
    },
  });
}
