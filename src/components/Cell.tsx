import { Accessor, Component, Match, Switch } from "solid-js";
import {
  type Cell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "../types";
import { useStore, useStoreSelector } from "../StoreContext";
import { selectPlayerIsRevealing } from "../selectors";
import { isMatching } from "ts-pattern";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellComponent = Component<{
  cell: Accessor<Cell>;
  index: number;
}>;

const CoveredCell: CellComponent = ({ cell, index }) => {
  const store = useStore();
  cell();
  const revealing = useStoreSelector(selectPlayerIsRevealing);

  const revealCell = () => {
    store.send({ type: "revealCell", index });
  };

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();
    store.send({ type: "toggleFlag", index });
  };

  const setRevealing = (e: MouseEvent) => {
    if (e.button === 0) {
      store.send({ type: "setIsPlayerRevealing", to: true });
    }
  };

  const unsetRevealing = (e: MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    if (revealing()) {
      store.send({ type: "setIsPlayerRevealing", to: false });
    }
  };

  return (
    <button
      class={`${baseCellStyle} bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600`}
      onClick={revealCell}
      onContextMenu={toggleFlag}
      onMouseLeave={unsetRevealing}
      onMouseDown={setRevealing}
      onMouseUp={unsetRevealing}
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

const FlaggedCell: CellComponent = ({ cell, index }) => {
  const store = useStore();
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

export const CellButton: CellComponent = (props) => (
  <Switch fallback={<div>Unknown cell</div>}>
    <Match when={isMatching(coveredCellWithMine, props.cell())}>
      <CoveredCell {...props} />
    </Match>
    <Match when={isMatching(coveredCellWithoutMine, props.cell())}>
      <CoveredCell {...props} />
    </Match>
    <Match when={isMatching(flaggedCell, props.cell())}>
      <FlaggedCell {...props} />
    </Match>
    <Match when={isMatching(revealedClearCell, props.cell())}>
      <RevealedCell {...props} />
    </Match>
    <Match when={isMatching(revealedCellWithMine, props.cell())}>
      <RevealedBomb {...props} />
    </Match>
  </Switch>
);
