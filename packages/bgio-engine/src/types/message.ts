"use client";

/**
 * 消息系统类型定义 (DDD + CQRS)
 *
 * 消息种类：
 * - announcement: 公开公告（所有人可见）
 * - public_action: 公开行动（所有人可见）
 * - private_action: 私密行动（仅执行者可见）
 * - witnessed_action: 见证行动（执行者 + 目标可见）
 */

import type { CardRef } from "./card";
import type { CardType, DeathCause, GamePhase } from "./core";

/**
 * 基础消息接口
 */
export interface BaseMessage {
  id: string;
  timestamp: number;
}

/**
 * 消息种类：基于业务概念分类
 */
export type TMessage =
  | AnnouncementMessage
  | PublicActionMessage
  | PrivateActionMessage
  | PrivateResponseMessage
  | WitnessedActionMessage;

// ==================== 1. 公告（公开）===================

/**
 * 系统公告，对所有玩家公开
 */
export type AnnouncementMessage =
  | PhaseTransitionAnnouncement
  | VoteSummaryAnnouncement
  | DeathListAnnouncement
  | DeathRecordAnnouncement
  | SystemAnnouncement;

export interface PhaseTransitionAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "phase_transition";
  from: GamePhase;
  to: GamePhase;
}

export interface VoteSummaryAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "vote_summary";
  votes: Array<{ voterId: string; targetId: string }>;
  imprisonedId: string | null;
  isTie: boolean;
}

export interface DeathListAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "death_list";
  deathIds: string[];
}

export interface DeathRecordAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "death_record";
  playerId: string;
  dropped: CardRef[];
}

/**
 * 通用系统公告（携带格式化文本）
 * 用于无法用结构化数据表示的公告
 */
export interface SystemAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "system";
  content: string;
  status?: "hidden";
}

// ==================== 2. 公开行动 ====================

/**
 * 玩家执行的、对所有人公开的行动
 */
export type PublicActionMessage = VoteAction | PassAction | SayAction;

export interface VoteAction extends BaseMessage {
  kind: "public_action";
  type: "vote";
  actorId: string;
  targetId: string;
}

export interface PassAction extends BaseMessage {
  kind: "public_action";
  type: "pass";
  actorId: string;
}

export interface SayAction extends BaseMessage {
  kind: "public_action";
  type: "say";
  actorId: string;
  content: string;
}

// ==================== 3. 私密行动（仅执行者可见）===================

/**
 * 玩家执行的、仅自己知道的行动
 */
export type PrivateActionMessage =
  | UseCardAction
  | AttackResultAction
  | TransformWitchAction
  | WreckAction
  | AttackExcessNotification
  | TradeOfferMessage
  | TradeResponseMessage;

export interface UseCardAction extends BaseMessage {
  kind: "private_action";
  type: "use_card";
  actorId: string;
  cardType: CardType;
  targetId?: string;
}

export interface AttackResultAction extends BaseMessage {
  kind: "private_action";
  type: "attack_result";
  actorId: string;
  targetId: string;
  cardType: CardType;
  result: "success" | "fail";
  failReason?:
    | "barrier_protected"
    | "target_already_dead"
    | "target_witch_killer_failed"
    | "actor_dead";
}

export interface TransformWitchAction extends BaseMessage {
  kind: "private_action";
  type: "transform_witch";
  actorId: string;
}

export interface WreckAction extends BaseMessage {
  kind: "private_action";
  type: "wreck";
  actorId: string;
}

/**
 * 攻击超额通知（新增）
 */
export interface AttackExcessNotification extends BaseMessage {
  kind: "private_action";
  type: "attack_excess";
  actorId: string;
  cardType: CardType;
  reason: "quota_exceeded";
}

/**
 * 交易提议消息（新增）
 */
export interface TradeOfferMessage extends BaseMessage {
  kind: "private_action";
  type: "trade_offer";
  actorId: string;
  targetId: string;
  offeredCardId: string;
}

/**
 * 交易响应消息（新增）
 */
export interface TradeResponseMessage extends BaseMessage {
  kind: "private_action";
  type: "trade_response";
  actorId: string;
  targetId: string;
  accepted: boolean;
  responseCardId?: string;
}

// ==================== 4. 私密响应（默认仅actor可见）===================

/**
 * 仅玩家自己知道的接收到的响应
 */
export type PrivateResponseMessage =
  | PrivateMessageResponse
  | BarrierResponse
  | DeadResponse
  | WitchKillerObtainedNotification
  | CheckResultAction
  | DetectResultAction;

export interface PrivateMessageResponse extends BaseMessage {
  kind: "private_response";
  type: "private_message";
  actorId: string;
  content: string;
}

export interface BarrierResponse extends BaseMessage {
  kind: "private_response";
  type: "barrier_applied";
  actorId: string;
  attackerId?: string;
}

export interface DeadResponse extends BaseMessage {
  kind: "private_response";
  type: "dead_response";
  actorId: string;
  attackerId?: string;
}

export interface WitchKillerObtainedNotification extends BaseMessage {
  kind: "private_response";
  type: "witch_killer_obtained";
  actorId: string;
  fromPlayerId: string;
  mode: "active" | "passive";
}

export interface CheckResultAction extends BaseMessage {
  kind: "private_response";
  type: "check_result";
  actorId: string;
  targetId: string;
  isWitchKiller: boolean;
  deathCause: DeathCause;
}

export interface DetectResultAction extends BaseMessage {
  kind: "private_response";
  type: "detect_result";
  actorId: string;
  targetId: string;
  handCount: number;
  seenCard?: CardType;
}
// ==================== 5. 见证行动（actor + target 可见）===================

/**
 * 涉及两个玩家，双方都知情的行动
 */
export type WitnessedActionMessage = CardReceivedAction;

export interface CardReceivedAction extends BaseMessage {
  kind: "witnessed_action";
  type: "card_received";
  actorId: string; // 接收者
  targetId: string; // 受害者
  receivedCards: CardRef[];
}
