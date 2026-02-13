import { describe, expect, it } from "bun:test";
import { INVALID_MOVE } from "boardgame.io/core";
import { moveFunctions } from "../game/moves";
import type { BGGameState } from "../types";
import { GamePhase } from "../types/core";
import { Mutations, Selectors } from "../utils";
import {
  createMockRandom,
  createMoveContext,
  createTestState,
  setupPlayers,
} from "./testUtils";

// ==================== 测试 ====================

describe("Trade System", () => {
  // 使用 testUtils 的 createTestState 和 setupPlayers
  const createTradeState = (): BGGameState => {
    const state = createTestState();
    setupPlayers(state, ["p1", "p2", "p3"]);
    state.status = GamePhase.DAY;
    return state;
  };

  describe("initiateTrade", () => {
    it("应正确发起交易", () => {
      const state = createTradeState();
      // 设置交易卡牌
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.secrets.p2.hand = [{ id: "c2", type: "detect" }];
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.initiateTrade(context, "p2", "c1");

      expect(result).toBeUndefined();
      expect(state.activeTrade).not.toBeNull();
      expect(state.activeTrade!.initiatorId).toBe("p1");
      expect(state.activeTrade!.targetId).toBe("p2");
      expect(state.activeTrade!.offeredCardId).toBe("c1");
      expect(state.dailyTradeTracker.p1.hasInitiatedToday).toBe(true);
      expect(state.dailyTradeTracker.p2.hasReceivedOfferToday).toBe(true);
    });

    it("不能与自己交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.initiateTrade(context, "p1", "c1");

      expect(result).toBe(INVALID_MOVE);
      expect(state.activeTrade).toBeNull();
    });

    it("不能交易 witch_killer", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "wk1", type: "witch_killer" }];
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.initiateTrade(context, "p2", "wk1");

      expect(result).toBe(INVALID_MOVE);
      expect(state.activeTrade).toBeNull();
    });

    it("每人每天只能发起一次交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.dailyTradeTracker.p1 = {
        hasInitiatedToday: true,
        hasReceivedOfferToday: false,
        hasTradedToday: true,
      };
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.initiateTrade(context, "p2", "c1");

      expect(result).toBe(INVALID_MOVE);
    });

    it("每人每天只能收到一次交易请求", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.dailyTradeTracker.p2 = {
        hasInitiatedToday: false,
        hasReceivedOfferToday: true,
        hasTradedToday: true,
      };
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.initiateTrade(context, "p2", "c1");

      expect(result).toBe(INVALID_MOVE);
    });

    it("只能在日间阶段发起交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.status = GamePhase.DEEP_NIGHT;
      const context = createMoveContext(state, "p1", GamePhase.DEEP_NIGHT);

      const result = moveFunctions.initiateTrade(context, "p2", "c1");

      expect(result).toBe(INVALID_MOVE);
    });
  });

  describe("respondTrade", () => {
    it("接受交易应正确交换卡牌", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.secrets.p2.hand = [{ id: "c5", type: "detect" }];
      state.activeTrade = {
        tradeId: "t1",
        initiatorId: "p1",
        targetId: "p2",
        offeredCardId: "c1",
        expiresAt: Date.now() + 60000,
      };
      const context = createMoveContext(state, "p2");

      moveFunctions.respondTrade(context, true, "c5");

      expect(state.secrets.p1.hand.find((c) => c.id === "c1")).toBeUndefined();
      expect(state.secrets.p2.hand.find((c) => c.id === "c5")).toBeUndefined();
      expect(state.activeTrade).toBeNull();
    });

    it("拒绝交易应清除活跃交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.activeTrade = {
        tradeId: "t1",
        initiatorId: "p1",
        targetId: "p2",
        offeredCardId: "c1",
        expiresAt: Date.now() + 60000,
      };
      const context = createMoveContext(state, "p2");

      moveFunctions.respondTrade(context, false);

      expect(state.activeTrade).toBeNull();
    });

    it("接受时必须指定要交付的卡牌", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.activeTrade = {
        tradeId: "t1",
        initiatorId: "p1",
        targetId: "p2",
        offeredCardId: "c1",
        expiresAt: Date.now() + 60000,
      };
      const context = createMoveContext(state, "p2");

      const result = moveFunctions.respondTrade(context, true);

      expect(result).toBe(INVALID_MOVE);
    });

    it("拒绝后发起方仍视为已使用当日交易机会", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      // 先发起交易
      const initiateContext = createMoveContext(state, "p1");
      moveFunctions.initiateTrade(initiateContext, "p2", "c1");

      // 拒绝交易
      const context = createMoveContext(state, "p2");
      moveFunctions.respondTrade(context, false);

      // 发起方仍可被其他玩家发起交易（只是不能再发起）
      expect(state.dailyTradeTracker.p1.hasInitiatedToday).toBe(true);
      expect(state.dailyTradeTracker.p2.hasReceivedOfferToday).toBe(true);
    });
  });

  describe("cancelTrade", () => {
    it("发起方可以取消交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.activeTrade = {
        tradeId: "t1",
        initiatorId: "p1",
        targetId: "p2",
        offeredCardId: "c1",
        expiresAt: Date.now() + 60000,
      };
      const context = createMoveContext(state, "p1");

      moveFunctions.cancelTrade(context);

      expect(state.activeTrade).toBeNull();
    });

    it("非发起方不能取消交易", () => {
      const state = createTradeState();
      state.secrets.p1.hand = [{ id: "c1", type: "barrier" }];
      state.activeTrade = {
        tradeId: "t1",
        initiatorId: "p1",
        targetId: "p2",
        offeredCardId: "c1",
        expiresAt: Date.now() + 60000,
      };
      const context = createMoveContext(state, "p2");

      const result = moveFunctions.cancelTrade(context);

      expect(result).toBe(INVALID_MOVE);
    });
  });

  describe("dailyTradeTracker", () => {
    it("日间阶段开始时应重置交易状态", () => {
      const state = createTradeState();
      state.dailyTradeTracker = {
        p1: {
          hasInitiatedToday: true,
          hasReceivedOfferToday: true,
          hasTradedToday: false,
        },
        p2: {
          hasInitiatedToday: true,
          hasReceivedOfferToday: false,
          hasTradedToday: false,
        },
        p3: {
          hasInitiatedToday: false,
          hasReceivedOfferToday: true,
          hasTradedToday: false,
        },
      };

      Mutations.resetDailyTradeStatus(state);

      expect(state.dailyTradeTracker.p1.hasInitiatedToday).toBe(false);
      expect(state.dailyTradeTracker.p2.hasReceivedOfferToday).toBe(false);
      expect(state.dailyTradeTracker.p3.hasInitiatedToday).toBe(false);
    });
  });
});
