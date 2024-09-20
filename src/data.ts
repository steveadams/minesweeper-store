import { P } from "ts-pattern";

const baseCell = P.shape({
  revealed: P.boolean,
  flagged: P.boolean,
  mine: P.boolean,
  adjacentMines: P.number,
});

export const coveredCell = baseCell.and({
  revealed: false,
  flagged: false,
});

export const coveredCellWithoutMine = coveredCell.and({ mine: false });
export const coveredCellWithMine = coveredCell.and({ mine: true });

export const flaggedCell = baseCell.and({
  revealed: false,
  flagged: true,
});

export const revealedCell = baseCell.and({ flagged: false, revealed: true });
export const revealedCellWithMine = revealedCell.and({ mine: true });
export const revealedClearCell = revealedCell.and({ mine: false });

export const anyCell = P.union(
  coveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedClearCell,
  revealedCellWithMine
);

export const gameState = P.shape({
  config: P.shape({
    width: P.number,
    height: P.number,
    mines: P.number,
    timeLimit: P.number,
  }),
  cells: P.array(anyCell),
  visitedCells: P.set(P.number),
  status: P.union("ready", "playing", "win", "lose"),
  cellsRevealed: P.number,
  flagsLeft: P.number,
  playerIsRevealingCell: P.boolean,
  timeElapsed: P.number,
});

export const FACES = {
  okay: "🙂",
  scared: "😬",
  win: "😀",
  lose: "😵",
} as const;

// If changing the Beginner preset, make a copy to preserve for testing purposes.
export const PRESETS = [
  {
    name: "Beginner",
    config: { width: 5, height: 5, mines: 5, timeLimit: 999 },
  },
  {
    name: "Intermediate",
    config: { width: 15, height: 15, mines: 30, timeLimit: 999 },
  },
  {
    name: "Advanced",
    config: { width: 20, height: 20, mines: 50, timeLimit: 999 },
  },
] as const;
