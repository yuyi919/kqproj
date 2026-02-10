"use client";

/**
 * Move 函数定义
 */

import { nanoid } from "nanoid";
import type { BGGameState, ChatMessage, PublicPlayerInfo } from "../types";
import { Selectors, getCardDefinition } from "../utils";
import {
  assertPhase,
  assertNotEmpty,
  assertPlayerAlive,
  assertCardInHand,
  assertWitchKillerCardAllowed,
  assertAttackQuotaAvailable,
  assertValidMessage,
  assertPlayerPublicAlive,
} from "./assertions";
import {
  isImprisoned,
  isWitch,
  hasKilledThisRound,
  findExistingVoteIndex,
  findExistingVote,
} from "./refinements";
import { wrapMove } from "./wrapMove";
import { GameLogicError } from "./errors";
import type { MoveContext, PlayerFullInfo } from "./types";

const moveFunctions = {
  /**
   * 投票 move
   *
   * 规则：
   * 1. 只能在投票阶段进行
   * 2. 投票者必须存活
   * 3. 目标玩家必须存活（不能投给已死亡玩家）
   * 4. 可以更新已有投票（一人一票，可改票）
   *
   * @param G - 游戏状态
   * @param playerID - 投票者ID
   * @param targetId - 目标玩家ID
   */
  vote: wrapMove(({ G, playerID }: MoveContext, targetId: string) => {
    // 验证阶段和基本参数
    assertPhase(G, "voting");
    assertNotEmpty(targetId, "targetId");

    // 验证投票者存活
    const player = assertPlayerAlive(G, playerID);

    // 验证目标玩家存活且不是自投
    const target = assertPlayerPublicAlive(G, targetId);

    if (playerID === targetId) {
      throw new GameLogicError("Cannot vote for yourself");
    }

    console.log(`[Vote] ${playerID} votes for ${targetId}`);

    // 查找是否已有投票（支持改票）
    const existingVote = findExistingVote(G, playerID);

    if (existingVote) {
      // 更新已有投票
      const oldTarget = existingVote.targetId;
      if (existingVote.targetId === targetId) {
        return;
      }
      existingVote.targetId = targetId;
      existingVote.timestamp = Date.now();
      console.log(
        `[Vote] ${playerID} changed vote from ${oldTarget} to ${targetId}`,
      );
      G.chatMessages.push(
        makeActionMessage(
          playerID,
          player.public,
          `改变投票为 玩家${target.seatNumber}`,
        ),
      );
    } else {
      const vote = {
        voterId: playerID,
        targetId,
        round: G.round,
        timestamp: Date.now(),
      };
      // 新增投票
      G.currentVotes.push(vote);
      console.log(
        `[Vote] ${playerID} voted for ${targetId}, total votes: ${G.currentVotes.length}`,
      );
      G.chatMessages.push(
        makeActionMessage(
          playerID,
          player.public,
          `投票给 玩家${target.seatNumber}`,
        ),
      );
    }
  }),

  /**
   * 弃权 move
   *
   * 规则：
   * 1. 只能在投票阶段进行
   * 2. 弃权者必须存活
   * 3. 弃权相当于投给自己（targetId = playerID）
   * 4. 可以更新已有投票为弃权
   *
   * @param G - 游戏状态
   * @param playerID - 弃权者ID
   */
  pass: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, "voting");
    assertPlayerAlive(G, playerID);

    console.log(`[Vote] ${playerID} passes (votes for self)`);

    // 查找是否已有投票
    const existingIndex = findExistingVoteIndex(G, playerID);

    // 弃权相当于投给自己
    const vote = {
      voterId: playerID,
      targetId: playerID, // 投给自己表示弃权
      round: G.round,
      timestamp: Date.now(),
    };

    if (existingIndex !== -1) {
      // 更新为弃权
      const oldTarget = G.currentVotes[existingIndex].targetId;
      G.currentVotes[existingIndex] = vote;
      console.log(
        `[Vote] ${playerID} changed vote to pass (from ${oldTarget})`,
      );
    } else {
      // 新增弃权票
      G.currentVotes.push(vote);
      console.log(
        `[Vote] ${playerID} passed, total votes: ${G.currentVotes.length}`,
      );
    }
  }),

  /** 使用卡牌 move */
  useCard: wrapMove(
    ({ G, playerID }: MoveContext, cardId: string, targetId?: string) => {
      assertPhase(G, "night");
      const player = assertPlayerAlive(G, playerID);

      // Assertion: 被监禁的玩家不能使用卡牌
      if (isImprisoned(G, playerID)) {
        throw new GameLogicError("Player is imprisoned");
      }

      // Assertion: 每个晚上只能使用一次手牌（通过 nightActions 计算）
      if (Selectors.hasPlayerUsedCardThisNight(G, playerID)) {
        throw new GameLogicError("You have already used a card this night");
      }

      const { index: cardIndex, card } = assertCardInHand(player, cardId);

      assertWitchKillerCardAllowed(player, card.type);
      assertAttackQuotaAvailable(G, card.type);

      const cardDef = getCardDefinition(card);
      if (cardDef.consumable) {
        player.secret.hand.splice(cardIndex, 1);
        G.discardPile.push(card);
      }

      G.nightActions.push({
        id: nanoid(),
        playerId: playerID,
        card: card, // CardRef
        targetId,
        timestamp: Date.now(),
      });

      if (card.type === "witch_killer") {
        G.attackQuota.witchKillerUsed = true;
        player.secret.lastKillRound = G.round;
        player.secret.consecutiveNoKillRounds = 0;
      } else if (card.type === "kill") {
        G.attackQuota.killMagicUsed++;
        player.secret.lastKillRound = G.round;
        player.secret.consecutiveNoKillRounds = 0;
        player.secret.isWitch = true;
      } else if (card.type === "barrier") {
        player.secret.hasBarrier = true;
      }
    },
  ),

  /** 夜间放弃 move */
  passNight: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, "night");
    const player = assertPlayerAlive(G, playerID);

    // 检查是否已使用卡牌（每晚只能行动一次）
    if (Selectors.hasPlayerUsedCardThisNight(G, playerID)) {
      throw new GameLogicError("You have already used a card this night");
    }

    // 记录弃权行动
    G.nightActions.push({
      id: nanoid(),
      playerId: playerID,
      card: null, // 弃权，没有使用卡牌
      timestamp: Date.now(),
    });

    // Refinement: 魔女化玩家未击杀需要累积回合
    if (isWitch(player) && !hasKilledThisRound(G, playerID)) {
      player.secret.consecutiveNoKillRounds++;
    }
  }),

  /** 发言 move - 仅在白天阶段可用 */
  say: wrapMove(({ G, playerID }: MoveContext, content: string) => {
    assertPhase(G, "day");
    const player = assertPlayerAlive(G, playerID);
    assertValidMessage(content);

    const message: ChatMessage = makeChatMessage(playerID, player, content);

    addMessage(G, message);
  }),
};

export { moveFunctions };

function addMessage(G: BGGameState, message: ChatMessage) {
  G.chatMessages.push(message);

  // 限制聊天记录数量，避免状态过大
  if (G.chatMessages.length > 200) {
    G.chatMessages.shift();
  }
}

function makeChatMessage(
  playerID: string,
  player: PlayerFullInfo,
  content: string,
): ChatMessage {
  return {
    id: nanoid(),
    type: "say",
    playerId: playerID,
    playerName: `玩家${player.public.seatNumber}`,
    content: content.trim(),
    timestamp: Date.now(),
  };
}

function makeActionMessage(
  playerID: string,
  player: PublicPlayerInfo,
  content: string,
): ChatMessage {
  return {
    id: nanoid(),
    type: "action",
    playerId: playerID,
    playerName: `玩家${player.seatNumber}`,
    content: content.trim(),
    timestamp: Date.now(),
  };
}
