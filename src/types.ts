import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { P } from "ts-pattern";

export const coveredCell = P.shape({
  flagged: false,
  revealed: false,
  mine: P.boolean,
  adjacentMines: P.number,
});

export const coveredCellWithoutMine = P.shape({
  flagged: false,
  revealed: false,
  mine: false,
  adjacentMines: P.number,
});

export const coveredCellWithMine = P.shape({
  flagged: false,
  revealed: false,
  mine: true,
  adjacentMines: P.number,
});

export const flaggedCell = P.shape({
  flagged: true,
  revealed: false,
  mine: P.boolean,
  adjacentMines: P.number,
});

export const revealedCellWithMine = P.shape({
  flagged: false,
  revealed: true,
  mine: true,
  adjacentMines: P.number,
});

export const revealedClearCell = P.shape({
  flagged: false,
  revealed: true,
  mine: false,
  adjacentMines: P.number,
});

export const anyCell = P.union(
  coveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedClearCell,
  revealedCellWithMine
);

const gameGrid = P.array(P.array(anyCell));
const cellCoordinates = P.shape({ row: P.number, col: P.number });
const configuration = P.shape({
  width: P.number,
  height: P.number,
  mines: P.number,
});

const gameState = P.shape({
  config: configuration,
  grid: gameGrid,
  gameStatus: P.union("ready", "playing", "win", "game-over"),
  cellsRevealed: P.number,
  flagsLeft: P.number,
  playerIsRevealingCell: P.boolean,
  timeElapsed: P.number,
});

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
  startPlaying: object;
  win: object;
  gameOver: object;
  revealCell: CellCoordinates;
  toggleFlag: CellCoordinates;
  setIsPlayerRevealing: { to: boolean };
  tick: object;
};

export type GameEvent = ExtractEventsFromPayloadMap<GameEventMap>;
export type GameStore = Store<GameState, GameEvent>;
export type GameSnapshot = SnapshotFromStore<GameStore>;
