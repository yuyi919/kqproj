import { describe, it, expect } from "bun:test";
import {
  Selectors,
  Mutations,
  createCard,
  createDeck,
  getCardDefinition,
  getCardDefinitionByType,
  getCardTypeName,
  getPhaseName,
} from "../utils";
import type { BGGameState, CardRef, GameConfig } from "../types";

// 创建测试用的 mock 随机函数
const mockShuffle = <T>(arr: T[]): T[] => [...arr].reverse();
const mockRandom = {
  Number: () => 0.5,
  Shuffle: mockShuffle,
  D4: () => 2,
  D6: () => 3,
  D10: () => 5,
  D20: () => 10,
};

// 创建基础游戏状态
const createMockGameState = (): BGGameState => ({
  id: "test-game",
  roomId: "test-room",
  status: "night",
  round: 1,
  players: {
    p1: { id: "p1", seatNumber: 1, status: "alive" },
    p2: { id: "p2", seatNumber: 2, status: "alive" },
    p3: { id: "p3", seatNumber: 3, status: "witch" },
  },
  playerOrder: ["p1", "p2", "p3"],
  deck: [],
  discardPile: [],
  currentActions: {},
  currentVotes: [],
  nightActions: [],
  actionHistory: [],
  voteHistory: [],
  deathLog: [],
  imprisonedId: null,
  attackQuota: { witchKillerUsed: false, killMagicUsed: 0 },
  config: {
    maxPlayers: 7,
    maxRounds: 7,
    dayDuration: 300,
    nightDuration: 60,
    votingDuration: 30,
    cardPool: {
      witch_killer: 1,
      barrier: 5,
      kill: 2,
      detect: 2,
      check: 1,
    },
  },
  phaseStartTime: Date.now(),
  phaseEndTime: Date.now() + 60000,
  secrets: {
    p1: {
      hand: [
        { id: "c1", type: "barrier" },
        { id: "c2", type: "detect" },
      ],
      isWitch: false,
      hasBarrier: false,
      witchKillerHolder: false,
      lastKillRound: 0,
      consecutiveNoKillRounds: 0,
      revealedInfo: [],
    },
    p2: {
      hand: [
        { id: "c3", type: "kill" },
        { id: "c4", type: "witch_killer" },
      ],
      isWitch: true,
      hasBarrier: true,
      witchKillerHolder: true,
      lastKillRound: 1,
      consecutiveNoKillRounds: 0,
      revealedInfo: [],
    },
    p3: {
      hand: [{ id: "c5", type: "check" }],
      isWitch: true,
      hasBarrier: false,
      witchKillerHolder: false,
      lastKillRound: 1,
      consecutiveNoKillRounds: 1,
      revealedInfo: [],
    },
  },
});

describe("Selectors", () => {
  describe("getAlivePlayers", () => {
    it("应返回所有存活玩家", () => {
      const state = createMockGameState();
      const alive = Selectors.getAlivePlayers(state);
      expect(alive).toHaveLength(3);
      expect(alive.map((p) => p.id)).toContain("p1");
      expect(alive.map((p) => p.id)).toContain("p2");
      expect(alive.map((p) => p.id)).toContain("p3");
    });

    it("应排除已死亡玩家", () => {
      const state = createMockGameState();
      state.players.p1.status = "dead";
      const alive = Selectors.getAlivePlayers(state);
      expect(alive).toHaveLength(2);
      expect(alive.map((p) => p.id)).not.toContain("p1");
    });
  });

  describe("isPlayerAlive", () => {
    it("应正确判断存活玩家", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerAlive(state, "p1")).toBe(true);
      expect(Selectors.isPlayerAlive(state, "p2")).toBe(true);
    });

    it("应正确判断死亡玩家", () => {
      const state = createMockGameState();
      state.players.p1.status = "dead";
      expect(Selectors.isPlayerAlive(state, "p1")).toBe(false);
    });

    it("应正确判断魔女化玩家为存活", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerAlive(state, "p3")).toBe(true);
    });
  });

  describe("isPlayerWitch", () => {
    it("应正确识别魔女杀手持有者为魔女", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerWitch(state, "p2")).toBe(true);
    });

    it("应正确识别非魔女玩家", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerWitch(state, "p1")).toBe(false);
    });
  });

  describe("getPlayerHandCount", () => {
    it("应返回正确的手牌数量", () => {
      const state = createMockGameState();
      expect(Selectors.getPlayerHandCount(state, "p1")).toBe(2);
      expect(Selectors.getPlayerHandCount(state, "p2")).toBe(2);
      expect(Selectors.getPlayerHandCount(state, "p3")).toBe(1);
    });
  });

  describe("isWitchKillerHolder", () => {
    it("应正确识别魔女杀手持有者", () => {
      const state = createMockGameState();
      expect(Selectors.isWitchKillerHolder(state, "p2")).toBe(true);
      expect(Selectors.isWitchKillerHolder(state, "p1")).toBe(false);
    });
  });

  describe("computeVoteCounts", () => {
    it("应正确计算投票统计", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
        { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      const counts = Selectors.computeVoteCounts(state);
      expect(counts["p2"]).toBe(2);
      expect(counts["p3"]).toBe(1);
    });
  });

  describe("hasPlayerVoted", () => {
    it("应正确判断玩家是否已投票", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      expect(Selectors.hasPlayerVoted(state, "p1")).toBe(true);
      expect(Selectors.hasPlayerVoted(state, "p2")).toBe(false);
    });
  });

  describe("computeRemainingAttackQuota", () => {
    it("应正确计算初始攻击名额", () => {
      const state = createMockGameState();
      const quota = Selectors.computeRemainingAttackQuota(state);
      expect(quota.witchKiller).toBe(true);
      expect(quota.killMagic).toBe(3);
    });

    it("魔女杀手使用后应减少杀人魔法名额", () => {
      const state = createMockGameState();
      state.attackQuota.witchKillerUsed = true;
      const quota = Selectors.computeRemainingAttackQuota(state);
      expect(quota.witchKiller).toBe(false);
      expect(quota.killMagic).toBe(2);
    });
  });

  describe("isGameOver", () => {
    it("只剩1人时应结束游戏", () => {
      const state = createMockGameState();
      state.players.p2.status = "dead";
      state.players.p3.status = "dead";
      expect(Selectors.isGameOver(state)).toBe(true);
    });

    it("超过最大回合数时应结束游戏", () => {
      const state = createMockGameState();
      state.round = 8;
      expect(Selectors.isGameOver(state)).toBe(true);
    });

    it("正常进行时不应结束游戏", () => {
      const state = createMockGameState();
      expect(Selectors.isGameOver(state)).toBe(false);
    });
  });
});

describe("Mutations", () => {
  describe("addCardToHand", () => {
    it("应正确添加卡牌到手牌", () => {
      const state = createMockGameState();
      const newCard: CardRef = { id: "new", type: "barrier" };
      Mutations.addCardToHand(state, "p1", newCard);
      expect(state.secrets.p1.hand).toHaveLength(3);
      expect(state.secrets.p1.hand.map((c) => c.id)).toContain("new");
    });
  });

  describe("addRevealedInfo", () => {
    it("应正确添加揭示信息", () => {
      const state = createMockGameState();
      Mutations.addRevealedInfo(state, "p1", "detect", { targetId: "p2" });
      expect(state.secrets.p1.revealedInfo).toHaveLength(1);
      expect(state.secrets.p1.revealedInfo[0].type).toBe("detect");
    });
  });

  describe("killPlayer", () => {
    it("应正确击杀玩家并更新状态", () => {
      const state = createMockGameState();
      const result = Mutations.killPlayer(state, "p1", "kill_magic", "p2");
      expect(result).not.toBeNull();
      expect(state.players.p1.status).toBe("dead");
      expect(state.deathLog).toHaveLength(1);
    });

    it("应清空被击杀玩家的手牌", () => {
      const state = createMockGameState();
      Mutations.killPlayer(state, "p1", "kill_magic", "p2");
      expect(state.secrets.p1.hand).toHaveLength(0);
    });

    it("残骸化死亡时应将状态设为 wreck", () => {
      const state = createMockGameState();
      Mutations.killPlayer(state, "p1", "wreck");
      expect(state.players.p1.status).toBe("wreck");
    });

    it("魔女杀手持有者被杀人魔法击杀时应转移给击杀者", () => {
      const state = createMockGameState();
      // p2 持有魔女杀手
      const result = Mutations.killPlayer(state, "p2", "kill_magic", "p1");
      expect(result).not.toBeNull();
      expect(state.secrets.p1.witchKillerHolder).toBe(true);
      expect(state.secrets.p2.witchKillerHolder).toBe(false);
    });

    it("魔女杀手持有者残骸化时应随机转移", () => {
      const state = createMockGameState();
      // p2 持有魔女杀手，残骸化死亡
      const result = Mutations.killPlayer(
        state,
        "p2",
        "wreck",
        undefined,
        mockRandom.Number,
      );
      expect(result).not.toBeNull();
      // 魔女杀手应转移给存活玩家之一
      const holders = Object.entries(state.secrets)
        .filter(([, s]) => s.witchKillerHolder)
        .map(([id]) => id);
      expect(holders).toHaveLength(1);
      expect(holders[0]).not.toBe("p2");
    });
  });
});

describe("createCard", () => {
  it("应创建正确类型的卡牌", () => {
    const card = createCard("barrier");
    expect(card.type).toBe("barrier");
    expect(card.id).toBeDefined();
    expect(typeof card.id).toBe("string");
  });
});

describe("createDeck", () => {
  it("应创建正确数量的卡牌", () => {
    const config: GameConfig["cardPool"] = {
      witch_killer: 1,
      barrier: 3,
      kill: 2,
      detect: 2,
      check: 1,
    };
    const deck = createDeck(config, mockShuffle);
    expect(deck).toHaveLength(9);
  });

  it("应包含正确类型的卡牌", () => {
    const config: GameConfig["cardPool"] = {
      witch_killer: 1,
      barrier: 2,
      kill: 0,
      detect: 0,
      check: 0,
    };
    const deck = createDeck(config, mockShuffle);
    const witchKillers = deck.filter((c) => c.type === "witch_killer");
    const barriers = deck.filter((c) => c.type === "barrier");
    expect(witchKillers).toHaveLength(1);
    expect(barriers).toHaveLength(2);
  });

  it("应使用 shuffle 函数", () => {
    const config: GameConfig["cardPool"] = {
      witch_killer: 1,
      barrier: 1,
      kill: 1,
      detect: 0,
      check: 0,
    };
    const deck = createDeck(config, mockShuffle);
    // mockShuffle 是 reverse，所以最后一张应该在第一位
    expect(deck[0].type).toBe("kill");
  });
});

describe("getCardDefinition", () => {
  it("应返回完整的卡牌定义", () => {
    const cardRef: CardRef = { id: "test", type: "witch_killer" };
    const card = getCardDefinition(cardRef);
    expect(card.id).toBe("test");
    expect(card.type).toBe("witch_killer");
    expect(card.name).toBe("魔女杀手");
    expect(card.consumable).toBe(false);
    expect(card.priority).toBe(100);
  });
});

describe("getCardDefinitionByType", () => {
  it("应返回不包含 id 的卡牌定义", () => {
    const def = getCardDefinitionByType("barrier");
    expect(def.type).toBe("barrier");
    expect(def.name).toBe("结界魔法");
    expect("id" in def).toBe(false);
  });
});

describe("UI Helpers", () => {
  describe("getCardTypeName", () => {
    it("应返回正确的中文名称", () => {
      expect(getCardTypeName("witch_killer")).toBe("魔女杀手");
      expect(getCardTypeName("barrier")).toBe("结界魔法");
    });
  });

  describe("getPhaseName", () => {
    it("应返回正确的阶段名称", () => {
      expect(getPhaseName("morning")).toBe("晨间");
      expect(getPhaseName("night")).toBe("夜间");
      expect(getPhaseName("voting")).toBe("投票");
    });
  });
});
