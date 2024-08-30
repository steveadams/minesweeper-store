import {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { P } from "ts-pattern";

export type Configuration = {
  width: number;
  height: number;
  mines: number;
};

export type CellCoordinates = { row: number; col: number };

export type GameGrid = Cell[][];

export type GameState = {
  config: Configuration;
  grid: GameGrid;
  gameStatus: "idle" | "playing" | "won" | "lost";
  face: "grimace" | "smile" | "win" | "lose";
  minesLeft: number;
  flagsLeft: number;
  time: number;
};

export type GameEventMap = {
  initialize: object;
  startGame: object;
  setGameStatus: { gameStatus: GameState["gameStatus"] };
  revealCell: CellCoordinates;
  toggleFlag: CellCoordinates;
  tick: object;
};

export type GameEvent = ExtractEventsFromPayloadMap<GameEventMap>;

export type GameStore = Store<GameState, GameEvent>;
export type GameSnapshot = SnapshotFromStore<GameStore>;

export const emptyPattern = {
  flagged: false,
  revealed: false,
  mine: false,
  adjacentMines: 0,
} as const;

export const coveredPattern = {
  ...emptyPattern,
  mine: P.boolean,
  adjacentMines: P.number,
} as const;

export const flaggedPattern = {
  ...coveredPattern,
  flagged: true,
} as const;

export const revealedBombPattern = {
  ...coveredPattern,
  revealed: true,
  mine: true,
} as const;

export const revealedCellPattern = {
  ...coveredPattern,
  revealed: true,
  mine: false,
} as const;

export type EmptyCell = P.infer<typeof emptyPattern>;
export type CoveredCell = P.infer<typeof coveredPattern>;
export type FlaggedCell = P.infer<typeof flaggedPattern>;
export type RevealedCell = P.infer<typeof revealedCellPattern>;
export type RevealedBomb = P.infer<typeof revealedBombPattern>;

export type Cell =
  | EmptyCell
  | CoveredCell
  | FlaggedCell
  | RevealedCell
  | RevealedBomb;
