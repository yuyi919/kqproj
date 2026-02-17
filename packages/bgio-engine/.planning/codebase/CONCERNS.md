# Codebase Concerns

**Analysis Date:** 2026-02-17

## Tech Debt

**Effect-TS Integration Incomplete:**
- Issue: New Effect-TS service layer is partially implemented but not fully integrated
- Files: `src/effect/services/attackResolutionService.ts` (425 lines), `src/effect/services/messageService.ts` (391 lines), `src/effect/services/playerStateService.ts` (394 lines), `src/effect/layers/gameLayers.ts`
- Impact: Mixing old imperative patterns with new functional Effect-TS patterns creates inconsistency and cognitive load
- Fix approach: Complete Effect-TS migration and remove old service implementations, or create clear separation

**Excessive Console Logging:**
- Issue: Debug console.log statements throughout game logic
- Files: `src/game/moves.ts` (multiple instances at lines 64, 77, 91, 115, 132, 139, 337, 428), `src/game/phases.ts` (multiple instances at lines 129, 138, 150, 156, 168, 171, 184, 193, 337)
- Impact: Performance degradation in production, unnecessary I/O, potential information leakage
- Fix approach: Replace with proper logging infrastructure or remove before production

**Type Safety Gaps:**
- Issue: Use of `any` type in production and test code
- Files: `src/ai/index.ts` (line 19: metadata return type), `src/effect/test-helpers.ts` (lines 107, 117, 134, 135, 137, 139, 146, 147, 149, 158-160), `src/game/index.ts` (line 155: deathLog cast)
- Impact: Runtime errors not caught by type system, harder maintenance
- Fix approach: Add proper typing for all return values and generics

**Mixed Error Handling Patterns:**
- Issue: Using both `GameLogicError` (imperative) and Effect-TS `Data.TaggedError` (functional)
- Files: `src/game/errors.ts`, `src/game/assertions.ts` (throw GameLogicError), `src/effect/errors.ts` (Data.TaggedError)
- Impact: Inconsistent error handling, harder to create unified error boundaries
- Fix approach: Migrate all errors to Effect-TS pattern or create adapter layer

**Debug Mode Hardcoding:**
- Issue: Player ID "0" is hardcoded for debug mode visibility
- Files: `src/game/index.ts` (filterMessages function)
- Impact: Potential security issue if debug mode leaks in production
- Fix approach: Remove debug mode from production builds, use environment flag

## Known Bugs

**No explicit bugs found.** However, the incomplete Effect-TS integration may have edge cases not yet discovered.

## Security Considerations

**Debug Mode Player:**
- Risk: Player ID "0" bypasses message filtering, exposing all private information
- Files: `src/game/index.ts` (playerView function)
- Current mitigation: None detected - debug mode is active in production
- Recommendations: Add production environment check, disable in production builds

**Console Logging Sensitive Data:**
- Risk: Game state, player actions, and votes logged to console
- Files: `src/game/moves.ts`, `src/game/phases.ts`
- Current mitigation: None
- Recommendations: Remove all console.log statements or use proper logging with filters

## Performance Bottlenecks

**Large File Complexity:**
- Problem: Core game logic files exceed 400 lines
- Files:
  - `src/game/moves.ts` (552 lines)
  - `src/effect/services/attackResolutionService.ts` (425 lines)
  - `src/domain/services/messageBuilder.ts` (410 lines)
  - `src/effect/services/playerStateService.ts` (394 lines)
  - `src/effect/services/messageService.ts` (391 lines)
- Cause: Single responsibility violations, multiple concerns in single files
- Improvement path: Split by feature (vote handling, card usage, phase transitions)

**Deep Phase Resolution Chains:**
- Problem: Night action resolution calls multiple services in sequence
- Files: `src/game/resolution/phase2-attack.ts`, `src/effect/services/attackResolutionService.ts`
- Cause: Effect programs run synchronously but perform complex game state mutations
- Improvement path: Consider async processing for large player counts

## Fragile Areas

**Phase Resolution Logic:**
- Files: `src/game/resolution/phase2-attack.ts`, `src/game/resolution/phase1-detect-barrier.ts`, `src/game/resolution/phase3-check.ts`, `src/game/resolution/phase4-wreck.ts`, `src/game/resolution/phase5-consume.ts`
- Why fragile: Complex multi-phase state mutations with dependencies between phases, hard to trace state changes
- Safe modification: Add integration tests covering full night resolution cycle
- Test coverage: Limited - only `src/game/resolution/phase2-attack.test.ts` exists

**Message Building System:**
- Files: `src/domain/services/messageBuilder.ts` (410 lines), `src/types/message.ts` (266 lines)
- Why fragile: Message types are tightly coupled, adding new message kinds requires changes in multiple places
- Safe modification: Add builder pattern for new message types, document message kinds clearly

**Card and Player State Services:**
- Files: `src/effect/services/cardService.ts`, `src/effect/services/playerStateService.ts`
- Why fragile: New Effect-TS services with limited test coverage, still being stabilized
- Safe modification: Add comprehensive tests before modifying service interfaces

## Scaling Limits

**Message Filtering:**
- Current capacity: All messages kept in state, filtered at runtime per player
- Limit: O(n*m) where n=players, m=messages - becomes slow with long games
- Scaling path: Implement message pagination, archive old messages

**Night Resolution:**
- Current capacity: Sequential processing of all player actions
- Limit: Slows with 14 players (max) performing actions simultaneously
- Scaling path: Batch processing, parallel effect execution

## Dependencies at Risk

**Effect-TS Version:**
- Risk: Using `@effect/experimental: ^0.58.0` and `effect: ^3.19.16` - experimental packages may have breaking changes
- Impact: Could break compilation or runtime behavior
- Migration plan: Pin to specific versions, monitor Effect-TS changelog for breaking changes

**boardgame.io:**
- Risk: Using version `^0.50.2` - major version could have API changes
- Impact: Game definition may need updates
- Migration plan: Test thoroughly on updates, check boardgame.io migration guides

## Missing Critical Features

**AI Implementation:**
- Problem: `src/ai/index.ts` contains stub implementation with hardcoded return values
- Blocks: Computer opponents, automated testing scenarios
- Priority: High

**Complete Effect-TS Services:**
- Problem: New service layer exists but old imperative code still used in moves
- Blocks: Full functional programming benefits, better error handling
- Priority: Medium

## Test Coverage Gaps

**Phase Resolution Integration:**
- What's not tested: Full night resolution flow with multiple players
- Files: `src/game/resolution/` directory
- Risk: Phase interactions may have edge cases not covered by unit tests
- Priority: High

**Effect-TS Service Layer:**
- What's not tested: AttackResolutionService, MessageService in production code paths
- Files: `src/effect/services/`
- Risk: Errors in new functional layer may go undetected
- Priority: High

**Message Visibility:**
- What's not tested: Complex message scenarios with multiple players, all message kinds
- Files: `src/types/message.ts`, `src/domain/services/messageBuilder.ts`
- Risk: Incorrect filtering could leak information
- Priority: Medium

**Selector Functions:**
- What's not tested: Edge cases in Selectors utility functions
- Files: `src/utils.ts`
- Risk: Incorrect state computation could affect game logic
- Priority: Medium

---

*Concerns audit: 2026-02-17*
