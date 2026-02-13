"use client";

/**
 * Assertion 函数 - 验证失败抛出 GameLogicError
 * 用于必须满足的条件，由 wrapMove 捕获并返回 INVALID_MOVE
 */

import type {
  BGGameState,
  CardType,
  CardRef,
  PublicPlayerInfo,
  PlayerFullInfo,
} from "../types";
import { GamePhase } from "../types/core";
import { Selectors } from "../utils";
import { GameLogicError } from "./errors";

/**
 * Assertion: 验证游戏阶段
 * @throws GameLogicError 阶段不匹配时抛出
 */
export function assertPhase(
  G: BGGameState,
  ...allowedPhases: GamePhase[]
): void {
  if (!allowedPhases.includes(G.status)) {
    throw new GameLogicError(
      `Expected phases: ${allowedPhases.join(", ")}, got: ${G.status}`,
    );
  }
}

/**
 * Assertion: 验证值不为空
 * @throws GameLogicError 值为空时抛出
 */
export function assertNotEmpty<T>(
  value: T | null | undefined,
  name: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new GameLogicError(`${name} is required`);
  }
  if (typeof value === "string" && value.trim().length === 0) {
    throw new GameLogicError(`${name} cannot be empty`);
  }
}

/**
 * Assertion: 验证玩家存在且存活
 * @returns PlayerFullInfo 玩家完整信息
 * @throws GameLogicError 玩家不存在或已死亡时抛出
 */
export function assertPlayerAlive(
  G: BGGameState,
  playerID: string,
): PlayerFullInfo {
  const publicInfo = Selectors.getPlayer(G, playerID);
  const secret = Selectors.getPlayerSecrets(G, playerID);

  if (!publicInfo || !secret) {
    throw new GameLogicError(`Player ${playerID} not found`);
  }

  if (!Selectors.isPlayerAlive(G, playerID)) {
    throw new GameLogicError(`Player ${playerID} is not alive`);
  }

  return {
    id: playerID,
    public: publicInfo,
    secret,
  };
}

/**
 * Assertion: 验证玩家存在且存活 (使用公共信息)
 * @returns PublicPlayerInfo 玩家公共信息
 * @throws GameLogicError 玩家不存在或已死亡时抛出
 */
export function assertPlayerPublicAlive(
  G: BGGameState,
  playerID: string,
): PublicPlayerInfo {
  const publicInfo = G.players[playerID];

  if (!publicInfo) {
    throw new GameLogicError(`Player ${playerID} not found`);
  }

  const isAlive = publicInfo.status === "alive";
  if (!isAlive) {
    throw new GameLogicError(`Player ${playerID} is not alive`);
  }

  return publicInfo;
}

/**
 * Assertion: 验证卡牌在手牌中
 * @returns 卡牌索引和卡牌对象
 * @throws GameLogicError 卡牌不存在时抛出
 */
export function assertCardInHand(
  player: PlayerFullInfo,
  cardId: string,
): { index: number; card: CardRef } {
  const index = player.secret.hand.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new GameLogicError(`Card ${cardId} not found in hand`);
  }
  return { index, card: player.secret.hand[index] };
}

/**
 * Assertion: 验证魔女杀手持有者只能使用魔女杀手
 * @throws GameLogicError 违反规则时抛出
 */
export function assertWitchKillerCardAllowed(
  player: PlayerFullInfo,
  cardType: CardType,
): void {
  if (player.secret.witchKillerHolder && cardType !== "witch_killer") {
    throw new GameLogicError(
      "Witch killer holder can only use witch killer card",
    );
  }
}

/**
 * Assertion: 验证攻击名额
 * 注意：对于 kill magic，超额时允许提交但在结算时处理
 * @throws GameLogicError 名额不足时抛出（仅 witch_killer）
 */
export function assertAttackQuotaAvailable(
  G: BGGameState,
  cardType: CardType,
): void {
  if (cardType === "witch_killer") {
    const quota = Selectors.computeRemainingAttackQuota(G);
    if (!quota.witchKiller) {
      throw new GameLogicError("Witch killer quota already used");
    }
  }
}

/**
 * Assertion: 验证发言内容
 * @throws GameLogicError 内容无效时抛出
 */
export function assertValidMessage(content: string): void {
  if (!content || content.trim().length === 0) {
    throw new GameLogicError("Message cannot be empty");
  }
  if (content.length > 500) {
    throw new GameLogicError("Message too long (max 500 chars)");
  }
}
