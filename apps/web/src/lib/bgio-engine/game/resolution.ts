"use client";

/**
 * 夜间结算逻辑
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState, CardRef, DeathCause } from "../types";
import { Mutations, Selectors, getCardDefinition } from "../utils";

/**
 * 解析夜间行动
 */
export function resolveNightActions(G: BGGameState, random: RandomAPI): void {
  const sortedActions = [...G.nightActions].sort((a, b) => {
    const priorityA = getCardPriority(a.cardType);
    const priorityB = getCardPriority(b.cardType);
    return priorityB - priorityA;
  });

  const deadPlayers = new Set<string>();
  const barrierPlayers = new Set<string>();

  // 第一阶段：处理探知和结界
  for (const action of sortedActions) {
    const actorSecret = G.secrets[action.playerId];
    if (!actorSecret) continue;

    if (action.cardType === "detect" && action.targetId) {
      const targetSecret = G.secrets[action.targetId];
      if (targetSecret) {
        const handCount = targetSecret.hand.length;
        const seenCard =
          targetSecret.hand.length > 0
            ? targetSecret.hand[
                Math.floor(random.Number() * targetSecret.hand.length)
              ].type
            : undefined;

        Mutations.addRevealedInfo(G, action.playerId, "detect", {
          targetId: action.targetId,
          handCount,
          seenCard,
        });
      }
    } else if (action.cardType === "barrier") {
      barrierPlayers.add(action.playerId);
    }
  }

  // 第二阶段：处理攻击
  for (const action of sortedActions) {
    if (action.cardType !== "witch_killer" && action.cardType !== "kill")
      continue;
    if (!action.targetId) continue;

    const actorSecret = G.secrets[action.playerId];
    const targetPlayer = G.players[action.targetId];
    const targetSecret = G.secrets[action.targetId];

    if (!actorSecret || !targetPlayer || !targetSecret) continue;
    if (deadPlayers.has(action.targetId)) {
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "target_already_dead",
      });
      continue;
    }

    if (barrierPlayers.has(action.targetId)) {
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "barrier_protected",
      });
      Mutations.addRevealedInfo(G, action.targetId, "barrier", {
        attackerId: action.playerId,
        cardType: action.cardType,
      });
      targetSecret.hasBarrier = false;
      continue;
    }

    const cause: DeathCause =
      action.cardType === "witch_killer" ? "witch_killer" : "kill_magic";
    const result = Mutations.killPlayer(
      G,
      action.targetId,
      cause,
      action.playerId,
      random.Number,
    );

    if (result) {
      deadPlayers.add(action.targetId);

      if (action.cardType === "kill") {
        actorSecret.isWitch = true;
        Mutations.addRevealedInfo(G, action.playerId, "witch_transform", {
          reason: "kill_success",
        });
      }

      if (
        result.droppedCards.length > 0 &&
        action.cardType !== "witch_killer"
      ) {
        distributeDroppedCards(
          G,
          random,
          action.targetId,
          result.droppedCards,
          action.playerId,
        );
      }
    }
  }

  // 第三阶段：处理检定
  for (const action of sortedActions) {
    if (action.cardType !== "check") continue;
    if (!action.targetId) continue;

    const targetSecret = G.secrets[action.targetId];
    if (!targetSecret) continue;

    const isWitchKiller = targetSecret.deathCause === "witch_killer";

    Mutations.addRevealedInfo(G, action.playerId, "check", {
      targetId: action.targetId,
      isWitchKiller,
      deathCause: targetSecret.deathCause,
    });
  }

  // 第四阶段：处理残骸化
  for (const [playerId, secret] of Object.entries(G.secrets)) {
    if (!secret.isWitch) continue;
    if (deadPlayers.has(playerId)) continue;

    const hasKilledThisRound = G.nightActions.some(
      (a) =>
        a.playerId === playerId &&
        (a.cardType === "witch_killer" || a.cardType === "kill"),
    );

    if (!hasKilledThisRound) {
      secret.consecutiveNoKillRounds++;

      if (secret.consecutiveNoKillRounds >= 2) {
        const result = Mutations.killPlayer(
          G,
          playerId,
          "wreck",
          undefined,
          random.Number,
        );
        if (result && result.droppedCards.length > 0) {
          distributeDroppedCards(
            G,
            random,
            playerId,
            result.droppedCards,
            undefined,
            true,
          );
        }
      }
    }
  }

  // 清理回合状态
  G.round++;
  G.currentVotes = [];
  G.nightActions = [];
  G.imprisonedId = null;
}

/**
 * 分配遗落卡牌
 */
function distributeDroppedCards(
  G: BGGameState,
  random: { Number: () => number },
  victimId: string,
  cards: CardRef[],
  killerId?: string,
  isWreck = false,
): void {
  if (cards.length === 0) return;

  const alivePlayers = Selectors.getAlivePlayers(G).filter(
    (p) => p.id !== victimId,
  );
  if (alivePlayers.length === 0) return;

  const receivers: Record<string, CardRef[]> = {};

  if (isWreck) {
    for (const card of cards) {
      const randomIndex = Math.floor(random.Number() * alivePlayers.length);
      const receiverId = alivePlayers[randomIndex].id;

      Mutations.addCardToHand(G, receiverId, card);

      if (!receivers[receiverId]) receivers[receiverId] = [];
      receivers[receiverId].push(card);
    }
  } else if (killerId) {
    const witchKillerIndex = cards.findIndex((c) => c.type === "witch_killer");
    if (witchKillerIndex > -1) {
      const witchKillerCard = cards[witchKillerIndex];
      Mutations.addCardToHand(G, killerId, witchKillerCard);
      if (!receivers[killerId]) receivers[killerId] = [];
      receivers[killerId].push(witchKillerCard);
      cards.splice(witchKillerIndex, 1);
    }

    for (const card of cards) {
      const randomIndex = Math.floor(random.Number() * alivePlayers.length);
      const receiverId = alivePlayers[randomIndex].id;

      Mutations.addCardToHand(G, receiverId, card);

      if (!receivers[receiverId]) receivers[receiverId] = [];
      receivers[receiverId].push(card);
    }
  }

  const deathRecord = G.deathLog.find(
    (r) => r.playerId === victimId && r.round === G.round - 1,
  );
  if (deathRecord) {
    deathRecord.cardReceivers = receivers;
  }

  for (const [receiverId, receivedCards] of Object.entries(receivers)) {
    Mutations.addRevealedInfo(G, receiverId, "card_received", {
      from: victimId,
      cards: receivedCards.map((c) => c.type),
    });
  }
}

/**
 * 获取卡牌优先级
 */
function getCardPriority(cardType: string): number {
  switch (cardType) {
    case "witch_killer":
      return 5;
    case "kill":
      return 4;
    case "barrier":
      return 3;
    case "detect":
      return 2;
    case "check":
      return 1;
    default:
      return 0;
  }
}
