import { match } from "ts-pattern";
import { Cell, GameSnapshot, GameState } from "./types";

export const selectGameStatus = (s: GameSnapshot) => s.context.gameStatus;

export const selectCells = (s: GameSnapshot) => s.context.cells;

export const compareCells = (a: Cell, b: Cell) =>
  a === b ||
  (a.mine === b.mine &&
    a.revealed === b.revealed &&
    a.flagged === b.flagged &&
    a.adjacentMines === b.adjacentMines);

const getCell = (s: GameSnapshot, index: number) =>
  s.context.cells[index] as Cell;

export const selectCell = (index: number) => (s: GameSnapshot) =>
  getCell(s, index);

export const selectCellAdjacentMines = (index: number) => (s: GameSnapshot) =>
  getCell(s, index).adjacentMines;

export const selectIsCellRevealed = (index: number) => (s: GameSnapshot) =>
  getCell(s, index).revealed;

export const selectIsCellFlagged = (index: number) => (s: GameSnapshot) =>
  getCell(s, index).flagged;

export const selectIsCellMine = (index: number) => (s: GameSnapshot) =>
  getCell(s, index).mine;

export const selectIsPlayerRevealing = (s: GameSnapshot) =>
  s.context.playerIsRevealingCell;

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
