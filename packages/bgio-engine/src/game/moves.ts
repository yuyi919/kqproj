"use client";

/**
 * Move 函数定义
 */

import { nanoid } from "nanoid";
import type { PublicPlayerInfo } from "../types";
import { Selectors, getCardDefinition, MessageBuilder } from "../utils";
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

      MessageBuilder.addVoteMessage(
        G,
        playerID,
        player.public,
        targetId,
        target,
        true,
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

      MessageBuilder.addVoteMessage(
        G,
        playerID,
        player.public,
        targetId,
        target,
        false,
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
    const player = assertPlayerAlive(G, playerID);

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
      MessageBuilder.addPassMessage(G, playerID, player.public);
    } else {
      // 新增弃权票
      G.currentVotes.push(vote);
      console.log(
        `[Vote] ${playerID} passed, total votes: ${G.currentVotes.length}`,
      );
      MessageBuilder.addPassMessage(G, playerID, player.public);
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

      // 添加夜间行动消息
      let targetPlayer: PublicPlayerInfo | undefined;
      if (targetId) {
        const target = G.players[targetId];
        if (target) {
          targetPlayer = target;
        }
      }
      MessageBuilder.addNightActionMessage(
        G,
        playerID,
        player.public,
        card.type,
        targetId,
        targetPlayer,
      );

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

    // 添加夜间弃权消息
    MessageBuilder.addPassMessage(G, playerID, player.public);

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

    const message = MessageBuilder.createSay(playerID, player.public, content);
    MessageBuilder.addMessage(G, message);
  }),
};

export { moveFunctions };
