import { match, P } from "ts-pattern";
import { CellCoordinates, GameSnapshot } from "./types";

export const selectGameStatus = (s: GameSnapshot) => s.context.gameStatus;

const getCell = (s: GameSnapshot, { row, col }: CellCoordinates) =>
  s.context.grid[row][col];

export const selectCell = (coords: CellCoordinates) => (s: GameSnapshot) =>
  getCell(s, coords);

export const selectAdjacentMines =
  (coords: CellCoordinates) => (s: GameSnapshot) =>
    getCell(s, coords).adjacentMines;

export const selectRevealed = (coords: CellCoordinates) => (s: GameSnapshot) =>
  getCell(s, coords).revealed;

export const selectFlagged = (coords: CellCoordinates) => (s: GameSnapshot) =>
  getCell(s, coords).flagged;

export const selectMine = (coords: CellCoordinates) => (s: GameSnapshot) =>
  getCell(s, coords).mine;

export const selectInteracting = (s: GameSnapshot) => s.context.interacting;

export const selectFace = (s: GameSnapshot) =>
  match([s.context.gameStatus, s.context.interacting])
    .with(["playing", false], ["idle", false], () => "🙂")
    .with(["playing", true], ["idle", true], () => "😬")
    .with(["won", P.boolean], () => "😀")
    .with(["lost", P.boolean], () => "😵")
    .exhaustive();
