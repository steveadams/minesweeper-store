import { createStore, SnapshotFromStore } from "@xstate/store";
import { P } from "ts-pattern";

import { cell, gameState, FACES, revealedCell } from "./data";

export type RevealedCell = P.infer<typeof revealedCell>;
export type Cell = P.infer<typeof cell>;
export type GameContext = P.infer<typeof gameState>;
export type Cells = GameContext["cells"];

export type GameEvent = {
  initialize: { config: GameContext["config"] };
  startPlaying: object;
  revealCell: { index: number };
  toggleFlag: { index: number };
  setIsPlayerRevealing: { to: boolean };
  tick: object;
  win: object;
  lose: object;
};

export type EmittedEvents = {
  type: "endGame";
  result: "win" | "lose";
  cause: string;
};

export type GameStore = ReturnType<
  typeof createStore<GameContext, GameEvent, { emitted: EmittedEvents }>
>;
export type GameSnapshot = SnapshotFromStore<GameStore>;

export type FaceState = keyof typeof FACES;
export type FaceEmoji = (typeof FACES)[FaceState];
