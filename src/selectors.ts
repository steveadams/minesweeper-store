import { CellCoordinates, GameSnapshot } from "./types";

export const selectGameStatus = (s: GameSnapshot) => s.context.gameStatus;

export const selectCell = (s: GameSnapshot, { row, col }: CellCoordinates) =>
  s.context.grid[row][col];

export const selectAdjacentMines =
  ({ row, col }: CellCoordinates) =>
  (s: GameSnapshot) =>
    s.context.grid[row][col].adjacentMines;

export const selectRevealed =
  ({ row, col }: CellCoordinates) =>
  (s: GameSnapshot) =>
    s.context.grid[row][col].revealed;

export const selectFlagged =
  ({ row, col }: CellCoordinates) =>
  (s: GameSnapshot) =>
    s.context.grid[row][col].flagged;

export const selectMine =
  ({ row, col }: CellCoordinates) =>
  (s: GameSnapshot) =>
    s.context.grid[row][col].mine;
