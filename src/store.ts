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
  config: Configuration;
  grid: GameGrid;
  gameStatus: "idle" | "playing" | "won" | "lost";
  face: "grimace" | "smile" | "win" | "lose";
  minesLeft: number;
  flagsLeft: number;
  time: number;
};

type GameEvents = {
  initialize: object;
  startGame: CellCoordinates;
  revealCell: CellCoordinates;
  flagCell: CellCoordinates;
  tick: object;
};

export const emptyPattern = {
  flagged: false,
  revealed: false,
  mine: false,
  adjacentMines: 0,
} as const;

export const coveredPattern = {
  ...emptyPattern,
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

type EmptyCell = P.infer<typeof emptyPattern>;
type CoveredCell = P.infer<typeof coveredPattern>;
type FlaggedCell = P.infer<typeof flaggedPattern>;
type RevealedCell = P.infer<typeof revealedCellPattern>;
type RevealedBomb = P.infer<typeof revealedBombPattern>;

export type Cell =
  | EmptyCell
  | CoveredCell
  | FlaggedCell
  | RevealedCell
  | RevealedBomb;

const createEmptyCell = (): EmptyCell => ({
  mine: false,
  revealed: false,
  flagged: false,
  adjacentMines: 0,
});

const createGrid = (config: Configuration): GameGrid => {
  const grid: GameGrid = Array.from({ length: config.height }, () =>
    Array.from({ length: config.width }, createEmptyCell)
  );

  // Randomly place mines into cells
  let minesPlaced = 0;
  while (minesPlaced < config.mines) {
    const row = randomIndex(config.height);
    const col = randomIndex(config.width);

    if (!grid[row][col].mine) {
      grid[row][col] = { ...grid[row][col], mine: true };
      minesPlaced++;
    }
  }

  // Update each cell with its adjacent mine count
  grid.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      const adjacentMines = getValidNeighbors(
        config,
        rowIndex,
        colIndex
      ).reduce((count, [r, c]) => count + (grid[r][c].mine ? 1 : 0), 0);

      grid[rowIndex][colIndex] = { ...cell, adjacentMines };
    })
  );

  return grid;
};

const getValidNeighbors = (config: Configuration, row: number, col: number) =>
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
    .filter(
      ([r, c]) => r >= 0 && r < config.height && c >= 0 && c < config.width
    );

const randomIndex = (length: number) => Math.floor(Math.random() * length);

const revealCell = (state: GameState, row: number, col: number): GameGrid => {
  const newGrid = state.grid.map((r) => [...r]);
  const cell = newGrid[row][col];

  if (cell.revealed || cell.flagged) return newGrid;

  cell.revealed = true;

  return newGrid;
};

const revealNeighbors = (state: GameState, row: number, col: number) => {
  const cell = state.grid[row][col];

  if (cell.adjacentMines === 0 && !cell.mine) {
    getValidNeighbors(state.config, row, col).forEach(([r, c]) =>
      revealCell(state, r, c)
    );
  }
};

const checkWin = (grid: GameGrid): boolean =>
  grid.every((row) => row.every((cell) => cell.mine || cell.revealed));

export type GameStore = ReturnType<typeof createStore<GameState, GameEvents>>;
export type GameSnapshot = SnapshotFromStore<GameStore>;

export const createMinesweeperStore = (config: Configuration) => {
  const initialGrid = createGrid(config);

  return createStore<GameState, GameEvents>(
    {
      config,
      grid: initialGrid,
      gameStatus: "idle",
      face: "smile",
      minesLeft: config.mines,
      flagsLeft: config.mines,
      time: 0,
    },
    {
      initialize: (state) => ({
        ...state,
        grid: createGrid(state.config),
      }),
      startGame: (state, { row, col }) => ({
        ...state,
        grid: revealCell(state, row, col),
        gameStatus: "playing",
        time: 0,
      }),
      revealCell: (state, { row, col }) => {
        if (state.gameStatus !== "playing") return state;

        const newGrid = revealCell(state, row, col);
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
};
