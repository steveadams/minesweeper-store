import { match } from "ts-pattern";
import { GameSnapshot, GameContext, FaceState } from "../types";

// Any of these conditions can be met to determine this. One once of the non-permanent
// conditions is met, `s.context.status === "playing"` will be triggered by the
// UI layer and ensure this stays in effect.
export const gameIsStarted = (s: GameSnapshot) =>
  s.context.status === "playing" ||
  s.context.cellsRevealed > 0 ||
  s.context.flagsLeft !== s.context.config.mines;

export const gameIsOver = (s: GameSnapshot) =>
  s.context.status === "lose" || s.context.status === "win";

export const gameIsWon = (s: GameSnapshot) => {
  const { config, cellsRevealed } = s.context;

  return cellsRevealed === config.width * config.height - config.mines;
};

export const faceEmoji = (s: GameSnapshot) =>
  match<GameContext, FaceState>(s.context)
    .with(
      { status: "playing", playerIsRevealingCell: true },
      { status: "ready", playerIsRevealingCell: true },
      () => "scared",
    )
    .with({ status: "win" }, () => "win")
    .with({ status: "lose" }, () => "lose")
    .otherwise(() => "okay");
