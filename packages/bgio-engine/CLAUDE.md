# CLAUDE.md

This file provides guidance to Claude Code when working with code in this package.

## Package Overview

**Package Name:** `@whole-ends-kneel/bgio-engine`
**Type:** TypeScript library for boardgame.io game engine
**Purpose:** Implementation of "Witch Trial" social deduction game

## Architecture

### Core Pattern: DDD + CQRS

The engine follows Domain-Driven Design principles with Command Query Responsibility Segregation:

- **Commands (Writes):** Move functions in `game/moves.ts` - modify game state
- **Queries (Reads):** Selectors in `utils.ts` - compute derived state
- **Events:** Messages in `utils.ts` (TMessageBuilder) - record game events

### State Architecture

```
BGGameState (atomic state)
├── Public State (visible to all)
│   ├── players[id].status (only alive/dead, witch displayed as alive)
│   ├── round, status, config
│   └── deathLog (public death records)
│
├── Private State (filtered by playerView)
│   ├── secrets[id].hand (cards in hand)
│   ├── secrets[id].isWitch (hidden from other players)
│   └── secrets[id].witchKillerHolder
│
└── Chat Messages (TMessage with visibility rules)
    ├── announcement (public to all)
    ├── public_action (public to all)
    ├── private_action (only actor可见)
    └── witnessed_action (actor + target visible)
```

## Key Files

### State & Types
- `src/types.ts` - All TypeScript interfaces and types
- `src/utils.ts` - Selectors (computed state) and TMessageBuilder

### Game Logic
- `src/game/index.ts` - Main game definition (WitchTrialGame)
- `src/game/phases.ts` - Phase configurations and hooks
- `src/game/moves.ts` - Player actions (useCard, vote, pass, say)
- `src/game/resolution.ts` - Night action resolution logic

### UI Integration
- `src/components/` - React UI components
- `src/hooks/useWitchTrial.ts` - Game hook for custom UIs
- `src/contexts/GameContext.tsx` - Game state context

## Game Phases

```
lobby → setup → morning → day → NIGHT → DEEP_NIGHT → resolution → (repeat)
         ↓                                            ↑
    (game ends) ←─────────────────────────────────────┘
```

**Phase Flow:**
- **morning**: Announce night deaths, free discussion
- **day**: Free discussion and card trading
- **NIGHT**: Vote to imprison a player (uses `votingDuration`)
- **DEEP_NIGHT**: Use cards for secret actions (uses `nightDuration`)
- **resolution**: Process all night actions

**GamePhase Enum:**
```typescript
export enum GamePhase {
  LOBBY = "lobby",
  SETUP = "setup",
  MORNING = "morning",
  DAY = "day",
  NIGHT = "night",
  DEEP_NIGHT = "deepNight",
  RESOLUTION = "resolution",
  CARD_SELECTION = "cardSelection",
  ENDED = "ended",
}
```

## Message System (TMessage)

### Message Kinds & Visibility

| Kind | Visibility | Examples |
|------|------------|----------|
| `announcement` | All players | System messages, phase transitions, death lists |
| `public_action` | All players | Votes, passes, public statements |
| `private_action` | Only actor | Card usage, attack results, witch transformation |
| `witnessed_action` | Actor + target | Card distribution after death |

### Using TMessageBuilder

```typescript
import { TMessageBuilder } from "./utils";

// Public messages (visible to all)
TMessageBuilder.createSystem("Game started");
TMessageBuilder.createVote(actorId, targetId);
TMessageBuilder.createPass(playerId);

// Private messages (only actor可见)
TMessageBuilder.createUseCard(actorId, "detect", targetId);
TMessageBuilder.createAttackResult(actor, target, "kill", "success");
TMessageBuilder.createTransformWitch(actorId);

// Witnessed messages (actor + target visible)
TMessageBuilder.createCardReceived(receiverId, victimId, cards);
```

### Message Filtering in playerView

Messages are automatically filtered based on `msg.kind`:

```typescript
const filterMessages = (messages: TMessage[], pid: string) => {
  if (pid === "0") return messages; // Debug mode: show all

  return messages.filter((msg) => {
    switch (msg.kind) {
      case "announcement":
      case "public_action":
        return true;
      case "private_action":
        return msg.actorId === pid;
      case "witnessed_action":
        return msg.actorId === pid || msg.targetId === pid;
      default:
        return false;
    }
  });
};
```

## Selectors Pattern

All computed state uses the `Selectors` object in `utils.ts`:

```typescript
import { Selectors } from "./utils";

// Player state
Selectors.getAlivePlayers(state);
Selectors.isPlayerAlive(state, playerId);
Selectors.getPlayerHandCount(state, playerId);

// Game state
Selectors.computeVoteResult(state);
Selectors.computeRemainingAttackQuota(state);
Selectors.isGameOver(state);
```

**Never compute derived state in components.** Always use Selectors.

## Testing

Testing uses **Bun's built-in test runner**:

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/visibility.test.ts
```

Test files follow the pattern `__tests__/*.test.ts`.

### Test Structure

- `game.test.ts` - Core game mechanics (setup, voting, night actions)
- `visibility.test.ts` - Message visibility rules

## Common Development Tasks

### Adding a New Move

1. Define the move function in `game/moves.ts`:
```typescript
export const customMove = {
  move: ({ G, ctx, playerID }, ...args) => {
    // Validate using assertions
    assertValidPlayer(G, playerID);

    // Modify state (G is mutable in moves)
    G.someState = newValue;

    // Add message
    TMessageBuilder.createSystem("Action performed");
  },
};
```

2. Register in phase config (`game/phases.ts` or `game/index.ts`)

### Adding a New Message Type

1. Add interface to `types.ts` (extends BaseMessage, sets `kind`)
2. Add builder method to `TMessageBuilder` in `utils.ts`
3. Update `filterMessages` in `game/index.ts` to handle new `kind`

### Modifying Phase Flow

Modify `game/phases.ts`:
- `onBegin`: Setup when entering phase
- `onEnd`: Cleanup when leaving phase
- `moves`: Available actions in phase

## Debug Mode

Player ID `"0"` is reserved for debug mode:
- Sees all private information
- Sees all messages (including private actions)

## Card Types

| Type | Name | Description |
|------|------|-------------|
| `witch_killer` | 魔女杀手 | Highest priority attack, holder becomes witch |
| `barrier` | 结界魔法 | Protects from attacks for one night |
| `kill` | 杀人魔法 | Attack card, successful kill triggers witch transformation |
| `detect` | 探知魔法 | View target's hand count and one random card |
| `check` | 检定魔法 | Check dead player's cause of death |

## Important Patterns

### Assertions Before State Change

```typescript
import { assert } from "./game/assertions";

// In moves
assertPlayerCanAct(G, playerId);
assertCardExists(G, playerId, cardId);
```

### State Updates

- Use `G.property = value` directly (boardgame.io uses Immer)
- Return `"INVALID_MOVE"` if move is not allowed
- Use Selectors for reading, direct assignment for writing

### Phase Transitions

Use the `GamePhase` enum for type-safe phase transitions:

```typescript
import { GamePhase } from "./types/core";

// Trigger phase change from a move
events.setPhase(GamePhase.DEEP_NIGHT);

// Or use endTurn/endPhase
events.endTurn();
```

**Important:** Never use string literals like `"night"` or `"deepNight"` directly. Always import and use `GamePhase` enum.

## Related Documentation

- [boardgame.io Docs](https://boardgame.io/docs)
- [Main Project CLAUDE.md](../../CLAUDE.md)
