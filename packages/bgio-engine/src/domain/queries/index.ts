"use client";

/**
 * Selectors - CQRS Query
 *
 * 从原子状态计算派生状态的纯函数集合
 */

import { countBy, groupBy, mapValues, maxBy } from "es-toolkit";
import type {
  BGGameState,
  CardRef,
  DeathRecord,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  TMessage,
  Vote,
  VoteResult,
} from "../../types";
import { Refinements } from "../refinements";

// ==================== 计算层（Selectors）====================

/**
 * 计算层 - 从原子状态计算派生状态
 * 所有函数都是纯函数，不修改输入
 */
export const Selectors = {
  // ===== 玩家相关计算 =====

  /**
   * 获取存活玩家列表（计算）
   * 从私有状态中判断（witch 也算存活）
   */
  getAlivePlayers(state: BGGameState): PublicPlayerInfo[] {
    return Object.values(state.players).filter((p) => {
      const secret = state.secrets[p.id];
      return !!secret && Refinements.isAlive(secret);
    });
  },

  /**
   * 获取所有玩家列表（计算）
   */
  getAllPlayers(state: BGGameState): PublicPlayerInfo[] {
    return Object.values(state.players);
  },

  /**
   * 获取存活玩家ID列表（计算）
   */
  getAlivePlayerIds(state: BGGameState): string[] {
    return this.getAlivePlayers(state).map((p) => p.id);
  },

  /**
   * 获取存活玩家数量（计算）
   */
  getAlivePlayerCount(state: BGGameState): number {
    return this.getAlivePlayers(state).length;
  },

  /**
   * 检查玩家是否存活
   */
  isPlayerAlive(state: BGGameState, playerId: PlayerID): boolean {
    const info = state.players[playerId];
    return !!info && Refinements.isAlive(info);
  },

  /**
   * 检查玩家是否被囚禁（计算）
   */
  isPlayerImprisoned(state: BGGameState, playerId: PlayerID): boolean {
    return Refinements.isImprisoned(state.imprisonedId, playerId);
  },

  /**
   * 获取指定玩家（公开信息）
   */
  getPlayer(
    state: BGGameState,
    playerId: PlayerID,
  ): PublicPlayerInfo | undefined {
    return state.players[playerId];
  },

  /**
   * 获取玩家的私有信息
   */
  getPlayerSecrets(
    state: BGGameState,
    playerId: PlayerID,
  ): PrivatePlayerInfo | undefined {
    return state.secrets[playerId];
  },

  /**
   * 获取玩家手牌数量（计算）
   */
  getPlayerHandCount(state: BGGameState, playerId: PlayerID): number {
    return state.secrets[playerId]?.hand.length ?? 0;
  },

  /**
   * 检查玩家是否持有魔女杀手（计算）
   */
  isWitchKillerHolder(state: BGGameState, playerId: PlayerID): boolean {
    return state.secrets[playerId]?.witchKillerHolder ?? false;
  },

  /**
   * 获取所有持有魔女杀手的玩家ID（计算）
   */
  getWitchKillerHolders(state: BGGameState): string[] {
    return Object.entries(state.secrets)
      .filter(([, secret]) => secret.witchKillerHolder)
      .map(([playerId]) => playerId);
  },

  // ===== 魔女化状态计算 =====

  /**
   * 计算玩家是否魔女化（计算）
   */
  isPlayerWitch(state: BGGameState, playerId: PlayerID): boolean {
    const secret = state.secrets[playerId];
    return !!secret && Refinements.isWitch(secret);
  },

  /**
   * 计算玩家是否需要残骸化（计算）
   */
  shouldPlayerWreck(state: BGGameState, playerId: PlayerID): boolean {
    const secret = state.secrets[playerId];
    return !!secret && Refinements.shouldWreck(secret);
  },

  // ===== 投票相关计算 =====

  /**
   * 计算投票统计（计算）
   */
  computeVoteCounts(state: BGGameState): Record<string, number> {
    return countBy(state.currentVotes, (vote) => vote.targetId);
  },

  /**
   * 计算投票结果（计算）
   */
  computeVoteResult(state: BGGameState): VoteResult {
    const alivePlayers = this.getAlivePlayers(state);
    const totalAlive = alivePlayers.length;

    // 统计有效投票记录（排除投给自己的弃权票）
    const validVotesData = state.currentVotes.filter(
      (v) => !Refinements.isAbstention(v),
    );
    const participationCount = new Set(validVotesData.map((v) => v.voterId))
      .size;

    const MIN_PARTICIPATION_RATE = state.config.minVoteParticipationRate;
    const isValid =
      totalAlive > 0
        ? participationCount / totalAlive > MIN_PARTICIPATION_RATE
        : false;

    // 分组所有投票（用于 UI 显示）
    const votesGrouped = groupBy(state.currentVotes, (v) => v.targetId);
    const votes = mapValues(votesGrouped, (group) =>
      group.map((v) => v.voterId),
    );
    const voteCounts = mapValues(votesGrouped, (group) => group.length);

    const validVoteCounts = countBy(validVotesData, (v) => v.targetId);
    const validVoteEntries = Object.entries(validVoteCounts) as [
      string,
      number,
    ][];

    // 使用 maxBy 查找最高票数
    const maxEntry = maxBy(validVoteEntries, ([, count]) => count);
    const maxVotes = maxEntry ? maxEntry[1] : 0;

    // 检查是否平票
    const isTie =
      maxVotes > 0 &&
      validVoteEntries.filter(([, count]) => count === maxVotes).length > 1;

    const imprisonedId = !isTie && maxEntry ? maxEntry[0] : null;

    return {
      round: state.round,
      votes,
      imprisonedId,
      isTie,
      voteCounts,
      stats: {
        participationCount,
        totalAlive,
        isValid,
        maxVotes,
      },
    };
  },

  // ===== 攻击名额计算 =====

  /**
   * 计算剩余攻击名额（计算）
   */
  computeRemainingAttackQuota(state: BGGameState): {
    witchKiller: boolean;
    killMagic: number;
  } {
    const maxKillMagic = state.attackQuota.witchKillerUsed ? 2 : 3;
    return {
      witchKiller: !state.attackQuota.witchKillerUsed,
      killMagic: maxKillMagic - state.attackQuota.killMagicUsed,
    };
  },

  // ===== 游戏结束检查 =====

  /**
   * 检查游戏是否结束（计算）
   */
  isGameOver(state: BGGameState): boolean {
    return Refinements.isGameOver(
      this.getAlivePlayerCount(state),
      state.round,
      state.config.maxRounds,
    );
  },

  /**
   * 计算获胜者（计算）
   */
  computeWinner(state: BGGameState): string | null {
    const alivePlayers = this.getAlivePlayers(state);
    if (alivePlayers.length === 1) {
      return alivePlayers[0].id;
    }
    return null;
  },

  // ===== 死亡记录计算 =====

  /**
   * 获取公开死亡信息（过滤敏感信息）
   */
  getPublicDeathInfo(state: BGGameState) {
    return state.deathLog.map((record) => ({
      round: record.round,
      playerId: record.playerId,
      died: true,
    }));
  },

  // ===== 卡牌相关计算 =====

  /**
   * 获取玩家可使用的手牌（计算）
   */
  getUsableCards(state: BGGameState, playerId: PlayerID): CardRef[] {
    const secret = state.secrets[playerId];
    if (!secret) return [];

    if (secret.witchKillerHolder) {
      return secret.hand.filter((c) => c.type === "witch_killer");
    }

    return secret.hand;
  },

  /**
   * 获取手牌完整信息（计算）
   */
  getHandDetails(state: BGGameState, playerId: PlayerID) {
    const secret = state.secrets[playerId];
    if (!secret) return [];
    return secret.hand.map((cardRef) => getCardDefinition(cardRef));
  },

  /**
   * 检查玩家是否有结界（计算）
   */
  hasPlayerBarrier(state: BGGameState, playerId: PlayerID): boolean {
    return state.secrets[playerId]?.hasBarrier || false;
  },

  /**
   * 检查玩家是否已行动（计算）
   */
  hasPlayerActed(state: BGGameState, playerId: PlayerID): boolean {
    return state.nightActions.some((action) => action.playerId === playerId);
  },
  /**
   * 检查玩家是否已投票（计算）
   */
  hasPlayerVoted(state: BGGameState, playerId: PlayerID): boolean {
    return state.currentVotes.some((v) => v.voterId === playerId);
  },

  /**
   * 检查玩家本回合是否已提交投票
   */
  findExistingVoteIndex(state: BGGameState, playerId: PlayerID): number {
    return Refinements.findVoteIndex(state.currentVotes, playerId);
  },

  /**
   * 获取玩家本回合的投票记录
   */
  findExistingVote(state: BGGameState, playerId: PlayerID): Vote | null {
    return Refinements.findVote(state.currentVotes, playerId);
  },

  /**
   * 检查玩家本回合是否已击杀成功
   */
  hasKilledThisRound(state: BGGameState, playerId: PlayerID): boolean {
    return Refinements.hasKilledSuccessfully(state.nightActions, playerId);
  },

  /**
   * 检查玩家本夜是否已使用卡牌（计算）
   * 通过 nightActions 数组判断，遵循原子状态原则
   */
  hasPlayerUsedCardThisNight(state: BGGameState, playerId: PlayerID): boolean {
    return state.nightActions.some((action) => action.playerId === playerId);
  },

  // ===== 视图过滤计算 (PlayerView) =====

  /**
   * 为特定玩家过滤消息（遵循可见性规则）
   */
  filterMessagesForPlayer(
    messages: TMessage[],
    playerId: PlayerID,
  ): TMessage[] {
    if (playerId === "0") return messages; // 调试模式显示所有

    return messages
      .filter((msg): boolean => {
        switch (msg.kind) {
          case "announcement":
          case "public_action":
            return true; // 公开消息
          case "private_action":
          case "private_response":
            // 私密行动：仅 actor 可见
            return msg.actorId === playerId;
          case "witnessed_action":
            // 见证行动：actor 或 target 可见
            return msg.actorId === playerId || msg.targetId === playerId;
          default:
            return false;
        }
      })
      .map((msg) => {
        if (msg.type === "dead_response" || msg.type === "barrier_applied") {
          return {
            ...msg,
            attackerId: undefined, // 隐藏攻击者的消息
          };
        }
        return msg;
      });
  },

  /**
   * 为特定玩家过滤死亡日志（隐藏杀手信息）
   */
  filterDeathLogForPlayer(
    log: DeathRecord[],
    playerId: PlayerID,
  ): DeathRecord[] {
    if (playerId === "0") return log; // 调试模式显示完整信息
    return log.map((record) => ({
      ...record,
      killerId: undefined, // 对所有玩家隐藏击杀者
    }));
  },

  /**
   * 生成公开玩家信息列表
   */
  computePublicPlayers(state: BGGameState): Record<string, PublicPlayerInfo> {
    return mapValues(state.players, (player, id): PublicPlayerInfo => {
      const secret = state.secrets[id];
      const isDead = !!secret && Refinements.isDead(secret);
      return {
        ...player,
        status: isDead ? "dead" : "alive",
      };
    });
  },

  // ===== 交易相关计算（新增）=====

  /**
   * 检查玩家今日是否已发起交易（新增）
   */
  hasInitiatedTradeToday(state: BGGameState, playerId: PlayerID): boolean {
    return state.dailyTradeTracker[playerId]?.hasInitiatedToday ?? false;
  },

  /**
   * 检查玩家今日是否已收到交易提议
   */
  hasReceivedTradeOfferToday(state: BGGameState, playerId: PlayerID): boolean {
    return state.dailyTradeTracker[playerId]?.hasReceivedOfferToday ?? false;
  },

  /**
   * 检查玩家今日是否已参与过任何交易（发起或被发起）
   * 规则 5.2：仅能参与一次交易
   */
  hasTradedToday(state: BGGameState, playerId: PlayerID): boolean {
    return state.dailyTradeTracker[playerId]?.hasTradedToday ?? false;
  },

  /**
   * 检查玩家手牌是否已满
   */
  isHandFull(state: BGGameState, playerId: PlayerID): boolean {
    return Refinements.isHandFull(
      this.getPlayerHandCount(state, playerId),
      state.config.maxHandSize,
    );
  },
};

import type { PlayerID } from "boardgame.io";
// 导入需要的函数（放在底部避免循环引用）
import { getCardDefinition } from "../services/cardService";
