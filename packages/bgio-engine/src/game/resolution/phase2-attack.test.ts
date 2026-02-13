import { beforeEach, describe, expect, it } from "bun:test";
import {
  createMockRandom,
  createNightAction,
  createTestState,
  SEVEN_PLAYER_CONFIG,
  setupPlayers,
} from "../../__tests__/testUtils";
import type {
  BGGameState,
  GameConfig,
  PlayerStatus,
  PublicPlayerStatus,
  RandomAPI,
} from "../../types";
import { processAttackActions } from "./phase2-attack";
import type { PhaseResult } from "./types";

// ==================== Phase 2 Attack Tests ====================
describe("Phase 2: Attack", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;
  let result: PhaseResult;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
    mockRandom = createMockRandom();
    result = {
      stateUpdates: {},
      deadPlayers: new Set(),
      barrierPlayers: new Set(),
    };
  });

  describe("processAttackActions", () => {
    it("应该处理多个 kill 攻击（超出配额）", () => {
      // 4 个攻击者分别攻击不同目标，避免循环击杀
      // 无 witch_killer 时配额为 3，第 4 个应该超出配额
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];
      G.secrets["p4"].hand = [{ id: "k4", type: "kill" }];

      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p5",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p6",
        card: { id: "k2", type: "kill" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p7",
        card: { id: "k3", type: "kill" },
      });
      G.nightActions.push({
        id: "na4",
        timestamp: Date.now() + 3,
        playerId: "p4",
        targetId: "p1",
        card: { id: "k4", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // 前 3 个攻击成功，第 4 个超出配额
      expect(deadPlayers.size).toBe(3);
      expect(deadPlayers.has("p5")).toBe(true);
      expect(deadPlayers.has("p6")).toBe(true);
      expect(deadPlayers.has("p7")).toBe(true);
      // na4 超出配额应该失败
      const quotaFail = newResult.attackResult?.failedActions.find(
        (f: any) => f.actionId === "na4",
      );
      expect(quotaFail?.reason).toBe("quota_exceeded");
    });

    it("应该处理目标已死亡的情况", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];

      // p1 和 p2 都攻击 p3，p3 首先死亡
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p3",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p3",
        card: { id: "k2", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // 只有 p3 死亡
      expect(deadPlayers.size).toBe(1);
      expect(deadPlayers.has("p3")).toBe(true);
      // p2 的攻击应该失败（目标已死亡）
      const failAction = newResult.attackResult?.failedActions.find(
        (f: any) => f.reason === "target_already_dead",
      );
      expect(failAction).toBeDefined();
    });

    it("应该处理 witch_killer 击杀后针对持有者的攻击落空", () => {
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k2", type: "kill" }];

      // p1 用 witch_killer 攻击 p2，p2 用 kill 攻击 p1，p3 用 kill 攻击 p1
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "wk1", type: "witch_killer" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p1",
        card: { id: "k2", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p2 被 witch_killer 杀死
      expect(deadPlayers.has("p2")).toBe(true);
      // p1（持有者）受保护，不会死亡
      expect(deadPlayers.has("p1")).toBe(false);
      // p2 的 kill 失败：p2 已死亡（actor_dead），不消耗
      const p2Failed = newResult.attackResult?.failedActions.find(
        (f: any) => f.actionId === "na2",
      );
      expect(p2Failed?.reason).toBe("actor_dead");
      // p3 的 kill 失败：持有者受保护（target_witch_killer_failed），消耗卡牌
      const p3Failed = newResult.attackResult?.failedActions.find(
        (f: any) => f.actionId === "na3",
      );
      expect(p3Failed?.reason).toBe("target_witch_killer_failed");
    });

    it("应该正确处理 witch_killer 优先级", () => {
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];

      // p2 的 kill 先提交，但 witch_killer 优先级更高
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "wk1", type: "witch_killer" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p2 被 witch_killer 杀死
      expect(deadPlayers.has("p2")).toBe(true);
      // witch_killer 持有者 p1 不会被 kill 杀死
      expect(deadPlayers.has("p1")).toBe(false);
    });

    it("应该跳过弃权", () => {
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: null,
      });

      const newResult = processAttackActions(G, mockRandom, result);

      expect(newResult.deadPlayers?.size ?? 0).toBe(0);
    });

    it("应该跳过无目标攻击", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "k1", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);

      expect(newResult.deadPlayers?.size ?? 0).toBe(0);
    });

    it("应该处理 barrier 防御", () => {
      G.secrets["p1"].hand = [{ id: "b1", type: "barrier" }];
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];

      // p1 使用 barrier，p2 攻击 p1
      result.barrierPlayers = new Set(["p1"]);
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "b1", type: "barrier" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p1 应该存活（barrier 防御成功）
      expect(deadPlayers.has("p1")).toBe(false);
    });

    it("应该传递 barrierPlayers 从上一阶段", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      result.barrierPlayers = new Set(["p2"]);
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "k1", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);

      // barrierPlayers 应该被传递
      expect(newResult.barrierPlayers?.has("p2")).toBe(true);
    });

    it("规则4.5：witch_killer攻击他人成功时，针对持有者的攻击落空且消耗卡牌", () => {
      // p1(witch_killer)攻击p5，p2和p3都用kill攻击p1
      // witch_killer成功 → p1受保护 → p2和p3的攻击落空
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p1"].witchKillerHolder = true;
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k2", type: "kill" }];

      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p5",
        card: { id: "wk1", type: "witch_killer" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p1",
        card: { id: "k2", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p5 被 witch_killer 杀死
      expect(deadPlayers.has("p5")).toBe(true);
      // p1（持有者）受保护，存活
      expect(deadPlayers.has("p1")).toBe(false);
      // p2 和 p3 的攻击落空（target_witch_killer_failed）
      const p2Failed = newResult.attackResult?.failedActions.find(
        (f: any) => f.actionId === "na2",
      );
      expect(p2Failed?.reason).toBe("target_witch_killer_failed");
      const p3Failed = newResult.attackResult?.failedActions.find(
        (f: any) => f.actionId === "na3",
      );
      expect(p3Failed?.reason).toBe("target_witch_killer_failed");
    });

    it("规则4.5：witch_killer被防御时，攻击持有者的kill应成功且获得witch_killer", () => {
      // p1(witch_killer)攻击p5（有barrier），p2用kill攻击p1
      // witch_killer被防御 → p1不受保护 → p2成功击杀p1 → p2获得witch_killer
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p1"].witchKillerHolder = true;
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p5"].hasBarrier = true;
      result.barrierPlayers = new Set(["p5"]);

      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p5",
        card: { id: "wk1", type: "witch_killer" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p5 存活（barrier防御成功）
      expect(deadPlayers.has("p5")).toBe(false);
      // witch_killer被防御 → p1不受保护
      // p1 被 p2 击杀
      expect(deadPlayers.has("p1")).toBe(true);
      // p2 成功执行
      expect(newResult.attackResult?.executedActions.has("na2")).toBe(true);
      // p2 应该获得 witch_killer（通过 killPlayer 内部转移）
      expect(G.secrets["p2"].witchKillerHolder).toBe(true);
    });

    it("规则6.2情境四：kill击杀witch_killer持有者时获得witch_killer", () => {
      // p1 持有 witch_killer 但不攻击（弃权），p2 用 kill 攻击 p1
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p1"].witchKillerHolder = true;
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];

      // p1 弃权
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: null,
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });

      const newResult = processAttackActions(G, mockRandom, result);
      const deadPlayers = newResult.deadPlayers ?? new Set();

      // p1 被击杀
      expect(deadPlayers.has("p1")).toBe(true);
      // p2 成功击杀
      expect(newResult.attackResult?.executedActions.has("na2")).toBe(true);
      // p2 获得 witch_killer（killPlayer 内部处理转移）
      expect(G.secrets["p2"].witchKillerHolder).toBe(true);
      // p2 变成魔女（kill成功触发魔女化）
      expect(G.secrets["p2"].isWitch).toBe(true);
    });
  });
});
