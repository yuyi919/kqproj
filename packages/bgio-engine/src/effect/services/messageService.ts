"use client";

/**
 * MessageService - 消息服务
 *
 * 职责：
 * 1. 统一写入公共消息和私密响应
 * 2. 封装攻击成功/失败的消息分发
 * 3. 维护 revealedInfo 的结构化记录
 */

import { Effect } from "effect";
import { TMessageBuilder } from "../../domain/services/messageBuilder";
import type {
  BGGameState,
  CardRef,
  CardType,
  DeathCause,
  GamePhase,
  Messages,
  PrivatePlayerInfo,
  RevealedInfoType,
  TMessage,
} from "../../types";
import { Mutations } from "../../utils";
import type { IGameStateRef } from "../context/gameStateRef";
import { GameStateRef } from "../context/gameStateRef";
import { type AttackError, PlayerNotFoundError } from "../errors";

export class MessageServiceImpl {
  constructor(private readonly gameStateRef: IGameStateRef) {}

  private readonly requireSecret = (
    state: BGGameState,
    playerId: string,
  ): Effect.Effect<PrivatePlayerInfo, PlayerNotFoundError> =>
    Effect.gen(function* () {
      if (!Object.hasOwn(state.secrets, playerId)) {
        return yield* new PlayerNotFoundError({ playerId });
      }
      return state.secrets[playerId];
    });

  /** 添加消息到游戏状态 */
  addMessage = (message: TMessage) => {
    const gameStateRef = this.gameStateRef;
    return Effect.gen(function* () {
      const G = yield* gameStateRef.get();
      Mutations.msg(G, message);
    });
  };

  /** 添加揭示信息 */
  addRevealedInfo = (
    playerId: string,
    type: RevealedInfoType,
    content: unknown,
  ): Effect.Effect<void, PlayerNotFoundError> => {
    const gameStateRef = this.gameStateRef;
    const requireSecret = this.requireSecret;
    return Effect.gen(function* () {
      const G = yield* gameStateRef.get();
      const secret = yield* requireSecret(G, playerId);
      secret.revealedInfo.push({
        type,
        content,
        timestamp: Date.now(),
      });
    });
  };

  sendPhaseTransition = (from: GamePhase, to: GamePhase) =>
    this.addMessage(TMessageBuilder.createPhaseTransition(from, to));

  sendVoteSummary = (
    votes: Array<{ voterId: string; targetId: string }>,
    imprisonedId: string | null,
    isTie: boolean,
  ) =>
    this.addMessage(
      TMessageBuilder.createVoteSummary(votes, imprisonedId, isTie),
    );

  sendDeathList = (deathIds: string[]) =>
    this.addMessage(TMessageBuilder.createDeathList(deathIds));

  sendDeathRecord = (playerId: string, dropped: CardRef[]) =>
    this.addMessage(TMessageBuilder.createDeathRecord(playerId, dropped));

  sendSystem = (
    content: string,
    status?: Messages.SystemAnnouncement["status"],
  ) => this.addMessage(TMessageBuilder.createSystem(content, status));

  sendHiddenSystem = (content: string) =>
    this.addMessage(TMessageBuilder.createHiddenSystem(content));

  sendVote = (actorId: string, targetId: string) =>
    this.addMessage(TMessageBuilder.createVote(actorId, targetId));

  sendPass = (actorId: string) =>
    this.addMessage(TMessageBuilder.createPass(actorId));

  sendSay = (actorId: string, content: string) =>
    this.addMessage(TMessageBuilder.createSay(actorId, content));

  sendUseCard = (actorId: string, cardType: CardType, targetId?: string) =>
    this.addMessage(TMessageBuilder.createUseCard(actorId, cardType, targetId));

  sendAttackResult = (
    actorId: string,
    targetId: string,
    cardType: CardType,
    result: "success" | "fail",
    failReason?:
      | "barrier_protected"
      | "target_already_dead"
      | "target_witch_killer_failed"
      | "actor_dead",
  ) =>
    this.addMessage(
      TMessageBuilder.createAttackResult(
        actorId,
        targetId,
        cardType,
        result,
        failReason,
      ),
    );

  sendTransformWitch = (actorId: string) =>
    this.addMessage(TMessageBuilder.createTransformWitch(actorId));

  sendWreck = (actorId: string) =>
    this.addMessage(TMessageBuilder.createWreck(actorId));

  sendAttackExcessNotification = (
    actorId: string,
    cardType: CardType,
    reason: "quota_exceeded",
  ) =>
    this.addMessage(
      TMessageBuilder.createAttackExcessNotification(actorId, cardType, reason),
    );

  sendTradeOffer = (actorId: string, targetId: string, offeredCardId: string) =>
    this.addMessage(
      TMessageBuilder.createTradeOffer(actorId, targetId, offeredCardId),
    );

  sendTradeResponse = (
    actorId: string,
    targetId: string,
    accepted: boolean,
    responseCardId?: string,
  ) =>
    this.addMessage(
      TMessageBuilder.createTradeResponse(
        actorId,
        targetId,
        accepted,
        responseCardId,
      ),
    );

  sendBarrierApplied = (actorId: string, attackerId?: string) =>
    this.addMessage(TMessageBuilder.createBarrierApplied(actorId, attackerId));

  sendDeadResponse = (actorId: string, attackerId?: string) =>
    this.addMessage(TMessageBuilder.createDeadResponse(actorId, attackerId));

  sendWitchKillerObtained = (
    actorId: string,
    fromPlayerId: string,
    mode: "active" | "passive",
  ) =>
    this.addMessage(
      TMessageBuilder.createWitchKillerObtainedNotification(
        actorId,
        fromPlayerId,
        mode,
      ),
    );

  sendCheckResult = (
    actorId: string,
    targetId: string,
    isWitchKiller: boolean,
    deathCause: DeathCause,
  ) =>
    this.addMessage(
      TMessageBuilder.createCheckResult(
        actorId,
        targetId,
        isWitchKiller,
        deathCause,
      ),
    );

  sendDetectResult = (
    actorId: string,
    targetId: string,
    handCount: number,
    seenCard?: CardType,
  ) =>
    this.addMessage(
      TMessageBuilder.createDetectResult(
        actorId,
        targetId,
        handCount,
        seenCard,
      ),
    );

  sendPrivateMessage = (actorId: string, content: string) =>
    this.addMessage(
      TMessageBuilder.createPrivateMessageResponse(actorId, content),
    );

  sendCardReceived = (
    actorId: string,
    targetId: string,
    receivedCards: CardRef[],
  ) =>
    this.addMessage(
      TMessageBuilder.createCardReceived(actorId, targetId, receivedCards),
    );

  /** 处理攻击失败 - actor_dead */
  handleAttackFailureActorDead = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ): Effect.Effect<void, PlayerNotFoundError> =>
    this.sendAttackResult(
      actorId,
      targetId,
      cardType,
      "fail",
      "actor_dead",
    ).pipe(
      Effect.flatMap(() =>
        this.addRevealedInfo(actorId, "attack_failed", {
          targetId,
          reason: "actor_dead",
        }),
      ),
    );

  /** 处理攻击失败 - target_witch_killer_failed */
  handleAttackFailureWitchKillerFailed = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ): Effect.Effect<void, PlayerNotFoundError> =>
    this.sendAttackResult(
      actorId,
      targetId,
      cardType,
      "fail",
      "target_witch_killer_failed",
    ).pipe(
      Effect.flatMap(() =>
        this.addRevealedInfo(actorId, "attack_failed", {
          targetId,
          reason: "target_witch_killer_failed",
        }),
      ),
    );

  /** 处理攻击失败 - quota_exceeded */
  handleAttackFailureQuotaExceeded = (
    actionId: string,
    actorId: string,
    cardType: CardType,
  ) => this.sendAttackExcessNotification(actorId, cardType, "quota_exceeded");

  /** 处理攻击失败 - target_already_dead */
  handleAttackFailureTargetDead = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ): Effect.Effect<void, PlayerNotFoundError> =>
    this.sendAttackResult(
      actorId,
      targetId,
      cardType,
      "fail",
      "target_already_dead",
    ).pipe(
      Effect.flatMap(() =>
        this.addRevealedInfo(actorId, "attack_failed", {
          targetId,
          reason: "target_already_dead",
        }),
      ),
    );

  /** 处理攻击失败 - barrier_protected */
  handleAttackFailureBarrierProtected = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
  ): Effect.Effect<void, PlayerNotFoundError> => {
    const self = this;
    return Effect.gen(function* () {
      yield* self.sendAttackResult(
        actorId,
        targetId,
        cardType,
        "fail",
        "barrier_protected",
      );
      yield* self.sendBarrierApplied(targetId, actorId);
      yield* self.addRevealedInfo(actorId, "attack_failed", {
        targetId,
        reason: "barrier_protected",
      });
      yield* self.addRevealedInfo(targetId, "barrier", {
        attackerId: actorId,
        cardType,
      });

      const state = yield* self.gameStateRef.get();
      yield* self.requireSecret(state, targetId);
      yield* self.gameStateRef.update((current) => {
        current.secrets[targetId].hasBarrier = false;
        return current;
      });
    });
  };

  /** 按失败原因统一分发攻击失败消息 */
  sendAttackFailureByReason = (
    actionId: string,
    actorId: string,
    targetId: string,
    cardType: CardType,
    reason: AttackError,
  ): Effect.Effect<void, PlayerNotFoundError> => {
    switch (reason._tag) {
      case "ActorDeadError":
        return this.handleAttackFailureActorDead(
          actionId,
          actorId,
          targetId,
          cardType,
        );
      case "TargetWitchKillerFailedError":
        return this.handleAttackFailureWitchKillerFailed(
          actionId,
          actorId,
          targetId,
          cardType,
        );
      case "QuotaExceededError":
        return this.handleAttackFailureQuotaExceeded(
          actionId,
          actorId,
          cardType,
        );
      case "TargetAlreadyDeadError":
        return this.handleAttackFailureTargetDead(
          actionId,
          actorId,
          targetId,
          cardType,
        );
      case "BarrierProtectedError":
        return this.handleAttackFailureBarrierProtected(
          actionId,
          actorId,
          targetId,
          cardType,
        );
    }
  };

  /** 处理攻击成功 */
  handleAttackSuccess = (
    actorId: string,
    targetId: string,
    cardType: CardType,
  ) => this.sendAttackResult(actorId, targetId, cardType, "success");

  /** 处理目标死亡消息 */
  handleTargetDead = (targetId: string, attackerId: string) =>
    this.sendDeadResponse(targetId, attackerId);

  /** 处理 kill_magic 成功击杀触发的 witch 转化 */
  handleTransformWitch = (
    actorId: string,
  ): Effect.Effect<void, PlayerNotFoundError> =>
    this.sendTransformWitch(actorId).pipe(
      Effect.flatMap(() =>
        this.addRevealedInfo(actorId, "witch_transform", {
          reason: "kill_success",
        }),
      ),
    );

  /** 处理获得 witch_killer */
  handleWitchKillerObtained = (
    actorId: string,
    fromPlayerId: string,
    mode: "active" | "passive" = "active",
  ): Effect.Effect<void, PlayerNotFoundError> =>
    this.sendWitchKillerObtained(actorId, fromPlayerId, mode).pipe(
      Effect.tap(() =>
        Effect.logInfo("witch_killer ownership notification emitted").pipe(
          Effect.annotateLogs({
            source: "message_service",
            actorId,
            fromPlayerId,
            mode,
          }),
        ),
      ),
      Effect.flatMap(() =>
        this.addRevealedInfo(actorId, "witch_killer_obtained", {
          fromPlayerId,
          reason: mode === "active" ? "kill_holder" : "forced_wreck_transfer",
        }),
      ),
    );

  /** 处理私密消息 */
  handlePrivateMessage = (actorId: string, content: string) =>
    this.sendPrivateMessage(actorId, content);
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
      return new MessageServiceImpl(gameStateRef);
    }),
  },
) {
  static pure = (gameStateRef: IGameStateRef) =>
    new MessageServiceImpl(gameStateRef);
}
