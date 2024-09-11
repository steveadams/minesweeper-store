import type { Component } from "solid-js";
import "./App.css";
import { Minesweeper } from "./components/Minesweeper";
import { StoreProvider } from "./StoreContext";

const App: Component = () => {
  return (
    <StoreProvider>
      <Minesweeper />
    </StoreProvider>
  );
};

export default App;
