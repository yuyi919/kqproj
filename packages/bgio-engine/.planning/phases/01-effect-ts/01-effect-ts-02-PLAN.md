---
phase: 01-effect-ts
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/effect/services/attackResolutionService.test.ts
  - src/game/resolution/phase2-attack.test.ts
autonomous: true
requirements:
  - EFFECT-01
  - EFFECT-02
  - EFFECT-03

must_haves:
  truths:
    - "AttackResolutionService is callable via Effect-TS layer"
    - "MessageService is callable via Effect-TS layer"
    - "PlayerStateService is callable via Effect-TS layer"
  artifacts:
    - path: "src/effect/services/attackResolutionService.test.ts"
      provides: "Integration tests for AttackResolutionService"
    - path: "src/game/resolution/phase2-attack.test.ts"
      provides: "End-to-end test for attack resolution"
  key_links:
    - from: "src/game/resolution/phase2-attack.ts"
      to: "src/effect/services/attackResolutionService"
      via: "Effect.runSyncExit"
---

<objective>
Add integration tests verifying Effect-TS services can be properly called through the game layer.

Purpose: Verify that EFFECT-01, EFFECT-02, EFFECT-03 requirements are satisfied - services are migrated and callable
Output: Additional integration tests
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/effect/services/attackResolutionService.ts
@src/effect/services/messageService.ts
@src/effect/services/playerStateService.ts
@src/game/resolution/phase2-attack.ts
</context>

<tasks>

<task type="auto">
  <name>Verify AttackResolutionService integration tests</name>
  <files>src/effect/services/attackResolutionService.test.ts</files>
  <action>
Check existing tests in src/effect/services/attackResolutionService.test.ts. If tests exist, verify they cover:

1. resolvePhase2 - Main entry point for attack resolution
2. processAttackActions - Processing attack actions with barriers
3. Error cases - PlayerNotFound, PlayerNotAlive, etc.

If tests are incomplete or missing, add tests to cover:
- Successful attack resolution with kill
- Attack failure due to barrier
- Attack failure due to quota exceeded
- Witch killer holder protection
  </action>
  <verify>
Run tests: bun test src/effect/services/attackResolutionService.test.ts
  </verify>
  <done>
AttackResolutionService has passing integration tests covering main scenarios
  </done>
</task>

<task type="auto">
  <name>Verify phase2-attack integration tests</name>
  <files>src/game/resolution/phase2-attack.test.ts</files>
  <action>
Check existing tests in src/game/resolution/phase2-attack.test.ts. Verify they test:

1. End-to-end attack resolution through game layer
2. Proper state updates after resolution
3. Error handling when service fails

If tests are missing, add integration tests that:
- Set up game state with night actions
- Call processAttackActions
- Verify PhaseResult contains expected deadPlayers, barrierPlayers, etc.
  </action>
  <verify>
Run tests: bun test src/game/resolution/phase2-attack.test.ts
  </verify>
  <done>
phase2-attack has end-to-end integration tests passing
  </done>
</task>

</tasks>

<verification>
- All tests pass: bun test src/effect/services/attackResolutionService.test.ts
- All tests pass: bun test src/game/resolution/phase2-attack.test.ts
- Tests verify services are properly callable through game layer
</verification>

<success_criteria>
EFFECT-01, EFFECT-02, EFFECT-03: Services can be called via Effect-TS layer with tests proving it works
</success_criteria>

<output>
After completion, create `.planning/phases/01-effect-ts/01-effect-ts-02-SUMMARY.md`
</output>
