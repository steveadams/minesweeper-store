import { Component, createEffect, onCleanup } from "solid-js";
import { useStore, useStoreSelector } from "./StoreContext";
import {
  faceEmoji,
  gameIsOver,
  gameIsStarted,
  gameIsWon,
} from "../store/selectors";
import { FACES } from "../data";

const resetInterval = (interval: number | undefined) => {
  clearInterval(interval);
  return (interval = undefined);
};

export const GameInfo: Component = () => {
  const store = useStore();
  const config = useStoreSelector(({ context }) => context.config);
  const flagsLeft = useStoreSelector(({ context }) => context.flagsLeft);
  const time = useStoreSelector(({ context }) => context.timeElapsed);
  const face = useStoreSelector(faceEmoji);
  const gameStarted = useStoreSelector(gameIsStarted);
  const gameLost = useStoreSelector(gameIsOver);
  const gameWon = useStoreSelector(gameIsWon);

  let interval: number | undefined;

  createEffect(() => {
    if (gameStarted()) {
      interval = window.setInterval(() => store.send({ type: "tick" }), 1000);
    }
  });

  createEffect(() => {
    if (gameLost() || gameWon() || !gameStarted()) {
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
          {FACES[face()]}
        </button>
      </div>
      <time role="timer" datetime={`PT${time().toString()}S`}>
        {time().toString().padStart(3, "0")}
      </time>
    </div>
  );
};
