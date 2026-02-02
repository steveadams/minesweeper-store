import { type Component } from "solid-js";
import { Toaster } from "solid-sonner";

import { Minesweeper } from "./Minesweeper";
import { StoreProvider } from "./StoreContext";

const App: Component = () => (
  <StoreProvider>
    <main class="container mx-auto">
      <Minesweeper />
      <footer class="flex flex-col gap-4 py-8 items-center justify-center text-sm">
        <p>
          <span>Learn more: </span>
          <a
            href="https://steve-adams.me/building-minesweeper-with-xstate-store/"
            target="_blank"
            class="mt-1"
          >
            Building Minesweeper with a @xstate/store
          </a>
        </p>
        <ul class="flex gap-4 text-sm">
          <li>
            <a
              href="https://github.com/steveadams/minesweeper-store"
              class="text-black dark:text-white"
              target="_blank"
            >
              <svg class="size-8" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          </li>
          <li>
            <a
              href="https://bsky.app/profile/steve-adams.me"
              class="text-black dark:text-white"
              target="_blank"
            >
              <svg class="size-8" role="img" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                  <title>Bluesky</title>
                  <g>
                      <path d="M55.4911549,15.1724797 C84.8410141,37.2065079 116.408338,81.8843671 128,105.858226 C139.591662,81.8843671 171.158986,37.2065079 200.508845,15.1724797 C221.686085,-0.726562511 256,-13.0280836 256,26.1164797 C256,33.9343952 251.517746,91.7899445 248.888789,101.183522 C239.750761,133.838395 206.452732,142.167409 176.832451,137.126283 C228.607099,145.938001 241.777577,175.125607 213.333183,204.313212 C159.311775,259.746226 135.689465,190.40493 129.636507,172.637268 C128.526873,169.380029 128.007662,167.856198 128,169.151973 C127.992338,167.856198 127.473127,169.380029 126.363493,172.637268 C120.310535,190.40493 96.6882254,259.746226 42.6668169,204.313212 C14.2224225,175.125607 27.3929014,145.938001 79.1675493,137.126283 C49.5472676,142.167409 16.2492394,133.838395 7.11121127,101.183522 C4.48225352,91.7899445 0,33.9343952 0,26.1164797 C0,-13.0280836 34.3139155,-0.726562511 55.4911549,15.1724797 Z"/>
                  </g>
              </svg>
            </a>
          </li>
        </ul>
      </footer>
    </main>

    <Toaster
      toastOptions={{
        unstyled: true,
        classes: {
          toast:
            "flex gap-2 items-center justify-center bg-white p-4 rounded-lg shadow-lg ring-1 ring-offset-1 ring-gray-900/10",
          error: "bg-red-50 text-red-600 ring-red-600/50",
          success: "bg-green-50 text-green-600 ring-green-600/50",
        },
      }}
    />
  </StoreProvider>
);

export default App;
