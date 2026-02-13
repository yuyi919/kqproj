"use client";

/**
 * Phase Result 应用器
 *
 * 职责：将所有阶段的变更应用到游戏状态
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState } from "../../types";
import type { PhaseResult } from "./types";

/**
 * 应用所有阶段的变更到游戏状态
 */
export function applyPhaseResult(
  G: BGGameState,
  _random: RandomAPI,
  result: PhaseResult,
): void {
  // 1. 应用状态更新
  if (result.stateUpdates) {
    Object.assign(G, result.stateUpdates);
  }

  // 2. 更新 deadPlayers（包含攻击阶段和残骸化阶段的死亡）
  if (result.deadPlayers && result.deadPlayers.size > 0) {
    for (const playerId of result.deadPlayers) {
      const secret = G.secrets[playerId];
      const player = G.players[playerId];
      if (secret && secret.status === "alive") {
        secret.status = "dead";
      }
      if (player && player.status === "alive") {
        player.status = "dead";
      }
    }
  }

  // 注意：失败的行动已在 phase2-attack.ts 中直接标记（G.nightActions 中的 action 对象）
  // 此处无需额外处理
}
