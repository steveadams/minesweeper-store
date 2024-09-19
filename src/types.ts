import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { Schema } from "@effect/schema";

export const coveredCell = Schema.Struct({
  _type: Schema.Literal("covered"),
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
});

export const coveredCellWithoutMine = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(false),
  adjacentMines: Schema.Number,
});

export const coveredCellWithMine = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(true),
  adjacentMines: Schema.Number,
} as const);

export const flaggedCell = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(true),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
} as const);

export const revealedCell = Schema.Struct({
  flagged: Schema.Literal(false),
  revealed: Schema.Literal(true),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
} as const);

export const revealedCellWithMine = Schema.Struct({
  revealed: Schema.Literal(true),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(true),
  adjacentMines: Schema.Number,
} as const);

export const revealedClearCell = Schema.Struct({
  revealed: Schema.Literal(true),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(false),
  adjacentMines: Schema.Number,
} as const);

export const anyCell = Schema.Union(
  coveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedClearCell,
  revealedCellWithMine
);

const configuration = Schema.Struct({
  width: Schema.Number,
  height: Schema.Number,
  mines: Schema.Number,
});

const cells = Schema.Array(anyCell);

const gameState = Schema.Struct({
  config: configuration,
  cells: cells,
  visitedCells: Schema.Set(Schema.Number),
  gameStatus: Schema.Literal("ready", "playing", "win", "game-over"),
  cellsRevealed: Schema.Number,
  flagsLeft: Schema.Number,
  playerIsRevealingCell: Schema.Boolean,
  timeElapsed: Schema.Number,
});

export type CoveredCell = Schema.Schema.Type<typeof coveredCell>;
export type CoveredCellWithMine = Schema.Schema.Type<
  typeof coveredCellWithMine
>;
export type CoveredCellWithoutMine = Schema.Schema.Type<
  typeof coveredCellWithoutMine
>;
export type FlaggedCell = Schema.Schema.Type<typeof flaggedCell>;
export type RevealedCell = Schema.Schema.Type<typeof revealedCell>;
export type RevealedClearCell = Schema.Schema.Type<typeof revealedClearCell>;
export type RevealedMine = Schema.Schema.Type<typeof revealedCellWithMine>;
export type Cell = Schema.Schema.Type<typeof anyCell>;

export type Cells = Schema.Schema.Type<typeof cells>;
export type Configuration = Schema.Schema.Type<typeof configuration>;
export type GameContext = Schema.Schema.Type<typeof gameState>;

export type InitializeEvent = { config: Configuration };
export type RevealCellEvent = { index: number };
export type ToggleFlagEvent = { index: number };
export type SetIsPlayerRevealingEvent = { to: boolean };

// TODO: Make this type-safe
export const face: Record<"okay" | "scared" | "win" | "gameOver", string> = {
  okay: "🙂",
  scared: "😬",
  win: "😀",
  gameOver: "😵",
} as const;

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

export type Emitted =
  | {
      type: "game-over";
    }
  | {
      type: "win";
    };

export type GameEvent = ExtractEventsFromPayloadMap<GameEventMap>;
// TODO: Improve TEmitted type
export type GameStore = Store<GameContext, GameEvent, Emitted>;
export type GameSnapshot = SnapshotFromStore<GameStore>;
