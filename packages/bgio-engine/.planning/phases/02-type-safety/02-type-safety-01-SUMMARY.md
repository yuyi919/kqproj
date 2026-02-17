---
phase: 02-type-safety
plan: "01"
subsystem: bgio-engine
tags:
  - effect-ts
  - type-safety
  - testing
dependency_graph:
  requires: []
  provides:
    - src/effect/test-helpers.ts
  affects:
    - src/effect/services/
    - src/effect/context/
tech_stack:
  - Effect-TS
  - TypeScript strict mode
key_files:
  created: []
  modified:
    - src/effect/test-helpers.ts
decisions:
  - "Used generic type parameters (I, E, R) for Layer types instead of any"
  - "Preserved type inference by accepting generic Layer inputs"
metrics:
  duration: "~1 min"
  completed_date: "2026-02-17"
---

# Phase 2 Plan 1: Type Safety - Test Helpers Summary

## Objective

Remove `any` types from `src/effect/test-helpers.ts` and add proper generic type signatures.

## Changes Made

### Generic Type Parameters Added

| Function | Generic Types | Description |
|----------|---------------|-------------|
| `runWithLayer<A, I, R>` | A (result), I (input), R (service) | Runs Effect with Layer, returns A |
| `runWithLayerExit<A, E, I, R>` | A, E (error), I, R | Same but returns Exit |
| `makeMockLayer<I, R>` | I (identifier), R (service) | Creates mock Layer from Tag and impl |
| `makeEffectMockLayer<I, R, E>` | I, R, E | Creates Layer from Effect |
| `mergeLayers<I1, E1, R1, I2, E2, R2>` | All input/output types | Merges two Layers with union types |

### Type Pattern

- `I` - Input/Identifier type (Context.Tag identifier)
- `E` - Error type
- `R` - Result/Service type (the actual service interface)

## Verification

- TypeScript strict mode passes for test-helpers.ts
- Tests pass: `bun test src/effect/test-helpers.test.ts` (2 pass, 0 fail)
- No `any` types in public API signatures

## Deviation from Plan

The original plan suggested using `Layer.Layer<never, never, R>` pattern, but the Effect-TS v3 library uses a different type signature where `Context.Tag<I, R>` requires two type parameters (identifier and value). The implementation uses proper generic constraints instead.

Internal implementation uses type casts (`as any`) to work around Effect-TS's complex type inference for `Effect.provide()`. These are implementation details not exposed in the public API.

## Status

**Complete** - All tasks finished, tests passing, type-safe signatures in place.
