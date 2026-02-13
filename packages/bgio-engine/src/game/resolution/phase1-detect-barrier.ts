"use client";

/**
 * Phase 1: 探知与结界
 *
 * 职责：处理 detect 和 barrier 行动
 * 规则：
 * 1. 探知优先结算，看到的是目标使用手牌前的状态
 * 2. witch_killer 在探知结果中显示为 kill
 * 3. 记录结界状态（后续攻击阶段使用）
 */

import type { RandomAPI, BGGameState } from "../../types";
import { Mutations, Refinements, TMessageBuilder } from "../../utils";
import type { PhaseResult } from "./types";

/**
 * 处理探知和结界行动
 */
export function processDetectAndBarrier(
  G: Readonly<BGGameState>,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  const result: PhaseResult = {
    stateUpdates: { ...previousResult.stateUpdates },
    deadPlayers: new Set(previousResult.deadPlayers),
    barrierPlayers: new Set(previousResult.barrierPlayers),
  };

  // 处理每个行动
  for (const action of G.nightActions) {
    // 跳过弃权
    if (!action.card) continue;

    // 处理探知
    if (Refinements.isIntelligenceCard(action.card) && action.targetId) {
      if (action.card.type === "detect") {
        const targetSecret = G.secrets[action.targetId];
        if (targetSecret) {
          const handCount = targetSecret.hand.length;
          // 随机获取一张手牌，如果为 witch_killer 则显示为 kill
          // 注意：如果手牌为空，seenCard 为 undefined
          const rawCard =
            targetSecret.hand.length > 0
              ? targetSecret.hand[random.Die(targetSecret.hand.length) - 1].type
              : undefined;
          const seenCard = rawCard === "witch_killer" ? "kill" : rawCard;

          // 添加探知消息
          const targetPlayer = G.players[action.targetId];
          const actorPlayer = G.players[action.playerId];
          if (targetPlayer && actorPlayer) {
            Mutations.msg(
              G,
              TMessageBuilder.createDetectResult(
                action.playerId,
                action.targetId,
                handCount,
                seenCard,
              ),
            );
          }

          Mutations.addRevealedInfo(G, action.playerId, "detect", {
            targetId: action.targetId,
            handCount,
            seenCard,
          });
        }
      }
    } else if (Refinements.isDefenseCard(action.card)) {
      // 记录结界
      result.barrierPlayers!.add(action.playerId);
    }
  }

  return result;
}
