# Testing Patterns

**Analysis Date:** 2026-02-17

## Test Framework

### Runner

- **Framework:** Bun's built-in test runner (`bun:test`)
- **Version:** Bundled with Bun (v1.3.8+)
- **Config:** No separate config file - uses Bun defaults
- **Assertion:** Built-in `expect` from `bun:test`

### Run Commands

```bash
bun test                    # Run all tests
bun test --watch           # Watch mode
bun test src/__tests__/game.test.ts  # Specific file
bun test src/effect/       # Directory
```

### Test Discovery

- Files matching `*.test.ts` pattern
- Both co-located and separate `__tests__/` directories used
- Also uses `.test.ts` suffix pattern

## Test File Organization

### Location Patterns

1. **Co-located with source:** `src/game/resolution/phase2-attack.test.ts`
2. **Separate test directory:** `src/__tests__/game.test.ts`
3. **Effect tests:** `src/effect/services/*.test.ts`, `src/effect/context/*.test.ts`

### Naming

- **PascalCase test file:** `game.test.ts`, `attack.test.ts`, `resolution.test.ts`
- **Describes test suites:** `describe("WitchTrialGame - Setup", () => {})`
- **Chinese descriptions:** Uses Chinese for readability: `应正确初始化游戏状态`, `应允许更新投票`

### Directory Structure

```
src/
├── __tests__/              # Shared test utilities
│   ├── testUtils.ts       # Game state factories, mock generators
│   └── scenarios.ts       # Test scenario builders
├── game/
│   ├── resolution/
│   │   ├── phase2-attack.test.ts
│   │   └── phase3-check.test.ts
│   └── __tests__/
│       └── game.test.ts
├── effect/
│   ├── services/
│   │   ├── attackResolutionService.test.ts
│   │   └── playerStateService.test.ts
│   └── context/
│       └── gameStateRef.test.ts
```

## Test Structure

### Suite Organization

```typescript
describe("WitchTrialGame - Setup", () => {
  it("应正确初始化游戏状态", () => {
    // Arrange
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    // Act
    const G = WitchTrialGame.setup(context, { roomId: "test-room" });

    // Assert
    expect(G.id).toBeDefined();
    expect(G.roomId).toBe("test-room");
  });
});
```

### Patterns

- **Describe blocks:** Group by feature/phase
- **It statements:** Single behavior per test
- **Arrange-Act-Assert:** Clear separation
- **Chinese descriptions:** For test intent clarity

## Mocking

### Random API Mocking

```typescript
// From testUtils.ts
export function createMockRandom(
  overrides: Partial<RandomAPI> = {},
): RandomAPI {
  return {
    Number: () => 0.5,
    Shuffle: <T>(arr: T[]): T[] => [...arr],
    Die: (sides: number) => Math.floor(sides / 2) + 1,
    D4: () => 2,
    D6: () => 3,
    ...overrides,
  } as RandomAPI;
}

// Specialized versions
export function createFixedRandom(): RandomAPI { ... }  // Always returns 1
export function createMaxRandom(): RandomAPI { ... }  // Always returns max
```

### Game State Factories

```typescript
// From testUtils.ts
export function createTestState(
  config: GameConfig = SEVEN_PLAYER_CONFIG,
): BGGameState {
  return {
    id: `test-${Date.now()}`,
    roomId: "test-room",
    config: { ...config },
    players: {},
    playerOrder: [],
    secrets: {},
    // ... all required fields
  };
}

// Player setup helper
export function setupPlayers(state: BGGameState, playerIds: string[]): void {
  playerIds.forEach((id, index) => {
    state.players[id] = {
      id,
      name: `Player ${index + 1}`,
      status: "alive",
    };
    state.secrets[id] = {
      id,
      hand: [],
      isWitch: false,
      witchKillerHolder: false,
    };
    state.playerOrder.push(id);
  });
}
```

### Context Factories

```typescript
// Move context for testing move functions
export function createMoveContext(
  G: BGGameState,
  playerID: string,
  phase: GamePhase = GamePhase.DEEP_NIGHT,
): MoveContext {
  return {
    G,
    ctx: {
      currentPlayer: playerID,
      phase,
      numPlayers: Object.keys(G.players).length,
    } as Ctx,
    playerID,
    random: createMockRandom(),
    events: mockEvents(),
  };
}
```

### Effect-TS Layer Mocking

```typescript
// From attackResolutionService.test.ts
function makeLayer(state: ReturnType<typeof createTestState>) {
  return Layer.provideMerge(
    Layer.provideMerge(GameLayers, GameStateRef.layer(state)),
    makeGameRandomLayer(createMockRandom()),
  );
}

function runPhase2AndGetState(state: BGGameState) {
  const program = Effect.gen(function* () {
    const service = yield* AttackResolutionService;
    yield* service.resolvePhase2(previousResult);
    const stateRef = yield* GameStateRef;
    return yield* stateRef.get();
  }).pipe(Effect.provide(makeLayer(state)));

  return Effect.runSync(program);
}
```

### What to Mock

- **RandomAPI:** Always mock for deterministic tests
- **GameState:** Use createTestState factory
- **Context:** Use context factories (move, phase, player view)
- **Effect dependencies:** Use Layer.provideMerge() pattern

### What NOT to Mock

- **Core game logic:** Test actual behavior
- **Assertions:** Test the assertions themselves separately
- **Selectors:** Use actual Selectors, not mocks

## Fixtures and Factories

### Standard Configs

```typescript
// From testUtils.ts
export const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 15,
    kill: 3,
    detect: 5,
    check: 4,
  },
  maxHandSize: 4,
  minVoteParticipationRate: 0.5,
  cardSelectionDuration: 15,
};
```

### Effect-TS Test Helpers

```typescript
// From effect/test-helpers.ts
export function runSync<A>(effect: Effect.Effect<A>): A {
  return Effect.runSync(effect);
}

export function runSyncExit<A, E>(
  effect: Effect.Effect<A, E>,
): Exit.Exit<A, E> {
  return Effect.runSyncExit(effect);
}

export function expectSuccess<A, E>(exit: Exit.Exit<A, E>): A {
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected success but got failure: ${JSON.stringify(exit.cause)}`,
    );
  }
  return exit.value;
}
```

### Test Scenario Builders

```typescript
// From scenarios.ts (if exists)
export function createNightPhaseScenario() { ... }
export function createVotingScenario() { ... }
```

## Coverage

### Requirements

- **No enforced coverage target** in current config
- **Recommended minimum:** 80% (from project rules)
- **Critical paths:** Game logic, phase transitions, move validation

### View Coverage

```bash
# No built-in coverage in Bun test runner
# Recommend using --coverage flag when available
bun test --coverage
```

## Test Types

### Unit Tests

- **Scope:** Individual move functions, selectors, assertions
- **Pattern:** Create minimal state, call function, assert result
- **Example:** Testing `vote` move with different scenarios

### Integration Tests

- **Scope:** Phase resolution, night action processing
- **Pattern:** Create full game state, execute phase, verify state changes
- **Example:** `src/game/resolution/integration.test.ts`

### Effect-TS Service Tests

- **Scope:** Services in `effect/` directory
- **Pattern:** Use Layer to provide dependencies, run Effect, assert result
- **Example:** `attackResolutionService.test.ts`

## Common Patterns

### Async Testing

```typescript
// For async Effects
import { Effect } from "effect";

it("should handle async operation", async () => {
  const program = Effect.gen(function* () {
    const result = yield* someAsyncOperation();
    return result;
  });

  const result = await Effect.runPromise(program);
  expect(result).toBe(expected);
});
```

### Error Testing

```typescript
// Testing throws
it("should throw on invalid move", () => {
  expect(() => {
    callMove(voteMove, createMoveContext(G, "p1"), "dead-player");
  }).toThrow();
});

// Or return INVALID_MOVE
it("should return INVALID_MOVE", () => {
  const result = callMove(voteMove, createMoveContext(G, "p1"), "p2");
  expect(result).toBe("INVALID_MOVE");
});
```

### State Verification

```typescript
// Direct property checking
expect(G.currentVotes).toHaveLength(1);
expect(G.currentVotes[0].voterId).toBe("p1");
expect(G.players["p1"].status).toBe("alive");

// Using Selectors
expect(Selectors.isPlayerAlive(G, "p1")).toBe(true);
expect(Selectors.getAlivePlayers(G)).toHaveLength(3);
```

### Message Verification

```typescript
function hasMessage(
  messages: TMessage[],
  predicate: (message: TMessage) => boolean,
): boolean {
  return messages.some(predicate);
}

it("should emit dead response message", () => {
  expect(hasMessage(G.chatMessages, (msg) =>
    msg.kind === "private_action" &&
    msg.type === "dead_response"
  )).toBe(true);
});
```

---

*Testing analysis: 2026-02-17*
