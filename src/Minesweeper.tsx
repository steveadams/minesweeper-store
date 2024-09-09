import type { Accessor, Component } from "solid-js";
import type { Cell } from "./types";

import { isMatching, match } from "ts-pattern";
import {
  createEffect,
  createMemo,
  createRenderEffect,
  Index,
  // onCleanup,
  onMount,
  Switch,
  Match,
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
  compareCells,
  selectCell,
  selectCellAdjacentMines,
  selectFace,
  selectGameStatus,
  selectCells,
  selectIsCellFlagged,
  selectIsCellMine,
  selectIsCellRevealed,
  selectIsPlayerRevealing,
} from "./selectors";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<{
  cell: Accessor<Cell>;
  index: number;
  store: ReturnType<typeof createMinesweeperStore>;
}>;

const CoveredCell: CellComponent = ({ cell, index, store }) => {
  cell();
  const revealing = useSelector(store, selectIsPlayerRevealing);

  const revealCell = () => {
    store.send({ type: "revealCell", index });
  };

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();
    store.send({ type: "toggleFlag", index });
  };

  // const setRevealing = (e: MouseEvent) => {
  //   if (e.button === 0) {
  //     store.send({ type: "setIsPlayerRevealing", to: true });
  //   }
  // };

  // const unsetRevealing = (e: MouseEvent) => {
  //   if (e.button === 0) {
  //     if (revealing()) {
  //       store.send({ type: "setIsPlayerRevealing", to: false });
  //     }
  //   }
  // };

  return (
    <button
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
      onClick={revealCell}
      onContextMenu={toggleFlag}
      // onMouseLeave={unsetRevealing}
      // onMouseDown={setRevealing}
      // onMouseUp={unsetRevealing}
    ></button>
  );
};

const RevealedCell: CellComponent = ({ cell }) => (
  <button
    class={`${baseCellStyle} bg-slate-400 focus:ring-slate-500 dark:bg-slate-400`}
  >
    {cell().adjacentMines > 0 ? cell().adjacentMines.toString() : ""}
  </button>
);

const FlaggedCell: CellComponent = ({ cell, index, store }) => {
  cell();

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();
    store.send({ type: "toggleFlag", index });
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

const RevealedBomb: CellComponent = ({ cell }) => {
  cell();

  return (
    <button
      class={`${baseCellStyle} bg-red-400 focus:ring-slate-500 dark:bg-red-600`}
    >
      💣
    </button>
  );
};

const Cell: CellComponent = ({ cell, index, store }) => (
  <Switch fallback={<div>Unknown cell</div>}>
    <Match when={isMatching(coveredCellWithMine, cell())}>
      <CoveredCell cell={cell} index={index} store={store} />
    </Match>
    <Match when={isMatching(coveredCellWithoutMine, cell())}>
      <CoveredCell cell={cell} index={index} store={store} />
    </Match>
    <Match when={isMatching(flaggedCell, cell())}>
      <FlaggedCell cell={cell} index={index} store={store} />
    </Match>
    <Match when={isMatching(revealedClearCell, cell())}>
      <RevealedCell cell={cell} index={index} store={store} />
    </Match>
    <Match when={isMatching(revealedCellWithMine, cell())}>
      <RevealedBomb cell={cell} index={index} store={store} />
    </Match>
  </Switch>
);

const Grid: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const cells = useSelector(store, selectCells);
  const width = useSelector(store, (state) => state.context.config.width);

  return (
    <>
      <style>
        {`.grid-cols-n {
          grid-template-columns: repeat(${width()}, 1fr);
        }
      `}
      </style>
      <div class="grid gap-1 grid-cols-n">
        <Index each={cells()}>
          {(cell, index) => <Cell cell={cell} index={index} store={store} />}
        </Index>
      </div>
    </>
  );
};

const GameInfo: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const face = useSelector(store, selectFace);
  const flagsLeft = useSelector(store, (state) => state.context.flagsLeft);
  const time = useSelector(store, (state) => state.context.timeElapsed);

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

  // let interval: number | undefined;
  // const gameStatus = useSelector(store, selectGameStatus);

  // createEffect(() => {
  //   const subscription = store.subscribe((state) => {
  //     console.log(state);
  //   });

  //   return () => subscription.unsubscribe();
  // });

  // createMemo(() => {
  //   if (gameStatus() === "playing") {
  //     interval = window.setInterval(() => {
  //       store.send({ type: "tick" });
  //     }, 1000);
  //   } else if (interval) {
  //     clearInterval(interval);
  //     interval = undefined;
  //   }
  // });

  // onCleanup(() => {
  //   if (interval) clearInterval(interval);
  // });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo store={store} />
      <Grid store={store} />
    </div>
  );
};
