import { Component, Index } from "solid-js";
import { useStoreSelector } from "../StoreContext";
import { selectCells, selectGridWidth } from "../selectors";
import { CellButton } from "./Cell";

export const Grid: Component = () => {
  const cells = useStoreSelector(selectCells);
  const width = useStoreSelector(selectGridWidth);

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
          {(cell, index) => <CellButton cell={cell} index={index} />}
        </Index>
      </div>
    </>
  );
};
