"use client";

/**
 * TMessageBuilder - 基于 DDD 和 CQRS 的消息构建器
 *
 * 消息只携带结构化数据，不携带展示文本，支持 i18n
 */

import { nanoid } from "nanoid";
import type {
  BGGameState,
  CardRef,
  CardType,
  DeathCause,
  GamePhase,
  Messages,
  TMessage,
} from "../../types";

// ==================== 消息构建器 ====================

export const TMessageBuilder = {
  // ==================== 1. 公告 ====================

  /**
   * 创建阶段转换公告
   */
  createPhaseTransition(from: GamePhase, to: GamePhase): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "announcement",
      type: "phase_transition",
      from,
      to,
    };
  },

  /**
   * 创建投票摘要公告
   */
  createVoteSummary(
    votes: Array<{ voterId: string; targetId: string }>,
    imprisonedId: string | null,
    isTie: boolean,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "announcement",
      type: "vote_summary",
      votes,
      imprisonedId,
      isTie,
    };
  },

  /**
   * 创建死亡列表公告
   */
  createDeathList(deathIds: string[]): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "announcement",
      type: "death_list",
      deathIds,
    };
  },

  /**
   * 创建死亡记录公告
   */
  createDeathRecord(playerId: string, dropped: CardRef[]): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "announcement",
      type: "death_record",
      playerId,
      dropped,
    };
  },

  /**
   * 创建通用系统公告
   */
  createSystem(
    content: string,
    status?: Messages.SystemAnnouncement["status"],
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "announcement",
      type: "system",
      content,
      status,
    };
  },

  /**
   * 创建通用系统公告
   */
  createHiddenSystem(content: string): TMessage {
    return this.createSystem(content, "hidden");
  },

  // ==================== 2. 公开行动 ====================

  /**
   * 创建投票行动
   */
  createVote(actorId: string, targetId: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "public_action",
      type: "vote",
      actorId,
      targetId,
    };
  },

  /**
   * 创建弃权行动
   */
  createPass(actorId: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "public_action",
      type: "pass",
      actorId,
    };
  },

  /**
   * 创建发言行动
   */
  createSay(actorId: string, content: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "public_action",
      type: "say",
      actorId,
      content,
    };
  },

  // ==================== 3. 私密行动 ====================

  /**
   * 创建使用卡牌行动（仅玩家自己可见）
   */
  createUseCard(
    actorId: string,
    cardType: CardType,
    targetId?: string,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "use_card",
      actorId,
      cardType,
      targetId,
    };
  },

  /**
   * 创建攻击结果（仅攻击者可见）
   */
  createAttackResult(
    actorId: string,
    targetId: string,
    cardType: CardType,
    result: "success" | "fail",
    failReason?:
      | "barrier_protected"
      | "target_already_dead"
      | "target_witch_killer_failed"
      | "actor_dead",
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "attack_result",
      actorId,
      targetId,
      cardType,
      result,
      failReason,
    };
  },

  /**
   * 创建魔女化行动（仅玩家自己可见）
   */
  createTransformWitch(actorId: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "transform_witch",
      actorId,
    };
  },

  /**
   * 创建残骸化行动（仅玩家自己可见）
   */
  createWreck(actorId: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "wreck",
      actorId,
    };
  },

  /**
   * 创建攻击超额通知（新增）
   */
  createAttackExcessNotification(
    actorId: string,
    cardType: CardType,
    reason: "quota_exceeded",
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "attack_excess",
      actorId,
      cardType,
      reason,
    };
  },

  /**
   * 创建交易提议消息（新增）
   */
  createTradeOffer(
    actorId: string,
    targetId: string,
    offeredCardId: string,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "trade_offer",
      actorId,
      targetId,
      offeredCardId,
    };
  },

  /**
   * 创建交易响应消息（新增）
   */
  createTradeResponse(
    actorId: string,
    targetId: string,
    accepted: boolean,
    responseCardId?: string,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_action",
      type: "trade_response",
      actorId,
      targetId,
      accepted,
      responseCardId,
    };
  },

  // ==================== 4. 私密响应 ====================

  /**
   * 创建结界反馈消息（仅结界使用者可见）
   */
  createBarrierApplied(actorId: string, attackerId?: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_response",
      type: "barrier_applied",
      actorId,
      attackerId,
    };
  },

  /**
   * 创建你已死亡反馈消息（私密）
   */
  createDeadResponse(actorId: string, attackerId?: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_response",
      type: "dead_response",
      actorId,
      attackerId,
    };
  },

  /**
   * 创建检定结果（仅检定者可见）
   */
  createCheckResult(
    actorId: string,
    targetId: string,
    isWitchKiller: boolean,
    deathCause: DeathCause,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_response",
      type: "check_result",
      actorId,
      targetId,
      isWitchKiller,
      deathCause,
    };
  },

  /**
   * 创建探知结果（仅探知者可见）
   */
  createDetectResult(
    actorId: string,
    targetId: string,
    handCount: number,
    seenCard?: CardType,
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_response",
      type: "detect_result",
      actorId,
      targetId,
      handCount,
      seenCard,
    };
  },

  /**
   * 创建私密消息（仅玩家自己可见）
   */
  createPrivateMessageResponse(actorId: string, content: string): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "private_response",
      type: "private_message",
      actorId,
      content,
    };
  },

  // ==================== 5. 见证行动 ====================

  /**
   * 创建卡牌接收消息（接收者和受害者可见）
   */
  createCardReceived(
    actorId: string,
    targetId: string,
    receivedCards: CardRef[],
  ): TMessage {
    return {
      id: nanoid(),
      timestamp: Date.now(),
      kind: "witnessed_action",
      type: "card_received",
      actorId,
      targetId,
      receivedCards,
    };
  },
};
