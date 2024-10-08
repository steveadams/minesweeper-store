import type { Accessor, Component } from "solid-js";
import { createMemo, createSignal } from "solid-js";

import { GameContext } from "../types";

const CustomSettingField: Component<{
  name: string;
  min: number;
  max: Accessor<number>;
  onChange?: (event: Event) => void;
}> = ({ name, min, max, onChange }) => (
  <div>
    <label
      for={name}
      class="block text-sm font-medium leading-6 text-gray-900 capitalize"
    >
      {name}
    </label>
    <input
      id={name}
      name={name}
      min={min}
      max={max()}
      onChange={onChange}
      type="number"
      placeholder="10"
      required
      class="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-red-500 focus:border-red-500"
    />
  </div>
);

export const CustomDialog: Component<{
  isOpen: Accessor<boolean>;
  closeDialog: (event: MouseEvent) => void;
  submitForm: (config: GameContext["config"]) => void;
}> = ({ closeDialog, isOpen, submitForm }) => {
  const [width, setWidth] = createSignal(10);
  const [height, setHeight] = createSignal(10);

  const maximumMines = createMemo(() => width() * height() - 1);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const config = {
      width: Number(formData.get("width")),
      height: Number(formData.get("height")),
      mines: Number(formData.get("mines")),
      timeLimit: Number(formData.get("timeLimit")),
    };
    submitForm(config);
  };

  const handleWidthChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setWidth(Number(value));
  };

  const handleHeightChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    setHeight(Number(value));
  };

  return (
    <dialog open={isOpen()}>
      <div
        class="fixed inset-0 bg-gray-800/30 transition-opacity bg-opacity-75"
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
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-6 hover:scale-110"
              >
                <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
              </svg>
            </button>
            <form onSubmit={handleSubmit} class="flex gap-8">
              <CustomSettingField
                name="width"
                min={2}
                max={() => 50}
                onChange={handleWidthChange}
              />
              <CustomSettingField
                name="height"
                min={2}
                max={() => 50}
                onChange={handleHeightChange}
              />
              <CustomSettingField name="mines" min={1} max={maximumMines} />

              {/* TODO: Add a custom time limit? */}
              <input
                id="timeLimit"
                name="timeLimit"
                value={999}
                type="number"
                required
                class="hidden"
                aria-hidden="true"
              />

              <div class="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="submit"
                  name="submit"
                  class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  Go
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
};
