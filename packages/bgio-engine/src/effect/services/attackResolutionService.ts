"use client";

import { Effect } from "effect";
import { Refinements } from "../../domain/refinements";
import { KILL_QUOTA } from "../../game/resolution/types";
import type {
  PendingDistribution,
  PhaseResult,
} from "../../game/resolution/types";
import type { CardRef, CardType, DeathCause } from "../../types";
import { GameStateRef, type IGameStateRef } from "../context/gameStateRef";
import {
  ActorDeadError,
  type AttackError,
  BarrierProtectedError,
  PlayerNotAliveError,
  PlayerNotFoundError,
  QuotaExceededError,
  TargetAlreadyDeadError,
  TargetWitchKillerFailedError,
} from "../errors";
import { type IMessageService, MessageService } from "./messageService";
import { type IPlayerStateService, PlayerStateService } from "./playerStateService";
import {
  type IPriorityService,
  PriorityService,
  PriorityServiceLayer,
} from "./priorityService";

export interface KillResult {
  readonly record: {
    round: number;
    playerId: string;
    cause: DeathCause;
    killerId?: string;
    droppedCards: CardRef[];
    cardReceivers: Record<string, string[]>;
  };
  readonly droppedCards: CardRef[];
}

export interface ExecutedActionInfo {
  readonly playerId: string;
  readonly targetId: string;
  readonly cardType: CardType;
  readonly droppedCards: CardRef[];
}

export interface AttackResolutionResult {
  readonly executedActions: Set<string>;
  readonly executedActionInfos: ReadonlyArray<ExecutedActionInfo>;
  readonly failedActions: Array<{
    actionId: string;
    reason: AttackError;
  }>;
  readonly killedByWitchKiller: Set<string>;
  readonly deadPlayers: Set<string>;
  readonly consumedBarriers: Set<string>;
}

export type AttackResolutionServiceError =
  | PlayerNotFoundError
  | PlayerNotAliveError;

type AttackValidationResult =
  | { readonly _tag: "RulePass" }
  | {
      readonly _tag: "RuleFailure";
      readonly reason: AttackError;
    };

function toAttackValidationFailure(
  reason: AttackError,
): AttackValidationResult {
  return {
    _tag: "RuleFailure",
    reason,
  };
}

function createConsumedBarrierSnapshot(
  originalBarrierPlayers: Set<string>,
  consumedBarriers: Set<string>,
): Set<string> {
  if (consumedBarriers.size === 0) {
    return new Set(originalBarrierPlayers);
  }

  const remaining = new Set<string>();
  for (const playerId of originalBarrierPlayers) {
    if (!consumedBarriers.has(playerId)) {
      remaining.add(playerId);
    }
  }
  return remaining;
}

function appendPendingDistribution(
  result: PhaseResult,
  distribution: PendingDistribution,
): void {
  result.pendingDistributions = result.pendingDistributions ?? [];
  result.pendingDistributions.push(distribution);
}

export interface IAttackResolutionService {
  readonly resolvePhase2: (
    previousResult: Readonly<PhaseResult>,
  ) => Effect.Effect<PhaseResult, AttackResolutionServiceError>;

  readonly processAttackActions: (
    barrierPlayers: Set<string>,
  ) => Effect.Effect<AttackResolutionResult, AttackResolutionServiceError>;

  readonly executeKill: (
    targetId: string,
    cause: DeathCause,
    killerId: string,
  ) => Effect.Effect<KillResult, AttackResolutionServiceError>;
}

export class AttackResolutionService extends Effect.Service<AttackResolutionService>()(
  "AttackResolutionService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const priorityService = yield* PriorityService;
      const playerStateService = yield* PlayerStateService;
      const messageService = yield* MessageService;
      const gameStateRef = yield* GameStateRef;

      return {
        resolvePhase2: (previousResult: Readonly<PhaseResult>) =>
          resolvePhase2Effect(
            priorityService,
            playerStateService,
            messageService,
            gameStateRef,
            previousResult,
          ),

        processAttackActions: (barrierPlayers: Set<string>) =>
          processAttackActionsEffect(
            priorityService,
            playerStateService,
            messageService,
            gameStateRef,
            barrierPlayers,
          ),

        executeKill: (targetId: string, cause: DeathCause, killerId: string) =>
          playerStateService.killPlayer(targetId, cause, killerId),
      } satisfies IAttackResolutionService;
    }),
    dependencies: [
      PriorityServiceLayer,
      PlayerStateService.Default,
      MessageService.Default,
    ],
  },
) {}

function resolvePhase2Effect(
  priorityService: IPriorityService,
  playerStateService: IPlayerStateService,
  messageService: IMessageService,
  gameStateRef: IGameStateRef,
  previousResult: Readonly<PhaseResult>,
): Effect.Effect<PhaseResult, AttackResolutionServiceError> {
  return Effect.gen(function* () {
    const barrierPlayers = previousResult.barrierPlayers ?? new Set<string>();
    const resolutionResult = yield* processAttackActionsEffect(
      priorityService,
      playerStateService,
      messageService,
      gameStateRef,
      barrierPlayers,
    );
    const state = yield* gameStateRef.get();

    const result: PhaseResult = {
      stateUpdates: { ...previousResult.stateUpdates },
      deadPlayers: resolutionResult.deadPlayers,
      barrierPlayers: createConsumedBarrierSnapshot(
        barrierPlayers,
        resolutionResult.consumedBarriers,
      ),
      attackResult: {
        killedByWitchKiller: resolutionResult.killedByWitchKiller,
        executedActions: resolutionResult.executedActions,
        failedActions: resolutionResult.failedActions,
      },
    };

    const selectionDeadline =
      Date.now() + state.config.cardSelectionDuration * 1000;

    for (const actionInfo of resolutionResult.executedActionInfos) {
      if (Refinements.isKillMagicCard(actionInfo.cardType)) {
        (result.stateUpdates.cardSelection ||= {})[actionInfo.playerId] = {
          selectingPlayerId: actionInfo.playerId,
          availableCards: actionInfo.droppedCards,
          victimId: actionInfo.targetId,
          deadline: selectionDeadline,
        };

        appendPendingDistribution(result, {
          type: "killerSelect",
          victimId: actionInfo.targetId,
          cards: actionInfo.droppedCards,
          killerId: actionInfo.playerId,
        });

        yield* messageService.handlePrivateMessage(
          actionInfo.playerId,
          `请选择一张卡牌（${actionInfo.droppedCards.length}张可选）`,
        );
      } else if (Refinements.isWitchKillerCard(actionInfo.cardType)) {
        appendPendingDistribution(result, {
          type: "skipKiller",
          victimId: actionInfo.targetId,
          cards: actionInfo.droppedCards,
          killerId: actionInfo.playerId,
        });
      }
    }

    return result;
  });
}

function processAttackActionsEffect(
  priorityService: IPriorityService,
  playerStateService: IPlayerStateService,
  messageService: IMessageService,
  gameStateRef: IGameStateRef,
  barrierPlayers: Set<string>,
): Effect.Effect<AttackResolutionResult, AttackResolutionServiceError> {
  return Effect.gen(function* () {
    const G = yield* gameStateRef.get();
    const attackActions = priorityService.sortAttackActions(G.nightActions);

    const witchKillerUsed = priorityService.isWitchKillerUsed(attackActions);
    const maxKill = witchKillerUsed
      ? KILL_QUOTA.withWitchKiller
      : KILL_QUOTA.withoutWitchKiller;

    const executedActions = new Set<string>();
    const executedActionInfos: ExecutedActionInfo[] = [];
    const failedActions: Array<{
      actionId: string;
      reason: AttackError;
    }> = [];
    const killedByWitchKiller = new Set<string>();
    const deadPlayers = new Set<string>();
    const consumedBarriers = new Set<string>();

    let protectedWitchKillerHolderId: string | null = null;
    const deadPlayersInPhase = new Set<string>();
    const killedTargetsInPhase = new Set<string>();
    let processedKillCount = 0;

    const asRuleFailure = (error: AttackError) =>
      Effect.succeed(toAttackValidationFailure(error));

    for (const action of attackActions) {
      if (!action.card || !action.targetId) continue;

      const targetId = action.targetId;
      const cardType = action.card.type;
      const isKillAttack = Refinements.isKillMagicCard(action.card);

      const validation = yield* Effect.gen(function* () {
        const actorAlive = yield* playerStateService.isAlive(action.playerId);
        if (deadPlayersInPhase.has(action.playerId) || !actorAlive) {
          return yield* new ActorDeadError({ actorId: action.playerId });
        }

        if (
          protectedWitchKillerHolderId &&
          targetId === protectedWitchKillerHolderId
        ) {
          if (isKillAttack) {
            processedKillCount++;
          }
          return yield* new TargetWitchKillerFailedError({
            targetId,
          });
        }

        if (isKillAttack) {
          if (processedKillCount >= maxKill) {
            return yield* new QuotaExceededError({
              current: processedKillCount,
              max: maxKill,
            });
          }
          processedKillCount++;
        }

        const isTargetAlive = yield* playerStateService.isAlive(targetId);
        if (!isTargetAlive || killedTargetsInPhase.has(targetId)) {
          return yield* new TargetAlreadyDeadError({ targetId });
        }

        if (barrierPlayers.has(targetId)) {
          return yield* new BarrierProtectedError({ targetId });
        }
      }).pipe(
        Effect.as<AttackValidationResult>({ _tag: "RulePass" }),
        Effect.catchTags({
          ActorDeadError: asRuleFailure,
          TargetWitchKillerFailedError: asRuleFailure,
          QuotaExceededError: asRuleFailure,
          TargetAlreadyDeadError: asRuleFailure,
          BarrierProtectedError: asRuleFailure,
        }),
      );

      if (validation._tag === "RuleFailure") {
        action.executed = false;
        action.failedReason = validation.reason;
        failedActions.push({
          actionId: action.id,
          reason: validation.reason,
        });

        if (validation.reason._tag === "ActorDeadError") {
          deadPlayersInPhase.add(action.playerId);
        }
        if (validation.reason._tag === "BarrierProtectedError") {
          consumedBarriers.add(targetId);
        }

        yield* messageService.handleAttackFailureByReason(
          action.id,
          action.playerId,
          targetId,
          cardType,
          validation.reason,
        );
        continue;
      }

      executedActions.add(action.id);
      action.executed = true;
      deadPlayersInPhase.add(action.playerId);
      killedTargetsInPhase.add(targetId);

      const targetSecret = yield* playerStateService.getPlayerSecrets(
        targetId,
      );
      const targetHadWitchKiller = targetSecret.witchKillerHolder;
      const droppedCards = [...targetSecret.hand];

      const cause: DeathCause =
        Refinements.isWitchKillerCard(cardType) ? "witch_killer" : "kill_magic";

      yield* playerStateService.killPlayer(targetId, cause, action.playerId);
      yield* messageService.handleAttackSuccess(
        action.playerId,
        targetId,
        cardType,
      );
      yield* messageService.handleTargetDead(targetId, action.playerId);

      executedActionInfos.push({
        playerId: action.playerId,
        targetId,
        cardType,
        droppedCards,
      });

      deadPlayers.add(targetId);
      if (Refinements.isWitchKillerCard(cardType)) {
        killedByWitchKiller.add(targetId);
        protectedWitchKillerHolderId = action.playerId;
      } else {
        const actorSecretBeforeTransform = yield* playerStateService.getPlayerSecrets(
          action.playerId,
        );
        const shouldNotifyTransform = !actorSecretBeforeTransform.isWitch;

        yield* gameStateRef.update((state) => {
          const actorSecret = state.secrets[action.playerId];
          if (actorSecret) {
            actorSecret.consecutiveNoKillRounds = 0;
            actorSecret.isWitch = true;
          }
          return state;
        });
        if (shouldNotifyTransform) {
          yield* messageService.handleTransformWitch(action.playerId);
        }

        if (targetHadWitchKiller) {
          yield* Effect.logInfo("witch_killer ownership transfer planned").pipe(
            Effect.annotateLogs({
              source: "attack_resolution_service.phase2",
              reason: "kill_holder",
              fromPlayerId: targetId,
              toPlayerId: action.playerId,
            }),
          );
          yield* messageService.handleWitchKillerObtained(
            action.playerId,
            targetId,
          );
          yield* playerStateService.transferWitchKiller(
            action.playerId,
            droppedCards,
            targetId,
          );
        }
      }
    }

    return {
      executedActions,
      executedActionInfos,
      failedActions,
      killedByWitchKiller,
      deadPlayers,
      consumedBarriers,
    };
  });
}
