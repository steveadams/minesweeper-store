import type { Component } from "solid-js";
import { onMount } from "solid-js";

import { useStore } from "./StoreContext";
import { GameInfo } from "./GameInfo";
import { Grid } from "./Grid";

export const Minesweeper: Component = () => {
  onMount(() =>
    useStore().send({
      type: "initialize",
      config: { width: 15, height: 10, mines: 1 },
    })
  );

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo />
      <Grid />
    </div>
  );
};
