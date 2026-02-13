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
import { processDetectAndBarrier } from "./phase1-detect-barrier";
import type { PhaseResult } from "./types";

// ==================== Phase 1 Tests ====================
describe("Phase 1: Detect & Barrier", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;
  let result: PhaseResult;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    mockRandom = createMockRandom();
    result = {
      stateUpdates: {},
      deadPlayers: new Set(),
      barrierPlayers: new Set(),
    };
  });

  describe("processDetectAndBarrier", () => {
    it("应该处理 detect 行动并返回 barrierPlayers 为空", () => {
      G.secrets["p2"].hand = [
        { id: "c1", type: "detect" },
        { id: "c2", type: "barrier" },
      ];
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "detect1", type: "detect" },
      });

      const newResult = processDetectAndBarrier(G, mockRandom, result);

      expect(newResult.barrierPlayers?.size).toBe(0);
      // 验证 secret.revealedInfo 中有检测结果（在 content 内部）
      const revealedInfo = G.secrets["p1"].revealedInfo.filter(
        (r: any) => r.type === "detect",
      );
      expect(revealedInfo.length).toBe(1);
      expect((revealedInfo[0] as any).content.targetId).toBe("p2");
      expect((revealedInfo[0] as any).content.handCount).toBe(2);
    });

    it("应该将 witch_killer 显示为 kill", () => {
      // 把 witch_killer 放在第二个位置，这样 Die(2) 会选中它
      G.secrets["p2"].hand = [
        { id: "c2", type: "detect" },
        { id: "wk1", type: "witch_killer" },
      ];
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "detect1", type: "detect" },
      });

      processDetectAndBarrier(G, mockRandom, result);

      // seenCard 在 content 内部
      const revealedInfo = G.secrets["p1"].revealedInfo.find(
        (r: any) => r.type === "detect",
      ) as any;
      expect(revealedInfo.content.seenCard).toBe("kill");
      expect(revealedInfo.content.targetId).toBe("p2");
      expect(revealedInfo.content.handCount).toBe(2);
    });

    it("应该处理空手牌目标", () => {
      G.secrets["p2"].hand = [];
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "detect1", type: "detect" },
      });

      processDetectAndBarrier(G, mockRandom, result);

      const revealedInfo = G.secrets["p1"].revealedInfo.find(
        (r: any) => r.type === "detect",
      ) as any;
      expect(revealedInfo.content.handCount).toBe(0);
      expect(revealedInfo.content.seenCard).toBeUndefined();
    });

    it("应该记录 barrier 玩家", () => {
      G.secrets["p1"].hand = [{ id: "b1", type: "barrier" }];
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "b1", type: "barrier" },
      });

      const newResult = processDetectAndBarrier(G, mockRandom, result);

      expect(newResult.barrierPlayers?.has("p1")).toBe(true);
    });

    it("应该跳过弃权", () => {
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: null,
      });

      const newResult = processDetectAndBarrier(G, mockRandom, result);

      expect(newResult.barrierPlayers?.size).toBe(0);
      expect(G.chatMessages.length).toBe(0);
    });

    it("应该传递 previousResult 的 barrierPlayers", () => {
      const prevResult: PhaseResult = {
        stateUpdates: {},
        deadPlayers: new Set(),
        barrierPlayers: new Set(["p2"]),
      };
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "b1", type: "barrier" },
      });

      const newResult = processDetectAndBarrier(G, mockRandom, prevResult);

      expect(newResult.barrierPlayers?.has("p1")).toBe(true);
      expect(newResult.barrierPlayers?.has("p2")).toBe(true);
    });
  });
});
