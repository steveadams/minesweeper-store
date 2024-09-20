import { createStore } from "@xstate/store";
import { match } from "ts-pattern";

import type {
  Cell,
  GameEvent,
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
  index: number,
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
      index,
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
          }) as RevealedCell,
      )
      .otherwise((c) => c),
  );

function playerCanInteract(ctx: GameContext) {
  return ctx.status !== "lose" && ctx.status !== "win";
}

function configureStoreContext(config: GameContext["config"]): GameContext {
  return {
    config,
    cells: createGrid(config),
    visitedCells: new Set<number>(),
    status: "ready",
    cellsRevealed: 0,
    flagsLeft: config.mines,
    playerIsRevealingCell: false,
    timeElapsed: 0,
  };
}

const getCell = (cells: Cells, index: number): Cell => {
  const cell = cells[index];

  if (!cell) {
    throw new Error(`No cell found at index ${index}`);
  }

  return cell;
};

export function setupStore(config: GameContext["config"]): GameStore {
  return createStore<GameContext, GameEvent, { emitted: EmittedEvents }>({
    types: {} as { emitted: EmittedEvents },
    context: configureStoreContext(config),
    on: {
      initialize: (_, event) => configureStoreContext(event.config),
      startPlaying: { status: "playing" },
      win: { status: "win" },
      lose: (ctx) => ({
        status: "lose",
        cells: revealMines(ctx.cells),
      }),
      revealCell: (ctx, event, { emit }) => {
        if (!playerCanInteract(ctx)) {
          return ctx;
        }

        // const cell = ctx.cells[event.index];
        const cell = getCell(ctx.cells, event.index);
        let revealed = 0;

        return match(cell)
          .with(coveredCellWithoutMine, () => {
            const cells = [...ctx.cells];
            const visitedCells = new Set<number>(ctx.visitedCells);
            const stack: number[] = [event.index];

            while (stack.length > 0) {
              const idx = stack.pop();

              if (idx === undefined) {
                continue;
              }

              const cell = getCell(cells, idx);

              if (cell.flagged || visitedCells.has(idx)) {
                continue;
              }

              visitedCells.add(idx);

              const revealedCell = { ...cell, revealed: true } as RevealedCell;
              cells[idx] = revealedCell;
              revealed++;

              // If the cell has no adjacent mines, reveal neighbors
              if (revealedCell.adjacentMines === 0) {
                const neighbors = getValidNeighbourIndices(
                  ctx.config.width,
                  ctx.config.height,
                  idx,
                );

                neighbors.forEach((neighbourIdx) => {
                  const neighbourCell = cells[neighbourIdx];

                  if (!neighbourCell) {
                    return;
                  }

                  // Add neighbors to the stack if they haven't been visited or flagged
                  if (
                    !visitedCells.has(neighbourIdx) &&
                    !neighbourCell.flagged
                  ) {
                    stack.push(neighbourIdx);
                  }
                });
              }
            }

            const cellsRevealed = ctx.cellsRevealed + revealed;
            const playerWon =
              cellsRevealed ===
              ctx.config.width * ctx.config.height - ctx.config.mines;
            const status = playerWon ? ("win" as const) : ("playing" as const);

            if (playerWon) {
              emit({
                type: "endGame",
                result: "win",
                cause: "You cleared all of the mines.",
              });
            }

            return { cells, cellsRevealed, status, visitedCells };
          })
          .with(coveredCellWithMine, () => {
            emit({ type: "endGame", result: "lose", cause: "You hit a mine." });

            return {
              cells: revealMines(ctx.cells),
              status: "lose",
            } as const;
          })
          .otherwise(() => ctx);
      },
      toggleFlag: (ctx, event) => {
        if (!playerCanInteract(ctx)) {
          return ctx;
        }

        const cell = ctx.cells[event.index];

        if (!cell) {
          return ctx;
        }

        const flagsLeft = ctx.flagsLeft + (cell.flagged ? 1 : -1);
        const cells = [...ctx.cells];
        const status = ctx.status === "ready" ? "playing" : ctx.status;

        if (!cell.flagged && ctx.flagsLeft === 0) {
          return ctx;
        }

        cells[event.index] = {
          ...cell,
          revealed: false,
          flagged: !cell.flagged,
        } as Cell;

        return { flagsLeft, cells, status };
      },
      setIsPlayerRevealing: (ctx, event) =>
        playerCanInteract(ctx) ? { playerIsRevealingCell: event.to } : ctx,
      tick: (ctx, _, { emit }) => {
        const timeElapsed = ctx.timeElapsed + 1;
        const status = timeElapsed < ctx.config.timeLimit ? "playing" : "lose";

        if (status === "lose") {
          emit({
            type: "endGame",
            result: "lose",
            cause: "You ran out of time.",
          });
        }

        return { timeElapsed, status };
      },
    },
  });
}
