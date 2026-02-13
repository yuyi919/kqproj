"use client";

/**
 * Move 函数定义
 */

import { nanoid } from "nanoid";
import type { MoveContext, PublicPlayerInfo } from "../types";
import { GamePhase } from "../types/core";
import {
  getCardDefinition,
  Mutations,
  Refinements,
  Selectors,
  TMessageBuilder,
} from "../utils";
import {
  assertAttackQuotaAvailable,
  assertCardInHand,
  assertNotEmpty,
  assertPhase,
  assertPlayerAlive,
  assertPlayerPublicAlive,
  assertValidMessage,
  assertWitchKillerCardAllowed,
} from "./assertions";
import { GameLogicError } from "./errors";
import { wrapMove } from "./wrapMove";

const moveFunctions = {
  /**
   * 投票 move
   *
   * 规则：
   * 1. 只能在夜间阶段进行
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
    assertPhase(G, GamePhase.NIGHT);
    assertNotEmpty(targetId, "targetId");

    // 验证投票者存活
    const player = assertPlayerAlive(G, playerID);

    // 验证被监禁玩家无法投票
    if (Selectors.isPlayerImprisoned(G, playerID)) {
      throw new GameLogicError("被监禁的玩家无法投票");
    }

    // 验证目标玩家存活且不是自投
    const target = assertPlayerPublicAlive(G, targetId);

    if (playerID === targetId) {
      throw new GameLogicError("Cannot vote for yourself");
    }

    console.log(`[Vote] ${playerID} votes for ${targetId}`);

    // 查找是否已有投票（支持改票）
    const existingVote = Selectors.findExistingVote(G, playerID);

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

      Mutations.msg(G, TMessageBuilder.createVote(playerID, targetId));
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

      Mutations.msg(G, TMessageBuilder.createVote(playerID, targetId));
    }
  }),

  /**
   * 弃权 move
   *
   * 规则：
   * 1. 只能在夜间阶段进行
   * 2. 弃权者必须存活
   * 3. 弃权相当于投给自己（targetId = playerID）
   * 4. 可以更新已有投票为弃权
   *
   * @param G - 游戏状态
   * @param playerID - 弃权者ID
   */
  pass: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, GamePhase.NIGHT);
    const player = assertPlayerAlive(G, playerID);

    console.log(`[Vote] ${playerID} passes (votes for self)`);

    // 查找是否已有投票
    const existingIndex = Selectors.findExistingVoteIndex(G, playerID);

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
      Mutations.msg(G, TMessageBuilder.createPass(playerID));
    } else {
      // 新增弃权票
      G.currentVotes.push(vote);
      console.log(
        `[Vote] ${playerID} passed, total votes: ${G.currentVotes.length}`,
      );
      Mutations.msg(G, TMessageBuilder.createPass(playerID));
    }
  }),

  /** 使用卡牌 move */
  useCard: wrapMove(
    ({ G, playerID }: MoveContext, cardId: string, targetId?: string) => {
      assertPhase(G, GamePhase.DEEP_NIGHT);
      const player = assertPlayerAlive(G, playerID);

      // Assertion: 被监禁的玩家不能使用卡牌
      if (Selectors.isPlayerImprisoned(G, playerID)) {
        throw new GameLogicError("Player is imprisoned");
      }

      // Assertion: 每个晚上只能使用一次手牌（通过 nightActions 计算）
      if (Selectors.hasPlayerUsedCardThisNight(G, playerID)) {
        throw new GameLogicError("You have already used a card this night");
      }

      const { index: cardIndex, card } = assertCardInHand(player, cardId);

      assertWitchKillerCardAllowed(player, card.type);
      assertAttackQuotaAvailable(G, card.type);

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
      Mutations.msg(
        G,
        TMessageBuilder.createUseCard(playerID, card.type, targetId),
      );

      // 记录攻击配额（实际执行在 resolution 阶段根据配额限制处理）
      // 注意：isWitch 只在成功击杀时设置（见 resolution.ts）
      if (Refinements.isWitchKillerCard(card)) {
        G.attackQuota.witchKillerUsed = true;
        player.secret.lastKillRound = G.round;
        // consecutiveNoKillRounds 在 resolution 成功击杀时重置，不在 useCard 时重置
      } else if (Refinements.isKillMagicCard(card)) {
        // 记录尝试使用（isWitch 只在成功击杀时设置）
        player.secret.lastKillRound = G.round;
        // consecutiveNoKillRounds 在 resolution 成功击杀时重置，不在 useCard 时重置
      } else if (Refinements.isDefenseCard(card)) {
        player.secret.hasBarrier = true;
      }
    },
  ),

  /** 夜间放弃 move */
  passNight: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, GamePhase.DEEP_NIGHT);
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
    Mutations.msg(G, TMessageBuilder.createPass(playerID));

    // Refinement: 魔女化玩家未击杀需要累积回合
    if (
      Selectors.isPlayerWitch(G, player.id) &&
      !Selectors.hasKilledThisRound(G, playerID)
    ) {
      player.secret.consecutiveNoKillRounds++;
    }
  }),

  /** 发言 move - 仅在白天阶段可用 */
  say: wrapMove(({ G, playerID }: MoveContext, content: string) => {
    assertPhase(G, GamePhase.DAY);
    const player = assertPlayerAlive(G, playerID);
    assertValidMessage(content);

    Mutations.msg(G, TMessageBuilder.createSay(playerID, content));
  }),

  // ==================== 交易系统（新增）====================

  /**
   * 发起交易 move
   *
   * 规则：
   * 1. 只能在日间阶段进行
   * 2. 发起者必须存活
   * 3. 目标玩家必须存活
   * 4. 每人每天只能发起一次交易
   * 5. 每人每天只能收到一次交易请求
   * 6. 不能与自己交易
   *
   * @param G - 游戏状态
   * @param playerID - 发起者ID
   * @param targetId - 目标玩家ID
   * @param offeredCardId - 提供的卡牌ID
   */
  initiateTrade: wrapMove(
    ({ G, playerID }: MoveContext, targetId: string, offeredCardId: string) => {
      assertPhase(G, GamePhase.DAY);
      assertNotEmpty(targetId, "targetId");
      assertNotEmpty(offeredCardId, "offeredCardId");

      // 验证发起者存活
      const player = assertPlayerAlive(G, playerID);

      // 验证目标玩家存活
      const target = assertPlayerPublicAlive(G, targetId);

      // 不能与自己交易
      if (playerID === targetId) {
        throw new GameLogicError("Cannot trade with yourself");
      }

      // 检查是否已有活跃交易
      if (G.activeTrade) {
        throw new GameLogicError("There is already an active trade");
      }

      // 检查今日是否已参与过任何交易（规则 5.2）
      if (Selectors.hasTradedToday(G, playerID)) {
        throw new GameLogicError(
          "You have already participated in a trade today",
        );
      }

      // 检查目标今日是否已参与过任何交易
      if (Selectors.hasTradedToday(G, targetId)) {
        throw new GameLogicError(
          "This player has already participated in a trade today",
        );
      }

      // 验证卡牌在发起者手牌中
      const cardIndex = player.secret.hand.findIndex(
        (c) => c.id === offeredCardId,
      );
      if (cardIndex === -1) {
        throw new GameLogicError("Card not found in hand");
      }

      const offeredCard = player.secret.hand[cardIndex];

      // 不能交易 witch_killer
      if (Refinements.isWitchKillerCard(offeredCard)) {
        throw new GameLogicError("Cannot trade witch_killer card");
      }

      // 设置活跃交易
      G.activeTrade = {
        tradeId: nanoid(),
        initiatorId: playerID,
        targetId,
        offeredCardId,
        expiresAt: Date.now() + G.config.dayDuration * 1000,
      };

      // 更新交易状态（设置 hasTradedToday 表示已参与交易）
      Mutations.updateTradeTracker(G, playerID, {
        hasInitiatedToday: true,
        hasTradedToday: true,
      });
      Mutations.updateTradeTracker(G, targetId, {
        hasReceivedOfferToday: true,
        hasTradedToday: true,
      });

      // 发送交易提议消息（私密）
      Mutations.msg(
        G,
        TMessageBuilder.createTradeOffer(playerID, targetId, offeredCardId),
      );

      console.log(
        `[Trade] ${playerID} initiated trade with ${targetId}, offering ${offeredCardId}`,
      );
    },
  ),

  /**
   * 响应交易 move
   *
   * 规则：
   * 1. 只能在日间阶段进行
   * 2. 必须是交易的接收者
   * 3. 可以选择是否接受，以及是否提供交换卡牌
   *
   * @param G - 游戏状态
   * @param playerID - 响应者ID（交易接收者）
   * @param accepted - 是否接受
   * @param responseCardId - 提供的交换卡牌ID（可选）
   */
  respondTrade: wrapMove(
    (
      { G, playerID }: MoveContext,
      accepted: boolean,
      responseCardId?: string,
    ) => {
      assertPhase(G, GamePhase.DAY);

      // 验证有活跃交易
      if (!G.activeTrade) {
        throw new GameLogicError("No active trade to respond to");
      }

      // 验证响应者是交易目标
      if (G.activeTrade.targetId !== playerID) {
        throw new GameLogicError("You are not the target of this trade");
      }

      const initiatorId = G.activeTrade.initiatorId;
      const initiator = G.secrets[initiatorId];
      const responder = G.secrets[playerID];

      if (!initiator || !responder) {
        throw new GameLogicError("Player not found");
      }

      // 查找发起者提供的卡牌
      const offeredIndex = initiator.hand.findIndex(
        (c) => c.id === G.activeTrade!.offeredCardId,
      );
      if (offeredIndex === -1) {
        // 提供的卡牌已不在发起者手中，交易取消
        G.activeTrade = null;
        throw new GameLogicError("Offered card no longer available");
      }
      const offeredCard = initiator.hand[offeredIndex];

      // 发送响应消息
      Mutations.msg(
        G,
        TMessageBuilder.createTradeResponse(
          playerID,
          initiatorId,
          accepted,
          responseCardId,
        ),
      );

      if (accepted) {
        // 接受交易
        // 规则：被发起方必须指定一张手牌交付给发起方
        if (!responseCardId) {
          throw new GameLogicError("必须指定要交付的卡牌");
        }

        const responseIndex = responder.hand.findIndex(
          (c) => c.id === responseCardId,
        );
        if (responseIndex === -1) {
          throw new GameLogicError("指定的卡牌不在手牌中");
        }
        const responseCard = responder.hand[responseIndex];

        // 不能交易 witch_killer
        if (Refinements.isWitchKillerCard(responseCard)) {
          throw new GameLogicError("Cannot trade witch_killer card");
        }

        // 交换卡牌
        initiator.hand[offeredIndex] = responseCard;
        responder.hand[responseIndex] = offeredCard;

        console.log(
          `[Trade] Trade between ${initiatorId} and ${playerID} completed`,
        );
      } else {
        // 拒绝交易，卡牌归发起者
        console.log(`[Trade] ${playerID} rejected trade from ${initiatorId}`);

        // 拒绝后发起方仍视为已参与当日交易（规则 5.2）
        Mutations.updateTradeTracker(G, initiatorId, {
          hasInitiatedToday: true,
          hasTradedToday: true,
        });
        // 接收方也视为已参与当日交易
        Mutations.updateTradeTracker(G, playerID, {
          hasTradedToday: true,
        });
      }

      // 清除活跃交易
      G.activeTrade = null;
    },
  ),

  /**
   * 取消交易 move
   *
   * @param G - 游戏状态
   * @param playerID - 请求取消者ID
   */
  cancelTrade: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, GamePhase.DAY);

    // 验证有活跃交易
    if (!G.activeTrade) {
      throw new GameLogicError("No active trade to cancel");
    }

    // 只有交易发起者可以取消
    if (G.activeTrade.initiatorId !== playerID) {
      throw new GameLogicError("Only the initiator can cancel the trade");
    }

    console.log(`[Trade] ${playerID} cancelled trade`);

    // 清除活跃交易
    G.activeTrade = null;
  }),

  // ==================== 卡牌选择阶段（新增）====================

  /**
   * 选择击杀后获得的卡牌
   *
   * 规则：
   * 1. 只能在 cardSelection 阶段进行
   * 2. 必须是当前选择者
   * 3. 只能从可用卡牌中选择一张
   *
   * @param G - 游戏状态
   * @param playerID - 选择者ID
   * @param cardId - 选择的卡牌ID
   */
  selectDroppedCard: wrapMove(
    ({ G, playerID }: MoveContext, cardId: string) => {
      assertNotEmpty(cardId, "cardId");
      const cardSelection = G.cardSelection[playerID];
      // 验证卡牌选择状态
      if (!cardSelection) {
        throw new GameLogicError("No card selection in progress");
      }

      // 验证选择者
      if (cardSelection.selectingPlayerId !== playerID) {
        throw new GameLogicError("You are not the current selector");
      }

      // 验证卡牌在可用列表中
      const cardIndex = cardSelection.availableCards.findIndex(
        (c) => c.id === cardId,
      );
      if (cardIndex === -1) {
        throw new GameLogicError("Card not available for selection");
      }

      const selectedCard = cardSelection.availableCards[cardIndex];

      // 完成卡牌选择过程
      Mutations.completeCardSelection(G, playerID, selectedCard);

      console.log(`[CardSelection] ${playerID} selected card ${cardId}`);
    },
  ),

  /**
   * 跳过卡牌选择
   *
   * @param G - 游戏状态
   * @param playerID - 选择者ID
   */
  skipCardSelection: wrapMove(({ G, playerID }: MoveContext) => {
    // 验证卡牌选择状态
    if (!G.cardSelection[playerID]) {
      throw new GameLogicError("No card selection in progress");
    }

    // 验证选择者
    if (G.cardSelection[playerID].selectingPlayerId !== playerID) {
      // 添加消息说明放弃选择
      throw new GameLogicError("You are not the current selector");
    }
    Mutations.msg(
      G,
      TMessageBuilder.createHiddenSystem(
        `玩家${G.players[playerID]?.seatNumber ?? playerID}放弃了卡牌选择`,
      ),
    );

    // 完成卡牌选择过程（无选卡）
    Mutations.completeCardSelection(G, playerID, null);

    console.log(`[CardSelection] ${playerID} skipped card selection`);
  }),
};

export { moveFunctions };
