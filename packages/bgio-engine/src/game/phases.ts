"use client";

/**
 * Phase 配置
 */

import { ActivePlayers, TurnOrder } from "boardgame.io/core";
import { countBy } from "es-toolkit";
import type { PhaseConfig } from "boardgame.io";
import type { BGGameState, GamePhase } from "../types";
import { moveFunctions } from "./moves";
import type { PhaseHookContext } from "./types";
import { resolveNightActions } from "./resolution";
import { TMessageBuilder, Selectors } from "../utils";

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

      // 添加早晨阶段消息
      G.chatMessages.push(TMessageBuilder.createSystem("☀️ 早晨：公布夜间死亡信息"));

      // 显示死亡日志（合并为一条消息）
      const lastRoundDeaths = G.deathLog.filter(
        (record) => record.round === G.round - 1,
      );
      if (lastRoundDeaths.length > 0) {
        const deathIds = lastRoundDeaths.map((d) => d.playerId);
        G.chatMessages.push(TMessageBuilder.createDeathList(deathIds));
      }
    },
  } satisfies PhaseConfig<BGGameState>,

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

      // 添加日间阶段消息
      G.chatMessages.push(TMessageBuilder.createSystem("🌤️ 日间：自由讨论和交易时间"));
    },
  } satisfies PhaseConfig<BGGameState>,

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

      // 添加投票阶段消息
      G.chatMessages.push(
        TMessageBuilder.createSystem(`🗳️ 投票阶段开始（${G.config.votingDuration / 1000}秒）`)
      );

      // 显示存活玩家列表
      const alivePlayers = Selectors.getAlivePlayers(G);
      const playerList = alivePlayers
        .map((p) => `玩家${p.seatNumber}`)
        .join(", ");
      G.chatMessages.push(TMessageBuilder.createSystem(`存活玩家：${playerList}`));
    },
    onEnd: ({ G }: PhaseHookContext) => {
      console.log(
        `[Phase] Voting phase ended, processing ${G.currentVotes.length} votes`,
      );

      // 统计票数 (Refactor: use countBy)
      const voteCounts = countBy(G.currentVotes, (vote) => vote.targetId);

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

        if (abstentionVotes.has(targetId)) {
          // 如果目标自己也投了自己，那么这一票是弃权票，需要减去
          validVotes -= 1;
          console.log(
            `[VoteResult] Candidate ${targetId} has 1 abstention vote, valid votes: ${validVotes}`,
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
        G.chatMessages.push(TMessageBuilder.createSystem("⚠️ 投票平票，无人被监禁"));
      } else if (imprisonedId) {
        console.log(
          `[VoteResult] ${imprisonedId} will be imprisoned with ${maxVotes} votes`,
        );
        const imprisonedPlayer = G.players[imprisonedId];
        if (imprisonedPlayer) {
          G.chatMessages.push(
            TMessageBuilder.createSystem(`🔒 玩家${imprisonedPlayer.seatNumber} 以 ${maxVotes} 票被监禁`)
          );
        }
      } else {
        console.log(`[VoteResult] No valid votes, no one imprisoned`);
        G.chatMessages.push(TMessageBuilder.createSystem("⚠️ 无有效投票，无人被监禁"));
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

      // 添加投票结果摘要
      const voteSummary = Object.entries(voteCounts)
        .map(([targetId, count]) => {
          const player = G.players[targetId];
          return player
            ? `玩家${player.seatNumber}: ${count}票`
            : `${targetId}: ${count}票`;
        })
        .join(" | ");
      if (voteSummary) {
        G.chatMessages.push(TMessageBuilder.createSystem(`投票结果：${voteSummary}`));
      }
    },
  } satisfies PhaseConfig<BGGameState>,

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

      // 添加夜间阶段消息
      G.chatMessages.push(TMessageBuilder.createSystem("🌙 夜间：使用手牌进行暗中行动"));
      G.chatMessages.push(
        TMessageBuilder.createSystem(`剩余攻击名额：魔女杀手${G.attackQuota.witchKillerUsed ? "已使用" : "可用"}｜杀人魔法 ${3 - G.attackQuota.killMagicUsed}次`)
      );
    },
  } satisfies PhaseConfig<BGGameState>,

  resolution: {
    moves: {},
    next: "morning",
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    onBegin: ({ G, random }: PhaseHookContext) => {
      G.status = "resolution" as GamePhase;

      // 添加结算阶段开始消息
      G.chatMessages.push(TMessageBuilder.createSystem("⚖️ 结算阶段：处理所有夜间行动"));

      resolveNightActions(G, random);

      // 添加结算完成消息
      G.chatMessages.push(TMessageBuilder.createSystem("✅ 夜间行动结算完成"));

      // 显示本轮死亡汇总
      const currentRoundDeaths = G.deathLog.filter(
        (record) => record.round === G.round,
      );
      if (currentRoundDeaths.length > 0) {
        const deathCount = currentRoundDeaths.length;
        G.chatMessages.push(TMessageBuilder.createSystem(`☠️ 本轮共有 ${deathCount} 人死亡`));
      }

      // 回合增加在 resolution 结束时发生，这里添加回合结束消息
      G.chatMessages.push(TMessageBuilder.createSystem(`📜 第 ${G.round} 回合结束`));
    },
  } satisfies PhaseConfig<BGGameState>,
};

export { phaseConfigs };
