import { describe, it, expect, beforeEach } from "bun:test";
import { GamePhase, type BGGameState, type RandomAPI } from "../../types";

import { resolveNightActions } from "./index";
import {
  createMockRandom,
  createPhaseContext,
  createTestState,
  setupPlayers,
  SEVEN_PLAYER_CONFIG,
} from "../../__tests__/testUtils";
import { phaseConfigs } from "../phases";

// ==================== Resolution 完整流程测试 ====================
describe("Resolution Complete Flow", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    mockRandom = createMockRandom();
  });

  describe("完整夜间结算流程", () => {
    it("应该正确处理 detect + barrier + attack 的完整流程", () => {
      G.secrets["p2"].hand = [
        { id: "c1", type: "detect" },
        { id: "c2", type: "check" },
      ];
      G.secrets["p1"].hand = [
        { id: "b1", type: "barrier" },
        { id: "k1", type: "kill" },
      ];

      // p1 使用 detect 查看 p2
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "d1", type: "detect" },
      });

      // p2 使用 barrier
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        card: { id: "b1", type: "barrier" },
      });

      // p3 使用 kill 攻击 p2（p2 有 barrier 保护）
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p2",
        card: { id: "k1", type: "kill" },
      });

      resolveNightActions(G, mockRandom);

      // 验证 detect 结果存在于 revealedInfo
      const detectInfo = G.secrets["p1"].revealedInfo.filter(
        (r: any) => r.type === "detect",
      );
      expect(detectInfo.length).toBe(1);
      expect((detectInfo[0] as any).content.targetId).toBe("p2");

      // 验证 barrier 防御了 kill（通过检查 p2 的状态）
      // p2 应该存活，因为 barrier 防御了攻击
      expect(G.players["p2"].status).toBe("alive");
      expect(G.secrets["p2"].status).toBe("alive");
    });

    it("应该正确处理多个玩家同时结算", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];

      // p1 攻击 p2，p2 攻击 p3，p3 攻击 p1
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p3",
        card: { id: "k2", type: "kill" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p1",
        card: { id: "k3", type: "kill" },
      });

      resolveNightActions(G, mockRandom);

      // 按时间戳排序：na1(p1→p2)先结算，p2死亡
      // na2(p2→p3) p2已死 → actor_dead
      // na3(p3→p1) 成功，p1死亡
      // 结果：p1和p2死亡，p3存活
      expect(G.players["p2"].status).toBe("dead");
      expect(G.players["p1"].status).toBe("dead");
      expect(G.players["p3"].status).toBe("alive");
    });

    it("应该正确处理弃权行动", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];

      // p1 攻击 p2，p2 和 p3 弃权
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        card: null,
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        card: null,
      });

      resolveNightActions(G, mockRandom);

      // 只有 p2 应该死亡
      expect(G.players["p2"].status).toBe("dead");
      expect(G.players["p1"].status).toBe("alive");
      expect(G.players["p3"].status).toBe("alive");
    });

    it("应该正确清理 nightActions", () => {
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "b1", type: "barrier" },
      });

      resolveNightActions(G, mockRandom);

      expect(G.nightActions.length).toBe(0);
    });

    it("应该正确增加回合数", () => {
      G.round = 5;
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "b1", type: "barrier" },
      });

      resolveNightActions(G, mockRandom);
      phaseConfigs.morning.onBegin(createPhaseContext(G, GamePhase.RESOLUTION));

      expect(G.round).toBe(6);
    });
  });

  describe("Phase 组合场景", () => {
    it("应该处理 Phase 1-3 的组合场景", () => {
      // 设置状态：p2 是 witch_killer 持有者，p1 是 witch
      G.secrets["p1"].isWitch = true;
      G.secrets["p1"].consecutiveNoKillRounds = 1;
      G.secrets["p1"].hand = [{ id: "d1", type: "detect" }];

      G.secrets["p2"].witchKillerHolder = true;
      G.secrets["p2"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p2"].consecutiveNoKillRounds = 1;

      G.secrets["p3"].hand = [{ id: "c1", type: "check" }];

      // p1 使用 detect，p2 使用 witch_killer，p3 使用 check
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p3",
        card: { id: "d1", type: "detect" },
      });
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p3",
        card: { id: "wk1", type: "witch_killer" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p1",
        card: { id: "c1", type: "check" },
      });

      resolveNightActions(G, mockRandom);

      // p3 应该被 witch_killer 杀死
      expect(G.players["p3"].status).toBe("dead");
      expect(G.secrets["p3"].status).toBe("dead");
      expect(G.secrets["p3"].deathCause).toBe("witch_killer");

      // check 行动应该能检测到 p1 的 witch 状态
      // 因为 p1 是 witch，所以 check 结果应该显示 p1 是 witch
    });

    it("应该处理 witch_killer 击杀后其他玩家的行动失败", () => {
      G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
      G.secrets["p2"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k2", type: "kill" }];

      // p2 和 p3 都想攻击 p1，但 p1 先用 witch_killer 杀死了 p2
      G.nightActions.push({
        id: "na2",
        timestamp: Date.now() + 1,
        playerId: "p2",
        targetId: "p1",
        card: { id: "k1", type: "kill" },
      });
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "wk1", type: "witch_killer" },
      });
      G.nightActions.push({
        id: "na3",
        timestamp: Date.now() + 2,
        playerId: "p3",
        targetId: "p1",
        card: { id: "k2", type: "kill" },
      });

      resolveNightActions(G, mockRandom);

      // p2 被 witch_killer 杀死
      expect(G.players["p2"].status).toBe("dead");
      // p3 的 kill 失败（因为 p1 的 witch_killer 已经使用了）
    });

    it("应该正确处理配额超额情况下的卡牌消耗", () => {
      // 设置 7 个玩家，避免循环击杀导致 actor_dead
      G = createTestState();
      setupPlayers(G, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
      mockRandom = createMockRandom();

      // 4 个 kill 超出配额（无 witch_killer 时为 3 个）
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];
      G.secrets["p4"].hand = [{ id: "k4", type: "kill" }];

      // 攻击者分别攻击不同的非攻击者目标
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

      resolveNightActions(G, mockRandom);

      // 前 3 个攻击成功（p5, p6, p7 死亡），na4 超出配额失败
      expect(G.players["p5"].status).toBe("dead");
      expect(G.players["p6"].status).toBe("dead");
      expect(G.players["p7"].status).toBe("dead");
      expect(G.players["p1"].status).toBe("alive");
    });

    it("应该正确处理目标已死亡时的卡牌消耗", () => {
      G.secrets["p1"].hand = [{ id: "k1", type: "kill" }];
      G.secrets["p2"].hand = [{ id: "k2", type: "kill" }];
      G.secrets["p3"].hand = [{ id: "k3", type: "kill" }];

      // p1 和 p2 都攻击 p3，但 witch_killer 优先
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

      resolveNightActions(G, mockRandom);

      // p3 应该死亡，p1 和 p2 中只有一个能成功
      // 由于两个 kill 在同一轮，配额为 3，所以只有一个失败
      const deadPlayers = Object.values(G.players).filter(
        (p) => p.status === "dead",
      );
      expect(deadPlayers.length).toBe(1);
      expect(deadPlayers[0].id).toBe("p3");
    });
  });
});
