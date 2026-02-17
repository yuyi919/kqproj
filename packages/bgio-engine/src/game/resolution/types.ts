"use client";

/**
 * Resolution 阶段类型定义
 *
 * 用于 resolveNightActions 函数的不可变架构
 * 每个阶段返回 PhaseResult，描述该阶段产生的变化
 */

import type {
  ActionFailureError,
  BGGameState,
  CardRef,
  NightAction,
} from "../../types";

// ============================================================================
// Phase Result Types
// ============================================================================

/**
 * 阶段处理结果
 * 包含该阶段产生的所有状态变化
 */
export interface PhaseResult {
  /** 普通状态更新（Partial<BGGameState>） */
  stateUpdates: {
    /** 卡牌选择 */
    cardSelection?: BGGameState["cardSelection"];
  };

  /** 死亡的玩家 ID 集合 */
  deadPlayers?: Set<string>;

  /** 释放结界的玩家 ID 集合 */
  barrierPlayers?: Set<string>;

  /** 攻击结算结果 */
  attackResult?: AttackResult;

  /** 残骸化转换列表 */
  wreckTransforms?: WreckTransform[];

  /** 卡牌消耗列表 */
  cardConsumptions?: CardConsumption[];

  /** 延迟分配列表（在 cardSelection 完成后处理） */
  pendingDistributions?: PendingDistribution[];
}

/**
 * 攻击结算结果
 */
export interface AttackResult {
  /** 被 witch_killer 杀死的玩家 ID 集合（用于阻止后续攻击） */
  killedByWitchKiller: Set<string>;

  /** 成功执行的行动 ID 集合 */
  executedActions: Set<string>;

  /** 失败的行动列表 */
  failedActions: Array<{ actionId: string; reason: ActionFailureError }>;
}

/**
 * 残骸化转换
 */
export interface WreckTransform {
  playerId: string;
  droppedCards: CardRef[];
}

/**
 * 卡牌消耗记录
 */
export interface CardConsumption {
  actionId: string;
  playerId: string;
  cardId: string;
  /** 消耗原因 */
  reason: ConsumptionReason;
}

/**
 * 消耗原因类型
 */
export type ConsumptionReason =
  | "executed_consumable" // 成功执行且可消耗
  | "executed_non_consumable" // 成功执行但不可消耗
  | "failed_barrier" // 被结界防御
  | "failed_target_dead" // 目标已死
  | "failed_quota_exceeded" // 配额超额（不消耗）
  | "failed_witch_killer_priority"; // 魔女杀手优先级失败（不消耗）

/**
 * 延迟分配类型
 */
export type PendingDistributionType = "skipKiller" | "killerSelect";

/**
 * 延迟分配信息
 *
 * 击杀结算后，需要延迟到 cardSelection 完成后才能处理的卡牌分配
 */
export interface PendingDistribution {
  /** 分配类型 */
  type: PendingDistributionType;
  /** 死亡玩家ID */
  victimId: string;
  /** 待分配的卡牌列表 */
  cards: CardRef[];
  /** 击杀者ID（skipKiller: 杀手无法获取；killerSelect: 杀手已选择） */
  killerId: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * 玩家手牌接收映射
 */
export type PlayerCardMap = Map<string, CardRef[]>;

// ============================================================================
// Constants
// ============================================================================

/**
 * 卡牌优先级（用于排序）
 */
export const CARD_PRIORITY: Record<string, number> = {
  witch_killer: 5,
  kill: 4,
  barrier: 3,
  detect: 2,
  check: 1,
};

/**
 * 获取卡牌优先级
 */
export function getCardPriority(card: NightAction["card"]): number {
  if (!card) return 0;
  return CARD_PRIORITY[card.type] ?? 0;
}

/**
 * kill 魔法配额
 */
export const KILL_QUOTA = {
  withoutWitchKiller: 3,
  withWitchKiller: 2,
};
