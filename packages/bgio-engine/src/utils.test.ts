import { describe, expect, it } from "bun:test";
import {
  createCard,
  createDeck,
  getCardDefinition,
  getCardDefinitionByType,
  getCardTypeName,
  getPhaseName,
  Mutations,
  Selectors,
  TMessageBuilder,
} from "./utils";
import { createTestState, setupPlayers, setupPlayer } from "./__tests__/testUtils";
import type { BGGameState, CardRef, GameConfig } from "./types";
import { GamePhase } from "./types";

// ==================== 测试数据工厂 ====================

const createMockGameState = (): BGGameState => {
  const state = createTestState();
  setupPlayers(state, ["p1", "p2", "p3", "p4"]);

  // 设置玩家状态
  state.secrets.p1.hand = [
    { id: "c1", type: "barrier" },
    { id: "c2", type: "detect" },
  ];
  state.secrets.p1.isWitch = false;
  state.secrets.p1.witchKillerHolder = false;

  state.secrets.p2.status = "witch";
  state.secrets.p2.hand = [
    { id: "c3", type: "kill" },
    { id: "c4", type: "witch_killer" },
  ];
  state.secrets.p2.isWitch = true;
  state.secrets.p2.hasBarrier = true;
  state.secrets.p2.witchKillerHolder = true;
  state.secrets.p2.lastKillRound = 1;

  state.secrets.p3.status = "alive";
  state.secrets.p3.hand = [{ id: "c5", type: "check" }];
  state.secrets.p3.isWitch = true;
  state.secrets.p3.consecutiveNoKillRounds = 1;

  state.secrets.p4.status = "dead";
  state.secrets.p4.hand = [];

  return state;
};

// ==================== Selectors 测试 ====================

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
      state.secrets.p1.status = "dead";
      const alive = Selectors.getAlivePlayers(state);
      expect(alive).toHaveLength(2);
      expect(alive.map((p) => p.id)).not.toContain("p1");
    });

    it("应包含魔女化玩家", () => {
      const state = createMockGameState();
      const alive = Selectors.getAlivePlayers(state);
      expect(alive.map((p) => p.id)).toContain("p2");
    });

    it("空游戏状态应返回空数组", () => {
      const state = createTestState();
      const alive = Selectors.getAlivePlayers(state);
      expect(alive).toHaveLength(0);
    });
  });

  describe("getAllPlayers", () => {
    it("应返回所有玩家（包括死亡）", () => {
      const state = createMockGameState();
      const all = Selectors.getAllPlayers(state);
      expect(all).toHaveLength(4);
    });

    it("空游戏状态应返回空数组", () => {
      const state = createTestState();
      const all = Selectors.getAllPlayers(state);
      expect(all).toHaveLength(0);
    });
  });

  describe("getAlivePlayerIds", () => {
    it("应返回存活玩家ID列表", () => {
      const state = createMockGameState();
      const ids = Selectors.getAlivePlayerIds(state);
      expect(ids).toContain("p1");
      expect(ids).toContain("p2");
      expect(ids).toContain("p3");
      expect(ids).not.toContain("p4");
    });
  });

  describe("getAlivePlayerCount", () => {
    it("应返回正确的存活玩家数量", () => {
      const state = createMockGameState();
      expect(Selectors.getAlivePlayerCount(state)).toBe(3);
    });

    it("所有玩家死亡时应返回0", () => {
      const state = createMockGameState();
      state.secrets.p1.status = "dead";
      state.secrets.p2.status = "dead";
      state.secrets.p3.status = "dead";
      expect(Selectors.getAlivePlayerCount(state)).toBe(0);
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
      // Need to also set the public status to "dead" - setupPlayers only sets to "alive" by default
      state.players.p4.status = "dead";
      expect(Selectors.isPlayerAlive(state, "p4")).toBe(false);
    });

    it("应正确判断魔女化玩家为存活", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerAlive(state, "p2")).toBe(true);
    });

    it("不存在的玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerAlive(state, "ghost")).toBe(false);
    });
  });

  describe("isPlayerImprisoned", () => {
    it("应正确判断被囚禁玩家", () => {
      const state = createMockGameState();
      state.imprisonedId = "p1";
      expect(Selectors.isPlayerImprisoned(state, "p1")).toBe(true);
      expect(Selectors.isPlayerImprisoned(state, "p2")).toBe(false);
    });

    it("无囚禁玩家时所有玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerImprisoned(state, "p1")).toBe(false);
    });
  });

  describe("getPlayer", () => {
    it("应返回存在的玩家", () => {
      const state = createMockGameState();
      const player = Selectors.getPlayer(state, "p1");
      expect(player).toBeDefined();
      expect(player?.id).toBe("p1");
    });

    it("不存在的玩家应返回undefined", () => {
      const state = createMockGameState();
      const player = Selectors.getPlayer(state, "ghost");
      expect(player).toBeUndefined();
    });
  });

  describe("getPlayerSecrets", () => {
    it("应返回玩家的私有信息", () => {
      const state = createMockGameState();
      const secrets = Selectors.getPlayerSecrets(state, "p1");
      expect(secrets).toBeDefined();
      expect(secrets?.hand).toHaveLength(2);
    });

    it("不存在的玩家应返回undefined", () => {
      const state = createMockGameState();
      const secrets = Selectors.getPlayerSecrets(state, "ghost");
      expect(secrets).toBeUndefined();
    });
  });

  describe("getPlayerHandCount", () => {
    it("应返回正确的手牌数量", () => {
      const state = createMockGameState();
      expect(Selectors.getPlayerHandCount(state, "p1")).toBe(2);
      expect(Selectors.getPlayerHandCount(state, "p2")).toBe(2);
      expect(Selectors.getPlayerHandCount(state, "p3")).toBe(1);
    });

    it("死亡玩家应返回0", () => {
      const state = createMockGameState();
      expect(Selectors.getPlayerHandCount(state, "p4")).toBe(0);
    });

    it("不存在的玩家应返回0", () => {
      const state = createMockGameState();
      expect(Selectors.getPlayerHandCount(state, "ghost")).toBe(0);
    });
  });

  describe("isWitchKillerHolder", () => {
    it("应正确识别魔女杀手持有者", () => {
      const state = createMockGameState();
      expect(Selectors.isWitchKillerHolder(state, "p2")).toBe(true);
      expect(Selectors.isWitchKillerHolder(state, "p1")).toBe(false);
    });

    it("不存在的玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.isWitchKillerHolder(state, "ghost")).toBe(false);
    });
  });

  describe("getWitchKillerHolders", () => {
    it("应返回所有魔女杀手持有者", () => {
      const state = createMockGameState();
      const holders = Selectors.getWitchKillerHolders(state);
      expect(holders).toHaveLength(1);
      expect(holders).toContain("p2");
    });

    it("无持有者时应返回空数组", () => {
      const state = createMockGameState();
      state.secrets.p2.witchKillerHolder = false;
      const holders = Selectors.getWitchKillerHolders(state);
      expect(holders).toHaveLength(0);
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

    it("不存在的玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.isPlayerWitch(state, "ghost")).toBe(false);
    });
  });

  describe("shouldPlayerWreck", () => {
    it("应正确判断需要残骸化的玩家", () => {
      const state = createMockGameState();
      // p2 is the witch with isWitch=true, need to set consecutiveNoKillRounds >= 2
      state.secrets.p2.consecutiveNoKillRounds = 2;
      expect(Selectors.shouldPlayerWreck(state, "p2")).toBe(true);
    });

    it("应正确判断不需要残骸化的玩家", () => {
      const state = createMockGameState();
      expect(Selectors.shouldPlayerWreck(state, "p1")).toBe(false);
    });

    it("不存在的玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.shouldPlayerWreck(state, "ghost")).toBe(false);
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

    it("无投票时应返回空对象", () => {
      const state = createMockGameState();
      const counts = Selectors.computeVoteCounts(state);
      expect(Object.keys(counts)).toHaveLength(0);
    });
  });

  describe("computeVoteResult", () => {
    it("应正确计算投票结果", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
        { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      const result = Selectors.computeVoteResult(state);
      expect(result.imprisonedId).toBe("p2");
      expect(result.isTie).toBe(false);
      expect(result.voteCounts["p2"]).toBe(2);
    });

    it("平票时应返回null imprisonedId", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
      ];
      const result = Selectors.computeVoteResult(state);
      expect(result.isTie).toBe(true);
      expect(result.imprisonedId).toBeNull();
    });

    it("应包含投票统计信息", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      const result = Selectors.computeVoteResult(state);
      expect(result.stats.participationCount).toBe(1);
      expect(result.stats.totalAlive).toBe(3);
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

    it("杀人魔法使用后应正确计算剩余", () => {
      const state = createMockGameState();
      state.attackQuota.killMagicUsed = 2;
      const quota = Selectors.computeRemainingAttackQuota(state);
      expect(quota.killMagic).toBe(1);
    });
  });

  describe("isGameOver", () => {
    it("只剩1人时应结束游戏", () => {
      const state = createMockGameState();
      state.secrets.p2.status = "dead";
      state.secrets.p3.status = "dead";
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

  describe("computeWinner", () => {
    it("只剩1人时应返回该玩家", () => {
      const state = createMockGameState();
      state.secrets.p2.status = "dead";
      state.secrets.p3.status = "dead";
      const winner = Selectors.computeWinner(state);
      expect(winner).toBe("p1");
    });

    it("多人存活时应返回null", () => {
      const state = createMockGameState();
      expect(Selectors.computeWinner(state)).toBeNull();
    });

    it("无人存活时应返回null", () => {
      const state = createMockGameState();
      state.secrets.p1.status = "dead";
      state.secrets.p2.status = "dead";
      state.secrets.p3.status = "dead";
      expect(Selectors.computeWinner(state)).toBeNull();
    });
  });

  describe("getPublicDeathInfo", () => {
    it("应返回公开的死亡信息", () => {
      const state = createMockGameState();
      state.deathLog = [
        { round: 1, playerId: "p5", deathCause: "kill_magic", killerId: "p1" },
      ];
      const info = Selectors.getPublicDeathInfo(state);
      expect(info).toHaveLength(1);
      expect(info[0].playerId).toBe("p5");
      expect(info[0].round).toBe(1);
      expect(info[0].died).toBe(true);
    });

    it("应隐藏杀手信息", () => {
      const state = createMockGameState();
      state.deathLog = [
        { round: 1, playerId: "p5", deathCause: "kill_magic", killerId: "p1" },
      ];
      const info = Selectors.getPublicDeathInfo(state);
      expect((info[0] as any).killerId).toBeUndefined();
    });
  });

  describe("getUsableCards", () => {
    it("普通玩家应返回所有手牌", () => {
      const state = createMockGameState();
      const cards = Selectors.getUsableCards(state, "p1");
      expect(cards).toHaveLength(2);
    });

    it("魔女杀手持有者应只返回魔女杀手", () => {
      const state = createMockGameState();
      const cards = Selectors.getUsableCards(state, "p2");
      expect(cards).toHaveLength(1);
      expect(cards[0].type).toBe("witch_killer");
    });

    it("死亡玩家应返回空数组", () => {
      const state = createMockGameState();
      const cards = Selectors.getUsableCards(state, "p4");
      expect(cards).toHaveLength(0);
    });

    it("不存在的玩家应返回空数组", () => {
      const state = createMockGameState();
      const cards = Selectors.getUsableCards(state, "ghost");
      expect(cards).toHaveLength(0);
    });
  });

  describe("getHandDetails", () => {
    it("应返回手牌详细信息", () => {
      const state = createMockGameState();
      const details = Selectors.getHandDetails(state, "p1");
      expect(details).toHaveLength(2);
      expect(details[0].name).toBeDefined();
      expect(details[0].description).toBeDefined();
    });

    it("死亡玩家应返回空数组", () => {
      const state = createMockGameState();
      const details = Selectors.getHandDetails(state, "p4");
      expect(details).toHaveLength(0);
    });
  });

  describe("hasPlayerBarrier", () => {
    it("应正确识别有结界的玩家", () => {
      const state = createMockGameState();
      expect(Selectors.hasPlayerBarrier(state, "p2")).toBe(true);
      expect(Selectors.hasPlayerBarrier(state, "p1")).toBe(false);
    });

    it("不存在的玩家应返回false", () => {
      const state = createMockGameState();
      expect(Selectors.hasPlayerBarrier(state, "ghost")).toBe(false);
    });
  });

  describe("hasPlayerActed", () => {
    it("应正确判断已行动的玩家", () => {
      const state = createMockGameState();
      state.nightActions = [
        { id: "na1", playerId: "p1", card: { id: "c1", type: "detect" }, timestamp: Date.now() },
      ];
      expect(Selectors.hasPlayerActed(state, "p1")).toBe(true);
      expect(Selectors.hasPlayerActed(state, "p2")).toBe(false);
    });
  });

  describe("hasPlayerVoted", () => {
    it("应正确判断已投票的玩家", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      expect(Selectors.hasPlayerVoted(state, "p1")).toBe(true);
      expect(Selectors.hasPlayerVoted(state, "p2")).toBe(false);
    });
  });

  describe("hasKilledThisRound", () => {
    it("应正确判断本回合已击杀的玩家", () => {
      const state = createMockGameState();
      // Need to set executed: true for the action to be considered a successful kill
      state.nightActions = [
        { id: "na1", playerId: "p1", card: { id: "c1", type: "kill" }, targetId: "p2", timestamp: Date.now(), executed: true },
      ];
      expect(Selectors.hasKilledThisRound(state, "p1")).toBe(true);
      expect(Selectors.hasKilledThisRound(state, "p2")).toBe(false);
    });
  });

  describe("hasPlayerUsedCardThisNight", () => {
    it("应正确判断本夜已使用卡牌的玩家", () => {
      const state = createMockGameState();
      state.nightActions = [
        { id: "na1", playerId: "p1", card: { id: "c1", type: "detect" }, timestamp: Date.now() },
      ];
      expect(Selectors.hasPlayerUsedCardThisNight(state, "p1")).toBe(true);
      expect(Selectors.hasPlayerUsedCardThisNight(state, "p2")).toBe(false);
    });
  });

  describe("findExistingVoteIndex", () => {
    it("应找到存在的投票索引", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
      ];
      expect(Selectors.findExistingVoteIndex(state, "p1")).toBe(0);
      expect(Selectors.findExistingVoteIndex(state, "p2")).toBe(1);
    });

    it("未投票时应返回-1", () => {
      const state = createMockGameState();
      expect(Selectors.findExistingVoteIndex(state, "p1")).toBe(-1);
    });
  });

  describe("findExistingVote", () => {
    it("应返回存在的投票", () => {
      const state = createMockGameState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      ];
      const vote = Selectors.findExistingVote(state, "p1");
      expect(vote).toBeDefined();
      expect(vote?.targetId).toBe("p2");
    });

    it("未投票时应返回null", () => {
      const state = createMockGameState();
      expect(Selectors.findExistingVote(state, "p1")).toBeNull();
    });
  });

  describe("filterMessagesForPlayer", () => {
    it("应正确过滤公开消息", () => {
      const messages = [
        TMessageBuilder.createSystem("公告"),
        TMessageBuilder.createVote("p1", "p2"),
      ];
      const filtered = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filtered).toHaveLength(2);
    });

    it("应正确过滤私密消息", () => {
      const messages = [
        TMessageBuilder.createUseCard("p1", "detect"),
        TMessageBuilder.createUseCard("p2", "kill"),
      ];
      const filtered = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filtered).toHaveLength(1);
      expect((filtered[0] as any).actorId).toBe("p1");
    });

    it("调试模式应显示所有消息", () => {
      const messages = [
        TMessageBuilder.createSystem("公告"),
        TMessageBuilder.createUseCard("p1", "detect"),
      ];
      const filtered = Selectors.filterMessagesForPlayer(messages, "0");
      expect(filtered).toHaveLength(2);
    });
  });

  describe("filterDeathLogForPlayer", () => {
    it("应隐藏杀手信息", () => {
      const log = [
        { round: 1, playerId: "p5", deathCause: "kill_magic" as const, killerId: "p1" },
      ];
      const filtered = Selectors.filterDeathLogForPlayer(log, "p2");
      expect(filtered[0].killerId).toBeUndefined();
    });

    it("调试模式应显示完整信息", () => {
      const log = [
        { round: 1, playerId: "p5", deathCause: "kill_magic" as const, killerId: "p1" },
      ];
      const filtered = Selectors.filterDeathLogForPlayer(log, "0");
      expect(filtered[0].killerId).toBe("p1");
    });
  });

  describe("computePublicPlayers", () => {
    it("应计算公开玩家信息", () => {
      const state = createMockGameState();
      const publicPlayers = Selectors.computePublicPlayers(state);
      expect(publicPlayers.p1.status).toBe("alive");
      expect(publicPlayers.p4.status).toBe("dead");
    });
  });

  describe("交易相关 Selectors", () => {
    describe("hasInitiatedTradeToday", () => {
      it("应正确判断今日已发起交易的玩家", () => {
        const state = createMockGameState();
        state.dailyTradeTracker.p1 = { hasInitiatedToday: true, hasReceivedOfferToday: false, hasTradedToday: true };
        expect(Selectors.hasInitiatedTradeToday(state, "p1")).toBe(true);
        expect(Selectors.hasInitiatedTradeToday(state, "p2")).toBe(false);
      });
    });

    describe("hasReceivedTradeOfferToday", () => {
      it("应正确判断今日已收到交易提议的玩家", () => {
        const state = createMockGameState();
        state.dailyTradeTracker.p1 = { hasInitiatedToday: false, hasReceivedOfferToday: true, hasTradedToday: true };
        expect(Selectors.hasReceivedTradeOfferToday(state, "p1")).toBe(true);
        expect(Selectors.hasReceivedTradeOfferToday(state, "p2")).toBe(false);
      });
    });

    describe("hasTradedToday", () => {
      it("应正确判断今日已参与交易的玩家", () => {
        const state = createMockGameState();
        state.dailyTradeTracker.p1 = { hasInitiatedToday: false, hasReceivedOfferToday: false, hasTradedToday: true };
        expect(Selectors.hasTradedToday(state, "p1")).toBe(true);
        expect(Selectors.hasTradedToday(state, "p2")).toBe(false);
      });
    });

    describe("isHandFull", () => {
      it("应正确判断手牌已满的玩家", () => {
        const state = createMockGameState();
        state.secrets.p1.hand = [
          { id: "c1", type: "barrier" },
          { id: "c2", type: "detect" },
          { id: "c3", type: "kill" },
          { id: "c4", type: "check" },
        ];
        expect(Selectors.isHandFull(state, "p1")).toBe(true);
        expect(Selectors.isHandFull(state, "p2")).toBe(false);
      });

      it("不存在的玩家应返回false", () => {
        const state = createMockGameState();
        expect(Selectors.isHandFull(state, "ghost")).toBe(false);
      });
    });
  });
});

// ==================== Mutations 测试 ====================

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
      expect(state.players.p1.status).toBe("dead");
      expect(state.secrets.p1.status).toBe("wreck");
    });
  });
});

// ==================== 卡牌服务测试 ====================

describe("Card Service", () => {
  describe("createDeck", () => {
    it("应创建正确数量的卡牌", () => {
      const config: GameConfig["cardPool"] = {
        witch_killer: 1,
        barrier: 3,
        kill: 2,
        detect: 2,
        check: 1,
      };
      const mockShuffle = <T>(arr: T[]): T[] => [...arr];
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
      const mockShuffle = <T>(arr: T[]): T[] => [...arr];
      const deck = createDeck(config, mockShuffle);
      const witchKillers = deck.filter((c) => c.type === "witch_killer");
      const barriers = deck.filter((c) => c.type === "barrier");
      expect(witchKillers).toHaveLength(1);
      expect(barriers).toHaveLength(2);
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

  describe("getCardTypeName", () => {
    it("应返回正确的中文名称", () => {
      expect(getCardTypeName("witch_killer")).toBe("魔女杀手");
      expect(getCardTypeName("barrier")).toBe("结界魔法");
      expect(getCardTypeName("kill")).toBe("杀人魔法");
      expect(getCardTypeName("detect")).toBe("探知魔法");
      expect(getCardTypeName("check")).toBe("检定魔法");
    });
  });
});

// ==================== UI Helpers 测试 ====================

describe("UI Helpers", () => {
  describe("getPhaseName", () => {
    it("应返回正确的阶段名称", () => {
      expect(getPhaseName(GamePhase.LOBBY)).toBe("等待加入");
      expect(getPhaseName(GamePhase.SETUP)).toBe("游戏准备");
      expect(getPhaseName(GamePhase.MORNING)).toBe("晨间阶段");
      expect(getPhaseName(GamePhase.DAY)).toBe("午间阶段");
      expect(getPhaseName(GamePhase.NIGHT)).toBe("夜间阶段");
      expect(getPhaseName(GamePhase.DEEP_NIGHT)).toBe("深夜阶段");
      expect(getPhaseName(GamePhase.RESOLUTION)).toBe("行动结算");
      expect(getPhaseName(GamePhase.CARD_SELECTION)).toBe("卡牌选择");
      expect(getPhaseName(GamePhase.ENDED)).toBe("游戏结束");
    });
  });
});

// ==================== TMessageBuilder 集成测试 ====================

describe("TMessageBuilder Integration", () => {
  it("创建的消息应可被 Selectors 正确处理", () => {
    const state = createMockGameState();
    const messages = [
      TMessageBuilder.createSystem("系统消息"),
      TMessageBuilder.createUseCard("p1", "detect", "p2"),
      TMessageBuilder.createDetectResult("p1", "p2", 3, "barrier"),
    ];

    state.chatMessages = messages;

    const visibleToP1 = Selectors.filterMessagesForPlayer(messages, "p1");
    expect(visibleToP1).toHaveLength(3);

    const visibleToP2 = Selectors.filterMessagesForPlayer(messages, "p2");
    expect(visibleToP2).toHaveLength(1); // 只有系统消息
  });

  it("消息时间戳应递增", async () => {
    const before = Date.now();
    const msg1 = TMessageBuilder.createSystem("消息1");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const msg2 = TMessageBuilder.createSystem("消息2");
    const after = Date.now();

    expect(msg1.timestamp).toBeGreaterThanOrEqual(before);
    expect(msg2.timestamp).toBeGreaterThanOrEqual(msg1.timestamp);
    expect(msg2.timestamp).toBeLessThanOrEqual(after);
  });
});
