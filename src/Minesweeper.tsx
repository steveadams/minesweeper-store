import type { Component } from "solid-js";
import type { Cell, CellCoordinates } from "./store";

import { match, P } from "ts-pattern";
import { createMemo, onCleanup, onMount } from "solid-js";
import { useSelector } from "@xstate/store/solid";
import {
  coveredPattern,
  flaggedPattern,
  revealedBombPattern,
  revealedCellPattern,
  createMinesweeperStore,
} from "./store";
import {
  selectAdjacentMines,
  selectFlagged,
  selectGameStatus,
  selectMine,
  selectRevealed,
} from "./selectors";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<
  CellCoordinates & { store: ReturnType<typeof createMinesweeperStore> }
>;

const CoveredCell: CellComponent = ({ row, col, store }) => {
  const gameStatus = useSelector(store, selectGameStatus);

  const uncoverCell = () => {
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
      onClick={uncoverCell}
      onContextMenu={handleContextMenu}
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
    ></button>
  );
};

const RevealedCell: CellComponent = ({ row, col, store }) => {
  const adjacentMines = useSelector(store, selectAdjacentMines({ row, col }));

  return (
    <button
      class={`${baseCellStyle} bg-slate-400 focus:ring-slate-500 dark:bg-slate-400`}
    >
      {adjacentMines() > 0 ? adjacentMines().toString() : ""}
    </button>
  );
};

const FlaggedCell: CellComponent = ({ row, col, store }) => {
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

const Cell: CellComponent = ({ row, col, store }) => {
  const isRevealed = useSelector(store, selectRevealed({ row, col }));
  const isFlagged = useSelector(store, selectFlagged({ row, col }));
  const isMine = useSelector(store, selectMine({ row, col }));
  const adjacentMines = useSelector(store, selectAdjacentMines({ row, col }));

  const cell = {
    revealed: isRevealed(),
    flagged: isFlagged(),
    mine: isMine(),
    adjacentMines: adjacentMines(),
  } as Cell;

  return match(cell)
    .with(coveredPattern, () => (
      <CoveredCell row={row} col={col} store={store} />
    ))
    .with(flaggedPattern, () => (
      <FlaggedCell row={row} col={col} store={store} />
    ))
    .with(revealedCellPattern, () => (
      <RevealedCell row={row} col={col} store={store} />
    ))
    .with(revealedBombPattern, () => <RevealedBomb />)
    .exhaustive();
};

const Board: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const board = useSelector(store, (state) => state.context.grid);

  return (
    <div class="flex gap-1 flex-col">
      {board().map((row, rowIndex) => (
        <div class="flex gap-1">
          {row.map((_, colIndex) => (
            <Cell row={rowIndex} col={colIndex} store={store} />
          ))}
        </div>
      ))}
    </div>
  );
};

const GameInfo: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const gameStatus = useSelector(store, (state) => state.context.gameStatus);
  const face = useSelector(store, (state) => state.context.face);
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
    <div class="flex justify-between">
      <div>🚩 {flagsLeft()}</div>
      <div>Status: {gameStatus()}</div>
      <div>{face()}</div>
      <div>Time: {time()}</div>
    </div>
  );
};

export const Minesweeper: Component = () => {
  const store = createMinesweeperStore({
    width: 10,
    height: 10,
    mines: 10,
  });

  // Only necessary to avoid running on the server
  // Sending this event outside of onMount would work fine for a client-only app
  onMount(() => {
    store.send({ type: "initialize" });
  });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo store={store} />
      <Board store={store} />
    </div>
  );
};
