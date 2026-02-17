import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { createTestState } from "../../__tests__/testUtils";
import { GameStateRef, makeGameStateRefLayer } from "./gameStateRef";

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

  describe("get operation", () => {
    it("should return initial state on first get", () => {
      const initial = createTestState();
      const initialRound = initial.round;

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        return yield* stateRef.get();
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result.round).toBe(initialRound);
    });

    it("should return current state after modifications", () => {
      const initial = createTestState();

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;

        yield* stateRef.update((s) => ({ ...s, round: 10 }));
        const state = yield* stateRef.get();

        return state.round;
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result).toBe(10);
    });
  });

  describe("set operation", () => {
    it("should replace entire state", () => {
      const initial = createTestState();
      const newState = createTestState();
      newState.round = 99;
      newState.status = "morning";

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        yield* stateRef.set(newState);
        return yield* stateRef.get();
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result.round).toBe(99);
      expect(result.status).toBe("morning");
    });

    it("should work with empty state", () => {
      const initial = createTestState();

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        // Set to empty object with required fields
        yield* stateRef.set({
          ...initial,
          players: {},
          playerOrder: [],
          secrets: {},
          deathLog: [],
          currentVotes: [],
          nightActions: [],
          actionHistory: [],
          voteHistory: [],
          deck: [],
          discardPile: [],
          chatMessages: [],
          attackQuota: { witchKillerUsed: false, killMagicUsed: 0 },
          dailyTradeTracker: {},
          cardSelection: {},
        });
        return (yield* stateRef.get()).players;
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result).toEqual({});
    });
  });

  describe("update operation", () => {
    it("should apply transformation function", () => {
      const initial = createTestState();

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;

        yield* stateRef.update((s) => ({
          ...s,
          round: s.round + 5,
        }));

        return yield* stateRef.get();
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result.round).toBe(6); // initial is 1, +5 = 6
    });

    it("should preserve unmodified fields", () => {
      const initial = createTestState();
      const initialId = initial.id;

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;

        yield* stateRef.update((s) => ({ ...s, round: 999 }));

        return (yield* stateRef.get()).id;
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result).toBe(initialId);
    });

    it("should handle complex transformations", () => {
      const initial = createTestState();

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;

        yield* stateRef.update((s) => ({
          ...s,
          round: s.round + 1,
          phaseStartTime: Date.now(),
        }));

        const state = yield* stateRef.get();
        return {
          round: state.round,
          hasPhaseStartTime: state.phaseStartTime > 0,
        };
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result.round).toBe(2);
      expect(result.hasPhaseStartTime).toBe(true);
    });
  });

  describe("default behavior without layer", () => {
    it("default service should have get that throws when executed", () => {
      // Test the default implementation directly - this should trigger the dieMessage line
      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        // This triggers the default get implementation
        const getEffect = stateRef.get();
        // Running this effect should trigger dieMessage at line 55
        return yield* getEffect;
      });

      expect(() => Effect.runSync(program)).toThrow();
    });

    it("default service should have set that throws when executed", () => {
      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        const setEffect = stateRef.set(createTestState());
        return yield* setEffect;
      });

      expect(() => Effect.runSync(program)).toThrow();
    });

    it("default service should have update that throws when executed", () => {
      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        const updateEffect = stateRef.update((s) => s);
        return yield* updateEffect;
      });

      expect(() => Effect.runSync(program)).toThrow();
    });
  });

  describe("layer creation", () => {
    it("should create layer with initial state", () => {
      const initial = createTestState();
      const layer = GameStateRef.layer(initial);

      expect(layer).toBeDefined();
    });

    it("should work with different game configurations", () => {
      const initial = createTestState();
      initial.config = {
        ...initial.config,
        maxPlayers: 8,
        maxRounds: 10,
      };

      const program = Effect.gen(function* () {
        const stateRef = yield* GameStateRef;
        const state = yield* stateRef.get();
        return state.config.maxPlayers;
      }).pipe(Effect.provide(GameStateRef.layer(initial)));

      const result = Effect.runSync(program);
      expect(result).toBe(8);
    });
  });
});
