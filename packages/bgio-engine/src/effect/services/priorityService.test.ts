import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import {
  makeBarrierCard,
  makeBaseLayer,
  makeCheckCard,
  makeDetectCard,
  makeKillCard,
  makeWitchKillerCard,
} from "../../__tests__/helpers";
import type { NightAction } from "../../types";
import { PriorityService } from "./priorityService";

// ==================== Test Helpers ====================

/**
 * 运行 PriorityService Effect
 */
function runPriorityService<T>(effect: Effect.Effect<T, never, unknown>): T {
  return Effect.runSync(effect.pipe(Effect.provide(makeBaseLayer())));
}

/**
 * 创建夜间行动
 */
function createNightAction(
  playerId: string,
  card: { id: string; type: string } | null,
  targetId?: string,
  timestamp: number = Date.now(),
): NightAction {
  return {
    id: `na-${playerId}-${timestamp}`,
    timestamp,
    playerId,
    targetId,
    card,
  } as NightAction;
}

// ==================== Tests ====================

describe("PriorityService", () => {
  describe("getAttackType", () => {
    it("should return witch_killer for witch_killer card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const card = makeWitchKillerCard("wk-1");
        return service.getAttackType(card);
      });

      expect(runPriorityService(program)).toBe("witch_killer");
    });

    it("should return kill for kill card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const card = makeKillCard("kill-1");
        return service.getAttackType(card);
      });

      expect(runPriorityService(program)).toBe("kill");
    });

    it("should return null for barrier card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const card = makeBarrierCard("barrier-1");
        return service.getAttackType(card);
      });

      expect(runPriorityService(program)).toBeNull();
    });

    it("should return null for detect card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const card = makeDetectCard("detect-1");
        return service.getAttackType(card);
      });

      expect(runPriorityService(program)).toBeNull();
    });

    it("should return null for check card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const card = makeCheckCard("check-1");
        return service.getAttackType(card);
      });

      expect(runPriorityService(program)).toBeNull();
    });

    it("should return null for null card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        return service.getAttackType(null);
      });

      expect(runPriorityService(program)).toBeNull();
    });
  });

  describe("isAttackAction", () => {
    it("should return true for witch_killer action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction(
          "p1",
          makeWitchKillerCard("wk-1"),
          "p2",
        );
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(true);
    });

    it("should return true for kill action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction("p1", makeKillCard("kill-1"), "p2");
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(true);
    });

    it("should return false for barrier action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction("p1", makeBarrierCard("barrier-1"));
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should return false for detect action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction(
          "p1",
          makeDetectCard("detect-1"),
          "p2",
        );
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should return false for check action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction("p1", makeCheckCard("check-1"), "p2");
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should return false for pass action (null card)", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const action = createNightAction("p1", null);
        return service.isAttackAction(action);
      });

      expect(runPriorityService(program)).toBe(false);
    });
  });

  describe("sortActionsByPriority", () => {
    it("should sort witch_killer before kill", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeKillCard("k1"), "p2", 1000),
          createNightAction("p3", makeWitchKillerCard("wk1"), "p4", 1001),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted[0].card?.type).toBe("witch_killer");
      expect(sorted[1].card?.type).toBe("kill");
    });

    it("should sort kill before detect", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeDetectCard("d1"), "p2", 1000),
          createNightAction("p3", makeKillCard("k1"), "p4", 1001),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted[0].card?.type).toBe("kill");
      expect(sorted[1].card?.type).toBe("detect");
    });

    it("should sort detect before check", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeCheckCard("c1"), "p2", 1000),
          createNightAction("p3", makeDetectCard("d1"), "p4", 1001),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted[0].card?.type).toBe("detect");
      expect(sorted[1].card?.type).toBe("check");
    });

    it("should sort barrier before check", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeCheckCard("c1"), "p2", 1000),
          createNightAction("p3", makeBarrierCard("b1"), undefined, 1001),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted[0].card?.type).toBe("barrier");
      expect(sorted[1].card?.type).toBe("check");
    });

    it("should sort by timestamp for same priority", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p2", makeKillCard("k2"), "p3", 2000),
          createNightAction("p1", makeKillCard("k1"), "p4", 1000),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted[0].playerId).toBe("p1"); // Earlier timestamp
      expect(sorted[1].playerId).toBe("p2"); // Later timestamp
    });

    it("should handle empty array", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        return service.sortActionsByPriority([]);
      });

      expect(runPriorityService(program)).toEqual([]);
    });

    it("should handle single action", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeKillCard("k1"), "p2", 1000),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].playerId).toBe("p1");
    });

    it("should maintain stable sort for same priority and timestamp", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeKillCard("k1"), "p2", 1000),
          createNightAction("p3", makeKillCard("k2"), "p4", 1000),
        ];
        return service.sortActionsByPriority(actions);
      });

      const sorted = runPriorityService(program);
      // Same timestamp, should maintain original order
      expect(sorted[0].playerId).toBe("p1");
      expect(sorted[1].playerId).toBe("p3");
    });
  });

  describe("sortAttackActions", () => {
    it("should filter and sort only attack actions", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeDetectCard("d1"), "p2", 1000),
          createNightAction("p3", makeKillCard("k1"), "p4", 1001),
          createNightAction("p5", makeBarrierCard("b1"), undefined, 1002),
          createNightAction("p6", makeWitchKillerCard("wk1"), "p7", 1003),
        ];
        return service.sortAttackActions(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted).toHaveLength(2);
      expect(sorted[0].card?.type).toBe("witch_killer");
      expect(sorted[1].card?.type).toBe("kill");
    });

    it("should return empty array when no attack actions", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeDetectCard("d1"), "p2", 1000),
          createNightAction("p3", makeBarrierCard("b1"), undefined, 1001),
          createNightAction("p5", makeCheckCard("c1"), "p6", 1002),
        ];
        return service.sortAttackActions(actions);
      });

      expect(runPriorityService(program)).toEqual([]);
    });

    it("should handle empty array", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        return service.sortAttackActions([]);
      });

      expect(runPriorityService(program)).toEqual([]);
    });

    it("should include pass actions with null card", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", null, undefined, 1000),
          createNightAction("p2", makeKillCard("k1"), "p3", 1001),
        ];
        return service.sortAttackActions(actions);
      });

      const sorted = runPriorityService(program);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].card?.type).toBe("kill");
    });
  });

  describe("isWitchKillerUsed", () => {
    it("should return true when witch_killer is in actions", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeDetectCard("d1"), "p2", 1000),
          createNightAction("p3", makeWitchKillerCard("wk1"), "p4", 1001),
        ];
        return service.isWitchKillerUsed(actions);
      });

      expect(runPriorityService(program)).toBe(true);
    });

    it("should return false when no witch_killer in actions", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeDetectCard("d1"), "p2", 1000),
          createNightAction("p3", makeKillCard("k1"), "p4", 1001),
          createNightAction("p5", makeBarrierCard("b1"), undefined, 1002),
        ];
        return service.isWitchKillerUsed(actions);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should return false for empty actions", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        return service.isWitchKillerUsed([]);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should return false when all actions have null cards", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", null, undefined, 1000),
          createNightAction("p2", null, undefined, 1001),
        ];
        return service.isWitchKillerUsed(actions);
      });

      expect(runPriorityService(program)).toBe(false);
    });

    it("should detect witch_killer at any position", () => {
      const program = Effect.gen(function* () {
        const service = yield* PriorityService;
        const actions: NightAction[] = [
          createNightAction("p1", makeKillCard("k1"), "p2", 1000),
          createNightAction("p3", makeDetectCard("d1"), "p4", 1001),
          createNightAction("p5", makeWitchKillerCard("wk1"), "p6", 1002),
          createNightAction("p7", makeBarrierCard("b1"), undefined, 1003),
        ];
        return service.isWitchKillerUsed(actions);
      });

      expect(runPriorityService(program)).toBe(true);
    });
  });
});
