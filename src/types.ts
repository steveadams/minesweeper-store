import {
  ExtractEventsFromPayloadMap,
  SnapshotFromStore,
  Store,
} from "@xstate/store";
import { P } from "ts-pattern";

import { anyCell, gameState, revealedCell } from "./data";

export type RevealedCell = P.infer<typeof revealedCell>;
export type Cell = P.infer<typeof anyCell>;

export type GameContext = P.infer<typeof gameState>;
export type Cells = GameContext["cells"];

export type GameEventMap = {
  initialize: { config: GameContext["config"] };
  startPlaying: object;
  win: object;
  gameOver: object;
  revealCell: { index: number };
  toggleFlag: { index: number };
  setIsPlayerRevealing: { to: boolean };
  tick: object;
};

export type EmittedEvents = {
  type: "endGame";
  result: "win" | "lose";
};

export type GameStore = Store<
  GameContext,
  ExtractEventsFromPayloadMap<GameEventMap>,
  EmittedEvents
>;
export type GameSnapshot = SnapshotFromStore<GameStore>;
