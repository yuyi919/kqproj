"use client";

/**
 * Phase 4: 残骸化
 *
 * 职责：处理 witch/witch_killer 持有者的残骸化
 * 规则：连续两晚未成功击杀则残骸化
 *
 * 注意：分配放在 Phase 5 消耗之后，此时手牌状态已更新，直接判断即可
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState } from "../../types";
import type { PhaseResult, WreckTransform } from "./types";
import { Mutations, TMessageBuilder, Selectors } from "../../utils";
import { distributeWreckCards } from "./services/cardDistribution";
import { Refinements } from "../../domain/refinements";

/**
 * 处理残骸化
 *
 * 规则：
 * - 魔女或魔女杀手持有者连续两晚未成功击杀会残骸化
 * - 成功击杀定义：执行了 kill 或 witch_killer 且目标死亡
 * - 被监禁不影响计时器
 */
export function processWreckTransformation(
  G: Readonly<BGGameState>,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  const result: PhaseResult = {
    stateUpdates: { ...previousResult.stateUpdates },
    deadPlayers: new Set(previousResult.deadPlayers),
    barrierPlayers: new Set(previousResult.barrierPlayers),
    wreckTransforms: [],
    cardConsumptions: previousResult.cardConsumptions ?? [],
  };

  // 获取本回合成功击杀的玩家ID列表
  const executedAttackPlayerIds = new Set(
    G.nightActions
      .filter((action) => Refinements.isAnyAttackSuccess(action))
      .map((action) => action.playerId),
  );

  // 检查每个 witch/witch_killer 持有者的残骸化状态
  for (const [playerId, secret] of Object.entries(G.secrets)) {
    if (!Refinements.isWitch(secret)) continue;

    // 已死亡或已 wreck 的玩家跳过
    if (Refinements.isDead(secret)) continue;

    // 本回合成功击杀则重置计数器
    if (executedAttackPlayerIds.has(playerId)) {
      continue;
    }

    // 增加连续未击杀回合数
    const playerSecret = G.secrets[playerId];
    if (!playerSecret) continue;

    playerSecret.consecutiveNoKillRounds++;

    // 达到2回合未击杀，触发残骸化
    if (Refinements.shouldWreck(playerSecret)) {
      const player = G.players[playerId];
      if (player) {
        Mutations.msg(G, TMessageBuilder.createWreck(playerId));
      }

      const killResult = Mutations.killPlayer(
        G as BGGameState,
        playerId,
        "wreck",
        undefined,
        random,
      );

      if (killResult) {
        result.deadPlayers!.add(playerId);
        result.wreckTransforms!.push({
          playerId,
          droppedCards: killResult.droppedCards,
        });
      }
    }
  }

  return result;
}

/**
 * 应用残骸化分配
 *
 * 必须在 Phase 5（卡牌消耗）之后调用
 * 此时手牌状态已更新，直接判断是否已满即可
 */
export function applyWreckDistributions(
  G: BGGameState,
  random: RandomAPI,
  wreckTransforms: WreckTransform[],
): void {
  for (const transform of wreckTransforms) {
    if (transform.droppedCards.length > 0) {
      distributeWreckCards(G, random, transform.droppedCards);
    }
  }
}
