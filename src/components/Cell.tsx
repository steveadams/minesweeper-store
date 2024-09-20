import { Accessor, Component, JSX, Match, Switch } from "solid-js";
import type { Cell } from "../types";
import { useStore, useStoreSelector } from "./StoreContext";
import { isMatching } from "ts-pattern";
import {
  coveredCell,
  flaggedCell,
  revealedCellWithMine,
  revealedClearCell,
} from "../data";

interface BaseButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

const BaseButton: Component<BaseButtonProps> = (props) => (
  <button
    {...props}
    class={`flex aspect-square size-10 rounded-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 items-center justify-center ${
      props.class || ""
    }`}
    role="gridcell"
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
  const revealing = useStoreSelector(
    ({ context }) => context.playerIsRevealingCell,
  );

  const revealCell = () => store.send({ type: "revealCell", index });

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
    if (e.button === 0 && revealing()) {
      store.send({ type: "setIsPlayerRevealing", to: false });
    }
  };

  return (
    <BaseButton
      class="bg-slate-900 hover:bg-slate-700 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
      onClick={revealCell}
      onContextMenu={toggleFlag}
      onPointerLeave={unsetRevealing}
      onPointerDown={setRevealing}
      onPointerUp={unsetRevealing}
      data-covered
    ></BaseButton>
  );
};

const RevealedCell: CellComponent = ({ cell }) => (
  <BaseButton
    class="bg-slate-400 focus:ring-slate-500 dark:bg-slate-400"
    data-revealed={cell().adjacentMines.toString()}
  >
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
      data-flagged
    >
      🚩
    </BaseButton>
  );
};

const RevealedBomb: CellComponent = () => {
  return (
    <BaseButton
      class="bg-red-400 focus:ring-slate-500 dark:bg-red-600"
      data-mine
    >
      💣
    </BaseButton>
  );
};

// TODO: Think about implementing something exhaustive here. Maybe Effect can be worked in?
// I don't think it's possible with SolidJS/JSX. Worth experimenting with though.
// Issue is specific to "run once" principle of SolidJS
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
