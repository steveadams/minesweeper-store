import { Component } from "solid-js";
import { useStore, useStoreSelector } from "../StoreContext";
import { selectFace, selectFlagsLeft, selectTimeElapsed } from "../selectors";

export const GameInfo: Component = () => {
  const store = useStore();
  const face = useStoreSelector(selectFace);
  const flagsLeft = useStoreSelector(selectFlagsLeft);
  const time = useStoreSelector(selectTimeElapsed);

  return (
    <div class="flex justify-between">
      <div class="font-mono">🚩 {flagsLeft()}</div>
      <div>
        <button onClick={() => store.send({ type: "initialize" })}>
          {face()}
        </button>
      </div>
      <div class="font-mono">{time()}</div>
    </div>
  );
};
