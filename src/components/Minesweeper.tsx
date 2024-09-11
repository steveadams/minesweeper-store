import type { Component } from "solid-js";
import { createMemo, onMount, onCleanup } from "solid-js";

import { selectGameIsOver, selectGameIsStarted } from "../selectors";
import { useStore, useStoreSelector } from "../StoreContext";
import { GameInfo } from "./GameInfo";
import { Grid } from "./Grid";

const resetInterval = (interval: number) => {
  clearInterval(interval);
  return (interval = undefined);
};

export const Minesweeper: Component = () => {
  const store = useStore();

  let interval: number | undefined;
  const gameIsStarted = useStoreSelector(selectGameIsStarted);
  const gameIsOver = useStoreSelector(selectGameIsOver);

  onMount(() => store.send({ type: "initialize" }));

  createMemo(() => {
    if (gameIsStarted()) {
      interval = window.setInterval(() => store.send({ type: "tick" }), 1000);
    }
  });

  createMemo(() => {
    if (gameIsOver()) {
      if (interval) {
        interval = resetInterval(interval);
      }
    }
  });

  onCleanup(() => {
    if (interval) {
      interval = resetInterval(interval);
    }
  });

  return (
    <div>
      <h1>Minesweeper</h1>
      <GameInfo />
      <Grid />
    </div>
  );
};
