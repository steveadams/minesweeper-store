import {
  Accessor,
  Component,
  createEffect,
  createSignal,
  Match,
  Switch,
} from "solid-js";
import {
  type Cell,
  coveredCell,
  coveredCellWithMine,
  coveredCellWithoutMine,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "../types";
import { useStore, useStoreSelector } from "./StoreContext";
import { selectPlayerIsRevealing } from "../store/selectors";
import { isMatching, match } from "ts-pattern";

const baseCellStyle =
  "aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm flex items-center justify-center pointer-events-auto";

type CellRootComponent = Component<{
  cell: Accessor<Cell>;
  index: number;
}>;

type CellDisplayComponent = Component<{
  cell: Cell;
  index: number;
}>;

const CoveredCell: CellDisplayComponent = ({ index }) => {
  const store = useStore();
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

const RevealedCell: CellDisplayComponent = ({ cell }) => (
  <button
    class={`${baseCellStyle} bg-slate-400 focus:ring-slate-500 dark:bg-slate-400`}
  >
    {cell.adjacentMines > 0 ? cell.adjacentMines.toString() : ""}
  </button>
);

const FlaggedCell: CellDisplayComponent = ({ index }) => {
  const store = useStore();

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

const RevealedBomb: CellDisplayComponent = () => {
  return (
    <button
      class={`${baseCellStyle} bg-red-400 focus:ring-slate-500 dark:bg-red-600`}
    >
      💣
    </button>
  );
};

// TODO: Figure out a way to get exhaustive matching in SolidJS :(
// export const CellButton: CellRootComponent = ({ cell, index }) => {
//   const [component, setComponent] = createSignal(CoveredCell);

//   createEffect(() => {
//     setComponent(() =>
//       match(cell())
//         .with(coveredCellWithMine, coveredCellWithoutMine, () => CoveredCell)
//         .with(flaggedCell, () => FlaggedCell)
//         .with(revealedClearCell, () => RevealedCell)
//         .with(revealedCellWithMine, () => RevealedBomb)
//         .exhaustive()
//     );
//   });

//   const CellComponent = component();

//   return <CellComponent cell={cell()} index={index} />;
// };

export const CellButton: CellRootComponent = ({ cell, index }) => (
  <Switch fallback={<div>Unknown cell</div>}>
    <Match when={isMatching(coveredCellWithMine, cell())} keyed>
      <CoveredCell cell={cell()} index={index} />
    </Match>
    <Match when={isMatching(coveredCellWithoutMine, cell())} keyed>
      <CoveredCell cell={cell()} index={index} />
    </Match>
    <Match when={isMatching(flaggedCell, cell())} keyed>
      <FlaggedCell cell={cell()} index={index} />
    </Match>
    <Match when={isMatching(revealedClearCell, cell())} keyed>
      <RevealedCell cell={cell()} index={index} />
    </Match>
    <Match when={isMatching(revealedCellWithMine, cell())} keyed>
      <RevealedBomb cell={cell()} index={index} />
    </Match>
  </Switch>
);
