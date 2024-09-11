import { createContext, ParentProps, useContext } from "solid-js";
import { setupStore } from "./store";
import { GameEvent, GameSnapshot, GameStore } from "./types";
import { useSelector } from "@xstate/store/solid";
import { EventFromStore, EventObject, EventPayloadMap } from "@xstate/store";

const StoreContext = createContext<GameStore | undefined>(undefined);

export const StoreProvider = (props: ParentProps) => {
  const store = setupStore({
    width: 10,
    height: 10,
    mines: 10,
  });

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
};

// Create a hook to use the store context
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
