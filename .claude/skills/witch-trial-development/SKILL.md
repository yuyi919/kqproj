---
name: witch-trial-development
description: Specialized skill for developing and extending the Witch Trial board game engine
author: Claude Code
version: 1.0.0
tags: [development, boardgame-io, game-engine, moves, phases]
---

# Witch Trial Development Skill

A specialized skill for developing and extending the Witch Trial board game engine.

## When to Use

Use this skill when performing any of these tasks:

| Task Category | Examples |
|--------------|----------|
| **New Features** | Adding new card types, new moves, new game phases |
| **Game Logic** | Modifying rules, changing win conditions, tweaking mechanics |
| **UI Components** | Creating new game UI, improving existing components |
| **State Management** | Adding new state properties, computed selectors |
| **Message System** | Adding new message types, changing visibility rules |

**Do NOT use this skill** for:
- Routine maintenance (use `/witch-trial-maintenance` skill)
- Database migrations (follow Prisma patterns)
- Build/deployment issues (use maintenance skill)

## Core Development Principles

### Principle 1: DDD + CQRS

The engine uses **Domain-Driven Design** with **Command Query Responsibility Segregation**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Game State (G)                         │
├─────────────────────────────────────────────────────────────┤
│  Commands (Writes)          │  Queries (Reads)             │
│  ─────────────────────────  │  ─────────────────────────    │
│  Move functions             │  Selectors                   │
│  - modify state             │  - compute derived state     │
│  - validate rules           │  - return computed values    │
│  - emit events              │                             │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** Never compute derived state in moves. Use Selectors for reads.

### Principle 2: State Architecture

```
BGGameState
├── Public State (seen by all)
│   ├── players[id].status (alive/dead only)
│   ├── round, status, config
│   ├── deathLog, voteHistory
│   └── currentVotes, chatMessages
│
├── Private State (filtered per player)
│   ├── secrets[id].hand
│   ├── secrets[id].isWitch
│   └── secrets[id].witchKillerHolder
│
└── Messages (visibility controlled)
    ├── announcement (public)
    ├── public_action (public)
    ├── private_action (actor only)
    └── witnessed_action (actor + target)
```

### Principle 3: Immutable Patterns, Mutable State

boardgame.io uses Immer internally. This means:

```typescript
// ✅ Correct - direct mutation works
G.players[playerId].status = "dead";
G.secrets[playerId].hand.push(newCard);

// ❌ Wrong - don't do this
G = { ...G, players: { ...G.players, [playerId]: { ... } } };
```

---

## Adding a New Move

### Step 1: Define the Move Function

**Location:** `packages/bgio-engine/src/game/moves.ts`

```typescript
/**
 * Custom Move - Description
 *
 * Rules:
 * 1. Rule one
 * 2. Rule two
 *
 * @param G - Game state
 * @param playerID - Actor ID
 * @param arg1 - Description
 */
customMove: wrapMove(({ G, ctx, playerID }: MoveContext, arg1: Type) => {
  // 1. Validate preconditions
  assertPhase(G, GamePhase.DEEP_NIGHT);
  assertPlayerAlive(G, playerID);
  assertNotEmpty(arg1, "arg1");

  // 2. Modify state (direct mutation works)
  console.log(`[Custom] ${playerID} performed action`);
  G.someProperty = newValue;

  // 3. Emit event
  TMessageBuilder.createSystem("Action completed");
}),
```

### Step 2: Register in Phase Config

**Location:** `packages/bgio-engine/src/game/phases.ts`

```typescript
[GamePhase.DEEP_NIGHT]: {
  turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
  moves: {
    useCard: moveFunctions.useCard,
    customMove: moveFunctions.customMove,  // Add here
    pass: moveFunctions.passNight,
  },
  next: GamePhase.RESOLUTION,
  // ...
},
```

### Step 3: Write Tests

**Location:** `packages/bgio-engine/src/__tests__/custom.test.ts`

```typescript
describe("Custom Move", () => {
  it("should perform action when conditions are met", () => {
    const state = createTestState();
    setupPlayers(state, ["p1", "p2"]);
    state.status = GamePhase.DEEP_NIGHT;

    const result = callMove(
      moveFunctions.customMove,
      createMoveContext(state, "p1"),
      arg1
    );

    expect(result).toBeUndefined();
    expect(state.someProperty).toBe(expectedValue);
  });

  it("should fail when player is dead", () => {
    // ...
  });
});
```

### Step 4: Common Assertions

**Location:** `packages/bgio-engine/src/game/assertions.ts`

```typescript
// Phase check
assertPhase(G, GamePhase.NIGHT);

// Player check
assertPlayerAlive(G, playerId);
assertPlayerPublicAlive(G, targetId);
assertNotImprisoned(G, playerId);

// Card check
assertCardExists(G, playerId, cardId);
assertCardType(G, playerId, cardId, "kill");
assertNotWitchKiller(G, playerId, cardId);
```

---

## Adding a New Phase

### Step 1: Add to GamePhase Enum

**Location:** `packages/bgio-engine/src/types/core.ts`

```typescript
export enum GamePhase {
  // ... existing phases
  NEW_PHASE = "newPhase",  // Add here
}
```

### Step 2: Configure Phase in phases.ts

```typescript
[newPhase: GamePhase.NEW_PHASE]: {
  turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
  moves: {
    // Available moves in this phase
  },
  next: GamePhase.NEXT_PHASE,
  onBegin: ({ G }: PhaseHookContext) => {
    G.status = GamePhase.NEW_PHASE;
    // Setup logic
  },
  onEnd: ({ G }: PhaseHookContext) => {
    // Cleanup logic
  },
},
```

### Step 3: Update Phase Flow

In `game/index.ts`, ensure the new phase is properly integrated into the flow:

```typescript
const phaseConfigs: PhaseConfigs = {
  [GamePhase.MORNING]: { /* ... */ },
  [GamePhase.DAY]: { /* ... */ },
  [GamePhase.NIGHT]: { /* ... */ },
  [GamePhase.DEEP_NIGHT]: { /* ... */ },
  [GamePhase.NEW_PHASE]: { /* ... */ },  // Add
  [GamePhase.RESOLUTION]: { /* ... */ },
};
```

### Step 4: Add UI Display (Optional)

In `components/ui/PhaseBadge.tsx`:

```typescript
case "newPhase":
  return { icon: <Icon />, color: token.color, label: "New Phase" };
```

---

## Adding a New Card Type

### Step 1: Define Card Type

**Location:** `packages/bgio-engine/src/types/core.ts`

```typescript
export type CardType = "witch_killer" | "barrier" | "kill" | "detect" | "check" | "newCard";
```

### Step 2: Add Card Definition

**Location:** `packages/bgio-engine/src/utils.ts`

```typescript
const CARD_DEFINITIONS: Record<CardType, CardDefinition> = {
  // ... existing cards
  newCard: {
    type: "newCard",
    name: "New Card Name",
    description: "What it does",
    consumable: true,
    priority: 50,
  },
};
```

### Step 3: Implement in Resolution

**Location:** `packages/bgio-engine/src/game/resolution.ts`

```typescript
case "newCard":
  // Implement resolution logic
  break;
```

### Step 4: Add to Config

**Location:** `packages/bgio-engine/src/types/config.ts`

```typescript
cardPool: {
  witch_killer: 1,
  barrier: 15,
  kill: 3,
  detect: 5,
  check: 4,
  newCard: 2,  // Add
},
```

---

## Adding a New Message Type

### Step 1: Define Message Interface

**Location:** `packages/bgio-engine/src/types/message.ts`

```typescript
export interface CustomMessage extends BaseMessage {
  kind: "custom_action";
  type: "custom";
  actorId: string;
  customData: { /* ... */ };
}
```

### Step 2: Add Builder Method

**Location:** `packages/bgio-engine/src/utils.ts`

```typescript
createCustomMessage(actorId: string, data: CustomData): CustomMessage {
  return {
    id: nanoid(),
    kind: "custom_action",
    type: "custom",
    timestamp: Date.now(),
    actorId,
    customData: data,
  };
}
```

### Step 3: Update Filter Logic

**Location:** `packages/bgio-engine/src/game/index.ts`

```typescript
const filterMessages = (messages: TMessage[], pid: string) => {
  return messages.filter((msg) => {
    switch (msg.kind) {
      case "announcement":
      case "public_action":
        return true;
      case "private_action":
        return msg.actorId === pid;
      case "custom_action":  // Add case
        return msg.actorId === pid;
      // ...
    }
  });
};
```

---

## Adding a New Selector

**Location:** `packages/bgio-engine/src/utils.ts`

```typescript
Selectors = {
  // ... existing selectors

  /**
   * Compute custom value
   */
  computeCustomValue: (G: BGGameState): Result => {
    // Read from state
    const alivePlayers = Selectors.getAlivePlayers(G);

    // Compute
    const result = /* ... */;

    return result;
  },
};
```

**Usage:**
```typescript
const value = Selectors.computeCustomValue(G);
```

---

## Creating UI Components

### Component Pattern

```typescript
// components/Board/CustomPanel.tsx
import { useGameState } from "../../contexts/GameContext";
import { GamePhase } from "../../types/core";

export function CustomPanel() {
  const { G, ctx, playerID } = useGameState();

  // Only show in correct phase
  if (ctx.phase !== GamePhase.DEEP_NIGHT) {
    return null;
  }

  // Check if player can act
  const canAct = playerID && Selectors.isPlayerAlive(G, playerID);

  return (
    <Panel>
      <Title>Custom Panel</Title>
      {/* Content */}
    </Panel>
  );
}
```

### Hook Pattern

```typescript
// hooks/useCustomLogic.ts
export function useCustomLogic(playerId: string) {
  const { G } = useGameState();

  const computedValue = useMemo(() => {
    return Selectors.computeCustomValue(G);
  }, [G, playerId]);

  const action = useCallback(() => {
    // Call move
  }, [playerId]);

  return { computedValue, action };
}
```

---

## Testing Strategy

### Test Categories

| Category | Purpose | Location |
|----------|---------|----------|
| Unit | Single function/selector | `*.test.ts` alongside source |
| Integration | Multiple components | `integration.test.ts` |
| Game Flow | Full game scenarios | `game.test.ts` |
| Edge Cases | Error conditions | `*.test.ts` |

### Test Utilities

**Location:** `packages/bgio-engine/src/__tests__/testUtils.ts`

```typescript
// Create game state
const state = createTestState();
setupPlayers(state, ["p1", "p2", "p3"]);

// Create move context
const context = createMoveContext(state, "p1", GamePhase.DEEP_NIGHT);

// Call move
const result = callMove(moveFunction, context, ...args);
```

### Test Structure

```typescript
describe("Feature Name", () => {
  describe("Happy Path", () => {
    it("should do expected thing", () => {
      // Arrange
      const state = createSetupContext(["p1", "p2"]);
      const G = WitchTrialGame.setup(state, {});

      // Act
      G.status = GamePhase.DEEP_NIGHT;

      // Assert
      expect(G.status).toBe(GamePhase.DEEP_NIGHT);
    });
  });

  describe("Edge Cases", () => {
    it("should handle error condition", () => {
      // ...
    });
  });
});
```

---

## Debugging Guide

### Console Log Prefixes

Use consistent prefixes for easy filtering:

```typescript
console.log(`[Move] ${playerID} action`);
console.log(`[Phase] Transition to ${G.status}`);
console.log(`[State] Property: ${value}`);
console.log(`[Debug] Additional info`);
```

### Debug Mode

Player ID `"0"` sees all:

```typescript
const playerView = WitchTrialGame.playerView({
  ...context,
  playerID: "0",  // Debug mode - sees everything
});
```

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Move not callable | Wrong phase | Check phase config |
| State not updating | Mutating wrong path | Use G directly |
| Tests pass but broken | Missing test case | Add edge case test |
| Type errors | Enum vs string | Use `GamePhase.NIGHT` not `"night"` |

---

## Development Workflow

### Local Development

```powershell
# 1. Start dev server
pnpm dev

# 2. Run tests in watch mode
bun test --watch

# 3. Build frequently
cd packages/bgio-engine; pnpm build
```

### Feature Development Cycle

```
1. Design (understand requirements)
   ↓
2. Implement (code the feature)
   ↓
3. Test (write/run tests)
   ↓
4. Verify (build + all tests)
   ↓
5. Document (update SKILL.md if needed)
```

### Before Committing

```powershell
# 1. Full verification
bun scripts/maintenance.ts check

# 2. Review changes
git diff --stat

# 3. Ensure tests pass
bun test packages/bgio-engine/src/

# 4. Type check
cd packages/bgio-engine; pnpm build
```

---

## Command Reference

### Development

```powershell
# Run single test file
bun test packages/bgio-engine/src/__tests__/game.test.ts

# Watch mode
bun test --watch

# Build for type errors
cd packages/bgio-engine; pnpm build
```

### Quick Verification

```powershell
bun scripts/maintenance.ts check  # Full check
bun scripts/maintenance.ts status  # Project status
```

---

## File Patterns

### When Adding

| What | Where | Pattern |
|------|-------|---------|
| New move | `game/moves.ts` | Follow existing move structure |
| New test | `__tests__/*.test.ts` | Use testUtils.ts |
| New selector | `utils.ts` | Add to Selectors object |
| New component | `components/Board/*.tsx` | Use existing components as template |
| New hook | `hooks/*.ts` | Follow hook pattern |

### When Modifying

| What | Check |
|------|-------|
| Move function | All tests pass |
| Phase config | Phase transitions work |
| Selector | Computed values correct |
| Type definition | Build passes |

---

## Related Documentation

- **Maintenance Skill** - `/witch-trial-maintenance`
- **Engine CLAUDE.md** - `packages/bgio-engine/CLAUDE.md`
- **Project CLAUDE.md** - `CLAUDE.md`
- **Game Rules** - `docs/rule.md`
- **Refactoring Journal** - `docs/refactoring/JOURNAL.md`
- [boardgame.io Docs](https://boardgame.io/docs)

---

## Quick Reference: Game Phases

```
lobby → setup → morning → day → NIGHT → DEEP_NIGHT → resolution → (repeat)
         ↓                                              ↑
    (game ends) ←─────────────────────────────────────┘
```

| Phase | Enum | Purpose |
|-------|------|---------|
| MORNING | `GamePhase.MORNING` | Announcements, discussion |
| DAY | `GamePhase.DAY` | Trading |
| NIGHT | `GamePhase.NIGHT` | Voting |
| DEEP_NIGHT | `GamePhase.DEEP_NIGHT` | Card actions |
| RESOLUTION | `GamePhase.RESOLUTION` | Action resolution |

---

*Use this skill when developing new features for the Witch Trial game engine.*
