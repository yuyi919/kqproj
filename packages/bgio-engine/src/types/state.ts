"use client";

/**
 * 状态相关类型定义
 *
 * 包含：
 * - PlayerAction: 玩家行动
 * - Vote: 投票记录
 * - NightAction: 夜间行动记录
 * - VoteResult: 投票结果
 * - BGGameState: boardgame.io 游戏状态
 * - MoveContext: 移动函数上下文
 */

import type { FnContext, PlayerID } from "boardgame.io";
import type { AttackError } from "../effect/errors";
import type { GameCtx } from "../game";
import type { CardRef } from "./card";
import type { GameConfig } from "./config";
import type { ActionType, CardType, GamePhase } from "./core";
import type { DeathRecord } from "./death";
import type { TMessage } from "./message";
import type { PrivatePlayerInfo, PublicPlayerInfo } from "./player";
import type { CardSelectionState, DailyTradeTracker } from "./trade";

/**
 * 玩家行动
 */
export interface PlayerAction {
  id: string;
  /** 发起行动的玩家ID */
  playerId: string;
  /** 行动类型 */
  type: ActionType;
  /** 行动发生的合回 */
  round: number;
  /** 行动发生的阶段 */
  phase: GamePhase;
  /** 使用的卡牌ID */
  cardId?: string;
  /** 使用的卡牌类型 */
  cardType?: CardType;
  /** 行动目标玩家的ID */
  targetId?: string;
  /** 行动发生的时间戳 */
  timestamp: number;
}

/**
 * 投票记录
 */
export interface Vote {
  /** 投票者ID */
  voterId: string;
  /** 被投票者ID */
  targetId: string;
  /** 投票发生的合回 */
  round: number;
  /** 投票发生的时间戳 */
  timestamp: number;
}

/**
 * 行动失败错误（TaggedError）
 */
export type ActionFailureError = AttackError;

/**
 * @deprecated 保留兼容命名，语义已迁移为 TaggedError
 */
export type ActionFailureReason = ActionFailureError;

/**
 * 夜间行动记录
 */
export interface NightAction {
  id: string;
  /** 行动玩家ID */
  playerId: string;
  /** 使用的卡牌（null 表示弃权） */
  card: CardRef | null;
  /** 目标玩家ID（可选） */
  targetId?: string;
  /** 行动产生的时间戳 */
  timestamp: number;
  /** 行动是否执行成功（可选，不设置表示成功） */
  executed?: boolean;
  /** 行动是否已处理（用于配额计算） */
  processed?: boolean;
  /** 行动失败原因（TaggedError，可选） */
  failedReason?: ActionFailureError;
}

/**
 * 投票结果
 */
export interface VoteResult {
  /** 投票所属的回合 */
  round: number;
  /** 投票详情：被投票者ID -> 投票给他的玩家ID列表 */
  votes: Record<string, string[]>;
  /** 最终被监禁的玩家ID */
  imprisonedId: string | null;
  /** 本次投票是否出现平票 */
  isTie: boolean;
  /** 投票数统计：玩家ID -> 得票数 */
  voteCounts: Record<string, number>;
  /** 投票统计信息 */
  stats: {
    /** 投票参与人数 */
    participationCount: number;
    /** 存活玩家总数 */
    totalAlive: number;
    /** 投票是否有效（达到最低参与率） */
    isValid: boolean;
    /** 最高得票数 */
    maxVotes: number;
  };
}

// ==================== boardgame.io 游戏状态 ====================

/**
 * 原子游戏状态（最小存储）
 *
 * boardgame.io 游戏状态 (G)
 * 只包含原子状态，所有可计算状态通过工具函数计算
 */
export interface BGGameState {
  // === 基本信息（原子）===
  id: string;
  /** 房间ID */
  roomId: string;
  /** 当前游戏阶段 */
  status: GamePhase;
  /** 当前游戏回合 */
  round: number;

  // === 玩家（公开信息 - 所有人可见）===
  /** 玩家公开信息映射：玩家ID -> 公开信息 */
  players: Record<string, PublicPlayerInfo>;
  // === 秘密信息（会被 playerView 过滤）===
  /** 玩家私有信息映射：玩家ID -> 私有信息 */
  secrets: Record<PlayerID, PrivatePlayerInfo>;
  /** 玩家座位顺序列表 */
  playerOrder: string[];

  // === 卡牌系统（原子 - 最小化存储）===
  /** 牌堆中剩余的卡牌列表 */
  deck: CardRef[];
  /** 弃牌堆中的卡牌列表 */
  discardPile: CardRef[];

  // === 当前回合行动（原子）===
  /** 当前夜间阶段已收到的投票记录 */
  currentVotes: Vote[];
  /** 夜间阶段已排队的行动列表 */
  nightActions: NightAction[];

  // === 历史记录（原子）===
  /** 游戏至今的所有玩家行动记录 */
  actionHistory: PlayerAction[];
  /** 游戏至今的所有投票结果记录 */
  voteHistory: VoteResult[];
  /** 游戏至今的所有死亡记录 */
  deathLog: DeathRecord[];

  // === 回合临时状态（原子）===
  /** 本回合被监禁的玩家ID */
  imprisonedId: string | null;
  /** 攻击配额管理 */
  attackQuota: {
    /** 魔女杀手是否已被使用 */
    witchKillerUsed: boolean;
    /** 本回合杀人魔法已使用的次数 */
    killMagicUsed: number;
  };

  // === 交易系统状态（新增）===
  /** 每日交易状态跟踪 */
  dailyTradeTracker: DailyTradeTracker;
  /** 当前活跃交易 */
  activeTrade: {
    tradeId: string;
    initiatorId: PlayerID;
    targetId: PlayerID;
    offeredCardId: string;
    expiresAt: number;
  } | null;
  /** 卡牌选择状态（新增） */
  cardSelection: Record<PlayerID, CardSelectionState>;

  // === 配置和时间戳（原子）===
  /** 当前游戏配置 */
  config: GameConfig;
  /** 当前阶段开始的时间戳 */
  phaseStartTime: number;
  /** 当前阶段结束的时间戳 */
  phaseEndTime: number;

  // === 聊天消息（公开）===
  /** 历史聊天消息列表 */
  chatMessages: TMessage[];
}

// ==================== 移动函数上下文 ====================

/**
 * boardgame.io 移动函数上下文
 */
export interface MoveContext extends FnContext<BGGameState> {
  ctx: GameCtx;
  playerID: string;
}

export type MoveResult = BGGameState | void | "INVALID_MOVE";
