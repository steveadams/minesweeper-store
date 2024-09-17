import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: "jsdom",
    globals: true,
    testTransformMode: {
      web: ["ts", "tsx"],
    },
    server: {
      deps: {
        inline: ["@xstate/store"],
      },
    },
  },
});
