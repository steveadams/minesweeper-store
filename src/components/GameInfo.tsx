import { Component, createEffect, onCleanup } from "solid-js";
import { useStore, useStoreSelector } from "./StoreContext";
import {
  selectConfig,
  selectFace,
  selectFlagsLeft,
  selectGameIsOver,
  selectGameIsStarted,
  selectGameIsWon,
  selectTimeElapsed,
} from "../store/selectors";

const resetInterval = (interval: number) => {
  clearInterval(interval);
  return (interval = undefined);
};

export const GameInfo: Component = () => {
  const store = useStore();
  const config = useStoreSelector(selectConfig);
  const face = useStoreSelector(selectFace);
  const flagsLeft = useStoreSelector(selectFlagsLeft);
  const time = useStoreSelector(selectTimeElapsed);
  const gameIsStarted = useStoreSelector(selectGameIsStarted);
  const gameIsOver = useStoreSelector(selectGameIsOver);
  const gameIsWon = useStoreSelector(selectGameIsWon);

  let interval: number | undefined;

  createEffect(() => {
    if (gameIsStarted()) {
      interval = window.setInterval(() => store.send({ type: "tick" }), 1000);
    }
  });

  createEffect(() => {
    if (gameIsOver() || gameIsWon()) {
      interval = resetInterval(interval);
    }
  });

  onCleanup(() => {
    interval = resetInterval(interval);
  });

  return (
    <div class="flex justify-between font-mono">
      <div>🚩 {flagsLeft()}</div>
      <div>
        <button
          onClick={() => store.send({ type: "initialize", config: config() })}
        >
          {face()}
        </button>
      </div>
      <div>{time().toString().padStart(3, "0")}</div>
    </div>
  );
};
