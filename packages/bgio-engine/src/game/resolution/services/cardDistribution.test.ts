import { describe, it, expect, beforeEach } from "bun:test";
import type { BGGameState, CardRef } from "../../../types";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import {
  distributeWreckCards,
  distributeSkipKiller,
  applyDistributions,
  recordCardReceivers,
  notifyExcessIfNeeded,
  applyPendingDistributions,
} from "./cardDistribution";
import {
  createMockRandom,
  createTestState,
  setupPlayers,
  SEVEN_PLAYER_CONFIG,
} from "../../../__tests__/testUtils";

// ==================== Card Distribution Service Tests ====================
describe("Card Distribution Service", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    mockRandom = createMockRandom();
  });

  describe("distributeWreckCards", () => {
    it("应该处理空卡牌数组", () => {
      distributeWreckCards(G, mockRandom, []);
      expect(G.chatMessages.length).toBe(0);
    });

    it("应该分配卡牌给存活玩家", () => {
      G.secrets["p2"].hand = [{ id: "c1", type: "detect" }];
      G.secrets["p3"].hand = [{ id: "c2", type: "check" }];
      const cards: CardRef[] = [
        { id: "drop1", type: "barrier" },
        { id: "drop2", type: "kill" },
      ];

      distributeWreckCards(G, mockRandom, cards);

      const totalHandSize =
        G.secrets["p2"].hand.length + G.secrets["p3"].hand.length;
      expect(totalHandSize).toBeGreaterThan(2);
    });

    it("应该发送手牌已满通知", () => {
      G.secrets["p1"].hand = [
        { id: "c1", type: "detect" },
        { id: "c2", type: "check" },
        { id: "c3", type: "barrier" },
        { id: "c4", type: "kill" },
      ];
      G.secrets["p2"].hand = [
        { id: "c5", type: "detect" },
        { id: "c6", type: "check" },
        { id: "c7", type: "barrier" },
        { id: "c8", type: "kill" },
      ];
      G.secrets["p3"].hand = [
        { id: "c9", type: "detect" },
        { id: "c10", type: "check" },
        { id: "c11", type: "barrier" },
        { id: "c12", type: "kill" },
      ];

      distributeWreckCards(G, mockRandom, [{ id: "drop1", type: "barrier" }]);

      const systemMessage = G.chatMessages.find(
        (m: any) => m.kind === "announcement",
      ) as any;
      expect(systemMessage?.content).toContain("手牌已满");
    });
  });

  describe("distributeSkipKiller", () => {
    it("应该处理空卡牌数组", () => {
      distributeSkipKiller(G, mockRandom, "p1", [], "p2");
      expect(G.chatMessages.length).toBe(0);
    });

    it("应该跳过击杀者分配卡牌", () => {
      G.secrets["p2"].hand = [{ id: "c1", type: "detect" }];
      G.secrets["p3"].hand = [{ id: "c2", type: "check" }];
      const cards: CardRef[] = [{ id: "drop1", type: "barrier" }];

      distributeSkipKiller(G, mockRandom, "p1", cards, "p2");

      expect(G.secrets["p3"].hand.length).toBeGreaterThan(1);
      expect(G.secrets["p2"].hand.length).toBe(1);
    });
  });

  describe("applyDistributions", () => {
    it("应该将卡牌添加到玩家手牌", () => {
      const receivers = new Map<string, CardRef[]>();
      receivers.set("p1", [
        { id: "c1", type: "detect" },
        { id: "c2", type: "check" },
      ]);

      applyDistributions(G, receivers);

      expect(G.secrets["p1"].hand.length).toBe(2);
      expect(G.secrets["p1"].hand[0].type).toBe("detect");
    });

    it("应该处理空 receivers", () => {
      const receivers = new Map<string, CardRef[]>();
      expect(() => applyDistributions(G, receivers)).not.toThrow();
    });
  });

  describe("recordCardReceivers", () => {
    it("应该记录卡牌接收者到死亡日志", () => {
      G.round = 2;
      G.deathLog.push({
        round: 2,
        playerId: "p1",
        cause: "kill_magic",
        killerId: "p2",
        droppedCards: [],
        cardReceivers: {},
      });

      const receivers = new Map<string, CardRef[]>([
        ["p3", [{ id: "c1", type: "detect" }]],
      ]);

      recordCardReceivers(G, "p1", receivers);

      expect(G.deathLog[0].cardReceivers).toBeDefined();
      expect(G.deathLog[0].cardReceivers?.["p3"]).toBeDefined();
    });
  });

  describe("notifyExcessIfNeeded", () => {
    it("应该在有过多卡牌时发送通知", () => {
      const excessCards: CardRef[] = [
        { id: "c1", type: "detect" },
        { id: "c2", type: "check" },
      ];

      notifyExcessIfNeeded(G, excessCards);

      const systemMessage = G.chatMessages.find(
        (m: any) => m.kind === "announcement",
      ) as any;
      expect(systemMessage).toBeDefined();
    });

    it("应该在无过剩卡牌时不发送通知", () => {
      notifyExcessIfNeeded(G, []);
      expect(G.chatMessages.length).toBe(0);
    });
  });

  describe("applyPendingDistributions", () => {
    it("应该处理 skipKiller 类型分配", () => {
      G.secrets["p3"].hand = [{ id: "c1", type: "detect" }];
      const distributions: Array<{
        type: "skipKiller";
        victimId: string;
        cards: CardRef[];
        killerId: string;
      }> = [
        {
          type: "skipKiller",
          victimId: "p1",
          cards: [{ id: "drop1", type: "barrier" }],
          killerId: "p2",
        },
      ];

      applyPendingDistributions(G, mockRandom, distributions);

      expect(G.secrets["p3"].hand.length).toBeGreaterThan(1);
    });

    it("应该处理 killerSelect 类型分配", () => {
      G.secrets["p3"].hand = [{ id: "c1", type: "detect" }];
      const distributions: Array<{
        type: "killerSelect";
        victimId: string;
        cards: CardRef[];
        killerId: string;
      }> = [
        {
          type: "killerSelect",
          victimId: "p1",
          cards: [{ id: "drop1", type: "barrier" }],
          killerId: "p2",
        },
      ];

      applyPendingDistributions(G, mockRandom, distributions);

      expect(G.secrets["p3"].hand.length).toBeGreaterThan(1);
    });

    it("应该处理空分布数组", () => {
      expect(() => applyPendingDistributions(G, mockRandom, [])).not.toThrow();
    });
  });
});
