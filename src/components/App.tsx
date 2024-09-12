import type { Component } from "solid-js";
import { Minesweeper } from "./Minesweeper";
import { StoreProvider } from "./StoreContext";

const App: Component = () => {
  return (
    <main>
      <StoreProvider>
        <Minesweeper />
      </StoreProvider>
    </main>
  );
};

export default App;
