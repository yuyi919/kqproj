# boardgame.io Learning

**Date:** 2026-02-13
**Category:** learning
**Description:** Complete documentation study and practice notes based on Witch Trial project

---

## Summary

boardgame.io is an engine for creating turn-based games using JavaScript. The core design philosophy separates game logic (`Game`) from rendering (`Client`), providing automatic state synchronization, multiplayer support, and an extensible plugin system.

Key concepts learned:
- State management: `G` (game state) vs `ctx` (framework metadata)
- Phase system for controlling game flow
- Move functions for player actions
- Random number generation with secure API
- Player view for information hiding
- React integration patterns

---

## Details

### 1. Core Concepts

#### State (`G` vs `ctx`)

boardgame.io separates game state into two parts:

| Type | Description | Writable |
|------|-------------|----------|
| **`G`** | Custom game state (board, hands, health) | ✅ Mutable |
| **`ctx`** | Framework metadata (read-only) | ❌ Read-only |

**ctx properties:**
```typescript
interface GameContext {
  turn: number;          // Current turn number
  currentPlayer: string; // Current player ID
  phase: string;         // Current phase name
  numPlayers: number;    // Total players
  playOrder: string[];   // Player order array
  playOrderPos: number;  // Position in playOrder
}
```

#### Game Definition Structure

```typescript
const MyGame = {
  name: "my-game",
  minPlayers: 2,
  maxPlayers: 8,

  setup: ({ ctx, random }) => { /* Initialize state */ },

  moves: { /* Player actions */ },

  phases: { /* Phase configurations */ },

  playerView: ({ G, playerID }) => { /* Filter visible state */ },

  endIf: ({ G, ctx }) => { /* Game over condition */ },

  plugins: [ /* Extensions */ ],
};
```

### 2. Phase System

Phases allow switching between different game rules (e.g., "bidding phase", "playing phase"):

```typescript
const phaseConfigs = {
  [GamePhase.MORNING]: {
    start: true,              // Is this the starting phase?
    moves: { say: moveFunctions.say },
    next: GamePhase.DAY,      // Next phase

    turn: {
      order: TurnOrder.RESET,
      activePlayers: ActivePlayers.ALL,
    },

    onBegin: ({ G, events }) => { /* Enter phase */ },
    onEnd: ({ G, events }) => { /* Leave phase */ },
    endIf: ({ G }) => { /* End condition */ },
  },
};
```

**Phase Hooks:**

| Hook | Timing | Purpose |
|------|--------|---------|
| `onBegin` | On phase entry | Initialize, set timer |
| `onEnd` | On phase exit | Settlement, cleanup |
| `endIf` | After each move | Check if phase ends |

**Turn Order Options:**
```typescript
turn: {
  order: TurnOrder.DEFAULT,  // Round-robin (0, 1, 2...)
  order: TurnOrder.RESET,    // Reset each round

  // Custom order
  order: {
    first: ({ ctx }) => 0,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
  },

  activePlayers: ActivePlayers.ALL,  // All players
  activePlayers: ActivePlayers.ONE,  // Only current player
}
```

### 3. Move Functions

Basic structure:
```typescript
const moveFunctions = {
  moveName: ({ G, ctx, playerID, events, random }, ...args) => {
    // G - Game state (mutable)
    // ctx - Framework context (read-only)
    // playerID - Player executing the move
    // events - Events API
    // random - Random API
  },
};
```

**Return values:**
- `undefined` - Move successful
- `"INVALID_MOVE"` - Invalid move (no state change)

**Move Wrapper Pattern (Witch Trial):**
```typescript
import { wrapMove } from "./wrapMove";

const vote = wrapMove(({ G, playerID }: MoveContext, targetId: string) => {
  assertPhase(G, GamePhase.NIGHT);
  const player = assertPlayerAlive(G, playerID);

  // Find or create vote
  const existingVote = Selectors.findExistingVote(G, playerID);
  if (existingVote) {
    existingVote.targetId = targetId;
  } else {
    G.currentVotes.push({
      voterId: playerID,
      targetId,
      round: G.round,
      timestamp: Date.now(),
    });
  }

  Mutations.msg(G, TMessageBuilder.createVote(playerID, targetId));
});
```

### 4. Events API

Available events from `events`:
```typescript
events.endTurn();           // End current turn
events.endPhase();          // End current phase
events.setPhase("phase");   // Jump to phase
events.setTurn("turn");     // Jump to turn
events.setActivePlayers({ all: "stageName" });  // Set active players
```

### 5. Random Number Generation

Access via `random` parameter:
```typescript
setup: ({ ctx, random }) => {
  const shuffled = random.Shuffle(cards);
  const die = random.Die(6);    // 1-6
  const number = random.Number();  // 0-1
}
```

**Random API methods:**

| Method | Description |
|--------|-------------|
| `random.Die(sides)` | Integer 1 to sides |
| `random.Roll(sides)` | Same as Die |
| `random.Number()` | Random 0-1 |
| `random.Shuffle(array)` | Shuffle in-place |
| `random.Shuffle(array, count)` | Shuffle and return first count |

### 6. Player View (Information Hiding)

```typescript
playerView: ({ G, playerID }) => {
  const pid = playerID || "";

  const publicState: BGGameState = {
    ...G,
    // Hide sensitive information
    players: Selectors.computePublicPlayers(G),
    secrets: {},
    deck: [],
    chatMessages: Selectors.filterMessagesForPlayer(G.chatMessages, pid),
  };

  // Debug mode: show all
  if (playerID === "0") {
    publicState.secrets = G.secrets;
  } else if (G.secrets[playerID]) {
    publicState.secrets[playerID] = G.secrets[playerID];
  }

  return publicState;
}
```

### 7. React Integration

**Create Client:**
```typescript
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';

const App = Client({
  game: WitchTrialGame,
  board: GameBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true,
});
```

**Board Props:**
```typescript
interface BoardProps {
  G: BGGameState;
  ctx: any;
  moves: Record<string, Function>;
  playerID: string;
}
```

### 8. CQRS Pattern (Witch Trial Project)

**Commands (Writes):** `game/moves.ts`
```typescript
const moveFunctions = {
  useCard: wrapMove(({ G, playerID }, cardId, targetId) => {
    G.nightActions.push({ ... });
    Mutations.msg(G, TMessageBuilder.createUseCard(...));
  }),
};
```

**Queries (Reads):** `domain/queries/index.ts`
```typescript
export const Selectors = {
  computeVoteResult: (G: BGGameState) => { ... },
  isPlayerAlive: (G: BGGameState, playerId: string) => boolean,
  getAlivePlayers: (G: BGGameState) => PublicPlayerInfo[],
};
```

### 9. Message System (TMessage)

**Message Types & Visibility:**

| Kind | Visibility | Examples |
|------|------------|----------|
| `announcement` | All players | System, phase transitions |
| `public_action` | All players | Votes, public statements |
| `private_action` | Only actor | Card usage, attacks |
| `witnessed_action` | Actor + target | Card distribution |

**Message Builder:**
```typescript
const TMessageBuilder = {
  createVote: (actorId: string, targetId: string) => ({
    id: nanoid(),
    kind: 'public_action',
    actorId,
    targetId,
    timestamp: Date.now(),
  }),

  createPrivateAction: (actorId: string, action: string) => ({
    id: nanoid(),
    kind: 'private_action',
    actorId,
    action,
    timestamp: Date.now(),
  }),
};
```

### 10. Phase Timer Pattern

```typescript
const Mutations = {
  setPhaseTimer: (G: BGGameState, seconds: number) => {
    G.phaseStartTime = Date.now();
    G.phaseEndTime = Date.now() + seconds * 1000;
  },
};

// In endIf:
endIf({ G }) {
  return G.status === GamePhase.MORNING && G.phaseEndTime <= Date.now();
}
```

---

## Key Decisions

1. **Used `wrapMove` wrapper** - Centralizes assertion checks and logging
2. **Implemented CQRS pattern** - Separates commands (moves) from queries (selectors)
3. **Type-safe game phases** - Using `GamePhase` enum instead of string literals
4. **Player view filtering** - Automatic information hiding based on player ID
5. **Message visibility system** - TMessage kinds control who sees what

---

## Files Studied

- `packages/bgio-engine/src/game/index.ts` - Main game definition
- `packages/bgio-engine/src/game/moves.ts` - Move functions
- `packages/bgio-engine/src/game/phases.ts` - Phase configurations
- `packages/bgio-engine/src/utils.ts` - Selectors and utilities
- `packages/bgio-engine/src/types.ts` - Type definitions

---

## Verification

1. **Run tests:**
   ```bash
   bun test packages/bgio-engine/src/__tests__/game.test.ts
   ```

2. **Check type safety:**
   ```bash
   pnpm --filter @whole-ends-kneel/bgio-engine type-check
   ```

3. **Test game flow:**
   - Start dev server
   - Create game room
   - Verify phase transitions
   - Test all move functions

---

## Related Documents

- [boardgame.io Official Documentation](https://boardgame.io/docs)
- [packages/bgio-engine/CLAUDE.md](../../packages/bgio-engine/CLAUDE.md)
- [Witch Trial Game Rules](../../docs/rule.md)
