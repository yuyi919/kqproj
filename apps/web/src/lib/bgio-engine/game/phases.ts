"use client";

/**
 * Phase 配置
 */

import { ActivePlayers, TurnOrder } from "boardgame.io/core";
import type { PhaseConfig } from "boardgame.io";
import type { BGGameState, GamePhase } from "../types";
import { moveFunctions } from "./moves";
import type { PhaseHookContext } from "./types";
import { resolveNightActions } from "./resolution";

const phaseConfigs = {
  morning: {
    start: true,
    moves: {},
    next: "day",
    turn: {
      order: TurnOrder.RESET,
      activePlayers: {
        all: "wait",
      },
      stages: {
        wait: {
          moves: {
            say: moveFunctions.say,
          },
        },
      },
    },
    endIf({ G }: PhaseHookContext) {
      return G.phaseEndTime <= Date.now();
    },
    onBegin: ({ G, events }: PhaseHookContext) => {
      G.status = "morning";
      const duration = 5000;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + duration;
      // setTimeout(() => {
      //   // events.endPhase?.();
      //   console.log("endPhase morning");
      // }, duration);
    },
  } as PhaseConfig<BGGameState>,

  day: {
    moves: {
      say: moveFunctions.say,
    },
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    next: "voting",
    onBegin: ({ G, ctx }: PhaseHookContext) => {
      console.log("dayPhase onBegin", ctx._random);
      G.status = "day" as GamePhase;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.dayDuration * 1000;
    },
  } as PhaseConfig<BGGameState>,

  /**
   * 投票阶段
   *
   * 规则：
   * 1. 所有存活玩家可以投票
   * 2. 每人一票，可以改票
   * 3. 可以弃权（投给自己）
   * 4. 得票最高者被监禁
   * 5. 平票时无人被监禁
   */
  voting: {
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    moves: {
      vote: moveFunctions.vote,
      pass: moveFunctions.pass,
    },
    next: "night",
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = "voting" as GamePhase;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.votingDuration * 1000;
      console.log(`[Phase] Voting phase started, round ${G.round}`);
    },
    onEnd: ({ G }: PhaseHookContext) => {
      console.log(
        `[Phase] Voting phase ended, processing ${G.currentVotes.length} votes`,
      );

      // 统计票数
      const voteCounts: Record<string, number> = {};
      for (const vote of G.currentVotes) {
        voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
      }

      // 找出最高票（不包括弃权票）
      let maxVotes = 0;
      let imprisonedId: string | null = null;
      let isTie = false;

      // 分离弃权票和非弃权票
      const abstentionVotes = new Set<string>(); // 投给自己的玩家ID
      for (const vote of G.currentVotes) {
        if (vote.voterId === vote.targetId) {
          abstentionVotes.add(vote.voterId);
        }
      }

      console.log(`[VoteResult] Abstentions: ${abstentionVotes.size}`);

      for (const [targetId, count] of Object.entries(voteCounts)) {
        // 计算有效票数（总票数 - 弃权票数）
        // 弃权票定义为：投给自己的票
        let validVotes = count;

        // 检查是否有弃权票（投给自己）
        const selfVoteCount = G.currentVotes.filter(
          (v) => v.targetId === targetId && v.voterId === targetId,
        ).length;

        if (selfVoteCount > 0) {
          validVotes -= selfVoteCount;
          console.log(
            `[VoteResult] Candidate ${targetId} has ${selfVoteCount} abstention votes, valid votes: ${validVotes}`,
          );
        }

        if (validVotes <= 0) {
          continue;
        }

        if (validVotes > maxVotes) {
          maxVotes = validVotes;
          imprisonedId = targetId;
          isTie = false;
          console.log(
            `[VoteResult] New leader: ${targetId} with ${validVotes} valid votes`,
          );
        } else if (validVotes === maxVotes && maxVotes > 0) {
          isTie = true;
          console.log(
            `[VoteResult] Tie detected at ${validVotes} votes between ${imprisonedId} and ${targetId}`,
          );
        }
      }

      if (isTie) {
        console.log(`[VoteResult] Tie! No one will be imprisoned`);
        imprisonedId = null;
      } else if (imprisonedId) {
        console.log(
          `[VoteResult] ${imprisonedId} will be imprisoned with ${maxVotes} votes`,
        );
      } else {
        console.log(`[VoteResult] No valid votes, no one imprisoned`);
      }

      G.imprisonedId = imprisonedId;

      // 构建投票记录（按目标分组）
      const votes: Record<string, string[]> = {};
      for (const vote of G.currentVotes) {
        if (!votes[vote.targetId]) {
          votes[vote.targetId] = [];
        }
        votes[vote.targetId].push(vote.voterId);
      }

      // 记录到历史
      G.voteHistory.push({
        round: G.round,
        votes,
        imprisonedId,
        isTie,
        voteCounts,
      });

      console.log(
        `[VoteResult] Vote history updated, total records: ${G.voteHistory.length}`,
      );
    },
  } as PhaseConfig<BGGameState>,

  night: {
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    moves: {
      useCard: moveFunctions.useCard,
      pass: moveFunctions.passNight,
    },
    next: "resolution",
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = "night" as GamePhase;
      G.attackQuota = {
        witchKillerUsed: false,
        killMagicUsed: 0,
      };
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.nightDuration * 1000;
    },
  } as PhaseConfig<BGGameState>,

  resolution: {
    moves: {},
    next: "morning",
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    onBegin: ({ G, random }: PhaseHookContext) => {
      G.status = "resolution" as GamePhase;
      resolveNightActions(G, random);
    },
  } as PhaseConfig<BGGameState>,
};

export { phaseConfigs };
