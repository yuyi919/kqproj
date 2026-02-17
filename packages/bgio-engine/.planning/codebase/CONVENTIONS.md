# Coding Conventions

**Analysis Date:** 2026-02-17

## Naming Patterns

### Files

- **PascalCase** for components and types: `WitchTrialGame.ts`, `GamePhase.ts`, `AttackResolutionService.ts`
- **kebab-case** for test files: `attack.test.ts`, `visibility.test.ts`, `game.test.ts`
- **camelCase** for utilities and helpers: `testUtils.ts`, `formatters.ts`

### Functions

- **camelCase** for all functions: `assertPlayerAlive()`, `createTestState()`, `wrapMove()`
- **PascalCase** for classes and constructor functions: `GameLogicError`, `AttackResolutionService`
- **Verb-noun pattern** for actions: `useCard()`, `vote()`, `pass()`, `say()`
- **assert prefix** for validation functions: `assertPhase()`, `assertPlayerAlive()`, `assertCardInHand()`
- **create/make prefix** for factory functions: `createTestState()`, `createMockRandom()`, `makeLayer()`

### Variables

- **camelCase** for all variables: `playerId`, `targetId`, `nightActions`
- **UPPER_SNAKE_CASE** for constants: `SEVEN_PLAYER_CONFIG`, `NINE_PLAYER_CONFIG`
- **Descriptive naming**: Use clear names like `currentVotes`, `barrierPlayers`, `actionHistory`

### Types

- **PascalCase** for types: `BGGameState`, `MoveContext`, `PhaseResult`
- **Interface prefix patterns**:
  - `I` prefix for interfaces: `IAttackResolutionService`, `ICardService`
  - `T` prefix for tagged types: `TMessage`, `TMessageBuilder`
- **Descriptive suffixes**: `Result`, `Context`, `Config`, `State`, `Info`

## Code Style

### Formatting

- **Tool:** Biome (configured in `biome.json`)
- **Line length:** Standard formatting
- **Semicolons:** Enabled (useNodeAssertStrict)
- **Const:** Enforced (useConst)
- **No CommonJS:** Enforced (noCommonJs)

### Linting

- **Biome rules** configured in `packages/bgio-engine/biome.json`
- **File naming:** strictCase enforcement, allows kebab-case, camelCase, PascalCase
- **Restricted imports:** Explicitly warns against lodash and ramda - prefer Effect-TS functions
- **Run command:** `bun run lint`

### Import Organization

Order (from `biome.json` analysis):
1. External libraries (boardgame.io, react, effect)
2. Internal packages (@whole-ends-kneel)
3. Relative imports from same package (../, ./)

Example:
```typescript
import { describe, expect, it } from "bun:test";
import { INVALID_MOVE } from "boardgame.io/core";
import type { RandomAPI } from "../game";
import { moveFunctions } from "../game/moves";
import { Selectors } from "../utils";
import { createTestState, setupPlayers } from "./testUtils";
```

## Error Handling

### Assertion Pattern

Use assertion functions before state modifications:
```typescript
import { assertPhase, assertPlayerAlive, assertCardInHand } from "./assertions";

export function vote({ G, playerID }, targetId) {
  assertPhase(G, GamePhase.NIGHT);      // Validate phase
  assertNotEmpty(targetId, "targetId"); // Validate input
  const player = assertPlayerAlive(G, playerID); // Validate player state
  // ... modify state
}
```

### Effect-TS Error Types

All Effect-TS errors use TaggedError pattern:
```typescript
import { Data } from "effect";

export class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  playerId: string;
}> {}

export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  current: number;
  max: number;
}> {}
```

### Custom Error Classes

Boardgame.io layer uses custom Error class:
```typescript
export class GameLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameLogicError";
  }
}
```

## Comments

### JSDoc Usage

**When to Comment:**
- Every exported function/method with business logic
- Complex algorithms and edge cases
- Phase configurations and move definitions
- Test helper functions

**Pattern:**
```typescript
/**
 * 投票 move
 *
 * 规则：
 * 1. 只能在夜间阶段进行
 * 2. 投票者必须存活
 * 3. 目标玩家必须存活（不能投给已死亡玩家）
 * 4. 可以更新已有投票（一人一票，可改票）
 *
 * @param G - 游戏状态
 * @param playerID - 投票者ID
 * @param targetId - 目标玩家ID
 */
```

**Language:** Chinese (中文) for documentation in source code

### Section Markers

Use ASCII section markers in large files:
```typescript
// ==================== 标准配置 ====================

// ==================== MockRandom 构建器 ====================

// ==================== 游戏状态工厂 ====================
```

## Function Design

### Size Guidelines

- **Maximum 50 lines** per function (target)
- **Extract complex logic** into separate helper functions
- **Use assertions** to validate early, keep main function body focused

### Parameters

- Use type-safe parameters
- Validate inputs at boundaries
- Document all parameters in JSDoc
- Destructure complex objects in function signature

### Return Values

- Return `undefined` for moves (boardgame.io convention)
- Return results for queries (Selectors pattern)
- Throw errors for invalid states
- Return `INVALID_MOVE` string from boardgame.io for disallowed moves

## Module Design

### Exports

- **Named exports** preferred for most modules
- **Barrel files** (index.ts) for clean public API
- **Re-export pattern** for backward compatibility in utils.ts

### Barrel Files

Use index.ts files to re-export from submodules:
```typescript
// src/effect/services/index.ts
export { AttackResolutionService } from "./attackResolutionService";
export { CardService } from "./cardService";
export { MessageService } from "./messageService";
```

### Deprecated Patterns

Mark deprecated exports with @deprecated JSDoc:
```typescript
/**
 * @deprecated 请使用 src/types/index.ts 或具体的子模块
 */
```

## State Management

### Boardgame.io State

- Direct mutation of G object (Immer under the hood)
- Use Selectors for computed state
- Use Mutations for state modifications

### Effect-TS Context

- Use Context for dependency injection
- Use Layer for service composition
- Test with Layer.provideMerge()

---

*Convention analysis: 2026-02-17*
