import { createStore, SnapshotFromStore } from "@xstate/store";
import { match, P } from "ts-pattern";

type Configuration = {
  width: number;
  height: number;
  mines: number;
};

export type CellCoordinates = { row: number; col: number };

type GameGrid = Cell[][];

export type GameState = {
  grid: GameGrid;
  gameStatus: "idle" | "playing" | "won" | "lost";
  minesLeft: number;
  flagsLeft: number;
  time: number;
};

type GameEvents = {
  startGame: CellCoordinates;
  revealCell: CellCoordinates;
  flagCell: CellCoordinates;
  tick: object;
};

export const coveredPattern = {
  flagged: false,
  revealed: false,
  mine: P.boolean,
  adjacentMines: P.number,
} as const;

export const flaggedPattern = {
  ...coveredPattern,
  flagged: true,
} as const;

export const revealedBombPattern = {
  ...coveredPattern,
  revealed: true,
  mine: true,
} as const;

export const revealedCellPattern = {
  ...coveredPattern,
  revealed: true,
  mine: false,
} as const;

type CoveredCell = P.infer<typeof coveredPattern>;
type FlaggedCell = P.infer<typeof flaggedPattern>;
type RevealedCell = P.infer<typeof revealedCellPattern>;
type RevealedBomb = P.infer<typeof revealedBombPattern>;

export type Cell = CoveredCell | FlaggedCell | RevealedCell | RevealedBomb;

const emptyCoveredCell: CoveredCell = {
  flagged: false,
  revealed: false,
  mine: false,
  adjacentMines: 0,
};

const GRID_SIZE = 10;
const MINE_COUNT = 10;

const createEmptyCell = (): Cell => ({
  mine: false,
  revealed: false,
  flagged: false,
  adjacentMines: 0,
});

const createGrid = (): GameGrid => {
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, createEmptyCell)
  );

  placeMines(grid);
  calculateadjacentMines(grid);

  return grid;
};

const placeMines = (grid: GameGrid) => {
  let minesPlaced = 0;
  while (minesPlaced < MINE_COUNT) {
    const [row, col] = [randomIndex(), randomIndex()];
    if (!grid[row][col].mine) {
      grid[row][col].mine = true;
      minesPlaced++;
    }
  }
};

const calculateadjacentMines = (grid: GameGrid) => {
  forEachCell(grid, (cell, row, col) => {
    cell.adjacentMines = countadjacentMines(grid, row, col);
  });
};

const countadjacentMines = (grid: GameGrid, row: number, col: number) =>
  getValidNeighbors(row, col).reduce(
    (count, [r, c]) => count + (grid[r][c].mine ? 1 : 0),
    0
  );

const getValidNeighbors = (row: number, col: number) =>
  [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);

const randomIndex = () => Math.floor(Math.random() * GRID_SIZE);

const revealCell = (grid: GameGrid, row: number, col: number): GameGrid => {
  const newGrid = grid.map((r) => [...r]);
  const cell = newGrid[row][col];

  if (cell.revealed || cell.flagged) return newGrid;

  cell.revealed = true;

  if (cell.adjacentMines === 0 && !cell.mine) {
    getValidNeighbors(row, col).forEach(([r, c]) => revealCell(newGrid, r, c));
  }

  return newGrid;
};

const checkWin = (grid: GameGrid): boolean =>
  grid.every((row) => row.every((cell) => cell.mine || cell.revealed));

const forEachCell = (
  grid: GameGrid,
  fn: (cell: Cell, row: number, col: number) => void
) => {
  grid.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => fn(cell, rowIndex, colIndex))
  );
};

export type GameStore = ReturnType<typeof createStore<GameState, GameEvents>>;
export type GameSnapshot = SnapshotFromStore<GameStore>;

export const store = createStore<GameState, GameEvents>(
  {
    grid: createGrid(),
    gameStatus: "idle",
    minesLeft: MINE_COUNT,
    flagsLeft: MINE_COUNT,
    time: 0,
  },
  {
    startGame: (state, { row, col }) => ({
      ...state,
      grid: revealCell(state.grid, row, col),
      gameStatus: "playing",
      time: 0,
    }),
    revealCell: (state, { row, col }) => {
      if (state.gameStatus !== "playing") return state;

      const newGrid = revealCell(state.grid, row, col);
      const clickedCell = newGrid[row][col];

      if (clickedCell.mine)
        return { ...state, grid: newGrid, gameStatus: "lost" };

      const hasWon = checkWin(newGrid);
      return {
        ...state,
        grid: newGrid,
        gameStatus: hasWon ? "won" : "playing",
      };
    },
    flagCell: (state, { row, col }) => {
      if (state.gameStatus !== "playing") return state;

      const newGrid = state.grid.map((r) => [...r]);
      const cell = newGrid[row][col];

      if (cell.revealed) return state;

      const flagDelta = cell.flagged ? 1 : -1;

      if (!cell.flagged && !state.flagsLeft) {
        return state;
      }

      cell.flagged = !cell.flagged;

      return {
        ...state,
        flagsLeft: state.flagsLeft + flagDelta,
        minesLeft: state.minesLeft + flagDelta,
        grid: newGrid,
      };
    },
    tick: (state) => ({ ...state, time: state.time + 1 }),
  }
);
