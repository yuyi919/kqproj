---
phase: 02-type-safety
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/effect/test-helpers.ts
autonomous: true
requirements:
  - TYPE-02
must_haves:
  truths:
    - "src/effect/test-helpers.ts has no 'any' types"
    - "All Layer types are properly generic"
    - "All Context types are properly typed"
  artifacts:
    - path: "src/effect/test-helpers.ts"
      provides: "Type-safe Effect-TS test utilities"
      contains_no: "any"
  key_links:
    - from: "src/effect/test-helpers.ts"
      to: "src/effect/services/"
      via: "import"
      pattern: "import.*Effect.*from.*effect"
---

<objective>
Remove `any` types from src/effect/test-helpers.ts and add proper generic type signatures.
</objective>

<context>
@src/effect/test-helpers.ts
@.planning/REQUIREMENTS.md (TYPE-02)

Priority: Core functions first. Use generics for flexibility. Verify with TypeScript strict mode.
</context>

<tasks>

<task type="auto">
  <name>Add generic type parameters to test helper functions</name>
  <files>src/effect/test-helpers.ts</files>
  <action>
Replace all `Layer.Layer<any>` and `Context.GenericTag<any>` with proper generic types:

1. `runWithLayer` - Add generic type parameter for the effect result:
   - Change: `Layer.Layer<any>` to proper context type
   - Use `Layer.Layer<never, never, R>` pattern where R is the service context

2. `runWithLayerExit` - Same approach as runWithLayer

3. `makeMockLayer` - Add generic type parameter for the service interface:
   - Change `Layer.Layer<any>` to `Layer.Layer<Context.GenericTag<T>, never, T>` where T is the service type
   - Use proper type casting instead of `as unknown as`

4. `makeEffectMockLayer` - Add generic type parameter:
   - Change `Effect.Effect<any>` to proper generic

5. `mergeLayers` - Add proper generic constraints for layer combination

Key: Import and use proper Context types. Do NOT use `any` or `as unknown as`.
  </action>
  <verify>
Run TypeScript strict check:
```
npx tsc --noEmit --strict src/effect/test-helpers.ts
```

Then run the test file to ensure no regressions:
```
bun test src/effect/test-helpers.test.ts
```
  </verify>
  <done>
src/effect/test-helpers.ts has no 'any' types. All Layer functions use proper generic type parameters.
  </done>
</task>

</tasks>

<verification>
1. Run `grep -n "any" src/effect/test-helpers.ts` - should return no results for `any` type usage
2. Run `bun test src/effect/test-helpers.test.ts` - all tests pass
</verification>

<success_criteria>
- No `any` types in src/effect/test-helpers.ts
- All tests pass
- TypeScript strict mode passes
</success_criteria>

<output>
After completion, create `.planning/phases/02-type-safety/02-type-safety-01-SUMMARY.md`
</output>
