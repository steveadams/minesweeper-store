import type { Accessor, Component } from "solid-js";
import type { Cell, CellCoordinates } from "./types";

import { match } from "ts-pattern";
import {
  createEffect,
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
  compareCells,
  selectCell,
  selectFace,
  selectGameStatus,
  selectGrid,
  selectIsPlayerRevealing,
} from "./selectors";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<
  CellCoordinates & {
    store: ReturnType<typeof createMinesweeperStore>;
  }
>;

const CoveredCell: CellComponent = ({ row, col, store }) => {
  const revealing = useSelector(store, selectIsPlayerRevealing);

  const revealCell = () => {
    console.log("onClick event");
    store.send({ type: "revealCell", row, col });
  };

  const toggleFlag = (e: MouseEvent) => {
    console.log("onContextMenu event");
    e.preventDefault();
    store.send({ type: "toggleFlag", row, col });
  };

  // const setRevealing = (e: MouseEvent) => {
  //   console.log("onMouseDown event");
  //   if (e.button === 0) {
  //     store.send({ type: "setIsPlayerRevealing", to: true });
  //   }
  // };

  // const unsetRevealing = (e: MouseEvent) => {
  //   console.log("onMouseUp event");
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

const RevealedCell: CellComponent = ({ store, row, col }) => {
  const cell = useSelector(store, selectCell({ row, col }));

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

const Cell: CellComponent = ({ row, col, store }) => {
  // const cell = useSelector(store, selectCell({ row, col }), compareCells);
  const cell = useSelector(store, selectCell({ row, col }));

  createRenderEffect(() => {
    console.log("render Cell", cell());
  });

  return match(cell())
    .with(coveredCell, coveredCellWithMine, coveredCellWithoutMine, () => (
      <CoveredCell row={row} col={col} store={store} />
    ))
    .with(flaggedCell, () => <FlaggedCell row={row} col={col} store={store} />)
    .with(revealedClearCell, () => (
      <RevealedCell row={row} col={col} store={store} />
    ))
    .with(revealedCellWithMine, () => <RevealedBomb />)
    .exhaustive();
};

const Grid: Component<{
  store: ReturnType<typeof createMinesweeperStore>;
}> = ({ store }) => {
  const grid = useSelector(store, selectGrid);

  createRenderEffect(() => {
    console.log("render Board");
  });

  return (
    <div class="flex gap-1 flex-col">
      <Index each={grid()}>
        {(row, rowIndex) => (
          <div class="flex gap-1">
            <Index each={row()}>
              {(_, colIndex) => (
                <Cell row={rowIndex} col={colIndex} store={store} />
              )}
            </Index>
          </div>
        )}
      </Index>
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

  createRenderEffect(() => {
    console.log("render MineSweeper");
  });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo store={store} />
      <Grid store={store} />
    </div>
  );
};
