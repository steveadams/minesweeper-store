import { match } from "ts-pattern";
import { GameSnapshot, GameState } from "./types";

export const selectGridWidth = (s: GameSnapshot) => s.context.config.width;
export const selectGameIsStarted = (s: GameSnapshot) =>
  s.context.gameStatus === "playing";

export const selectGameIsOver = (s: GameSnapshot) =>
  s.context.gameStatus === "game-over";

export const selectCells = (s: GameSnapshot) => s.context.cells;

export const selectPlayerIsRevealing = (s: GameSnapshot) =>
  s.context.playerIsRevealingCell;

export const selectFlagsLeft = (s: GameSnapshot) => s.context.flagsLeft;
export const selectTimeElapsed = (s: GameSnapshot) => s.context.timeElapsed;

export const selectFace = (s: GameSnapshot) =>
  match(s.context as GameState)
    .with(
      { gameStatus: "playing", playerIsRevealingCell: true },
      { gameStatus: "ready", playerIsRevealingCell: true },
      () => "😬"
    )
    .with({ gameStatus: "win" }, () => "😀")
    .with({ gameStatus: "game-over" }, () => "😵")
    .otherwise(() => "🙂");
