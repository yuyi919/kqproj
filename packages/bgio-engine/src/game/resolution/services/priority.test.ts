import { describe, expect, it } from "bun:test";
import type { CardRef, NightAction } from "../../../types";
import {
  getAttackType,
  isAttackAction,
  isWitchKillerUsed,
  sortActionsByPriority,
  sortAttackActions,
} from "../services/priority";

// ==================== Priority Service Tests ====================
describe("Priority Service", () => {
  describe("getAttackType", () => {
    it("应该返回 witch_killer", () => {
      const card: CardRef = { id: "c1", type: "witch_killer" };
      expect(getAttackType(card)).toBe("witch_killer");
    });

    it("应该返回 kill", () => {
      const card: CardRef = { id: "c1", type: "kill" };
      expect(getAttackType(card)).toBe("kill");
    });

    it("应该返回 null（非攻击卡）", () => {
      const card: CardRef = { id: "c1", type: "detect" };
      expect(getAttackType(card)).toBeNull();
    });

    it("应该处理 null card", () => {
      expect(getAttackType(null)).toBeNull();
    });
  });

  describe("isAttackAction", () => {
    it("应该识别 witch_killer 行动", () => {
      const action: NightAction = {
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "c1", type: "witch_killer" },
      };
      expect(isAttackAction(action)).toBe(true);
    });

    it("应该识别 kill 行动", () => {
      const action: NightAction = {
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "c1", type: "kill" },
      };
      expect(isAttackAction(action)).toBe(true);
    });

    it("应该拒绝非攻击行动", () => {
      const action: NightAction = {
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "c1", type: "barrier" },
      };
      expect(isAttackAction(action)).toBe(false);
    });

    it("应该处理弃权", () => {
      const action: NightAction = {
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: null,
      };
      expect(isAttackAction(action)).toBe(false);
    });
  });

  describe("sortActionsByPriority", () => {
    it("应该按优先级降序，时间戳升序排序", () => {
      const actions: NightAction[] = [
        {
          id: "na3",
          timestamp: 300,
          playerId: "p3",
          card: { id: "c3", type: "detect" },
        },
        {
          id: "na1",
          timestamp: 100,
          playerId: "p1",
          card: { id: "c1", type: "witch_killer" },
        },
        {
          id: "na2",
          timestamp: 200,
          playerId: "p2",
          card: { id: "c2", type: "kill" },
        },
      ];

      const sorted = sortActionsByPriority(actions);

      expect(sorted[0].card?.type).toBe("witch_killer");
      expect(sorted[1].card?.type).toBe("kill");
      expect(sorted[2].card?.type).toBe("detect");
    });

    it("应该处理相同优先级的行动（按时间戳）", () => {
      const now = Date.now();
      const actions: NightAction[] = [
        {
          id: "na2",
          timestamp: now + 200,
          playerId: "p2",
          card: { id: "c2", type: "kill" },
        },
        {
          id: "na1",
          timestamp: now + 100,
          playerId: "p1",
          card: { id: "c1", type: "kill" },
        },
      ];

      const sorted = sortActionsByPriority(actions);

      expect(sorted[0].timestamp).toBe(now + 100);
      expect(sorted[1].timestamp).toBe(now + 200);
    });

    it("应该处理空数组", () => {
      expect(sortActionsByPriority([])).toEqual([]);
    });
  });

  describe("sortAttackActions", () => {
    it("应该只保留并排序攻击行动", () => {
      const actions: NightAction[] = [
        {
          id: "na3",
          timestamp: 300,
          playerId: "p3",
          card: { id: "c3", type: "detect" },
        },
        {
          id: "na1",
          timestamp: 100,
          playerId: "p1",
          card: { id: "c1", type: "witch_killer" },
        },
        {
          id: "na2",
          timestamp: 200,
          playerId: "p2",
          card: { id: "c2", type: "barrier" },
        },
      ];

      const sorted = sortAttackActions(actions);

      expect(sorted.length).toBe(1);
      expect(sorted[0].card?.type).toBe("witch_killer");
    });
  });

  describe("isWitchKillerUsed", () => {
    it("应该检测到 witch_killer 已使用", () => {
      const actions: NightAction[] = [
        {
          id: "na1",
          timestamp: 100,
          playerId: "p1",
          card: { id: "c1", type: "witch_killer" },
        },
      ];
      expect(isWitchKillerUsed(actions)).toBe(true);
    });

    it("应该返回 false（无 witch_killer）", () => {
      const actions: NightAction[] = [
        {
          id: "na1",
          timestamp: 100,
          playerId: "p1",
          card: { id: "c1", type: "kill" },
        },
      ];
      expect(isWitchKillerUsed(actions)).toBe(false);
    });

    it("应该处理空数组", () => {
      expect(isWitchKillerUsed([])).toBe(false);
    });
  });
});
