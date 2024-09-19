import type {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { Data } from "effect";
import { Schema } from "@effect/schema";

const DefaultFalse = Schema.Boolean.pipe(
  Schema.propertySignature,
  Schema.withConstructorDefault(() => false)
);

export const BaseCellSchema = Schema.Struct({
  revealed: DefaultFalse,
  flagged: DefaultFalse,
  mine: DefaultFalse,
  adjacentMines: Schema.Number.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => 0)
  ),
});

export const CoveredCellSchema = Schema.Struct({
  ...BaseCellSchema.fields,
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(false),
});

export const CoveredClearCellSchema = Schema.Struct({
  ...CoveredCellSchema.fields,
  mine: Schema.Literal(false),
});

export const CoveredMineSchema = Schema.Struct({
  ...CoveredCellSchema.fields,
  mine: Schema.Literal(true),
} as const);

export const FlaggedCellSchema = Schema.Struct({
  ...BaseCellSchema.fields,
  revealed: Schema.Literal(false),
  flagged: Schema.Literal(true),
} as const);

export const RevealedCellSchema = Schema.Struct({
  ...BaseCellSchema.fields,
  flagged: Schema.Literal(false),
  revealed: Schema.Literal(true),
} as const);

export const RevealedMineSchema = Schema.Struct({
  ...RevealedCellSchema.fields,
  mine: Schema.Literal(true),
} as const);

export const RevealedClearCellSchema = Schema.Struct({
  ...RevealedCellSchema.fields,
  mine: Schema.Literal(false),
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

export type CoveredCell = typeof CoveredCellSchema.Type;
export type CoveredClearCell = Schema.Schema.Type<
  typeof CoveredClearCellSchema
>;
export type CoveredMine = typeof CoveredMineSchema.Type;
export type FlaggedCell = typeof FlaggedCellSchema.Type;
export type RevealedCell = typeof RevealedCellSchema.Type;
export type RevealedClearCell = Schema.Schema.Type<
  typeof RevealedClearCellSchema
>;
export type RevealedMine = typeof RevealedMineSchema.Type;

type CellData = Data.TaggedEnum<{
  Cell: typeof CellSchema.Type;
  Covered: typeof CoveredCellSchema.Type;
  CoveredClear: typeof CoveredClearCellSchema.Type;
  CoveredMine: typeof CoveredMineSchema.Type;
  Flagged: typeof FlaggedCellSchema.Type;
  Revealed: typeof RevealedCellSchema.Type;
  RevealedClear: typeof RevealedClearCellSchema.Type;
  RevealedMine: typeof RevealedMineSchema.Type;
}>;

export const CellData = Data.taggedEnum<CellData>();

export type Cell = typeof CellSchema.Type;
export type Cells = typeof CellsSchema.Type;
export type Configuration = typeof ConfigurationSchema.Type;

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
  visitedCells: Schema.Set(Schema.Number),
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

export type GameContext = typeof GameContextSchema.Type;

export const GameContextData = Data.case<GameContext>;

export type InitializeEvent = {
  config: typeof ConfigurationSchema.Type;
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
