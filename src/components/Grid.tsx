import { Component, Index } from "solid-js";
import { useStoreSelector } from "./StoreContext";
import { selectCells, selectGridWidth } from "../store/selectors";
import { CellButton } from "./Cell";

export const Grid: Component = () => {
  const cells = useStoreSelector(selectCells);
  const width = useStoreSelector(selectGridWidth);

  return (
    <div class="flex justify-center">
      <div
        class="grid gap-1 max-w-fit"
        style={`grid-template-columns: repeat(${width()}, 1fr);`}
        role="grid"
      >
        <Index each={cells()}>
          {(cell, index) => <CellButton cell={cell} index={index} />}
        </Index>
      </div>
    </div>
  );
};
