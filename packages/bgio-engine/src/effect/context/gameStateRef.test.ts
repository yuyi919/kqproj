import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { createTestState } from "../../__tests__/testUtils";
import { GameStateRef } from "./gameStateRef";

describe("GameStateRef", () => {
  it("provides observable get/set/update operations", () => {
    const initial = createTestState();
    const replacement = { ...createTestState(), round: 5 };

    const program = Effect.gen(function* () {
      const stateRef = yield* GameStateRef;

      const before = yield* stateRef.get();
      yield* stateRef.update((state) => ({ ...state, round: state.round + 1 }));
      const afterUpdate = yield* stateRef.get();

      yield* stateRef.set(replacement);
      const afterSet = yield* stateRef.get();

      return {
        beforeRound: before.round,
        afterUpdateRound: afterUpdate.round,
        afterSetRound: afterSet.round,
        afterSetId: afterSet.id,
      };
    }).pipe(Effect.provide(GameStateRef.layer(initial)));

    const result = Effect.runSync(program);

    expect(result.beforeRound).toBe(1);
    expect(result.afterUpdateRound).toBe(2);
    expect(result.afterSetRound).toBe(5);
    expect(result.afterSetId).toBe(replacement.id);
  });
});
