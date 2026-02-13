"use client";

/**
 * Phase 3: 检定
 *
 * 职责：处理 check 行动
 * 规则：查验已死亡玩家的死因是否为 witch_killer 所致
 */

import type { BGGameState } from "../../types";
import type { PhaseResult } from "./types";
import { Mutations, TMessageBuilder } from "../../utils";

/**
 * 处理检定行动
 */
export function processCheckActions(
  G: Readonly<BGGameState>,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  const result: PhaseResult = {
    stateUpdates: { ...previousResult.stateUpdates },
    deadPlayers: new Set(previousResult.deadPlayers),
    barrierPlayers: new Set(previousResult.barrierPlayers),
  };

  // 处理每个检定行动
  for (const action of G.nightActions) {
    if (!action.card || action.card.type !== "check") continue;
    if (!action.targetId) continue;

    const targetSecret = G.secrets[action.targetId];
    const targetPlayer = G.players[action.targetId];
    const actorPlayer = G.players[action.playerId];
    if (!targetSecret || !targetPlayer || !actorPlayer) continue;

    const isWitchKiller = targetSecret.deathCause === "witch_killer";
    const deathCause = targetSecret.deathCause || "wreck";

    // 添加检定结果消息
    Mutations.msg(G, 
      TMessageBuilder.createCheckResult(
        action.playerId,
        action.targetId,
        isWitchKiller,
        deathCause,
      ),
    );

    Mutations.addRevealedInfo(G, action.playerId, "check", {
      targetId: action.targetId,
      isWitchKiller,
      deathCause,
    });
  }

  return result;
}
