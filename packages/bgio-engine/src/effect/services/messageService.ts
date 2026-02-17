"use client";

/**
 * MessageService - 消息服务
 *
 * 职责：封装消息添加和揭示信息功能
 * 提供便捷方法来处理常见的消息场景
 */

import { Effect } from "effect";
import { TMessageBuilder } from "../../domain/services/messageBuilder";
import type {
  BGGameState,
  CardType,
  PrivatePlayerInfo,
  RevealedInfoType,
  TMessage,
} from "../../types";
import { Mutations } from "../../utils";
import type { IGameStateRef } from "../context/gameStateRef";
import { GameStateRef } from "../context/gameStateRef";
import { type AttackError, PlayerNotFoundError } from "../errors";

/**
 * 消息服务接口
 */
export interface IMessageService {
  /** 添加消息到游戏状态 */
  readonly addMessage: (message: TMessage) => Effect.Effect<void>;

  /** 添加揭示信息 */
  readonly addRevealedInfo: (
    playerId: string,
    type: RevealedInfoType,
    content: unknown,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理攻击失败 - actor_dead */
  readonly handleAttackFailureActorDead: (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理攻击失败 - target_witch_killer_failed */
  readonly handleAttackFailureWitchKillerFailed: (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理攻击失败 - quota_exceeded */
  readonly handleAttackFailureQuotaExceeded: (
    actionId: string,
    actorId: string,
    cardType: CardType,
  ) => Effect.Effect<void>;

  /** 处理攻击失败 - target_already_dead */
  readonly handleAttackFailureTargetDead: (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理攻击失败 - barrier_protected */
  readonly handleAttackFailureBarrierProtected: (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 按失败原因统一分发攻击失败消息 */
  readonly handleAttackFailureByReason: (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
    reason: AttackError,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理攻击成功 */
  readonly handleAttackSuccess: (
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => Effect.Effect<void>;

  /** 处理目标死亡消息 */
  readonly handleTargetDead: (
    targetId: string,
    attackerId: string,
  ) => Effect.Effect<void>;

  /** 处理因 kill_magic 成功击杀而导致的 witch 转化 */
  readonly handleTransformWitch: (
    actorId: string,
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理获得 witch_killer */
  readonly handleWitchKillerObtained: (
    actorId: string,
    fromPlayerId: string,
    mode?: "active" | "passive",
  ) => Effect.Effect<void, PlayerNotFoundError>;

  /** 处理私密消息 */
  readonly handlePrivateMessage: (
    actorId: string,
    content: string,
  ) => Effect.Effect<void>;
}

/**
 * MessageService Tag
 */
export class MessageService extends Effect.Service<MessageService>()(
  "MessageService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const gameStateRef = yield* GameStateRef;
      return createMessageService(gameStateRef);
    }),
  },
) {
  static pure = createMessageService;
}

/**
 * 创建 MessageService - 接收 GameStateRef 作为参数
 */
export function createMessageService(
  gameStateRef: IGameStateRef,
): IMessageService {
  const requireSecret = (
    state: BGGameState,
    playerId: string,
  ): Effect.Effect<PrivatePlayerInfo, PlayerNotFoundError> =>
    Effect.gen(function* () {
      if (!Object.hasOwn(state.secrets, playerId)) {
        return yield* new PlayerNotFoundError({ playerId });
      }
      return state.secrets[playerId];
    });

  const addMessage = (message: TMessage) =>
    Effect.gen(function* () {
      const G = yield* gameStateRef.get();
      Mutations.msg(G, message);
    });

  const addRevealedInfo = (
    playerId: string,
    type: RevealedInfoType,
    content: unknown,
  ) =>
    Effect.gen(function* () {
      const G = yield* gameStateRef.get();
      const secret = yield* requireSecret(G, playerId);
      secret.revealedInfo.push({
        type,
        content,
        timestamp: Date.now(),
      });
    });

  const handleAttackFailureActorDead = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) =>
    Effect.gen(function* () {
      yield* addMessage(
        TMessageBuilder.createAttackResult(
          actorId,
          targetId,
          cardType,
          "fail",
          "actor_dead",
        ),
      );
      yield* addRevealedInfo(actorId, "attack_failed", {
        targetId,
        reason: "actor_dead",
      });
    });

  const handleAttackFailureWitchKillerFailed = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) =>
    Effect.gen(function* () {
      yield* addMessage(
        TMessageBuilder.createAttackResult(
          actorId,
          targetId,
          cardType,
          "fail",
          "target_witch_killer_failed",
        ),
      );
      yield* addRevealedInfo(actorId, "attack_failed", {
        targetId,
        reason: "target_witch_killer_failed",
      });
    });

  const handleAttackFailureQuotaExceeded = (
    actionId: string,
    actorId: string,
    cardType: CardType,
  ) =>
    addMessage(
      TMessageBuilder.createAttackExcessNotification(
        actorId,
        cardType,
        "quota_exceeded",
      ),
    );

  const handleAttackFailureTargetDead = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) =>
    Effect.gen(function* () {
      yield* addMessage(
        TMessageBuilder.createAttackResult(
          actorId,
          targetId,
          cardType,
          "fail",
          "target_already_dead",
        ),
      );
      yield* addRevealedInfo(actorId, "attack_failed", {
        targetId,
        reason: "target_already_dead",
      });
    });

  const handleAttackFailureBarrierProtected = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) =>
    Effect.gen(function* () {
      yield* addMessage(
        TMessageBuilder.createAttackResult(
          actorId,
          targetId,
          cardType,
          "fail",
          "barrier_protected",
        ),
      );
      yield* addMessage(
        TMessageBuilder.createBarrierApplied(targetId, actorId),
      );
      yield* addRevealedInfo(actorId, "attack_failed", {
        targetId,
        reason: "barrier_protected",
      });
      yield* addRevealedInfo(targetId, "barrier", {
        attackerId: actorId,
        cardType,
      });

      const state = yield* gameStateRef.get();
      yield* requireSecret(state, targetId);
      yield* gameStateRef.update((current) => {
        current.secrets[targetId].hasBarrier = false;
        return current;
      });
    });

  return {
    addMessage,
    addRevealedInfo,

    handleAttackFailureActorDead,
    handleAttackFailureWitchKillerFailed,
    handleAttackFailureQuotaExceeded,
    handleAttackFailureTargetDead,
    handleAttackFailureBarrierProtected,

    handleAttackFailureByReason: (
      actionId,
      actorId,
      targetId,
      cardType,
      reason,
    ) => {
      switch (reason._tag) {
        case "ActorDeadError":
          return handleAttackFailureActorDead(
            actionId,
            actorId,
            targetId,
            cardType,
          );
        case "TargetWitchKillerFailedError":
          return handleAttackFailureWitchKillerFailed(
            actionId,
            actorId,
            targetId,
            cardType,
          );
        case "QuotaExceededError":
          return handleAttackFailureQuotaExceeded(actionId, actorId, cardType);
        case "TargetAlreadyDeadError":
          return handleAttackFailureTargetDead(
            actionId,
            actorId,
            targetId,
            cardType,
          );
        case "BarrierProtectedError":
          return handleAttackFailureBarrierProtected(
            actionId,
            actorId,
            targetId,
            cardType,
          );
      }
    },

    handleAttackSuccess: (actorId, targetId, cardType) =>
      addMessage(
        TMessageBuilder.createAttackResult(
          actorId,
          targetId,
          cardType,
          "success",
        ),
      ),

    handleTargetDead: (targetId, attackerId) =>
      addMessage(TMessageBuilder.createDeadResponse(targetId, attackerId)),

    handleTransformWitch: (actorId) =>
      Effect.gen(function* () {
        yield* addMessage(TMessageBuilder.createTransformWitch(actorId));
        yield* addRevealedInfo(actorId, "witch_transform", {
          reason: "kill_success",
        });
      }),

    handleWitchKillerObtained: (actorId, fromPlayerId, mode = "active") =>
      Effect.gen(function* () {
        yield* addMessage(
          TMessageBuilder.createWitchKillerObtainedNotification(
            actorId,
            fromPlayerId,
            mode,
          ),
        );
        yield* Effect.logInfo(
          "witch_killer ownership notification emitted",
        ).pipe(
          Effect.annotateLogs({
            source: "message_service",
            actorId,
            fromPlayerId,
            mode,
          }),
        );
        yield* addRevealedInfo(actorId, "witch_killer_obtained", {
          fromPlayerId,
          reason: mode === "active" ? "kill_holder" : "forced_wreck_transfer",
        });
      }),

    handlePrivateMessage: (actorId, content) =>
      addMessage(
        TMessageBuilder.createPrivateMessageResponse(actorId, content),
      ),
  };
}
