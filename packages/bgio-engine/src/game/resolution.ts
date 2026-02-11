"use client";

/**
 * 夜间结算逻辑
 */

import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState, CardRef, DeathCause } from "../types";
import { orderBy } from "es-toolkit";
import {
  Mutations,
  Selectors,
  getCardDefinition,
  TMessageBuilder,
} from "../utils";

/**
 * 解析夜间行动
 */
export function resolveNightActions(G: BGGameState, random: RandomAPI): void {
  const sortedActions = orderBy(
    G.nightActions,
    [(a) => getCardPriority(a.card)],
    ["desc"],
  );

  const deadPlayers = new Set<string>();
  const barrierPlayers = new Set<string>();

  // 第一阶段：处理探知和结界
  for (const action of sortedActions) {
    const actorSecret = G.secrets[action.playerId];
    if (!actorSecret) continue;

    // 弃权行动跳过
    if (!action.card) continue;

    if (action.card.type === "detect" && action.targetId) {
      const targetSecret = G.secrets[action.targetId];
      if (targetSecret) {
        const handCount = targetSecret.hand.length;
        const seenCard =
          targetSecret.hand.length > 0
            ? targetSecret.hand[
                Math.floor(random.Number() * targetSecret.hand.length)
              ].type
            : undefined;

        // 添加探知消息
        const targetPlayer = G.players[action.targetId];
        const actorPlayer = G.players[action.playerId];
        if (targetPlayer && actorPlayer) {
          G.chatMessages.push(
            TMessageBuilder.createDetectResult(
              action.playerId,
              action.targetId,
              handCount,
              seenCard
            )
          );
        }

        Mutations.addRevealedInfo(G, action.playerId, "detect", {
          targetId: action.targetId,
          handCount,
          seenCard,
        });
      }
    } else if (action.card.type === "barrier") {
      barrierPlayers.add(action.playerId);
    }
  }

  // 第二阶段：处理攻击
  for (const action of sortedActions) {
    if (!action.card) continue; // 跳过弃权
    if (action.card.type !== "witch_killer" && action.card.type !== "kill")
      continue;
    if (!action.targetId) continue;

    const actorSecret = G.secrets[action.playerId];
    const targetPlayer = G.players[action.targetId];
    const targetSecret = G.secrets[action.targetId];
    const actorPlayer = G.players[action.playerId];

    if (!actorSecret || !targetPlayer || !targetSecret || !actorPlayer)
      continue;
    if (deadPlayers.has(action.targetId)) {
      // 攻击失败：目标已死亡
      G.chatMessages.push(
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "target_already_dead"
        )
      );
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "target_already_dead",
      });
      continue;
    }

    if (barrierPlayers.has(action.targetId)) {
      // 攻击失败：结界保护
      G.chatMessages.push(
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "barrier_protected"
        )
      );
      G.chatMessages.push(
        TMessageBuilder.createBarrierApplied(action.targetId, action.playerId)
      );

      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "barrier_protected",
      });
      Mutations.addRevealedInfo(G, action.targetId, "barrier", {
        attackerId: action.playerId,
        cardType: action.card.type,
      });
      targetSecret.hasBarrier = false;
      continue;
    }

    const cause: DeathCause =
      action.card.type === "witch_killer" ? "witch_killer" : "kill_magic";
    const result = Mutations.killPlayer(
      G,
      action.targetId,
      cause,
      action.playerId,
      random.Number,
    );

    if (result) {
      deadPlayers.add(action.targetId);

      // 添加攻击成功消息
      G.chatMessages.push(
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "success"
        )
      );

      // 添加死亡消息 (系统公告)
      G.chatMessages.push(
        TMessageBuilder.createSystem(`玩家${targetPlayer.seatNumber} 已死亡`)
      );

      if (action.card.type === "kill") {
        actorSecret.isWitch = true;
        // 添加魔女化消息 (私密行动)
        G.chatMessages.push(
          TMessageBuilder.createTransformWitch(action.playerId)
        );
        Mutations.addRevealedInfo(G, action.playerId, "witch_transform", {
          reason: "kill_success",
        });
      }

      if (
        result.droppedCards.length > 0 &&
        action.card.type !== "witch_killer"
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
    if (!action.card || action.card.type !== "check") continue;
    if (!action.targetId) continue;

    const targetSecret = G.secrets[action.targetId];
    const targetPlayer = G.players[action.targetId];
    const actorPlayer = G.players[action.playerId];
    if (!targetSecret || !targetPlayer || !actorPlayer) continue;

    const isWitchKiller = targetSecret.deathCause === "witch_killer";
    const deathCause: DeathCause = targetSecret.deathCause || "wreck";

    // 添加检定结果消息
    G.chatMessages.push(
      TMessageBuilder.createCheckResult(
        action.playerId,
        action.targetId,
        isWitchKiller,
        deathCause
      )
    );

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

    const player = G.players[playerId];
    if (!player) continue;

    const hasKilledThisRound = G.nightActions.some(
      (a) =>
        a.playerId === playerId &&
        a.card &&
        (a.card.type === "witch_killer" || a.card.type === "kill"),
    );

    if (!hasKilledThisRound) {
      secret.consecutiveNoKillRounds++;

      if (secret.consecutiveNoKillRounds >= 2) {
        // 添加残骸化消息（在击杀之前）
        G.chatMessages.push(TMessageBuilder.createWreck(playerId));

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
    const killerSecret = G.secrets[killerId];
    const killerAlreadyHasWitchKiller = killerSecret?.witchKillerHolder ?? false;

    // 杀手可以自由捡走一张卡牌（如果还没有魔女杀手持有标记）
    // 注意：killPlayer 可能已经将魔女杀手转移给杀手（如果死者持有且kill_magic）
    // 此时 killerAlreadyHasWitchKiller 为 true，所以不再额外捡牌
    if (!killerAlreadyHasWitchKiller && cards.length > 0) {
      const randomIndex = Math.floor(random.Number() * cards.length);
      const chosenCard = cards[randomIndex];
      Mutations.addCardToHand(G, killerId, chosenCard);
      if (!receivers[killerId]) receivers[killerId] = [];
      receivers[killerId].push(chosenCard);
      cards.splice(randomIndex, 1); // 从掉落卡牌中移除
    }

    // 剩余卡牌随机分配给其他存活玩家（排除杀手本人）
    const otherAlivePlayers = alivePlayers.filter((p) => p.id !== killerId);
    for (const card of cards) {
      if (otherAlivePlayers.length === 0) break;
      const randomIndex = Math.floor(random.Number() * otherAlivePlayers.length);
      const receiverId = otherAlivePlayers[randomIndex].id;

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

  // 添加卡牌分配消息
  const victimPlayer = G.players[victimId];
  if (victimPlayer && Object.keys(receivers).length > 0) {
    // 为每个接收者添加个人消息（仅接收者和受害者可见）
    for (const [receiverId, receivedCards] of Object.entries(receivers)) {
      const receiver = G.players[receiverId];
      if (receiver) {
        const receiver = G.players[receiverId];
        if (receiver) {
          G.chatMessages.push(
            TMessageBuilder.createCardReceived(receiverId, victimId, receivedCards)
          );
        }
      }
    }
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
function getCardPriority(card: CardRef | null): number {
  switch (card?.type) {
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
      return 0; // 弃权或其他情况
  }
}
