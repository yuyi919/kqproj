---
name: "boardgame-io-docs"
description: "Reference for boardgame.io engine. Invoke when implementing turn-based game logic, state management, or game clients."
---

# boardgame.io Documentation

`boardgame.io` is an engine for turn-based games that separates game logic (`Game`) from rendering (`Client`).

## Core Concepts

### State (`G` vs `ctx`)
- **`G`**: Your custom game state (e.g., board, hands, health). Must be JSON-serializable.
- **`ctx`**: Framework metadata (read-only in moves).
  - `ctx.turn`: Current turn number.
  - `ctx.currentPlayer`: ID of player whose turn it is.
  - `ctx.phase`: Current phase name.
  - `ctx.numPlayers`: Total players.

### Game Definition
```typescript
const MyGame = {
  setup: ({ ctx }) => ({ cells: Array(9).fill(null) }), // Returns initial G
  
  moves: {
    clickCell: ({ G, ctx }, id) => {
      if (G.cells[id] !== null) return "INVALID_MOVE"; // Validation
      G.cells[id] = ctx.currentPlayer; // Mutation (Immer used internally)
    },
  },
  
  turn: {
    minMoves: 1,
    maxMoves: 1, // Auto-end turn after 1 move
  },
  
  endIf: ({ G, ctx }) => {
    if (IsVictory(G)) return { winner: ctx.currentPlayer };
  }
};
```

## Flow Control

### Phases
High-level game states (e.g., "bidding", "playing").
```typescript
phases: {
  bidding: {
    start: true,
    moves: { bid: ... }, // Phase-specific moves
    next: 'playing',     // Next phase
  },
  playing: { ... }
}
```

### Turn Order
Control who plays next.
```typescript
turn: {
  order: TurnOrder.DEFAULT, // Round-robin (0, 1, 2...)
  // Or custom:
  // order: {
  //   first: ({ G, ctx }) => 0,
  //   next: ({ G, ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
  // }
}
```

### Events
Triggered from moves or client to change `ctx`.
- `events.endTurn()`
- `events.endPhase()`
- `events.setActivePlayers({...})`

## React Client
```tsx
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';

const App = Client({
  game: MyGame,
  board: MyBoardComponent,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true, // Enable Debug Panel
});

// In MyBoardComponent:
// props.G, props.ctx, props.moves.clickCell(id)
```

## Plugins
Add custom functionality or state (e.g., Player State).
```typescript
import { PluginPlayer } from 'boardgame.io/plugins';

const game = {
  plugins: [PluginPlayer({ setup: (id) => ({ hand: [] }) })],
};

// Access in moves:
// ctx.player.get() / ctx.player.set()
```
