# Storesweeper

Storesweeper is a modern implementation of the classic Minesweeper game, built with a focus on event-based state management and type safety.

## Demo

You can demo the game at [https://minesweeper-store.vercel.app/](https://minesweeper-store.vercel.app/)

## Technologies

This project showcases the use of:

- [@xstate/store](https://github.com/statelyai/xstate/tree/main/packages/xstate-store) for state management
- [SolidJS](https://www.solidjs.com/) for reactive UI rendering
- [ts-pattern](https://github.com/gvergnaud/ts-pattern) for exhaustive pattern matching

Together they create a great foundation for tasks like this.

## Key Features

- Lightweight yet capable tooling
- Responsive grid-based game board
- Multiple difficulty presets
- Custom game configurations
- Timer and flag counter
- Toast notifications (triggered by game events)

## Development Philosophy

The project was a learning experience for me, and I wanted to share it with others. The following are some of the key principles that guided the development:

1. Type and runtime safety through use of TypeScript and pattern matching
2. Efficient, reactive UI rendering with SolidJS
3. Centralized state management with @xstate/store
4. Clean separation of concerns between UI components and game logic

The ideal outcome was to have a store which could run the game in the browser, but easily be adapted to run in a Node.js environment or on the server for example.

In this specfic iteration, I wanted the rendering of the UI to avoid any redundant renders possible and have as granular of control over reactivity as possible.

## Getting Started

### Prerequisites

- Node.js
- pnpm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/steveadams/minesweeper-store.git
   cd minesweeper-store
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

### Running the Development Server

Start the development server:

```
pnpm run dev
```

The game will be available at `http://localhost:3000`.

### Building for Production

To create a production build:

```
npm run build
```

The output will be in the `dist` directory.

### Running Tests

`pnpm test`

## Contributing

Do you see a way to do things better? Contributions are welcome! Feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
