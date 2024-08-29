// import { CellCoordinates, GameSnapshot, GameState } from "./store";

type Cell = { id: number; colour: string };
type CellCoordinates = { row: number; col: number };

type GameState = {
  grid: Cell[][];
  gameStatus: "idle" | "playing" | "won" | "lost";
  time: number;
};

type GameSnapshot = {
  context: GameState;
};

// A selector type that takes a store and returns some type T
type Selector<T = unknown> = (store: GameSnapshot) => T;
type SelectorWrapper<T> = T extends (...args: infer A) => Selector<any>
  ? (...args: A) => Selector<any>
  : never;

export const selectGameStatus: Selector<GameState["gameStatus"]> = (s) =>
  s.context.gameStatus;

export const selectCell: SelectorWrapper<Cell> =
  ({ row, col }: CellCoordinates) =>
  (s: GameSnapshot): Cell =>
    s.context.grid[row][col];
