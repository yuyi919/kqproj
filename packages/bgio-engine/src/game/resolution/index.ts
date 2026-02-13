"use client";

/**
 * 夜间结算主入口
 *
 * 职责：编排所有结算阶段的 pipeline
 *
 * 阶段顺序：
 * 1. 探知与结界 (detect, barrier)
 * 2. 攻击结算 (witch_killer, kill)
 * 3. 检定 (check)
 * 4. 残骸化 (wreck transformation)
 * 5. 卡牌消耗 (consumption)
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState, PlayerAction } from "../../types";
import { applyPhaseResult } from "./applyPhaseResult";
import { processDetectAndBarrier } from "./phase1-detect-barrier";
import { processAttackActions } from "./phase2-attack";
import { processCheckActions } from "./phase3-check";
import {
  applyWreckDistributions,
  processWreckTransformation,
} from "./phase4-wreck";
import { processCardConsumption } from "./phase5-consume";
import { applyPendingDistributions } from "./services/cardDistribution";
import type { PhaseResult } from "./types";

/**
 * 解析夜间行动
 *
 * 优先级规则（rule.md）：
 * 1. 魔女杀手优先结算
 * 2. 其次按提交攻击行动的顺序
 * 3. 魔女杀手攻击成功时，其他人攻击魔女杀手持有者会落空
 */
export function resolveNightActions(G: BGGameState, random: RandomAPI): void {
  // 初始化结果
  let result: PhaseResult = {
    stateUpdates: {},
    deadPlayers: new Set<string>(),
    barrierPlayers: new Set<string>(),
    attackResult: undefined,
    wreckTransforms: [],
    cardConsumptions: [],
    pendingDistributions: [],
  };

  // Phase 1: 探知与结界
  result = processDetectAndBarrier(G, random, result);

  // Phase 2: 攻击结算
  result = processAttackActions(G, random, result);

  // Phase 3: 检定
  result = processCheckActions(G, result);

  // Phase 4: 残骸化
  result = processWreckTransformation(G, random, result);

  // Phase 5: 卡牌消耗
  result = processCardConsumption(G, result);

  // 应用状态更新
  applyPhaseResult(G, random, result);

  // 执行击杀相关的延迟分配（在 cardSelection 完成后）
  if (result.pendingDistributions && result.pendingDistributions.length > 0) {
    applyPendingDistributions(G, random, result.pendingDistributions);
  }

  // 执行残骸化分配（需要在 apply 后执行）
  if (result.wreckTransforms && result.wreckTransforms.length > 0) {
    applyWreckDistributions(G, random, result.wreckTransforms);
  }

  // 最终清理
  finalizeNightActions(G);
}

/**
 * 清理夜间行动
 */
function finalizeNightActions(G: BGGameState): void {
  G.actionHistory.push(
    ...G.nightActions.map(
      (a): PlayerAction => ({
        id: a.id,
        playerId: a.playerId,
        type: "use_card",
        round: G.round,
        phase: G.status,
        cardId: a.card?.id,
        cardType: a.card?.type,
        targetId: a.targetId,
        timestamp: a.timestamp,
      }),
    ),
  );
  G.currentVotes = [];
  G.nightActions = [];
  G.imprisonedId = null;
}
