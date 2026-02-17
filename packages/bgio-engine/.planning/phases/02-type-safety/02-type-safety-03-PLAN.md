---
phase: 02-type-safety
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src/game/index.ts
autonomous: true
requirements:
  - TYPE-03
must_haves:
  truths:
    - "src/game/index.ts has no type casting (as SomeType)"
    - "Type assignments use standard TypeScript patterns"
  artifacts:
    - path: "src/game/index.ts"
      provides: "Type-safe game definition"
      contains_no: "as \\w+"
  key_links:
    - from: "src/game/index.ts"
      to: "src/types/"
      via: "import"
      pattern: "import.*BGGameState"
---

<objective>
Verify and ensure src/game/index.ts has no type casting (type assertions).
</objective>

<context>
@src/game/index.ts
@.planning/REQUIREMENTS.md (TYPE-03)

Check for any type casts like `as SomeType` or type assertions that should be replaced with proper types.
</context>

<tasks>

<task type="auto">
  <name>Verify game/index.ts has no type casting</name>
  <files>src/game/index.ts</files>
  <action>
1. Search for any type casting patterns in src/game/index.ts:
   - Search for `as ` keyword
   - Search for type assertions

2. If type casts are found, analyze them:
   - If cast to `Game<BGGameState>` at line 180: This is a standard type annotation, not a cast. The TypedWitchTrialGame already satisfies Game<BGGameState> via `satisfies`. This is fine.
   - If any other casts exist, replace with proper types

3. Document findings and confirm no problematic type casts exist.

Note: The assignment `const WitchTrialGame: Game<BGGameState> = TypedWitchTrialGame` is a type annotation, not a type cast. The `satisfies` keyword ensures type safety.
  </action>
  <verify>
Run grep to check for type casts:
```
grep -n " as " src/game/index.ts
grep -n "as\s\+" src/game/index.ts
```

Should return no matches for explicit type assertions.
  </verify>
  <done>
No type casting found in src/game/index.ts. Type annotations are standard TypeScript patterns.
  </done>
</task>

</tasks>

<verification>
1. Run grep for type cast patterns - should find none
2. Confirm the game can be compiled without errors related to game/index.ts
</verification>

<success_criteria>
- No explicit type casts (`as SomeType`) in src/game/index.ts
- Type assignments use standard TypeScript patterns
</success_criteria>

<output>
After completion, create `.planning/phases/02-type-safety/02-type-safety-03-SUMMARY.md`
</output>
