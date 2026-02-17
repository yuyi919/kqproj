# Phase 3: 技术债务 - Research

**Researched:** 2026-02-17
**Domain:** Logging standardization, error handling unification, debug mode configuration
**Confidence:** HIGH

## Summary

This phase addresses technical debt in the bgio-engine package by standardizing logging, unifying error handling, and removing hardcoded debug mode. The codebase already uses Effect-TS for service management, so implementing a logging service follows existing patterns. The error handling dual-track (GameLogicError + TaggedError) is already partially implemented and needs completion.

**Primary recommendation:** Extend existing Effect-TS patterns to create a LoggerService, add debug config to GameConfig, and complete the error conversion layer.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Effect-TS Context for logging service implementation
- Create logger service class wrapping logging functionality
- Use configuration switch for debug mode
- Create game config object managing debug settings
- Dual-track: GameLogicError and Effect-TS TaggedError coexist, convert as needed

### Claude's Discretion
- Specific implementation details of LoggerService
- Where exactly to inject debug config

### Deferred Ideas (OUT OF SCOPE)
None

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEBT-01 | Replace console.log in src/game/moves.ts with logging service | Effect.logInfo pattern exists in codebase |
| DEBT-02 | Replace console.log in src/game/phases.ts with logging service | Effect.logInfo pattern exists in codebase |
| DEBT-03 | Remove debug mode Player ID "0" hardcode, use config switch | GameConfig interface exists, can extend |
| DEBT-04 | Unify GameLogicError and Effect-TS error handling | TaggedError conversion already exists |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| effect | ^3 | Effect-TS runtime | Already in use, provides Context, logging |
| boardgame.io | ^0.53 | Game engine | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | ^3 | ID generation | Already in use for action IDs |

**Installation:**
No new dependencies required - Effect-TS is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── effect/
│   ├── services/
│   │   ├── logger.ts          # NEW: Logger service
│   │   ├── messageService.ts   # Existing
│   │   └── ...
│   └── context/
│       └── gameStateRef.ts     # Existing pattern reference
├── game/
│   ├── moves.ts                # Modify: use LoggerService
│   ├── phases.ts               # Modify: use LoggerService
│   └── index.ts                # Modify: add debug config
└── types/
    └── config.ts               # Modify: add debug config
```

### Pattern 1: LoggerService using Effect-TS Context

**What:** Create a LoggerService following existing Effect.Service pattern
**When to use:** For structured logging throughout the game engine

**Example:**
```typescript
// Based on existing patterns in src/effect/services/messageService.ts
import { Effect, Layer } from "effect";

export interface ILoggerService {
  readonly log: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly logDebug: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly logInfo: (message: string, context?: Record<string, unknown>) => Effect.Effect<void>;
  readonly logError: (message: string, error?: Error, context?: Record<string, unknown>) => Effect.Effect<void>;
}

export class LoggerServiceImpl implements ILoggerService {
  constructor(private readonly enableDebug: boolean) {}

  log = (message: string, context?: Record<string, unknown>) =>
    Effect.logInfo(message).pipe(
      Effect.annotateLogs(context ?? {}),
    );

  logDebug = (message: string, context?: Record<string, unknown>) =>
    this.enableDebug
      ? Effect.logDebug(message).pipe(Effect.annotateLogs(context ?? {}))
      : Effect.empty();

  logInfo = (message: string, context?: Record<string, unknown>) =>
    Effect.logInfo(message).pipe(Effect.annotateLogs(context ?? {}));

  logError = (message: string, error?: Error, context?: Record<string, unknown>) =>
    Effect.logError(message).pipe(
      error ? Effect.annotateLogs({ error: error.message }) : Effect.empty(),
      context ? Effect.annotateLogs(context) : Effect.empty(),
    );
}

export class LoggerService extends Effect.Service<LoggerService>()(
  "LoggerService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      // Get debug config from game state or env
      const enableDebug = process.env.NODE_ENV === "development";
      return new LoggerServiceImpl(enableDebug);
    }),
  },
) {}
```

### Pattern 2: GameConfig Debug Extension

**What:** Extend GameConfig with debug settings
**When to use:** For runtime configuration of debug features

**Example:**
```typescript
// Extend src/types/config.ts
export interface GameConfig {
  // ... existing fields
  /** Enable debug mode (shows all player secrets) */
  debugMode: boolean;
  /** Debug player ID override (instead of hardcoded "0") */
  debugPlayerId?: string;
}
```

### Pattern 3: Error Conversion Layer

**What:** Convert between GameLogicError and Effect-TS TaggedError
**When to use:** At service boundaries where Effect-TS errors meet boardgame.io moves

**Existing implementation:**
- `src/effect/errors.ts` already has `taggedErrorToGameLogicError`
- Need to add reverse conversion `gameLogicErrorToTagged`

**Example:**
```typescript
// Extend src/effect/errors.ts
export function gameLogicErrorToEffect(error: GameLogicError): BaseError {
  return new BaseError({ message: error.message });
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Logging infrastructure | Custom logger with console.log | Effect.logInfo + Effect.annotateLogs | Built-in, structured, testable |
| Error type hierarchy | Custom error classes | Effect-TS Data.TaggedError | Type-safe, exhaustively checked |
| Service dependency injection | Manual dependency passing | Effect.Context/Layer | Standard pattern, testable |

**Key insight:** Effect-TS provides built-in structured logging with `Effect.logInfo`, `Effect.logDebug`, `Effect.logError` that supports annotation with context. This is more powerful than console.log and integrates with the existing service architecture.

## Common Pitfalls

### Pitfall 1: Circular Dependencies
**What goes wrong:** LoggerService imports from game module, game module needs logging
**Why it happens:** Tight coupling between layers
**How to avoid:** Keep LoggerService in effect/services, depend only on Effect types
**Warning signs:** Import errors mentioning "circular dependency"

### Pitfall 2: Forgetting Debug Flag in Production
**What goes wrong:** Debug logging leaks to production
**Why it happens:** Debug flag defaults to true or isn't checked
**How to avoid:** Check `process.env.NODE_ENV` or config.debugMode before logging debug messages
**Warning signs:** Sensitive data in production logs

### Pitfall 3: Incomplete Error Conversion
**What goes wrong:** Some errors don't get converted, causing unhandled rejections
**Why it happens:** New TaggedError types added without updating converter
**How to avoid:** Add converter functions alongside new error types
**Warning signs:** Errors with "_tag" property appearing in move results

## Code Examples

### Replacing console.log in moves.ts

**Current (moves.ts lines 64-96):**
```typescript
console.log(`[Vote] ${playerID} votes for ${targetId}`);
// ... more console.log statements
```

**Target:**
```typescript
// Import at top
import { LoggerService } from "../effect/services/logger";

// In move function
yield* LoggerService.logInfo(`Player ${playerID} votes for ${targetId}`, {
  move: "vote",
  round: G.round,
});
```

### Replacing console.log in phases.ts

**Current (phases.ts lines 131-191):**
```typescript
console.log(`[Phase] Voting phase started, round ${G.round}`);
// ... multiple console.log statements
```

**Target:** Same pattern - use LoggerService with context

### Debug Mode Configuration

**Current (game/index.ts lines 159-161):**
```typescript
if (playerID === "0") {
  // Debug mode shows all secrets
```

**Target:**
```typescript
// In playerView function
const debugPlayerId = G.config.debugPlayerId;
if (playerID === debugPlayerId) {
  // Debug mode shows all secrets
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| console.log | Effect.logInfo | This phase | Structured, annotatable logs |
| Hardcoded "0" | Config.debugPlayerId | This phase | Runtime configurable |
| GameLogicError only | Dual-track (both) | Partial | Full Effect-TS integration |

**Deprecated/outdated:**
- console.log: Should be replaced with LoggerService throughout
- Hardcoded playerID "0": Should use config switch

## Open Questions

1. **Debug configuration location**
   - What we know: GameConfig can hold debug settings
   - What's unclear: Should debugPlayerId be per-game or global?
   - Recommendation: Per-game in GameConfig, default to undefined (disabled)

2. **Logger service layer composition**
   - What we know: Effect.Layer composes services
   - What's unclear: Should LoggerService depend on GameStateRef?
   - Recommendation: Keep independent - no game state dependency needed for logging

3. **Backward compatibility**
   - What we know: Existing code uses console.log
   - What's unclear: Should we provide a shim during transition?
   - Recommendation: Direct replacement, no shim needed

## Sources

### Primary (HIGH confidence)
- Existing code in `src/effect/services/messageService.ts` - Effect.logInfo usage pattern
- Existing code in `src/effect/context/gameStateRef.ts` - Effect.Service pattern
- Existing code in `src/effect/errors.ts` - TaggedError and conversion
- Existing code in `src/types/config.ts` - GameConfig interface

### Secondary (MEDIUM confidence)
- Effect-TS official docs - Effect.logInfo, Effect.annotateLogs patterns
- Context7: effect library - Service pattern documentation

### Tertiary (LOW confidence)
- N/A - sufficient primary sources available

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Effect-TS already in use, no new dependencies needed
- Architecture: HIGH - Clear patterns from existing codebase
- Pitfalls: HIGH - Known patterns from existing services

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (30 days - stable domain)
