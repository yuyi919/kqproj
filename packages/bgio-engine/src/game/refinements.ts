"use client";

/**
 * Refinement 函数 - 验证失败返回布尔值
 * 用于条件逻辑分支，不抛出错误
 */

import type { BGGameState, Vote } from "../types";
import type { PlayerFullInfo } from "./types";

/**
 * Refinement: 检查玩家是否被监禁
 */
export function isImprisoned(G: BGGameState, playerID: string): boolean {
  return G.imprisonedId === playerID;
}

/**
 * Refinement: 检查玩家是否是魔女
 */
export function isWitch(player: PlayerFullInfo): boolean {
  return player.secret.isWitch;
}

/**
 * Refinement: 检查玩家本回合是否已击杀
 */
export function hasKilledThisRound(G: BGGameState, playerID: string): boolean {
  return G.nightActions.some(
    (a) =>
      a.playerId === playerID &&
      a.card && (a.card.type === "witch_killer" || a.card.type === "kill"),
  );
}

/**
 * Refinement: 检查投票是否已存在
 * @returns 已有投票的索引，不存在返回 -1
 */
export function findExistingVoteIndex(
  G: BGGameState,
  playerID: string,
): number {
  return G.currentVotes.findIndex((v) => v.voterId === playerID);
}

/**
 * Refinement: 检查投票是否已存在
 * @returns 已有投票结果，不存在返回 null
 */
export function findExistingVote(
  G: BGGameState,
  playerID: string,
): Vote | null {
  return G.currentVotes.find((v) => v.voterId === playerID) ?? null;
}
