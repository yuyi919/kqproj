"use client";

/**
 * Mutations - CQRS Command
 *
 * 状态修改函数集合，用于移动函数中的状态更新
 */
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import { mapValues } from "es-toolkit";
import type {
  BGGameState,
  CardRef,
  DeathCause,
  DeathRecord,
  RevealedInfoType,
  TMessage,
} from "../../types";
import { Selectors } from "../queries";

/**
 * 状态修改 - 用于移动函数中的状态更新
 * 这些函数会修改传入的状态对象
 */
export const Mutations = {
  /**
   * 添加消息到游戏状态
   */
  msg(state: BGGameState, message: TMessage): void {
    state.chatMessages.push(message);
  },

  /**
   * 向手牌添加卡牌
   * 规则：手牌上限为4张，超出时无法添加
   */
  addCardToHand(state: BGGameState, playerId: string, card: CardRef): boolean {
    const secret = state.secrets[playerId];
    if (!secret) return false;

    // 检查手牌上限
    if (Selectors.isHandFull(state, playerId)) {
      return false;
    }

    secret.hand.push(card);
    return true;
  },

  /**
   * 从手牌移除卡牌
   */
  removeCardFromHand(
    state: BGGameState,
    playerId: string,
    cardId: string,
  ): CardRef | null {
    const secret = state.secrets[playerId];
    if (!secret) return null;

    const index = secret.hand.findIndex((c) => c.id === cardId);
    if (index === -1) return null;

    const card = secret.hand[index];
    secret.hand.splice(index, 1);
    return card;
  },

  /**
   * 击杀玩家
   * 返回死亡记录和遗落的手牌（需要后续分配）
   */
  killPlayer(
    state: BGGameState,
    playerId: string,
    cause: DeathCause,
    killerId?: string,
    random?: RandomAPI,
  ): { record: DeathRecord; droppedCards: CardRef[] } | null {
    const player = state.players[playerId];
    const secret = state.secrets[playerId];
    if (!player || !secret) return null;

    const droppedCards = [...secret.hand];

    // 更新私有状态
    secret.status = cause === "wreck" ? "wreck" : "dead";
    secret.hand = [];
    secret.hasBarrier = false;
    secret.deathCause = cause;
    secret.killerId = killerId;
    // 注意：consecutiveNoKillRounds 不需要重置，因为 deadPlayers 检查在残骸化阶段已跳过已死亡玩家

    // 更新公开状态（wreck 显示为 dead）
    player.status = "dead";

    const hadWitchKiller = secret.witchKillerHolder;
    secret.witchKillerHolder = false;

    const record: DeathRecord = {
      round: state.round,
      playerId,
      cause,
      killerId,
      droppedCards,
      cardReceivers: {},
    };

    state.deathLog.push(record);

    // 处理魔女杀手转移
    if (hadWitchKiller) {
      if (cause === "wreck") {
        // 残骸化：魔女杀手永不被遗弃
        // 优先转移给击杀者，如果没有击杀者则随机选择存活玩家
        let receiverId: string | null = null;

        if (killerId) {
          // 有击杀者，转移给击杀者
          receiverId = killerId;
        } else {
          // 无击杀者（连续两夜未击杀导致的残骸化），随机选择
          const alivePlayers = Selectors.getAlivePlayers(state);
          if (alivePlayers.length > 0) {
            const randomIndex = random
              ? random.Die(alivePlayers.length) - 1
              : Math.floor(Math.random() * alivePlayers.length);
            receiverId = alivePlayers[randomIndex].id;
          }
        }

        if (receiverId) {
          this.transferWitchKiller(state, receiverId, droppedCards);
          state.secrets[receiverId].isWitch = true;
        }
      } else if (cause === "kill_magic" && killerId) {
        // 击杀者获得 witch_killer
        this.transferWitchKiller(state, killerId, droppedCards);
      }
    }

    return { record, droppedCards };
  },

  /**
   * 转移魔女杀手
   */
  transferWitchKiller(
    state: BGGameState,
    receiverId: string,
    droppedCards: CardRef[],
  ): boolean {
    const receiverSecret = state.secrets[receiverId];
    if (!receiverSecret) return false;

    receiverSecret.witchKillerHolder = true;

    const witchKillerCardIndex = droppedCards.findIndex(
      (c) => c.type === "witch_killer",
    );
    if (witchKillerCardIndex > -1) {
      const card = droppedCards[witchKillerCardIndex];
      receiverSecret.hand.push(card);
      droppedCards.splice(witchKillerCardIndex, 1);
    }
    return true;
  },

  /**
   * 添加揭示信息
   */
  addRevealedInfo(
    state: BGGameState,
    playerId: string,
    type: RevealedInfoType,
    content: unknown,
  ): void {
    const secret = state.secrets[playerId];
    if (!secret) return;

    secret.revealedInfo.push({
      type: type,
      content,
      timestamp: Date.now(),
    });
  },

  /**
   * 更新交易跟踪状态（新增）
   */
  updateTradeTracker(
    state: BGGameState,
    playerId: string,
    updates: Partial<{
      hasInitiatedToday: boolean;
      hasReceivedOfferToday: boolean;
      hasTradedToday: boolean;
    }>,
  ): void {
    if (!state.dailyTradeTracker[playerId]) {
      state.dailyTradeTracker[playerId] = {
        hasInitiatedToday: false,
        hasReceivedOfferToday: false,
        hasTradedToday: false,
      };
    }
    Object.assign(state.dailyTradeTracker[playerId], updates);
  },

  /**
   * 设置当前活跃交易（新增）
   */
  setActiveTrade(
    state: BGGameState,
    trade: {
      tradeId: string;
      initiatorId: string;
      targetId: string;
      offeredCardId: string;
      expiresAt: number;
    } | null,
  ): void {
    state.activeTrade = trade;
  },

  /**
   * 设置卡牌选择状态（新增）
   */
  setCardSelection(
    G: BGGameState,
    selection: {
      selectingPlayerId: string;
      availableCards: CardRef[];
      victimId: string;
      deadline: number;
    } | null,
  ): void {
    const playerId = selection?.selectingPlayerId;
    if (!playerId) return;
    G.cardSelection[playerId] = selection;
  },

  /**
   * 重置每日交易状态
   */
  resetDailyTradeStatus(state: BGGameState): void {
    state.dailyTradeTracker = mapValues(state.dailyTradeTracker, () => ({
      hasInitiatedToday: false,
      hasReceivedOfferToday: false,
      hasTradedToday: false,
    }));
  },

  /**
   * 完成卡牌选择过程
   */
  completeCardSelection(
    G: BGGameState,
    playerId: string,
    card: CardRef | null,
  ): void {
    if (G.cardSelection[playerId] && card) {
      const victimId = G.cardSelection[playerId].victimId;
      this.addCardToHand(G, playerId, card);

      // 记录到死亡记录的 cardReceivers
      const deathRecord = G.deathLog.findLast((r) => r.playerId === victimId);
      if (deathRecord) {
        if (!deathRecord.cardReceivers[playerId]) {
          deathRecord.cardReceivers[playerId] = [];
        }
        deathRecord.cardReceivers[playerId].push(card.id);
      }
    }
    G.cardSelection = {};
  },

  /**
   * 设置阶段定时器
   */
  setPhaseTimer(state: BGGameState, durationSeconds: number): void {
    const now = Date.now();
    state.phaseStartTime = now;
    state.phaseEndTime = now + durationSeconds * 1000;
  },
};
