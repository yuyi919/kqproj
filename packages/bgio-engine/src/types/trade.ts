"use client";

/**
 * 交易系统类型定义
 */

import type { CardRef } from "./card";

/** 交易状态 */
export type TradeStatus =
  | "idle"
  | "offered"
  | "accepted"
  | "rejected"
  | "cancelled";

/** 交易记录 */
export interface Trade {
  initiatorId: string;
  targetId: string;
  offeredCardId: string;
  responseCardId?: string;
  timestamp: number;
  status: TradeStatus;
}

/** 每日交易状态 */
export interface DailyTradeStatus {
  /** 是否已发起过交易 */
  hasInitiatedToday: boolean;
  /** 是否已收到交易提议 */
  hasReceivedOfferToday: boolean;
  /** 是否已参与过任何交易（发起或被发起） - 规则 5.2：仅能参与一次交易 */
  hasTradedToday: boolean;
}

/** 卡牌选择状态（用于击杀后选择手牌） */
export interface CardSelectionState {
  selectingPlayerId: string;
  availableCards: CardRef[];
  victimId: string;
  deadline: number;
}

/** 每日交易跟踪 */
export interface DailyTradeTracker {
  [playerId: string]: DailyTradeStatus;
}

/** 当前活跃交易 */
export interface ActiveTrade {
  tradeId: string;
  initiatorId: string;
  targetId: string;
  offeredCard: CardRef;
  responseCard?: CardRef;
  expiresAt: number;
}
