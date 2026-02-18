"use client";

/**
 * GameRandom Context 测试用例
 */

import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { createMockRandom, createFixedRandom, createMaxRandom } from "../../__tests__/testUtils";
import { GameRandom, makeGameRandomLayer } from "./gameRandom";
import type { RandomAPI } from "../../types";

describe("GameRandom", () => {
  describe("with mock random", () => {
    const mockRandom = createMockRandom();

    it("should provide Number() returning 0.5", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Number();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(0.5);
    });

    it("should provide D4() returning 2", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D4();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(2);
    });

    it("should provide D6() returning 3", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D6();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(3);
    });

    it("should provide D10() returning 5", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D10();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(5);
    });

    it("should provide D12() returning 6", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D12();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(6);
    });

    it("should provide D20() returning 10", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D20();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(10);
    });

    it("should provide Die() returning half of sides plus 1", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Die(6);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(4); // Math.floor(6/2) + 1 = 4
    });
  });

  describe("Shuffle", () => {
    it("should shuffle array (mock returns unchanged)", () => {
      const mockRandom = createMockRandom({ Shuffle: (arr) => [...arr] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([1, 2, 3, 4, 5]);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should shuffle array (fixed returns unchanged)", () => {
      const fixedRandom = createFixedRandom();
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([1, 2, 3, 4, 5]);
      }).pipe(Effect.provide(makeGameRandomLayer(fixedRandom)));

      const result = Effect.runSync(program);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it("should shuffle array (max returns reversed)", () => {
      const maxRandom = createMaxRandom();
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([1, 2, 3, 4, 5]);
      }).pipe(Effect.provide(makeGameRandomLayer(maxRandom)));

      const result = Effect.runSync(program);
      expect(result).toEqual([5, 4, 3, 2, 1]);
    });

    it("should handle empty array", () => {
      const mockRandom = createMockRandom();
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([]);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toEqual([]);
    });

    it("should handle single element array", () => {
      const mockRandom = createMockRandom();
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([42]);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toEqual([42]);
    });

    it("should preserve array elements", () => {
      const mockRandom = createMockRandom();
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle(["a", "b", "c"]);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("c");
      expect(result).toHaveLength(3);
    });
  });

  describe("Number range", () => {
    it("should return value between 0 and 1", () => {
      const mockRandom = createMockRandom({ Number: () => 0.75 });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Number();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(0.75);
    });

    it("should handle boundary value 0", () => {
      const mockRandom = createMockRandom({ Number: () => 0 });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Number();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(0);
    });

    it("should handle boundary value 1", () => {
      const mockRandom = createMockRandom({ Number: () => 1 });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Number();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(1);
    });
  });

  describe("Dice functions", () => {
    it("D4 should return value between 1 and 4", () => {
      const mockRandom = createMockRandom({ D4: (() => 3) as RandomAPI["D4"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D4();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(3);
    });

    it("D6 should return value between 1 and 6", () => {
      const mockRandom = createMockRandom({ D6: (() => 5) as RandomAPI["D6"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D6();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(5);
    });

    it("D10 should return value between 1 and 10", () => {
      const mockRandom = createMockRandom({ D10: (() => 7) as RandomAPI["D10"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D10();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(7);
    });

    it("D12 should return value between 1 and 12", () => {
      const mockRandom = createMockRandom({ D12: (() => 9) as RandomAPI["D12"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D12();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(9);
    });

    it("D20 should return value between 1 and 20", () => {
      const mockRandom = createMockRandom({ D20: (() => 15) as RandomAPI["D20"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D20();
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(15);
    });

    it("Die should return value based on sides", () => {
      const mockRandom = createMockRandom({ Die: ((sides?: number) => Math.floor((sides ?? 6) / 2)) as RandomAPI["Die"] });
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Die(10);
      }).pipe(Effect.provide(makeGameRandomLayer(mockRandom)));

      const result = Effect.runSync(program);
      expect(result).toBe(5); // Math.floor(10/2) = 5
    });
  });

  describe("default behavior without layer", () => {
    it("Number should throw when called without layer", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Number();
      }) as Effect.Effect<unknown>;

      const exit = Effect.runSyncExit(program);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("D4 should throw when called without layer", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D4();
      }) as Effect.Effect<unknown>;

      const exit = Effect.runSyncExit(program);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("D6 should throw when called without layer", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.D6();
      }) as Effect.Effect<unknown>;

      const exit = Effect.runSyncExit(program);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("Shuffle should throw when called without layer", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Shuffle([1, 2, 3]);
      }) as Effect.Effect<unknown>;

      const exit = Effect.runSyncExit(program);
      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("Die should throw when called without layer", () => {
      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        return yield* random.Die(6);
      }) as Effect.Effect<unknown>;

      const exit = Effect.runSyncExit(program);
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("layer creation", () => {
    it("should create layer from RandomAPI", () => {
      const random: RandomAPI = {
        Number: () => 0.5,
        Shuffle: (arr) => [...arr],
        Die: ((sides?: number) => Math.floor((sides ?? 6) / 2)) as RandomAPI["Die"],
        D4: (() => 2) as RandomAPI["D4"],
        D6: (() => 3) as RandomAPI["D6"],
        D10: (() => 5) as RandomAPI["D10"],
        D12: (() => 6) as RandomAPI["D12"],
        D20: (() => 10) as RandomAPI["D20"],
      };

      const layer = makeGameRandomLayer(random);
      expect(layer).toBeDefined();
    });

    it("should work with various RandomAPI implementations", () => {
      const customRandom: RandomAPI = {
        Number: () => 0.123,
        Shuffle: (arr) => arr.slice().reverse(),
        Die: ((sides?: number) => (sides ?? 6) - 1) as RandomAPI["Die"],
        D4: (() => 1) as RandomAPI["D4"],
        D6: (() => 6) as RandomAPI["D6"],
        D10: (() => 10) as RandomAPI["D10"],
        D12: (() => 12) as RandomAPI["D12"],
        D20: (() => 20) as RandomAPI["D20"],
      };

      const program = Effect.gen(function* () {
        const random = yield* GameRandom;
        const num = yield* random.Number();
        const d6 = yield* random.D6();
        return { num, d6 };
      }).pipe(Effect.provide(makeGameRandomLayer(customRandom)));

      const result = Effect.runSync(program);
      expect(result.num).toBe(0.123);
      expect(result.d6).toBe(6);
    });
  });
});
