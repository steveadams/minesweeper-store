import { match, P } from "ts-pattern";
import { CellCoordinates, GameSnapshot, GameState } from "./types";

export const selectGameStatus = (s: GameSnapshot) => s.context.gameStatus;

const getCell = (s: GameSnapshot, { row, col }: CellCoordinates) =>
  s.context.grid[row][col];

export const selectCell = (coords: CellCoordinates) => (s: GameSnapshot) =>
  getCell(s, coords);

export const selectCellAdjacentMines =
  (coords: CellCoordinates) => (s: GameSnapshot) =>
    getCell(s, coords).adjacentMines;

export const selectIsCellRevealed =
  (coords: CellCoordinates) => (s: GameSnapshot) =>
    getCell(s, coords).revealed;

export const selectIsCellFlagged =
  (coords: CellCoordinates) => (s: GameSnapshot) =>
    getCell(s, coords).flagged;

export const selectIsCellMine =
  (coords: CellCoordinates) => (s: GameSnapshot) =>
    getCell(s, coords).mine;

export const selectIsPlayerRevealing = (s: GameSnapshot) =>
  s.context.playerIsRevealingCell;

export const selectFace = (s: GameSnapshot) => {
  console.log(s.context.gameStatus, s.context.playerIsRevealingCell);
  const face = match(s.context as GameState)
    .with(
      { gameStatus: "playing", playerIsRevealingCell: true },
      { gameStatus: "ready", playerIsRevealingCell: true },
      () => "😬"
    )
    .with({ gameStatus: "game-over", mineWasRevealed: false }, () => "😀")
    .with({ gameStatus: "game-over", mineWasRevealed: true }, () => "😵")
    .otherwise(() => "🙂");

  console.log(face);

  return face;
};
