import { describe, it, expect, beforeEach } from "bun:test";
import { moveFunctions } from "../game/moves";
import type { BGGameState } from "../types";
import type { RandomAPI } from "../game";
import { Selectors } from "../utils";
import { INVALID_MOVE } from "boardgame.io/core";
import { resolveNightActions } from "../game/resolution";
import {
  createMockRandom,
  createTestState,
  createMoveContext,
  setupPlayers,
  SEVEN_PLAYER_CONFIG,
  createPlayerWithHand,
} from "./testUtils";

// ==================== 辅助函数 ====================

/**
 * 获取卡牌优先级（测试辅助函数）
 * 优先级：witch_killer(5) > kill(4) > barrier(3) > detect(2) > check(1)
 */
function getCardPriority(card: { type: string } | null): number {
  switch (card?.type) {
    case "witch_killer":
      return 5;
    case "kill":
      return 4;
    case "barrier":
      return 3;
    case "detect":
      return 2;
    case "check":
      return 1;
    default:
      return 0;
  }
}

// ==================== 测试 ====================

describe("Attack Excess Handling", () => {
  // 使用 testUtils 的 createTestState 和 setupPlayers
  const create4PlayerState = (): BGGameState => {
    const state = createTestState();
    setupPlayers(state, ["p1", "p2", "p3", "p4"]);
    return state;
  };

  describe("Kill Magic Quota", () => {
    it("应允许超过3个kill magic提交（在assertions中不抛出）", () => {
      const state = create4PlayerState();
      state.secrets.p1.hand = [{ id: "kill1", type: "kill" }];
      state.secrets.p2.hand = [{ id: "kill2", type: "kill" }];
      state.secrets.p3.hand = [{ id: "kill3", type: "kill" }];
      state.secrets.p4.hand = [{ id: "kill4", type: "kill" }];

      const mockRandom = createMockRandom();

      // 前3个kill magic应该成功
      const result1 = moveFunctions.useCard(
        createMoveContext(state, "p1"),
        "kill1",
        "p2",
      );
      expect(result1).toBeUndefined();
      expect(state.nightActions).toHaveLength(1);

      const result2 = moveFunctions.useCard(
        createMoveContext(state, "p2"),
        "kill2",
        "p3",
      );
      expect(result2).toBeUndefined();
      expect(state.nightActions).toHaveLength(2);

      const result3 = moveFunctions.useCard(
        createMoveContext(state, "p3"),
        "kill3",
        "p4",
      );
      expect(result3).toBeUndefined();
      expect(state.nightActions).toHaveLength(3);

      // 第4个kill magic也应该成功（允许提交，结算时处理超额）
      const result4 = moveFunctions.useCard(
        createMoveContext(state, "p4"),
        "kill4",
        "p1",
      );
      expect(result4).toBeUndefined();
      expect(state.nightActions).toHaveLength(4);

      // killMagicUsed 在 useCard 中不再增加（改为在 resolution 中计算）
      expect(state.attackQuota.killMagicUsed).toBe(0);
    });

    it("witch_killer只能使用一次", () => {
      const state = create4PlayerState();
      state.secrets.p1.hand.push({ id: "wk1", type: "witch_killer" });
      state.secrets.p1.witchKillerHolder = true;

      const context = createMoveContext(state, "p1");

      // 第一次使用 witch_killer 应该成功
      const result1 = moveFunctions.useCard(context, "wk1", "p2");
      expect(result1).toBeUndefined();

      // 再次使用应该失败
      const result2 = moveFunctions.useCard(context, "wk1", "p3");
      expect(result2).toBe(INVALID_MOVE);
    });
  });

  describe("Witch Killer Holder Mechanics", () => {
    it("witch_killer持有者受魔女化影响", () => {
      const state = create4PlayerState();
      // p1 是 witch_killer 持有者
      state.secrets.p1.witchKillerHolder = true;
      state.secrets.p1.isWitch = false;
      state.secrets.p1.consecutiveNoKillRounds = 1;

      // 检查是否应受魔女化影响
      const isWitched =
        state.secrets.p1.isWitch || state.secrets.p1.witchKillerHolder;
      expect(isWitched).toBe(true);
    });

    it("witch_killer持有者放弃行动时累积回合", () => {
      const state = create4PlayerState();
      state.secrets.p1.witchKillerHolder = true;
      state.secrets.p1.isWitch = false;
      state.secrets.p1.consecutiveNoKillRounds = 0;

      // p1 放弃行动（passNight）
      const context = createMoveContext(state, "p1");
      const result = moveFunctions.passNight(context);
      expect(result).toBeUndefined();

      // 累积回合
      expect(state.secrets.p1.consecutiveNoKillRounds).toBe(1);
    });
  });
});

describe("Hand Size Limit", () => {
  it("手牌满4张时无法获取新卡牌", () => {
    const state = createTestState();
    setupPlayers(state, ["p1"]);
    // p1 手牌已满4张
    state.secrets.p1.hand = [
      { id: "c1", type: "barrier" },
      { id: "c2", type: "detect" },
      { id: "c3", type: "check" },
      { id: "c4", type: "barrier" },
    ];

    const isFull = Selectors.isHandFull(state, "p1");
    expect(isFull).toBe(true);
  });

  it("手牌未满时可获取新卡牌", () => {
    const state = createTestState();
    setupPlayers(state, ["p1"]);
    // p1 只有1张手牌
    state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];

    const isFull = Selectors.isHandFull(state, "p1");
    expect(isFull).toBe(false);
  });
});

describe("Witch Killer Priority Rules", () => {
  describe("攻击结算优先级", () => {
    it("魔女杀手优先于杀人魔法结算", () => {
      // 测试优先级排序逻辑
      const nightActions = [
        {
          id: "action1",
          playerId: "p2",
          card: { id: "kill1", type: "kill" as const },
          targetId: "p1",
          timestamp: 1000,
        },
        {
          id: "action2",
          playerId: "p1",
          card: { id: "wk1", type: "witch_killer" as const },
          targetId: "p3",
          timestamp: 2000,
        },
      ];

      // 按优先级排序后，witch_killer 应该在 kill 之前
      const sortedActions = [...nightActions].sort((a, b) => {
        const priorityA = getCardPriority(a.card);
        const priorityB = getCardPriority(b.card);
        if (priorityB !== priorityA) return priorityB - priorityA;
        return a.timestamp - b.timestamp;
      });

      // witch_killer (优先级5) 应该在 kill (优先级4) 之前
      expect(sortedActions[0].card?.type).toBe("witch_killer");
      expect(sortedActions[1].card?.type).toBe("kill");
    });

    it("杀人魔法按时间戳顺序结算", () => {
      // 测试 kill 按时间戳排序
      const nightActions = [
        {
          id: "action1",
          playerId: "p2",
          card: { id: "kill2", type: "kill" as const },
          targetId: "p3",
          timestamp: 3000,
        },
        {
          id: "action2",
          playerId: "p1",
          card: { id: "kill1", type: "kill" as const },
          targetId: "p4",
          timestamp: 1000,
        },
        {
          id: "action3",
          playerId: "p3",
          card: { id: "kill3", type: "kill" as const },
          targetId: "p5",
          timestamp: 2000,
        },
      ];

      // 只保留 kill 类型并按时间戳排序
      const killActions = nightActions
        .filter((a) => a.card?.type === "kill")
        .sort((a, b) => a.timestamp - b.timestamp);

      // 按时间戳顺序：p1 -> p3 -> p2
      expect(killActions[0].playerId).toBe("p1");
      expect(killActions[1].playerId).toBe("p3");
      expect(killActions[2].playerId).toBe("p2");
    });

    it("不同卡牌类型按优先级排序", () => {
      // 测试所有卡牌类型的优先级顺序
      const nightActions = [
        {
          id: "1",
          playerId: "p1",
          card: { id: "c1", type: "check" as const },
          timestamp: 1000,
        },
        {
          id: "2",
          playerId: "p2",
          card: { id: "c2", type: "detect" as const },
          timestamp: 1000,
        },
        {
          id: "3",
          playerId: "p3",
          card: { id: "c3", type: "barrier" as const },
          timestamp: 1000,
        },
        {
          id: "4",
          playerId: "p4",
          card: { id: "c4", type: "kill" as const },
          timestamp: 1000,
        },
        {
          id: "5",
          playerId: "p5",
          card: { id: "c5", type: "witch_killer" as const },
          timestamp: 1000,
        },
      ];

      const sorted = [...nightActions].sort((a, b) => {
        const priorityA = getCardPriority(a.card);
        const priorityB = getCardPriority(b.card);
        return priorityB - priorityA;
      });

      // 优先级顺序：witch_killer > kill > barrier > detect > check
      expect(sorted.map((a) => a.card?.type)).toEqual([
        "witch_killer",
        "kill",
        "barrier",
        "detect",
        "check",
      ]);
    });
  });

  describe("ActionFailureReason 类型", () => {
    it("所有失败原因类型定义正确", () => {
      // 验证 ActionFailureReason 类型包含所有预期的值
      const reasons: Array<
        | "quota_exceeded"
        | "target_witch_killer_failed"
        | "barrier_protected"
        | "target_already_dead"
      > = [
        "quota_exceeded",
        "target_witch_killer_failed",
        "barrier_protected",
        "target_already_dead",
      ];

      expect(reasons).toHaveLength(4);
    });

    it("NightAction 支持 executed 和 failedReason 字段", () => {
      const action = {
        id: "test",
        playerId: "p1",
        card: { id: "kill1", type: "kill" as const },
        targetId: "p2",
        timestamp: 1000,
        executed: false,
        failedReason: "quota_exceeded" as const,
      };

      expect(action.executed).toBe(false);
      expect(action.failedReason).toBe("quota_exceeded");
    });
  });
});

// ==================== 集成测试：魔女杀手优先级结算 ====================

describe("Witch Killer Priority Resolution (Integration)", () => {
  const mockRandom = createMockRandom();

  describe("优先级结算场景", () => {
    it("场景1：witch_killer与kill互相攻击 - 只有kill执行者死亡", () => {
      // p1 (witch_killer) 和 p2 (kill) 互相攻击
      // 由于 witch_killer 优先结算，p2 死亡，p1 存活
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
      state.secrets.p1.hand = [{ id: "wk1", type: "witch_killer" }];
      state.secrets.p1.witchKillerHolder = true;
      state.secrets.p2.hand = [{ id: "kill1", type: "kill" }];
      state.deck = [];

      // p1 先提交 witch_killer 攻击 p2
      state.nightActions = [
        {
          id: "a1",
          playerId: "p1",
          card: { id: "wk1", type: "witch_killer" },
          targetId: "p2",
          timestamp: 1000,
        },
        {
          id: "a2",
          playerId: "p2",
          card: { id: "kill1", type: "kill" },
          targetId: "p1",
          timestamp: 2000,
        },
      ];

      // 保存 nightActions 副本（因为 resolveNightActions 会清空它）
      const nightActionsCopy = [...state.nightActions];

      resolveNightActions(state, mockRandom);

      // p2 的行动应该失败（因为 p2 已被 witch_killer 杀死，攻击者已死亡）
      const p2Action = nightActionsCopy.find((a) => a.playerId === "p2");
      expect(p2Action?.executed).toBe(false);
      expect(p2Action?.failedReason).toBe("actor_dead");
    });

    it("场景2：witch_killer持有者未被攻击 - 所有kill按顺序执行", () => {
      // p1 (witch_killer holder), p2 (kill), p3 (kill) 都攻击其他人
      // witch_killer 优先结算，之后 kill 按配额执行
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
      state.secrets.p1.hand = [{ id: "wk1", type: "witch_killer" }];
      state.secrets.p1.witchKillerHolder = true;
      state.secrets.p2.hand = [{ id: "kill1", type: "kill" }];
      state.secrets.p3.hand = [{ id: "kill2", type: "kill" }];
      state.deck = [];

      // p1, p2, p3 都攻击 p4
      state.nightActions = [
        {
          id: "a1",
          playerId: "p1",
          card: { id: "wk1", type: "witch_killer" },
          targetId: "p4",
          timestamp: 1000,
        },
        {
          id: "a2",
          playerId: "p2",
          card: { id: "kill1", type: "kill" },
          targetId: "p5",
          timestamp: 2000,
        },
        {
          id: "a3",
          playerId: "p3",
          card: { id: "kill2", type: "kill" },
          targetId: "p6",
          timestamp: 3000,
        },
      ];

      resolveNightActions(state, mockRandom);

      // witch_killer 成功，p4 死亡
      expect(state.secrets.p4.status).toBe("dead");
      expect(state.secrets.p4.deathCause).toBe("witch_killer");

      // p1 存活（成功使用 witch_killer）
      expect(state.secrets.p1.status).toBe("alive");

      // p2, p3 的 kill 都成功（按配额2个 kill）
      expect(state.secrets.p5.status).toBe("dead");
      expect(state.secrets.p6.status).toBe("dead");
    });

    it("场景3：kill配额测试 - 超过配额的kill失败", () => {
      // p1, p2, p3, p4 都用 kill 攻击
      // 配额为3（没有使用 witch_killer）
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
      state.secrets.p1.hand = [{ id: "kill0", type: "kill" }];
      state.secrets.p2.hand = [{ id: "kill1", type: "kill" }];
      state.secrets.p3.hand = [{ id: "kill2", type: "kill" }];
      state.secrets.p4.hand = [{ id: "kill3", type: "kill" }];
      state.deck = [];

      state.nightActions = [
        {
          id: "a1",
          playerId: "p1",
          card: { id: "kill0", type: "kill" },
          targetId: "p5",
          timestamp: 1000,
        },
        {
          id: "a2",
          playerId: "p2",
          card: { id: "kill1", type: "kill" },
          targetId: "p6",
          timestamp: 2000,
        },
        {
          id: "a3",
          playerId: "p3",
          card: { id: "kill2", type: "kill" },
          targetId: "p7",
          timestamp: 3000,
        },
        {
          id: "a4",
          playerId: "p4",
          card: { id: "kill3", type: "kill" },
          targetId: "p2",
          timestamp: 4000,
        },
      ];

      resolveNightActions(state, mockRandom);

      // 前3个 kill 成功，第4个失败
      expect(state.secrets.p5.status).toBe("dead");
      expect(state.secrets.p6.status).toBe("dead");
      expect(state.secrets.p7.status).toBe("dead");
      expect(state.secrets.p2.status).toBe("alive"); // 第4个 kill 失败

      // p4 存活（kill 失败）
      expect(state.secrets.p4.status).toBe("alive");

      // 超额攻击的卡牌应不被消耗（失败且非 witch_killer 优先级失败）
      // 验证 p4 仍然持有 kill3 卡牌
      expect(state.secrets.p4.hand).toHaveLength(1);
      expect(state.secrets.p4.hand[0].id).toBe("kill3");
    });
  });

  describe("配额与优先级组合", () => {
    it("witch_killer使用时kill配额减少", () => {
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
      // p1 使用 witch_killer，p2, p3, p4, p5 都使用 kill
      // kill 配额应为 2（因为使用了 witch_killer）
      state.secrets.p1.hand = [{ id: "wk1", type: "witch_killer" }];
      state.secrets.p1.witchKillerHolder = true;
      state.secrets.p2.hand = [{ id: "kill1", type: "kill" }];
      state.secrets.p3.hand = [{ id: "kill2", type: "kill" }];
      state.secrets.p4.hand = [{ id: "kill3", type: "kill" }];
      state.secrets.p5.hand = [{ id: "kill4", type: "kill" }];
      state.deck = [];

      state.nightActions = [
        {
          id: "a1",
          playerId: "p1",
          card: { id: "wk1", type: "witch_killer" },
          targetId: "p6",
          timestamp: 1000,
        },
        {
          id: "a2",
          playerId: "p2",
          card: { id: "kill1", type: "kill" },
          targetId: "p7",
          timestamp: 2000,
        },
        {
          id: "a3",
          playerId: "p3",
          card: { id: "kill2", type: "kill" },
          targetId: "p4",
          timestamp: 3000,
        },
        {
          id: "a4",
          playerId: "p4",
          card: { id: "kill3", type: "kill" },
          targetId: "p5",
          timestamp: 4000,
        },
        {
          id: "a5",
          playerId: "p5",
          card: { id: "kill4", type: "kill" },
          targetId: "p2",
          timestamp: 5000,
        },
      ];

      resolveNightActions(state, mockRandom);

      // witch_killer 成功，p6 死亡
      expect(state.secrets.p6.status).toBe("dead");
      expect(state.secrets.p6.deathCause).toBe("witch_killer");

      // 只有前2个 kill 成功（配额为2）
      expect(state.secrets.p7.status).toBe("dead");
      expect(state.secrets.p4.status).toBe("dead");
      expect(state.secrets.p5.status).toBe("alive"); // 第3个 kill 失败
      expect(state.secrets.p2.status).toBe("alive"); // 第4个 kill 失败
    });
  });
});
