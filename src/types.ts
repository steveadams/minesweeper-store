import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
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

const configuration = P.shape({
  width: P.number,
  height: P.number,
  mines: P.number,
});

const cells = P.array(anyCell);

const gameState = P.shape({
  config: configuration,
  cells: cells,
  visitedCells: P.set(P.number),
  gameStatus: P.union("ready", "playing", "win", "game-over"),
  cellsRevealed: P.number,
  flagsLeft: P.number,
  playerIsRevealingCell: P.boolean,
  timeElapsed: P.number,
});

export type CoveredCell = P.infer<typeof coveredCell>;
export type FlaggedCell = P.infer<typeof flaggedCell>;
export type RevealedCell = P.infer<typeof revealedCell>;
export type RevealedClearCell = P.infer<typeof revealedClearCell>;
export type RevealedMine = P.infer<typeof revealedCellWithMine>;
export type Cell = P.infer<typeof anyCell>;

export type Cells = P.infer<typeof cells>;
export type Configuration = P.infer<typeof configuration>;
export type GameState = P.infer<typeof gameState>;

export type InitializeEvent = { config: Configuration };
export type RevealCellEvent = { index: number };
export type ToggleFlagEvent = { index: number };
export type SetIsPlayerRevealingEvent = { to: boolean };

export type GameEventMap = {
  initialize: InitializeEvent;
  startPlaying: object;
  win: object;
  gameOver: object;
  revealCell: RevealCellEvent;
  toggleFlag: ToggleFlagEvent;
  setIsPlayerRevealing: SetIsPlayerRevealingEvent;
  tick: object;
};

export type GameEvent = ExtractEventsFromPayloadMap<GameEventMap>;
export type GameStore = Store<GameState, GameEvent>;
export type GameSnapshot = SnapshotFromStore<GameStore>;
