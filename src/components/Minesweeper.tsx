import type { Component } from "solid-js";
import { createSignal, Index, onCleanup, onMount } from "solid-js";
import { match } from "ts-pattern";
import { toast } from "solid-sonner";

import { useStore, useStoreSelector } from "./StoreContext";
import { GameInfo } from "./GameInfo";
import { CellButton } from "./Cell";
import { CustomDialog } from "./CustomGameDialog";
import { PRESETS } from "../data";

export const Minesweeper: Component = () => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  const store = useStore();
  const cells = useStoreSelector(({ context }) => context.cells);
  const width = useStoreSelector(({ context }) => context.config.width);

  onMount(() => {
    const endGameSub = store.on("endGame", (event) => {
      match(event.result)
        .with("win", () => {
          toast.success(`You won! ${event.cause}`);
        })
        .with("lose", () => {
          store.send({ type: "lose" });
          toast.error(`You lost! ${event.cause}`);
        })
        .exhaustive();
    });

    onCleanup(() => {
      endGameSub.unsubscribe();
    });
  });

  return (
    <div class="flex flex-col gap-y-6 py-6">
      <h1 class="text-4xl font-black">Storesweeper</h1>
      <span class="isolate inline-flex rounded-md mx-auto my-4 ring-1 bg-white ring-inset ring-gray-300 overflow-hidden">
        <Index each={PRESETS}>
          {(preset) => (
            <ConfigureGameButton
              label={preset().name}
              onClick={() =>
                store.send({
                  type: "initialize",
                  config: preset().config,
                })
              }
            />
          )}
        </Index>
        <ConfigureGameButton
          label={"Custom"}
          onClick={() => setIsDialogOpen(true)}
        />
      </span>

      <CustomDialog
        isOpen={isDialogOpen}
        closeDialog={() => setIsDialogOpen(false)}
        submitForm={(config) => {
          store.send({ type: "initialize", config });
          setIsDialogOpen(false);
        }}
      />

      <GameInfo />

      <div class="flex justify-center">
        <div
          class="grid gap-1 min-w-min"
          style={`grid-template-columns: repeat(${width()}, 1fr);`}
          role="grid"
        >
          <Index each={cells()}>
            {(cell, index) => <CellButton cell={cell} index={index} />}
          </Index>
        </div>
      </div>
    </div>
  );
};

const ConfigureGameButton: Component<{
  label: string;
  onClick: () => void;
}> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      class="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold bg-transparent text-gray-600 hover:text-gray-900 focus:z-10"
      data-preset={label}
    >
      {label}
    </button>
  );
};
