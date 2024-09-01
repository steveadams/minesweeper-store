import type { Accessor, Component } from "solid-js";
import type { Cell, CellCoordinates } from "./types";

import { match } from "ts-pattern";
import {
  createMemo,
  createRenderEffect,
  Index,
  onCleanup,
  onMount,
} from "solid-js";
import { useSelector } from "@xstate/store/solid";
import {
  coveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "./types";

import { createMinesweeperStore } from "./store";

import {
  // selectCellAdjacentMines,
  selectFace,
  selectGameStatus,
  selectIsPlayerRevealing,
  // selectCell,
} from "./selectors";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<
  CellCoordinates & {
    cell: Accessor<Cell>;
    store: ReturnType<typeof createMinesweeperStore>;
  }
>;

const CoveredCell: CellComponent = ({ row, col, store }) => {
  const revealing = useSelector(store, selectIsPlayerRevealing);

  const uncoverCell = (e: MouseEvent) => {
    e.preventDefault();

    console.log("uncovering cell");

    store.send({ type: "revealCell", row, col });
  };

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();

    console.log("toggling flag");

    store.send({ type: "toggleFlag", row, col });
  };

  const setRevealing = (e: MouseEvent) => {
    e.preventDefault();

    if (e.button !== 0) {
      return;
    }

    store.send({ type: "setIsPlayerRevealing", to: true });
  };

  return (
    <button
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
      onClick={uncoverCell}
      onContextMenu={toggleFlag}
      onMouseLeave={() =>
        revealing
          ? store.send({ type: "setIsPlayerRevealing", to: false })
          : null
      }
      onMouseDown={setRevealing}
      onMouseUp={() => store.send({ type: "setIsPlayerRevealing", to: false })}
    ></button>
  );
};

const RevealedCell: CellComponent = ({ row, col, cell, store }) => {
  return (
    <button
      class={`${baseCellStyle} bg-slate-400 focus:ring-slate-500 dark:bg-slate-400`}
    >
      {cell().adjacentMines > 0 ? cell().adjacentMines.toString() : ""}
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

const Cell: CellComponent = ({ row, col, cell, store }) => {
  // const cell = useSelector(
  //   store,
  //   selectCell({ row, col }),
  // );

  createRenderEffect(() => {
    console.log("render Cell");
  });

  return match(cell())
    .with(coveredCell, coveredCellWithMine, coveredCellWithoutMine, () => (
      <CoveredCell cell={cell} row={row} col={col} store={store} />
    ))
    .with(flaggedCell, () => (
      <FlaggedCell cell={cell} row={row} col={col} store={store} />
    ))
    .with(revealedClearCell, () => (
      <RevealedCell cell={cell} row={row} col={col} store={store} />
    ))
    .with(revealedCellWithMine, () => <RevealedBomb />)
    .exhaustive();
};

const Board: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const board = useSelector(store, (state) => state.context.grid);

  createRenderEffect(() => {
    console.log("render Board");
  });

  return (
    <div class="flex gap-1 flex-col">
      <Index each={board()}>
        {(item, rowIndex) => (
          <div class="flex gap-1">
            <Index each={item()}>
              {(cell, colIndex) => (
                <Cell row={rowIndex} col={colIndex} cell={cell} store={store} />
              )}
            </Index>
          </div>
        )}
      </Index>
      {/* {board().map((row, rowIndex) => (
        <div class="flex gap-1">
          {row.map((_, colIndex) => (
            <Cell row={rowIndex} col={colIndex} store={store} />
          ))}
        </div>
      ))} */}
    </div>
  );
};

const GameInfo: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const face = useSelector(store, selectFace);
  const flagsLeft = useSelector(store, (state) => state.context.flagsLeft);
  const time = useSelector(store, (state) => state.context.timeElapsed);

  createRenderEffect(() => {
    console.log("render GameInfo");
  });

  return (
    <div class="flex justify-between">
      <div class="font-mono">🚩 {flagsLeft()}</div>
      <div>
        <button onClick={() => store.send({ type: "initialize" })}>
          {face()}
        </button>
      </div>
      <div class="font-mono">{time()}</div>
    </div>
  );
};

export const Minesweeper: Component = () => {
  const store = createMinesweeperStore({
    width: 10,
    height: 10,
    mines: 10,
  });

  onMount(() => store.send({ type: "initialize" }));

  let interval: number | undefined;
  const gameStatus = useSelector(store, selectGameStatus);

  // createEffect(() => {
  //   const subscription = store.subscribe((state) => {
  //     console.log(state);
  //   });

  //   return () => subscription.unsubscribe();
  // });

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

  createRenderEffect(() => {
    console.log("render MineSweeper");
  });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo store={store} />
      <Board store={store} />
    </div>
  );
};
