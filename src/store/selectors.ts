import { match } from "ts-pattern";
import { GameSnapshot, GameContext } from "../types";
import { getFaceEmoji } from "../data";

export const gameIsStarted = (s: GameSnapshot) =>
  s.context.gameStatus === "playing";

export const gameIsOver = (s: GameSnapshot) =>
  s.context.gameStatus === "game-over" || s.context.gameStatus === "win";

export const gameIsWon = (s: GameSnapshot) => {
  const { config, cellsRevealed } = s.context;

  return cellsRevealed === config.width * config.height - config.mines;
};

export const faceEmoji = (s: GameSnapshot) =>
  match(s.context as GameContext)
    .with(
      { gameStatus: "playing", playerIsRevealingCell: true },
      { gameStatus: "ready", playerIsRevealingCell: true },
      () => getFaceEmoji("scared")
    )
    .with({ gameStatus: "win" }, () => getFaceEmoji("win"))
    .with({ gameStatus: "game-over" }, () => getFaceEmoji("gameOver"))
    .otherwise(() => getFaceEmoji("okay"));
