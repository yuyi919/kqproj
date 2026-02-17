---
phase: 01-effect-ts
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/effect/errors.ts
  - src/game/resolution/phase2-attack.ts
autonomous: true
requirements:
  - EFFECT-04

must_haves:
  truths:
    - "Effect-TS service errors are converted to GameLogicError at the game boundary"
    - "phase2-attack.ts uses proper error conversion when AttackResolutionService fails"
  artifacts:
    - path: "src/effect/errors.ts"
      provides: "TaggedError definitions for Effect-TS services"
    - path: "src/game/resolution/phase2-attack.ts"
      provides: "Attack resolution with proper error boundary"
  key_links:
    - from: "src/game/resolution/phase2-attack.ts"
      to: "src/effect/errors.ts"
      via: "error conversion utility"
---

<objective>
Add boundary error conversion between Effect-TS TaggedErrors and GameLogicError to satisfy EFFECT-04 requirement.

Purpose: Implement the error handling pattern specified in context: "Effect-TS 服务内部使用 TaggedError，边界转换后抛出 GameLogicError"
Output: Error conversion utility + updated phase2-attack.ts
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-effect-ts/01-CONTEXT.md
@src/effect/errors.ts
@src/game/resolution/phase2-attack.ts
@src/game/errors.ts
</context>

<tasks>

<task type="auto">
  <name>Add TaggedError to GameLogicError conversion utility</name>
  <files>src/effect/errors.ts</files>
  <action>
Add a conversion function to src/effect/errors.ts that converts Effect-TS TaggedErrors to GameLogicError at the service boundary.

Add these exports to src/effect/errors.ts:
1. taggedErrorToGameLogicError(error: unknown): GameLogicError - Converts any TaggedError to GameLogicError with meaningful message
2. Re-export GameLogicError from src/game/errors.ts for convenience

The conversion should:
- Handle PlayerNotFoundError → "Player {playerId} not found"
- Handle PlayerNotAliveError → "Player {playerId} is not alive ({status})"
- Handle ActorDeadError → "Actor {actorId} is dead"
- Handle TargetAlreadyDeadError → "Target {targetId} is already dead"
- Handle TargetWitchKillerFailedError → "Target {targetId} is protected by witch_killer"
- Handle QuotaExceededError → "Kill quota exceeded ({current}/{max})"
- Handle BarrierProtectedError → "Target {targetId} is protected by barrier"
- Default case → "Unknown error: {error message}"
  </action>
  <verify>
Import and use the conversion in phase2-attack.ts, verify errors are properly converted when service fails
  </verify>
  <done>
taggedErrorToGameLogicError function exists in src/effect/errors.ts and is exported
  </done>
</task>

<task type="auto">
  <name>Update phase2-attack.ts to use error conversion</name>
  <files>src/game/resolution/phase2-attack.ts</files>
  <action>
Update src/game/resolution/phase2-attack.ts to use the new error conversion:

1. Import taggedErrorToGameLogicError from src/effect/errors.ts
2. In the catch block (exit._tag === "Failure"), convert the error:
   - Use Effect.mapError or manually convert using taggedErrorToGameLogicError
   - Throw GameLogicError instead of AttackResolutionExecutionError

The goal is to have consistent error handling where Effect-TS errors become GameLogicError at the boundary.
  </action>
  <verify>
Run existing tests: bun test src/game/resolution/phase2-attack.test.ts
  </verify>
  <done>
phase2-attack.ts throws GameLogicError when AttackResolutionService fails (not AttackResolutionExecutionError)
  </done>
</task>

</tasks>

<verification>
- Tests pass: bun test src/game/resolution/phase2-attack.test.ts
- Tests pass: bun test src/__tests__/resolution.test.ts
- Error messages are user-friendly
</verification>

<success_criteria>
EFFECT-04: Unified error handling using Effect-TS Data.TaggedError with proper boundary conversion to GameLogicError
</success_criteria>

<output>
After completion, create `.planning/phases/01-effect-ts/01-effect-ts-01-SUMMARY.md`
</output>
