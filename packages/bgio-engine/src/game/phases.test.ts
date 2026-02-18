"use client";

/**
 * Phase 配置单元测试
 *
 * 测试游戏相位配置和钩子函数
 */

import { describe, expect, it } from "bun:test";
import {
  createMockRandom,
  createPhaseContext,
  createTestState,
  setupPlayer,
  setupPlayers,
} from "../__tests__/testUtils";
import { GamePhase } from "../types";
import { phaseConfigs } from "./phases";

describe("phaseConfigs - LOBBY", () => {
  it("should have correct next phase", () => {
    const config = phaseConfigs[GamePhase.LOBBY];
    expect(config.next).toBe(GamePhase.SETUP);
  });
});

describe("phaseConfigs - SETUP", () => {
  it("should have correct next phase", () => {
    const config = phaseConfigs[GamePhase.SETUP];
    expect(config.next).toBe(GamePhase.MORNING);
  });
});

describe("phaseConfigs - MORNING", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.MORNING];

    expect(config.start).toBe(true);
    expect(config.next).toBe(GamePhase.DAY);
    expect(config.moves).toEqual({});
  });

  it("should have turn configuration with wait stage", () => {
    const config = phaseConfigs[GamePhase.MORNING];

    expect(config.turn).toBeDefined();
    expect(config.turn?.activePlayers).toEqual({ all: "wait" });
    expect(config.turn?.stages).toBeDefined();
    expect(config.turn?.stages?.wait).toBeDefined();
    expect(config.turn?.stages?.wait?.moves?.say).toBeDefined();
  });

  it("should end phase when timer expires", () => {
    const config = phaseConfigs[GamePhase.MORNING];
    const G = createTestState();

    G.status = GamePhase.MORNING;
    G.phaseEndTime = Date.now() - 1000; // Past time

    const ctx = createPhaseContext(G, GamePhase.MORNING);
    const shouldEnd = config.endIf?.(ctx);
    expect(shouldEnd).toBe(true);
  });

  it("should not end phase when timer has not expired", () => {
    const config = phaseConfigs[GamePhase.MORNING];
    const G = createTestState();

    G.status = GamePhase.MORNING;
    G.phaseEndTime = Date.now() + 10000; // Future time

    const ctx = createPhaseContext(G, GamePhase.MORNING);
    const shouldEnd = config.endIf?.(ctx);
    expect(shouldEnd).toBe(false);
  });

  it("should not end phase if status is not MORNING", () => {
    const config = phaseConfigs[GamePhase.MORNING];
    const G = createTestState();

    G.status = GamePhase.DAY;
    G.phaseEndTime = Date.now() - 1000;

    const ctx = createPhaseContext(G, GamePhase.MORNING);
    const shouldEnd = config.endIf?.(ctx);
    expect(shouldEnd).toBe(false);
  });

  it("should execute onBegin hook", () => {
    const config = phaseConfigs[GamePhase.MORNING];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.status = GamePhase.SETUP;
    G.round = 1;

    const ctx = createPhaseContext(G, GamePhase.MORNING);

    // onBegin should not throw
    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.MORNING);
  });

  it("should announce deaths from previous round in onBegin", () => {
    const config = phaseConfigs[GamePhase.MORNING];
    const G = createTestState();

    setupPlayers(G, [
      { id: "p1", status: "alive" },
      { id: "p2", status: "dead" },
      { id: "p3", status: "alive" },
    ]);

    // Add a death record from round 1
    G.deathLog.push({
      playerId: "p2",
      round: 1,
      cause: "kill_magic",
      droppedCards: [],
      cardReceivers: {},
    });

    G.status = GamePhase.SETUP;
    G.round = 2;

    const ctx = createPhaseContext(G, GamePhase.MORNING);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
  });
});

describe("phaseConfigs - DAY", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.DAY];

    expect(config.next).toBe(GamePhase.NIGHT);
    expect(config.turn).toBeDefined();
  });

  it("should have required moves", () => {
    const config = phaseConfigs[GamePhase.DAY];

    expect(config.moves).toBeDefined();
    expect(config.moves?.say).toBeDefined();
    expect(config.moves?.initiateTrade).toBeDefined();
    expect(config.moves?.respondTrade).toBeDefined();
    expect(config.moves?.cancelTrade).toBeDefined();
  });

  it("should execute onBegin hook", () => {
    const config = phaseConfigs[GamePhase.DAY];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.status = GamePhase.MORNING;

    const ctx = createPhaseContext(G, GamePhase.DAY);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.DAY);
    expect(G.activeTrade).toBeNull();
  });

  it("should reset daily trade status in onBegin", () => {
    const config = phaseConfigs[GamePhase.DAY];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2"]);
    G.status = GamePhase.MORNING;
    G.dailyTradeTracker = {
      p1: {
        hasInitiatedToday: true,
        hasReceivedOfferToday: true,
        hasTradedToday: true,
      },
    };

    const ctx = createPhaseContext(G, GamePhase.DAY);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    // dailyTradeTracker should be reset with all flags set to false
    expect(G.dailyTradeTracker.p1).toEqual({
      hasInitiatedToday: false,
      hasReceivedOfferToday: false,
      hasTradedToday: false,
    });
  });
});

describe("phaseConfigs - NIGHT", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.NIGHT];

    expect(config.next).toBe(GamePhase.DEEP_NIGHT);
    expect(config.turn).toBeDefined();
  });

  it("should have vote and pass moves", () => {
    const config = phaseConfigs[GamePhase.NIGHT];

    expect(config.moves).toBeDefined();
    expect(config.moves?.vote).toBeDefined();
    expect(config.moves?.pass).toBeDefined();
  });

  it("should execute onBegin hook", () => {
    const config = phaseConfigs[GamePhase.NIGHT];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.status = GamePhase.DAY;

    const ctx = createPhaseContext(G, GamePhase.NIGHT);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.NIGHT);
  });

  it("should execute onEnd hook and process votes", () => {
    const config = phaseConfigs[GamePhase.NIGHT];
    const G = createTestState();

    setupPlayers(G, [
      { id: "p1", status: "alive" },
      { id: "p2", status: "alive" },
      { id: "p3", status: "alive" },
    ]);

    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p2", round: 1, timestamp: Date.now() },
    ];

    const ctx = createPhaseContext(G, GamePhase.NIGHT);

    expect(() => config.onEnd?.(ctx)).not.toThrow();
    expect(G.voteHistory).toHaveLength(1);
  });

  it("should handle tie votes in onEnd", () => {
    const config = phaseConfigs[GamePhase.NIGHT];
    const G = createTestState();

    setupPlayers(G, [
      { id: "p1", status: "alive" },
      { id: "p2", status: "alive" },
      { id: "p3", status: "alive" },
    ]);

    // Tie vote: p1 and p2 each get 1 vote
    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p1", round: 1, timestamp: Date.now() },
    ];

    const ctx = createPhaseContext(G, GamePhase.NIGHT);

    expect(() => config.onEnd?.(ctx)).not.toThrow();
    expect(G.imprisonedId).toBeNull();
  });

  it("should handle no votes in onEnd", () => {
    const config = phaseConfigs[GamePhase.NIGHT];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.currentVotes = [];

    const ctx = createPhaseContext(G, GamePhase.NIGHT);

    expect(() => config.onEnd?.(ctx)).not.toThrow();
    expect(G.imprisonedId).toBeNull();
  });
});

describe("phaseConfigs - DEEP_NIGHT", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.DEEP_NIGHT];

    expect(config.next).toBe(GamePhase.RESOLUTION);
    expect(config.turn).toBeDefined();
  });

  it("should have useCard and pass moves", () => {
    const config = phaseConfigs[GamePhase.DEEP_NIGHT];

    expect(config.moves).toBeDefined();
    expect(config.moves?.useCard).toBeDefined();
    expect(config.moves?.pass).toBeDefined();
  });

  it("should execute onBegin hook and reset attack quota", () => {
    const config = phaseConfigs[GamePhase.DEEP_NIGHT];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.status = GamePhase.NIGHT;
    G.attackQuota = { witchKillerUsed: true, killMagicUsed: 2 };

    const ctx = createPhaseContext(G, GamePhase.DEEP_NIGHT);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.DEEP_NIGHT);
    expect(G.attackQuota.witchKillerUsed).toBe(false);
    expect(G.attackQuota.killMagicUsed).toBe(0);
  });
});

describe("phaseConfigs - RESOLUTION", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.RESOLUTION];

    expect(config.moves).toEqual({});
    expect(config.turn).toBeDefined();
  });

  it("should execute onBegin hook", () => {
    const config = phaseConfigs[GamePhase.RESOLUTION];
    const G = createTestState();

    setupPlayers(G, ["p1", "p2", "p3"]);
    G.status = GamePhase.DEEP_NIGHT;

    const ctx = createPhaseContext(G, GamePhase.RESOLUTION);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.RESOLUTION);
  });

  it("should transition to CARD_SELECTION when card selections exist", () => {
    const config = phaseConfigs[GamePhase.RESOLUTION];
    const G = createTestState();

    G.cardSelection = {
      p1: {
        selectingPlayerId: "p1",
        victimId: "p2",
        availableCards: [{ id: "card1", type: "kill" as const }],
        deadline: 0,
      },
    };

    const ctx = createPhaseContext(G, GamePhase.RESOLUTION);
    const nextPhase = config.next?.(ctx);

    expect(nextPhase).toBe(GamePhase.CARD_SELECTION);
  });

  it("should transition to MORNING when no card selections", () => {
    const config = phaseConfigs[GamePhase.RESOLUTION];
    const G = createTestState();

    G.cardSelection = {};
    const ctx = createPhaseContext(G, GamePhase.RESOLUTION);
    const nextPhase = config.next?.(ctx);

    expect(nextPhase).toBe(GamePhase.MORNING);
  });
});

describe("phaseConfigs - CARD_SELECTION", () => {
  it("should have correct configuration", () => {
    const config = phaseConfigs[GamePhase.CARD_SELECTION];

    expect(config.next).toBe(GamePhase.MORNING);
    expect(config.turn).toBeDefined();
  });

  it("should have selectDroppedCard and skipCardSelection moves", () => {
    const config = phaseConfigs[GamePhase.CARD_SELECTION];

    expect(config.moves).toBeDefined();
    expect(config.moves?.selectDroppedCard).toBeDefined();
    expect(config.moves?.skipCardSelection).toBeDefined();
  });

  it("should have cardSelection stage", () => {
    const config = phaseConfigs[GamePhase.CARD_SELECTION];

    expect(config.turn?.stages).toBeDefined();
    expect(config.turn?.stages?.cardSelection).toBeDefined();
    expect(config.turn?.activePlayers).toEqual({ all: "cardSelection" });
  });

  it("should execute onBegin hook", () => {
    const config = phaseConfigs[GamePhase.CARD_SELECTION];
    const G = createTestState();

    setupPlayer(G, { id: "p1", status: "alive" });
    G.cardSelection = {
      p1: {
        selectingPlayerId: "p1",
        victimId: "p2",
        availableCards: [{ id: "card1", type: "kill" as const }],
        deadline: 0,
      },
    };

    const ctx = createPhaseContext(G, GamePhase.CARD_SELECTION);

    expect(() => config.onBegin?.(ctx)).not.toThrow();
    expect(G.status as GamePhase).toBe(GamePhase.CARD_SELECTION);
  });

  it("should execute onEnd hook and randomly assign cards if not selected", () => {
    const config = phaseConfigs[GamePhase.CARD_SELECTION];
    const G = createTestState();

    setupPlayer(G, { id: "p1", status: "alive", hand: [] });
    G.cardSelection = {
      p1: {
        selectingPlayerId: "p1",
        victimId: "p2",
        availableCards: [{ id: "card1", type: "kill" as const }],
        deadline: 0,
      },
    };

    const ctx = {
      ...createPhaseContext(G, GamePhase.CARD_SELECTION),
      random: createMockRandom(),
    };

    expect(() => config.onEnd?.(ctx)).not.toThrow();
  });
});

describe("phaseConfigs - ENDED", () => {
  it("should have empty configuration", () => {
    const config = phaseConfigs[GamePhase.ENDED];

    expect(config).toEqual({});
  });
});

describe("phaseConfigs - Phase Flow", () => {
  it("should have correct phase transition chain", () => {
    // lobby -> setup -> morning -> day -> NIGHT -> DEEP_NIGHT -> resolution
    expect(phaseConfigs[GamePhase.LOBBY].next).toBe(GamePhase.SETUP);
    expect(phaseConfigs[GamePhase.SETUP].next).toBe(GamePhase.MORNING);
    expect(phaseConfigs[GamePhase.MORNING].next).toBe(GamePhase.DAY);
    expect(phaseConfigs[GamePhase.DAY].next).toBe(GamePhase.NIGHT);
    expect(phaseConfigs[GamePhase.NIGHT].next).toBe(GamePhase.DEEP_NIGHT);
    expect(phaseConfigs[GamePhase.DEEP_NIGHT].next).toBe(GamePhase.RESOLUTION);
  });

  it("should complete a full cycle from resolution back to morning", () => {
    // resolution -> (cardSelection or morning) -> morning
    const G = createTestState();
    G.cardSelection = {};

    const ctx = createPhaseContext(G, GamePhase.RESOLUTION);
    const nextPhase = phaseConfigs[GamePhase.RESOLUTION].next?.(ctx);

    expect(nextPhase as GamePhase).toBe(GamePhase.MORNING);
  });

  it("should handle card selection branch in resolution", () => {
    const G = createTestState();
    G.cardSelection = {
      p1: {
        selectingPlayerId: "p1",
        victimId: "p2",
        availableCards: [{ id: "card1", type: "kill" as const }],
        deadline: 0,
      },
    };

    const ctx = createPhaseContext(G, GamePhase.RESOLUTION);
    const nextPhase = phaseConfigs[GamePhase.RESOLUTION].next?.(ctx);

    expect(nextPhase as GamePhase).toBe(GamePhase.CARD_SELECTION);
    expect(phaseConfigs[GamePhase.CARD_SELECTION].next).toBe(GamePhase.MORNING);
  });
});
