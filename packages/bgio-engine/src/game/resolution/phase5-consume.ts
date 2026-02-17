"use client";

/**
 * Phase 5: 卡牌消耗
 *
 * 职责：处理所有卡牌的消耗逻辑
 * 规则：
 * - 成功执行的行动：根据 consumable 属性决定是否消耗
 * - witch_killer (consumable: false)：不消耗，成功后转移给击杀者
 * - kill (consumable: true)：成功时消耗
 * - 攻击者死亡：卡牌不消耗，留在亡者手中
 * - 因魔女杀手优先级失败：卡牌不消耗，留在亡者手中
 * - 因攻击超额失败的行动：卡牌不消耗，归还攻击者
 * - 其他失败行动（目标已死、结界等）：仍然消耗卡牌
 */

import type { ActionFailureError, BGGameState } from "../../types";
import { getCardDefinition, Mutations } from "../../utils";
import type { CardConsumption, ConsumptionReason, PhaseResult } from "./types";

/**
 * 处理卡牌消耗
 */
export function processCardConsumption(
  G: Readonly<BGGameState>,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  const result: PhaseResult = {
    stateUpdates: { ...previousResult.stateUpdates },
    deadPlayers: new Set(previousResult.deadPlayers),
    barrierPlayers: new Set(previousResult.barrierPlayers),
    attackResult: previousResult.attackResult,
    wreckTransforms: previousResult.wreckTransforms,
    cardConsumptions: [],
    pendingDistributions: previousResult.pendingDistributions,
  };

  for (const action of G.nightActions) {
    if (!action.card) continue; // 跳过弃权

    const cardDef = getCardDefinition(action.card);
    const isConsumable = cardDef?.consumable ?? true;
    const reason = determineConsumptionReason(
      action.executed,
      action.failedReason,
      isConsumable,
    );

    // 记录消耗信息
    result.cardConsumptions!.push({
      actionId: action.id,
      playerId: action.playerId,
      cardId: action.card.id,
      reason,
    });

    // 实际执行消耗（如果需要）
    if (shouldConsumeCard(reason)) {
      const playerSecret = G.secrets[action.playerId];
      if (playerSecret) {
        const cardIndex = playerSecret.hand.findIndex(
          (c) => c.id === action.card?.id,
        );
        if (cardIndex !== -1) {
          playerSecret.hand.splice(cardIndex, 1);
          G.discardPile.push(action.card!);
        }
      }
    }
  }

  return result;
}

/**
 * 判断消耗原因
 *
 * 规则 4.5：
 * - witch_killer（consumable=false）：无论成功与否都不消耗
 * - 攻击者死亡：卡牌不消耗（留在亡者手中）
 * - witch_killer 成功后针对原持有者的攻击失败：消耗
 * - 目标已死：消耗
 * - 被结界防御：消耗
 * - 攻击超额：不消耗
 */
function determineConsumptionReason(
  executed: boolean | undefined,
  failedReason: ActionFailureError | undefined,
  isConsumable: boolean,
): ConsumptionReason {
  // witch_killer（consumable=false）：无论成功与否都不消耗
  if (!isConsumable) {
    return "executed_non_consumable";
  }

  if (!executed && failedReason?._tag === "ActorDeadError") {
    // 攻击者在结算前已死亡：卡牌不消耗，留在亡者手中
    return "failed_witch_killer_priority";
  }

  if (!executed && failedReason?._tag === "TargetWitchKillerFailedError") {
    // witch_killer 成功后，针对原持有者的攻击失败：消耗
    return "failed_target_dead";
  }

  if (!executed && failedReason?._tag === "QuotaExceededError") {
    // 因攻击超额失败：卡牌不消耗，归还攻击者
    return "failed_quota_exceeded";
  }

  if (executed) {
    // 成功执行且可消耗
    return "executed_consumable";
  }

  if (!executed && failedReason?._tag === "BarrierProtectedError") {
    // 被结界防御：消耗卡牌
    return "failed_barrier";
  }

  if (!executed && failedReason?._tag === "TargetAlreadyDeadError") {
    // 目标已死：消耗卡牌
    return "failed_target_dead";
  }

  // 其他情况：默认消耗
  return "executed_consumable";
}

/**
 * 判断是否应该消耗卡牌
 */
function shouldConsumeCard(reason: ConsumptionReason): boolean {
  switch (reason) {
    case "executed_consumable":
    case "failed_barrier":
    case "failed_target_dead":
      return true;
    case "executed_non_consumable":
    case "failed_quota_exceeded":
    case "failed_witch_killer_priority":
      return false;
    default:
      return false;
  }
}
