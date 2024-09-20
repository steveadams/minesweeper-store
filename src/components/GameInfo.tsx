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

const resetInterval = (interval: number | undefined) => {
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
    if (gameIsOver() || gameIsWon() || !gameIsStarted()) {
      interval = resetInterval(interval);
    }
  });

  onCleanup(() => {
    interval = resetInterval(interval);
  });

  return (
    <div class="flex justify-between font-mono text-xl mb-4">
      <div role="meter">🚩 {flagsLeft()}</div>
      <div id="game-status">
        <button
          onClick={() => store.send({ type: "initialize", config: config() })}
          aria-label="face"
        >
          {face()}
        </button>
      </div>
      <time role="timer" datetime={`PT${time().toString()}S`}>
        {time().toString().padStart(3, "0")}
      </time>
    </div>
  );
};
