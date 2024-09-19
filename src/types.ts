import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { Data } from "effect";
import { Schema } from "@effect/schema";

export const CoveredCellSchema = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
});

export const CoveredClearCellSchema = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(false),
  adjacentMines: Schema.Number,
});

export const CoveredMineSchema = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(true),
  adjacentMines: Schema.Number,
} as const);

export const FlaggedCellSchema = Schema.Struct({
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(true),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
} as const);

export const RevealedCellSchema = Schema.Struct({
  flagged: Schema.Literal(false),
  revealed: Schema.Literal(true),
  mine: Schema.Boolean,
  adjacentMines: Schema.Number,
} as const);

export const RevealedMineSchema = Schema.Struct({
  revealed: Schema.Literal(true),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(true),
  adjacentMines: Schema.Number,
} as const);

export const RevealedClearCellSchema = Schema.Struct({
  revealed: Schema.Literal(true),
  flagged: Schema.Literal(false),
  mine: Schema.Literal(false),
  adjacentMines: Schema.Number,
} as const);

export const CellSchema = Schema.Union(
  CoveredCellSchema,
  CoveredClearCellSchema,
  CoveredMineSchema,
  FlaggedCellSchema,
  RevealedCellSchema,
  RevealedClearCellSchema,
  RevealedMineSchema
);

export type CoveredCell = Schema.Schema.Type<typeof CoveredCellSchema>;
export type CoveredClearCell = Schema.Schema.Type<
  typeof CoveredClearCellSchema
>;
export type CoveredMine = Schema.Schema.Type<typeof CoveredMineSchema>;
export type FlaggedCell = Schema.Schema.Type<typeof FlaggedCellSchema>;
export type RevealedCell = Schema.Schema.Type<typeof RevealedCellSchema>;
export type RevealedClearCell = Schema.Schema.Type<
  typeof RevealedClearCellSchema
>;
export type RevealedMine = Schema.Schema.Type<typeof RevealedMineSchema>;

type CellData = Data.TaggedEnum<{
  Cell: Schema.Schema.Type<typeof CellSchema>;
  Covered: Schema.Schema.Type<typeof CoveredCellSchema>;
  CoveredClear: Schema.Schema.Type<typeof CoveredClearCellSchema>;
  CoveredMine: Schema.Schema.Type<typeof CoveredMineSchema>;
  Flagged: Schema.Schema.Type<typeof FlaggedCellSchema>;
  Revealed: Schema.Schema.Type<typeof RevealedCellSchema>;
  RevealedClear: Schema.Schema.Type<typeof RevealedClearCellSchema>;
  RevealedMine: Schema.Schema.Type<typeof RevealedMineSchema>;
}>;

export const CellData = Data.taggedEnum<CellData>();

export type Cell = Schema.Schema.Type<typeof CellSchema>;
export type Cells = Schema.Schema.Type<typeof CellsSchema>;
export type Configuration = Schema.Schema.Type<typeof ConfigurationSchema>;

const ConfigurationSchema = Schema.Struct({
  width: Schema.required(Schema.Number).pipe(Schema.between(2, 50)),
  height: Schema.required(Schema.Number).pipe(Schema.between(2, 50)),
  mines: Schema.required(Schema.Number),
}).pipe(
  Schema.filter((input) =>
    input.mines > input.width * input.height - 1
      ? {
          path: ["mines"],
          message: "Cannot have more mines than cells in the grid",
        }
      : undefined
  )
);

const CellsSchema = Schema.Array(CellSchema);

const GameContextSchema = Schema.Struct({
  config: ConfigurationSchema,
  cells: CellsSchema,
  visitedCells: Schema.Number,
  gameStatus: Schema.Literal("ready", "playing", "win", "game-over"),
  cellsRevealed: Schema.Number,
  flagsLeft: Schema.Number,
  playerIsRevealingCell: Schema.Boolean,
  timeElapsed: Schema.Number,
}).pipe(
  Schema.filter((input) => {
    const { width, height } = input.config;
    const expectedLength = width * height;
    return input.cells.length !== expectedLength
      ? {
          path: ["cells"],
          message: `Number of cells must be a product of config.width * config.height (${expectedLength})`,
        }
      : undefined;
  }),
  Schema.filter((input) =>
    input.config.mines !== input.flagsLeft
      ? {
          path: ["flagsLeft"],
          message: "Cannot have more flags than mines",
        }
      : undefined
  )
);

export type GameContext = Schema.Schema.Type<typeof GameContextSchema>;

export const GameContextData = Data.case<GameContext>;

export type InitializeEvent = {
  config: Schema.Schema.Type<typeof ConfigurationSchema>;
};
export type RevealEvent = { index: number };
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
  revealCell: RevealEvent;
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
