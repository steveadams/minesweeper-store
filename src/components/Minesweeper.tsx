import type { Component } from "solid-js";
import { onMount, createSignal, Show } from "solid-js";

import { useStore } from "./StoreContext";
import { GameInfo } from "./GameInfo";
import { Grid } from "./Grid";
import { Configuration } from "../types";

const presets: Record<string, Configuration> = {
  beginner: { width: 5, height: 5, mines: 5 },
  intermediate: { width: 15, height: 15, mines: 30 },
  advanced: { width: 20, height: 20, mines: 100 },
};

const CustomSettingField: Component<{
  label: string;
}> = ({ label }) => {
  return (
    <div>
      <label
        for={label}
        class="block text-sm font-medium leading-6 text-gray-900 capitalize"
      >
        {label}
      </label>
      <div class="mt-2">
        <input
          type="number"
          min="1"
          name={label}
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="10"
          required
        />
      </div>
    </div>
  );
};

export const Minesweeper: Component = () => {
  const store = useStore();
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    console.log("formData", formData);

    const config = {
      width: Number(formData.get("width")),
      height: Number(formData.get("height")),
      mines: Number(formData.get("mines")),
    };

    console.log("config", config);

    store.send({ type: "initialize", config });
    closeDialog();
  };

  return (
    <div>
      <h1 class="font-black mb-4">Minesweeper</h1>
      <input type="text"></input>
      <nav class="rounded-md mx-auto p-2 mb-4">
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

            <dialog open={isDialogOpen()}>
              <div
                class="fixed inset-0 bg-gray-500 transition-opacity bg-opacity-75"
                aria-hidden="true"
              ></div>
              <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                  <div class="relative transform rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                    <button
                      class="z-20 absolute top-0 right-0 p-1 text-slate-400 bg-transparent hover:text-red-500"
                      onClick={closeDialog}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-6 hover:scale-110"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <form onSubmit={handleSubmit}>
                      <div class="flex gap-8">
                        <CustomSettingField label="width" />
                        <CustomSettingField label="height" />
                        <CustomSettingField label="mines" />
                      </div>
                      <div class="mt-6 flex items-center justify-end gap-x-6">
                        <button
                          type="submit"
                          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Start Game
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </dialog>
          </li>
        </ul>
      </nav>
      <GameInfo />
      <Grid />
    </div>
  );
};
