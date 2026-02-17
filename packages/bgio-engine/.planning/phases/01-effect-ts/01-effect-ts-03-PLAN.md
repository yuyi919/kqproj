---
phase: 01-effect-ts
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/domain/services/cardService.ts
  - src/domain/services/messageBuilder.ts
  - src/domain/queries/index.ts
autonomous: true
requirements:
  - EFFECT-05

must_haves:
  truths:
    - "Legacy domain services exist and remain accessible"
    - "New Effect-TS services can coexist with legacy services"
  artifacts:
    - path: "src/domain/services/cardService.ts"
      provides: "Card factory and definitions (legacy)"
    - path: "src/domain/services/messageBuilder.ts"
      provides: "TMessageBuilder (used by MessageService)"
    - path: "src/domain/queries/index.ts"
      provides: "Selectors (used by PlayerStateService)"
  key_links:
    - from: "src/effect/services/messageService.ts"
      to: "src/domain/services/messageBuilder.ts"
      via: "import TMessageBuilder"
    - from: "src/effect/services/playerStateService.ts"
      to: "src/domain/queries/index.ts"
      via: "import Selectors"
---

<objective>
Verify and document backward compatibility - legacy domain services are preserved as compatibility layer.

Purpose: Satisfy EFFECT-05 - keep legacy domain services as compatibility layer (don't delete)
Output: Verify services coexist and document the compatibility
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/domain/services/cardService.ts
@src/domain/services/messageBuilder.ts
@src/domain/queries/index.ts
@src/effect/services/messageService.ts
@src/effect/services/playerStateService.ts
</context>

<tasks>

<task type="auto">
  <name>Verify legacy domain services are preserved</name>
  <files>
    - src/domain/services/cardService.ts
    - src/domain/services/messageBuilder.ts
    - src/domain/queries/index.ts
  </files>
  <action>
Verify these legacy domain services exist and are importable:

1. src/domain/services/cardService.ts - Card definitions and factory functions
2. src/domain/services/messageBuilder.ts - TMessageBuilder (used by MessageService)
3. src/domain/queries/index.ts - Selectors (used by PlayerStateService)

Verify they compile without errors and are being used:
- TMessageBuilder is imported by MessageService in effect layer
- Selectors is imported by PlayerStateService in effect layer

Run: bun run tsc --noEmit to verify no type errors
  </action>
  <verify>
TypeScript compiles without errors: bun run tsc --noEmit
  </verify>
  <done>
Legacy domain services exist, importable, and type-check clean
  </done>
</task>

<task type="auto">
  <name>Verify dual-layer coexistence works</name>
  <files>src/__tests__/game.test.ts</files>
  <action>
Verify that both legacy and Effect-TS layers can coexist by running existing tests:

- bun test src/__tests__/game.test.ts
- bun test src/__tests__/resolution.test.ts
- bun test src/__tests__/attack.test.ts

These tests use the game layer which internally uses both:
- Legacy mutations (Mutations.msg, etc.)
- Effect-TS services (AttackResolutionService in phase2-attack)
  </action>
  <verify>
All game tests pass: bun test src/__tests__/game.test.ts src/__tests__/resolution.test.ts src/__tests__/attack.test.ts
  </verify>
  <done>
Dual-layer coexistence verified - all tests pass
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles: bun run tsc --noEmit
- All game tests pass: bun test
- Legacy services are preserved and usable
</verification>

<success_criteria>
EFFECT-05: Legacy domain services preserved as compatibility layer - verified by tests passing
</success_criteria>

<output>
After completion, create `.planning/phases/01-effect-ts/01-effect-ts-03-SUMMARY.md`
</output>
