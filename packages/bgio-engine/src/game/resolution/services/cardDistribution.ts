"use client";

/**
 * 卡牌分配服务
 *
 * 职责：处理玩家死亡时的遗落手牌分配
 * 原则：删除主入口，各函数职责单一，直接调用
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState, CardRef } from "../../../types";
import { Selectors, Mutations, TMessageBuilder } from "../../../utils";
import { mapValues } from "es-toolkit";

/**
 * 情境1: 残骸化分配
 *
 * 规则：随机分配给所有存活玩家
 * 调用场景：Phase 4 Wreck Transformation（在 Phase 5 消耗之后）
 */
export function distributeWreckCards(
  G: BGGameState,
  random: RandomAPI,
  cards: CardRef[],
): void {
  if (cards.length === 0) return;

  const alivePlayers = Selectors.getAlivePlayers(G);
  distributeCardsRandomly(G, random, cards, alivePlayers);
}

/**
 * 情境2: 杀手无法取得卡牌
 *
 * 规则：击杀者无法取得死者手牌（witch_killer 击杀或手牌已满）
 * 调用场景：Phase 2 Attack - witch_killer 击杀后
 * @param victimId - 仅用于记录 receiver 历史
 */
export function distributeSkipKiller(
  G: BGGameState,
  random: RandomAPI,
  victimId: string,
  cards: CardRef[],
  killerId: string,
): void {
  if (cards.length === 0) return;

  const alivePlayers = Selectors.getAlivePlayers(G).filter(
    (p) => p.id !== killerId,
  );
  distributeCardsRandomly(G, random, cards, alivePlayers, victimId);
}

/**
 * 通用：随机分配卡牌给一组玩家
 */
function distributeCardsRandomly(
  G: BGGameState,
  random: RandomAPI,
  cards: CardRef[],
  eligiblePlayers: { id: string }[],
  victimId?: string,
): void {
  const receivers = new Map<string, CardRef[]>();
  const excessCards: CardRef[] = [];

  for (const card of cards) {
    const availablePlayers = eligiblePlayers.filter(
      (p) => !Selectors.isHandFull(G, p.id),
    );

    if (availablePlayers.length === 0) {
      excessCards.push(card);
      continue;
    }

    const randomIndex = random.Die(availablePlayers.length) - 1;
    const receiver = availablePlayers[randomIndex];

    if (!receivers.has(receiver.id)) {
      receivers.set(receiver.id, []);
    }
    receivers.get(receiver.id)!.push(card);
  }

  applyDistributions(G, receivers);
  if (victimId) {
    recordCardReceivers(G, victimId, receivers);
  }
  notifyExcessIfNeeded(G, excessCards);
}

/**
 * 通用：应用卡牌分配
 *
 * 将卡牌添加到玩家手牌
 */
export function applyDistributions(
  G: BGGameState,
  receivers: Map<string, CardRef[]>,
): void {
  for (const [playerId, cards] of receivers) {
    for (const card of cards) {
      Mutations.addCardToHand(G, playerId, card);
    }
  }
}

/**
 * 记录卡牌接收历史
 *
 * 用于 deathLog 的 cardReceivers 字段
 */
export function recordCardReceivers(
  G: BGGameState,
  victimId: string,
  receivers: Map<string, CardRef[]>,
): void {
  const deathRecord = G.deathLog.find(
    (r) => r.playerId === victimId && r.round === G.round,
  );

  if (deathRecord) {
    deathRecord.cardReceivers = mapValues(
      Object.fromEntries(receivers),
      (cards) => cards.map((c) => c.id),
    );
  }
}

/**
 * 通知手牌已满的玩家
 *
 * 当无法分配卡牌时发送公告
 */
export function notifyExcessIfNeeded(
  G: BGGameState,
  excessCards: CardRef[],
): void {
  if (excessCards.length > 0) {
    Mutations.msg(
      G,
      TMessageBuilder.createHiddenSystem("所有存活玩家手牌已满，无法分配卡牌"),
    );
  }
}

/**
 * 应用延迟分配
 *
 * 在 cardSelection 完成后统一处理击杀相关的卡牌分配
 *
 * 规则：
 * - skipKiller: witch_killer 击杀，杀手无法取得卡牌
 * - killerSelect: kill 击杀，杀手已通过 cardSelection 选择了一张卡
 */
export function applyPendingDistributions(
  G: BGGameState,
  random: RandomAPI,
  distributions: Array<{
    type: "skipKiller" | "killerSelect";
    victimId: string;
    cards: CardRef[];
    killerId: string;
  }>,
): void {
  for (const dist of distributions) {
    if (dist.type === "skipKiller") {
      // witch_killer 击杀：杀手无法取得卡牌
      distributeSkipKiller(G, random, dist.victimId, dist.cards, dist.killerId);
    } else if (dist.type === "killerSelect") {
      // kill 击杀：杀手已选择一张卡，剩余卡牌随机分配给其他玩家
      distributeRemainingCards(
        G,
        random,
        dist.victimId,
        dist.cards,
        dist.killerId,
      );
    }
  }
}

/**
 * 分配剩余卡牌（killerSelect 类型）
 *
 * 击杀者已选择一张卡，剩余的卡牌随机分配给其他存活玩家
 */
function distributeRemainingCards(
  G: BGGameState,
  random: RandomAPI,
  victimId: string,
  cards: CardRef[],
  killerId: string,
): void {
  const otherAlivePlayers = Selectors.getAlivePlayers(G).filter(
    (p) => p.id !== killerId,
  );
  distributeCardsRandomly(G, random, cards, otherAlivePlayers, victimId);
}
