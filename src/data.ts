import { P } from "ts-pattern";

export const coveredCell = P.shape({
  revealed: false,
  flagged: false,
  mine: P.boolean,
  adjacentMines: P.number,
} as const);

export const coveredCellWithoutMine = P.shape({
  revealed: false,
  flagged: false,
  mine: false,
  adjacentMines: P.number,
} as const);

export const coveredCellWithMine = P.shape({
  revealed: false,
  flagged: false,
  mine: true,
  adjacentMines: P.number,
} as const);

export const flaggedCell = P.shape({
  revealed: false,
  flagged: true,
  mine: P.boolean,
  adjacentMines: P.number,
} as const);

export const revealedCell = P.shape({
  flagged: false,
  revealed: true,
  mine: P.boolean,
  adjacentMines: P.number,
} as const);

export const revealedCellWithMine = P.shape({
  revealed: true,
  flagged: false,
  mine: true,
  adjacentMines: P.number,
} as const);

export const revealedClearCell = P.shape({
  revealed: true,
  flagged: false,
  mine: false,
  adjacentMines: P.number,
} as const);

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
  }),
  cells: P.array(anyCell),
  visitedCells: P.set(P.number),
  gameStatus: P.union("ready", "playing", "win", "game-over"),
  cellsRevealed: P.number,
  flagsLeft: P.number,
  playerIsRevealingCell: P.boolean,
  timeElapsed: P.number,
});

export const FACES = {
  okay: "🙂",
  scared: "😬",
  win: "😀",
  gameOver: "😵",
} as const;

export type FaceState = keyof typeof FACES;
export type FaceEmoji = (typeof FACES)[FaceState];

export const getFaceEmoji = (state: FaceState): FaceEmoji => FACES[state];

// If changing the Beginner preset, make a copy to preserve for testing purposes.
export const PRESETS = [
  {
    name: "Beginner",
    config: { width: 5, height: 5, mines: 5 },
  },
  {
    name: "Intermediate",
    config: { width: 15, height: 15, mines: 30 },
  },
  {
    name: "Advanced",
    config: { width: 20, height: 20, mines: 50 },
  },
] as const;
