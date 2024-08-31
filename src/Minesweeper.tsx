import type { Component } from "solid-js";
import type { Cell, CellCoordinates } from "./types";

import { match } from "ts-pattern";
import { createEffect, createMemo, onCleanup, onMount } from "solid-js";
import { useSelector } from "@xstate/store/solid";
import {
  coveredCell,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "./types";

import { createMinesweeperStore } from "./store";

import {
  selectAdjacentMines,
  selectCell,
  selectFace,
  selectFlagged,
  selectGameStatus,
  selectInteracting,
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
  const cell = useSelector(store, selectCell({ row, col }));
  const interacting = useSelector(store, selectInteracting);

  const uncoverCell = () => {
    if (gameStatus() === "idle") {
      store.send({ type: "startGame" });
    }

    store.send({ type: "revealCell", row, col });

    if (cell().mine) {
      store.send({ type: "endGame" });
    }
  };

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();

    if (gameStatus() !== "playing" && gameStatus() !== "idle") {
      return;
    }

    if (gameStatus() === "idle") {
      store.send({ type: "startGame" });
    }

    store.send({ type: "toggleFlag", row, col });
  };

  return (
    <button
      onClick={uncoverCell}
      onContextMenu={toggleFlag}
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
      onMouseLeave={() =>
        interacting ? store.send({ type: "endInteract" }) : null
      }
      onMouseDown={() => store.send({ type: "startInteract" })}
      onMouseUp={() => store.send({ type: "endInteract" })}
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
  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();
    store.send({ type: "toggleFlag", row, col });
  };

  return (
    <button
      onContextMenu={toggleFlag}
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
    .with(coveredCell, () => <CoveredCell row={row} col={col} store={store} />)
    .with(flaggedCell, () => <FlaggedCell row={row} col={col} store={store} />)
    .with(revealedClearCell, () => (
      <RevealedCell row={row} col={col} store={store} />
    ))
    .with(revealedCellWithMine, () => <RevealedBomb />)
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
  const gameStatus = useSelector(store, selectGameStatus);
  const face = useSelector(store, selectFace);
  const flagsLeft = useSelector(store, (state) => state.context.flagsLeft);
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
      <div>
        <button onClick={() => store.send({ type: "initialize" })}>
          {face()}
        </button>
      </div>
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

  // Could react to state here, but... Might be too implicit
  createEffect(() => {
    const subscription = store.subscribe((snapshot) => {
      // ...
    });

    onCleanup(() => {
      subscription.unsubscribe();
    });
  });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo store={store} />
      <Board store={store} />
    </div>
  );
};
