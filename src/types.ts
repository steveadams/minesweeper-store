import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { P } from "ts-pattern";

export const cell = P.shape({
  flagged: P.boolean,
  revealed: P.boolean,
  mine: P.boolean,
  adjacentMines: P.number,
});

export const defaultCell = {
  flagged: false,
  revealed: false,
  mine: false,
  adjacentMines: 0,
} as const;

export const coveredCell = {
  ...defaultCell,
  mine: P.boolean,
  adjacentMines: P.number,
} as const;

export const coveredCellWithMine = {
  ...coveredCell,
  mine: true,
} as const;

export const flaggedCell = {
  ...coveredCell,
  flagged: true,
} as const;

export const revealedCellWithMine = {
  ...coveredCellWithMine,
  revealed: true,
} as const;

export const revealedClearCell = {
  ...coveredCell,
  revealed: true,
  mine: false,
} as const;

const anyCell = P.union(
  defaultCell,
  coveredCell,
  coveredCellWithMine,
  flaggedCell,
  revealedClearCell,
  revealedCellWithMine
);

const gameGrid = P.array(P.array(cell));
const cellCoordinates = P.shape({ row: P.number, col: P.number });
const configuration = P.shape({
  width: P.number,
  height: P.number,
  mines: P.number,
});

const gameState = P.shape({
  config: configuration,
  grid: gameGrid,
  gameStatus: P.union("idle", "playing", "won", "lost"),
  minesLeft: P.number,
  flagsLeft: P.number,
  interacting: P.boolean,
  time: P.number,
});

export type EmptyCell = P.infer<typeof defaultCell>;
export type CoveredCell = P.infer<typeof coveredCell>;
export type FlaggedCell = P.infer<typeof flaggedCell>;
export type RevealedClearCell = P.infer<typeof revealedClearCell>;
export type RevealedMine = P.infer<typeof revealedCellWithMine>;
export type Cell = P.infer<typeof anyCell>;

export type GameGrid = P.infer<typeof gameGrid>;
export type Configuration = P.infer<typeof configuration>;
export type CellCoordinates = P.infer<typeof cellCoordinates>;
export type GameState = P.infer<typeof gameState>;

export type GameEventMap = {
  initialize: object;
  startGame: object;
  endGame: object;
  winGame: object;
  revealCell: CellCoordinates;
  toggleFlag: CellCoordinates;
  startInteract: object;
  endInteract: object;
  tick: object;
};

export type GameEvent = ExtractEventsFromPayloadMap<GameEventMap>;

export type GameStore = Store<GameState, GameEvent>;
export type GameSnapshot = SnapshotFromStore<GameStore>;
