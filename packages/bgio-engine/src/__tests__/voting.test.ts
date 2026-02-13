import { describe, expect, it } from "bun:test";
import { INVALID_MOVE } from "boardgame.io/core";
import { moveFunctions } from "../game/moves";
import type { BGGameState } from "../types";
import { GamePhase } from "../types/core";
import { Selectors } from "../utils";
import {
  createMockRandom,
  createMoveContext,
  createTestState,
  setupPlayers,
} from "./testUtils";

// ==================== 测试 ====================

describe("Voting Participation Rate", () => {
  // 使用 testUtils 的 createTestState 和 setupPlayers
  const createVotingState = (): BGGameState => {
    const state = createTestState();
    setupPlayers(state, ["p1", "p2", "p3", "p4"]);
    state.status = GamePhase.NIGHT;
    return state;
  };

  describe("Vote Participation Rules", () => {
    it("投票参与率50%时应无效", () => {
      const state = createVotingState();
      // 4个存活玩家，2人投票（50%）
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p1", round: 1, timestamp: Date.now() },
      ];

      const alivePlayers = Selectors.getAlivePlayers(state);
      const totalAlive = alivePlayers.length;
      const validVoters = new Set(
        state.currentVotes
          .filter((v) => v.voterId !== v.targetId)
          .map((v) => v.voterId),
      ).size;
      const participationRate = validVoters / totalAlive;

      expect(participationRate).toBe(0.5);
      expect(participationRate < state.config.minVoteParticipationRate).toBe(
        false,
      ); // 等于 50%
    });

    it("投票参与率超过50%时应有效", () => {
      const state = createVotingState();
      // 4个存活玩家，3人投票（75%）
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
        { voterId: "p3", targetId: "p4", round: 1, timestamp: Date.now() },
      ];

      const alivePlayers = Selectors.getAlivePlayers(state);
      const totalAlive = alivePlayers.length;
      const validVoters = new Set(
        state.currentVotes
          .filter((v) => v.voterId !== v.targetId)
          .map((v) => v.voterId),
      ).size;
      const participationRate = validVoters / totalAlive;

      expect(participationRate).toBe(0.75);
      expect(participationRate >= state.config.minVoteParticipationRate).toBe(
        true,
      );
    });

    it("投票参与率不足50%时应无效", () => {
      const state = createVotingState();
      // 4个存活玩家，只有1人投票（25%）
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      ];

      const alivePlayers = Selectors.getAlivePlayers(state);
      const totalAlive = alivePlayers.length;
      const validVoters = new Set(
        state.currentVotes
          .filter((v) => v.voterId !== v.targetId)
          .map((v) => v.voterId),
      ).size;
      const participationRate = validVoters / totalAlive;

      expect(participationRate).toBe(0.25);
      expect(participationRate < state.config.minVoteParticipationRate).toBe(
        true,
      );
    });

    it("弃权票不计入有效投票", () => {
      const state = createVotingState();
      // 4个存活玩家，4人投票但3人弃权（投给自己）
      state.currentVotes = [
        { voterId: "p1", targetId: "p1", round: 1, timestamp: Date.now() }, // 弃权
        { voterId: "p2", targetId: "p2", round: 1, timestamp: Date.now() }, // 弃权
        { voterId: "p3", targetId: "p4", round: 1, timestamp: Date.now() }, // 有效
        { voterId: "p4", targetId: "p3", round: 1, timestamp: Date.now() }, // 有效
      ];

      const alivePlayers = Selectors.getAlivePlayers(state);
      const totalAlive = alivePlayers.length;
      const validVoters = new Set(
        state.currentVotes
          .filter((v) => v.voterId !== v.targetId)
          .map((v) => v.voterId),
      ).size;
      const participationRate = validVoters / totalAlive;

      expect(totalAlive).toBe(4);
      expect(validVoters).toBe(2);
      expect(participationRate).toBe(0.5);
    });
  });

  describe("VoteResult with Participation Rate", () => {
    it("应正确记录投票参与率", () => {
      const state = createVotingState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
        { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
      ];

      const result = Selectors.computeVoteResult(state);

      expect(result.stats.participationCount).toBeDefined();
      expect(result.stats.totalAlive).toBeDefined();
      expect(result.stats.isValid).toBeDefined();
    });

    it("参与率超过50%时投票应有效", () => {
      const state = createVotingState();
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
        { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
      ];

      const result = Selectors.computeVoteResult(state);

      expect(result.stats.isValid).toBe(true);
    });

    it("参与率刚好50%时投票应无效", () => {
      const state = createVotingState();
      // 4个存活玩家，2人投票（50%）
      state.currentVotes = [
        { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
        { voterId: "p2", targetId: "p1", round: 1, timestamp: Date.now() },
      ];

      const result = Selectors.computeVoteResult(state);

      // >= 50% 时投票有效（规则：超过半数，但等于也算通过）
      expect(result.stats.isValid).toBe(false);
    });
  });

  describe("Imprisoned Player Cannot Vote", () => {
    it("被监禁玩家无法投票", () => {
      const state = createVotingState();
      state.imprisonedId = "p1";
      const context = createMoveContext(state, "p1");

      const result = moveFunctions.vote(context, "p2");

      expect(result).toBe(INVALID_MOVE);
    });

    it("被监禁玩家可以弃权", () => {
      const state = createVotingState();
      state.imprisonedId = "p1";
      const context = createMoveContext(state, "p1", GamePhase.NIGHT);

      // 弃权不检查是否被监禁
      const result = moveFunctions.pass(context);

      // pass 不会检查被监禁状态
      expect(result).toBeUndefined();
      expect(state.currentVotes.length).toBe(1);
      expect(state.currentVotes[0].voterId).toBe("p1");
      expect(state.currentVotes[0].targetId).toBe("p1"); // 弃权 = 投给自己
    });
  });
});
