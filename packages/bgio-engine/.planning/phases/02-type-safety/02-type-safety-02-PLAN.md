---
phase: 02-type-safety
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/__tests__/testUtils.ts
autonomous: true
requirements:
  - TYPE-04
must_haves:
  truths:
    - "All test helper functions in testUtils.ts have complete type signatures"
    - "No 'any' types in function parameters or return types"
    - "callMove function is properly typed"
  artifacts:
    - path: "src/__tests__/testUtils.ts"
      provides: "Type-safe test utilities for game testing"
      contains_no: "any"
  key_links:
    - from: "src/__tests__/testUtils.ts"
      to: "src/types/"
      via: "import"
      pattern: "import.*types.*from"
---

<objective>
Add complete type signatures to all test helper functions in src/__tests__/testUtils.ts.
</objective>

<context>
@src/__tests__/testUtils.ts
@.planning/REQUIREMENTS.md (TYPE-04)

Priority: Core functions first. Use generics for flexibility. Verify with TypeScript strict mode.
</context>

<tasks>

<task type="auto">
  <name>Add proper types to testUtils.ts functions</name>
  <files>src/__tests__/testUtils.ts</files>
  <action>
Fix all 'any' types in testUtils.ts:

1. `callMove` function (line 639):
   - Current: `callMove(move: any, context: any, ...args: unknown[])`
   - Change to proper MoveFunction type from boardgame.io
   - Import and use proper MoveFn type

2. `createPhaseContext` events type (line 606):
   - Current: `events: {} as any,`
   - Change to proper EventsAPI type from boardgame.io
   - Import from "boardgame.io/dist/types/src/plugins/events/events"

3. `createSetupContext` return type:
   - Add proper MockContext type definition
   - Ensure all properties are typed

4. Check for any other `any` usages and fix them

Key: Import proper types from boardgame.io. Do NOT use `any`.
  </action>
  <verify>
Run TypeScript strict check:
```
npx tsc --noEmit --strict src/__tests__/testUtils.ts
```

Then run relevant tests:
```
bun test src/__tests__/game.test.ts
```
  </verify>
  <done>
All test helper functions have complete type signatures. No 'any' types in function parameters.
  </done>
</task>

</tasks>

<verification>
1. Run `grep -n ": any" src/__tests__/testUtils.ts` - should return no results
2. Run `grep -n "as any" src/__tests__/testUtils.ts` - should return no results
3. Run relevant tests to ensure no regressions
</verification>

<success_criteria>
- No `any` types in src/__tests__/testUtils.ts
- All related tests pass
- TypeScript strict mode passes
</success_criteria>

<output>
After completion, create `.planning/phases/02-type-safety/02-type-safety-02-SUMMARY.md`
</output>
