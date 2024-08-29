import type { Component } from "solid-js";
import type { Cell, CellCoordinates } from "./store";

import { match, P } from "ts-pattern";
import { createMemo, onCleanup } from "solid-js";
import { useSelector } from "@xstate/store/solid";
import {
  coveredPattern,
  flaggedPattern,
  revealedBombPattern,
  revealedCellPattern,
  store,
} from "./store";
import { selectAdjacentMines } from "./selectors";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<CellCoordinates>;

const CoveredCell: CellComponent = ({ row, col }) => {
  const gameStatus = useSelector(store, (state) => state.context.gameStatus);

  const handleClick = () => {
    if (gameStatus() === "idle") {
      store.send({ type: "startGame", row, col });
    } else if (gameStatus() === "playing") {
      store.send({ type: "revealCell", row, col });
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();

    if (gameStatus() === "playing") {
      store.send({ type: "flagCell", row, col });
    }
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
    ></button>
  );
};

const RevealedCell: CellComponent = ({ row, col }) => {
  const adjacentMines = useSelector(store, selectAdjacentMines(row, col));

  return (
    <button
      class={`${baseCellStyle} bg-slate-400 focus:ring-slate-500 dark:bg-slate-400`}
    >
      {adjacentMines() > 0 ? adjacentMines().toString() : ""}
    </button>
  );
};

const FlaggedCell: CellComponent = ({ row, col }) => {
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();

    store.send({ type: "flagCell", row, col });
  };

  return (
    <button
      onContextMenu={handleContextMenu}
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600`}
    >
      🚩
    </button>
  );
};

const RevealedBomb: Component = () => (
  <button
    class={`${baseCellStyle} bg-red-400 focus:ring-slate-500 dark:bg-red-600`}
  >
    💣
  </button>
);

const Cell: CellComponent = ({ row, col }) => {
  const isRevealed = useSelector(
    store,
    (state) => state.context.grid[row][col].revealed
  );
  const isFlagged = useSelector(
    store,
    (state) => state.context.grid[row][col].flagged
  );
  const isMine = useSelector(
    store,
    (state) => state.context.grid[row][col].mine
  );
  const adjacentMines = useSelector(
    store,
    (state) => state.context.grid[row][col].adjacentMines
  );

  const cell = {
    revealed: isRevealed(),
    flagged: isFlagged(),
    mine: isMine(),
    adjacentMines: adjacentMines(),
  } as Cell;

  return match(cell)
    .with(coveredPattern, () => <CoveredCell row={row} col={col} />)
    .with(flaggedPattern, () => <FlaggedCell row={row} col={col} />)
    .with(revealedCellPattern, () => <RevealedCell row={row} col={col} />)
    .with(revealedBombPattern, () => <RevealedBomb />)
    .exhaustive();
};

const Board: Component = () => {
  const board = useSelector(store, (state) => state.context.grid);

  return (
    <div class="flex gap-1 flex-col">
      {board().map((row, rowIndex) => (
        <div class="flex gap-1">
          {row.map((_, colIndex) => (
            <Cell row={rowIndex} col={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
};

const GameInfo: Component = () => {
  const gameStatus = useSelector(store, (state) => state.context.gameStatus);
  const flagsLeft = useSelector(store, (state) => state.context.minesLeft);
  const time = useSelector(store, (state) => state.context.time);

  let interval: number | undefined;

  createMemo(() => {
    if (gameStatus() === "playing") {
      interval = window.setInterval(() => {
        store.send({ type: "tick" });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
  });

  onCleanup(() => {
    if (interval) clearInterval(interval);
  });

  return (
    <div class="flex flex-col">
      <div>🚩 {flagsLeft()}</div>
      <div>Time: {time()}</div>
      <div>Status: {gameStatus()}</div>
    </div>
  );
};

export const Minesweeper: Component = () => {
  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo />
      <Board />
    </div>
  );
};
