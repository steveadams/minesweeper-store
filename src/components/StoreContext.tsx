import { useSelector } from "@xstate/store/solid";
import { createContext, ParentProps, useContext } from "solid-js";

import { setupStore } from "../store/store";
import { GameSnapshot, GameStore } from "../types";
import { PRESETS } from "../data";

const StoreContext = createContext<GameStore | undefined>(undefined);

export const StoreProvider = (props: ParentProps) => {
  const store = setupStore(PRESETS[0].config);

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error("useStore must be used within the StoreProvider");
  }

  return store;
};

export const useStoreSelector = <T,>(selector: (s: GameSnapshot) => T) => {
  return useSelector(useStore(), selector);
};
