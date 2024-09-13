import type { Component } from "solid-js";
import { onMount, createSignal, Show } from "solid-js";

import { useStore } from "./StoreContext";
import { GameInfo } from "./GameInfo";
import { Grid } from "./Grid";
import { Configuration } from "../types";

const presets: Record<string, Configuration> = {
  beginner: { width: 10, height: 10, mines: 10 },
  intermediate: { width: 15, height: 15, mines: 30 },
  advanced: { width: 20, height: 20, mines: 100 },
};

export const Minesweeper: Component = () => {
  const store = useStore();
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  onMount(() =>
    store.send({
      type: "initialize",
      config: { width: 15, height: 10, mines: 1 },
    })
  );

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const config = {
      width: Number(formData.get("width")),
      height: Number(formData.get("height")),
      mines: Number(formData.get("mines")),
    };
    store.send({ type: "initialize", config });
    closeDialog();
  };

  return (
    <div>
      <h1 class="font-black mb-4">Minesweeper</h1>
      <input type="text"></input>
      <nav class="bg-red-500 rounded-md mx-auto p-2 mb-4">
        <ul class="flex gap-x-4 justify-center font-mono">
          <li>
            <button
              onClick={() =>
                store.send({
                  type: "initialize",
                  config: presets.beginner,
                })
              }
            >
              Beginner
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                store.send({
                  type: "initialize",
                  config: presets.intermediate,
                })
              }
            >
              Intermediate
            </button>
          </li>
          <li>
            <button
              onClick={() =>
                store.send({
                  type: "initialize",
                  config: presets.advanced,
                })
              }
            >
              Advanced
            </button>
          </li>
          <li>
            <button onClick={openDialog}>Custom</button>
            <Show when={isDialogOpen()}>
              <div
                class="fixed inset-0 bg-gray-500 transition-opacity bg-opacity-75"
                aria-hidden="true"
              ></div>
              <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                  <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                    <form onSubmit={handleSubmit}>
                      <label>
                        Width:
                        <input
                          type="number"
                          name="width"
                          min="1"
                          max="50"
                          required
                        />
                      </label>
                      <label>
                        Height:
                        <input
                          type="number"
                          name="height"
                          min="1"
                          max="50"
                          required
                        />
                      </label>
                      <label>
                        Mines:
                        <input type="number" name="mines" min="1" required />
                      </label>
                      <button type="submit">Start Game</button>
                    </form>
                    {/* <div>
                      <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg
                          class="h-6 w-6 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <div class="mt-3 text-center sm:mt-5">
                        <h3
                          class="text-base font-semibold leading-6 text-gray-900"
                          id="modal-title"
                        >
                          Payment successful
                        </h3>
                        <div class="mt-2">
                          <p class="text-sm text-gray-500">
                            Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Consequatur amet labore.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="mt-5 sm:mt-6">
                      <button
                        type="button"
                        class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Go back to dashboard
                      </button>
                    </div> */}
                  </div>
                </div>
              </div>
            </Show>
          </li>
        </ul>
      </nav>
      <GameInfo />
      <Grid />
    </div>
  );
};
