import { Accessor, Component, JSX, Match, Switch } from "solid-js";
import {
  type Cell,
  coveredCell,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "../types";
import { useStore, useStoreSelector } from "./StoreContext";
import { selectPlayerIsRevealing } from "../store/selectors";
import { isMatching } from "ts-pattern";

interface BaseButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

const BaseButton: Component<BaseButtonProps> = (props) => (
  <button
    {...props}
    class={`flex aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 items-center justify-center ${
      props.class || ""
    }`}
  >
    {props.children}
  </button>
);

type CellComponent = Component<{
  cell: Accessor<Cell>;
  index: number;
}>;

const CoveredCell: CellComponent = ({ index }) => {
  const store = useStore();
  const revealing = useStoreSelector(selectPlayerIsRevealing);

  const revealCell = (e: MouseEvent) => {
    console.log("reveal cell", index);
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
    <BaseButton
      class="bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
      onClick={revealCell}
      onContextMenu={toggleFlag}
      onMouseLeave={unsetRevealing}
      onMouseDown={setRevealing}
      onMouseUp={unsetRevealing}
    ></BaseButton>
  );
};

const RevealedCell: CellComponent = ({ cell }) => (
  <BaseButton class="bg-slate-400 focus:ring-slate-500 dark:bg-slate-400">
    {cell().adjacentMines > 0 ? cell().adjacentMines.toString() : ""}
  </BaseButton>
);

const FlaggedCell: CellComponent = ({ index }) => {
  const store = useStore();

  const toggleFlag = (e: MouseEvent) => {
    e.preventDefault();
    store.send({ type: "toggleFlag", index });
  };

  return (
    <BaseButton
      onContextMenu={toggleFlag}
      class="bg-slate-900 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
    >
      🚩
    </BaseButton>
  );
};

const RevealedBomb: CellComponent = () => {
  return (
    <BaseButton class="bg-red-400 focus:ring-slate-500 dark:bg-red-600">
      💣
    </BaseButton>
  );
};

// TODO: Think about implementing something exhaustive here.
// I don't think it's possible with JSX. Worth a look for sure.
// It isn't possible to use ts-pattern here unfortunately
export const CellButton: CellComponent = (props) => {
  const { cell } = props;

  return (
    <Switch fallback={<div>Unknown cell</div>}>
      <Match when={isMatching(coveredCell, cell())} keyed>
        <CoveredCell {...props} />
      </Match>
      <Match when={isMatching(flaggedCell, cell())} keyed>
        <FlaggedCell {...props} />
      </Match>
      <Match when={isMatching(revealedClearCell, cell())} keyed>
        <RevealedCell {...props} />
      </Match>
      <Match when={isMatching(revealedCellWithMine, cell())} keyed>
        <RevealedBomb {...props} />
      </Match>
    </Switch>
  );
};
