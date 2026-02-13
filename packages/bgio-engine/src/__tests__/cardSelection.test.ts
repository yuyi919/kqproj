import { describe, expect, it } from "bun:test";
import { INVALID_MOVE } from "boardgame.io/core";
import { moveFunctions } from "../game/moves";
import type { BGGameState, CardRef } from "../types";
import { GamePhase } from "../types/core";
import { Mutations, Selectors } from "../utils";
import {
  createMockRandom,
  createMoveContext,
  createTestState,
  setupPlayers,
} from "./testUtils";

// ==================== 测试 ====================

describe("Card Selection Phase", () => {
  // 使用 testUtils 的 createTestState 和 setupPlayers
  const createCardSelectionState = (): BGGameState => {
    const state = createTestState();
    setupPlayers(state, ["p1", "p2", "p3"]);
    state.status = GamePhase.RESOLUTION;
    state.deathLog = [
      {
        round: 1,
        playerId: "p3",
        cause: "kill_magic",
        killerId: "p1",
        cardReceivers: {},
        droppedCards: [
          { id: "c1", type: "barrier" },
          { id: "c2", type: "kill" },
          { id: "c3", type: "detect" },
        ],
      },
    ];
    state.cardSelection = {
      p1: {
        selectingPlayerId: "p1",
        availableCards: [
          { id: "c1", type: "barrier" },
          { id: "c2", type: "kill" },
          { id: "c3", type: "detect" },
        ],
        victimId: "p3",
        deadline: Date.now() + 15000,
      },
    };
    state.secrets.p1.hand = [{ id: "c10", type: "barrier" }];
    state.secrets.p2.hand = [{ id: "c20", type: "detect" }];
    state.secrets.p3.status = "dead";
    state.secrets.p3.hand = [];
    return state;
  };

  describe("selectDroppedCard", () => {
    it("应正确选择卡牌", () => {
      const state = createCardSelectionState();
      const initialHandCount = state.secrets.p1.hand.length;
      const context = createMoveContext(state, "p1");

      moveFunctions.selectDroppedCard(context, "c2");

      expect(state.secrets.p1.hand.length).toBe(initialHandCount + 1);
      expect(state.secrets.p1.hand.find((c) => c.id === "c2")).toBeDefined();
      expect(state.cardSelection["p1"]).toBeUndefined();
    });

    it("选择的卡牌应记录到 deathRecord.cardReceivers", () => {
      const state = createCardSelectionState();
      const context = createMoveContext(state, "p1");

      moveFunctions.selectDroppedCard(context, "c2");

      const deathRecord = state.deathLog.find((r) => r.playerId === "p3");
      expect(deathRecord?.cardReceivers).toBeDefined();
      expect(deathRecord?.cardReceivers?.["p1"]).toHaveLength(1);
      expect(deathRecord?.cardReceivers?.["p1"]?.[0]).toBe("c2");
    });

    it("只能从可用卡牌中选择", () => {
      const state = createCardSelectionState();
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.selectDroppedCard(context, "not-available");

      expect(result).toBe(INVALID_MOVE);
    });

    it("只有选择者可以操作", () => {
      const state = createCardSelectionState();
      const context = createMoveContext(state, "p2");

      const result = moveFunctions.selectDroppedCard(context, "c1");

      expect(result).toBe(INVALID_MOVE);
    });

    it("无卡牌选择状态时不能操作", () => {
      const state = createCardSelectionState();
      state.cardSelection = {};
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.selectDroppedCard(context, "c1");

      expect(result).toBe(INVALID_MOVE);
    });
  });

  describe("skipCardSelection", () => {
    it("应允许跳过卡牌选择", () => {
      const state = createCardSelectionState();
      const context = createMoveContext(state, "p1");

      moveFunctions.skipCardSelection(context);

      expect(state.cardSelection).toBeEmptyObject();
    });

    it("只有选择者可以跳过", () => {
      const state = createCardSelectionState();
      const context = createMoveContext(state, "p2");

      const result = moveFunctions.skipCardSelection(context);

      expect(result).toBe(INVALID_MOVE);
    });
  });

  describe("CardSelection State", () => {
    it("应正确设置卡牌选择状态", () => {
      const state = createCardSelectionState();

      Mutations.setCardSelection(state, {
        selectingPlayerId: "p2",
        availableCards: [{ id: "new1", type: "barrier" }],
        victimId: "p3",
        deadline: Date.now() + 10000,
      });

      expect(state.cardSelection).not.toBeNull();
      expect(state.cardSelection!.p2?.selectingPlayerId).toBe("p2");
      expect(state.cardSelection!.p2?.availableCards).toHaveLength(1);
    });
  });
});

describe("Card Distribution Rules", () => {
  it("击杀者手牌满时应收到通知", () => {
    const state = createTestState();
    setupPlayers(state, ["p1"]);
    // p1 手牌已满4张
    state.secrets.p1.hand = [
      { id: "c1", type: "barrier" },
      { id: "c2", type: "kill" },
      { id: "c3", type: "detect" },
      { id: "c4", type: "check" },
    ];

    const handFull = Selectors.isHandFull(state, "p1");
    expect(handFull).toBe(true);
  });

  it("击杀者手牌未满时应可接收卡牌", () => {
    const state = createTestState();
    setupPlayers(state, ["p1"]);
    // p1 手牌只有1张
    const handFull = Selectors.isHandFull(state, "p1");
    expect(handFull).toBe(false);
  });
});
