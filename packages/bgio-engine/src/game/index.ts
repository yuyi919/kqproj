"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 游戏定义
 *
 * 目录结构：
 * - errors.ts       错误类型
 * - types.ts        类型定义
 * - assertions.ts   Assertion 函数
 * - wrapMove.ts     Move 包装器
 * - moves.ts        Move 函数
 * - phases.ts       Phase 配置
 * - resolution.ts   夜间结算逻辑
 * - index.ts        主游戏定义（本文件）
 */

import type { Game } from "boardgame.io";
import type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import { nanoid } from "nanoid";
import type {
  BGGameState,
  PrivatePlayerInfo,
  PublicPlayerInfo,
} from "../types";
import {
  createDeck,
  Mutations,
  Selectors,
  SEVEN_PLAYER_CONFIG,
} from "../utils";
import { phaseConfigs } from "./phases";

export type { EventsAPI, RandomAPI };

// 重新导出子模块
export { GameLogicError } from "./errors";

export type { GameCtx, PhaseHookContext } from "./types";

import { GamePhase } from "../types/core";
export type { MoveContext, PlayerFullInfo } from "../types";

export {
  assertAttackQuotaAvailable,
  assertCardInHand,
  assertNotEmpty,
  assertPhase,
  assertPlayerAlive,
  assertValidMessage,
  assertWitchKillerCardAllowed,
} from "./assertions";

export { moveFunctions } from "./moves";
export { phaseConfigs } from "./phases";
export { resolveNightActions } from "./resolution";
export { wrapMove } from "./wrapMove";

// ==================== 游戏定义 ====================

export const TypedWitchTrialGame = {
  name: "witch-trial",
  minPlayers: 2,
  maxPlayers: 14,

  setup({ ctx, random }, setupData): BGGameState {
    const config = setupData?.config || SEVEN_PLAYER_CONFIG;
    const playerIds = ctx.playOrder;

    const deck = createDeck(config.cardPool, random.Shuffle);

    const players: Record<string, PublicPlayerInfo> = {};
    const secrets: Record<string, PrivatePlayerInfo> = {};

    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const initialCards = deck.splice(0, 4);

      const witchKillerHolder = initialCards.some(
        (c) => c.type === "witch_killer",
      );

      // 公开信息：status 永远是公开状态（witch 显示为 alive）
      players[playerId] = {
        id: playerId,
        seatNumber: i + 1,
        status: "alive",
      };

      // 私有信息：包含完整状态（包括 witch/wreck）
      secrets[playerId] = {
        status: witchKillerHolder ? "witch" : "alive",
        hand: initialCards,
        isWitch: witchKillerHolder,
        hasBarrier: false,
        witchKillerHolder,
        lastKillRound: 0,
        consecutiveNoKillRounds: 0,
        revealedInfo: [],
      };
    }

    const instance: BGGameState = {
      id: nanoid(),
      roomId: setupData?.roomId || "default",
      status: GamePhase.SETUP,
      round: 1,
      players,
      playerOrder: [...playerIds],
      deck,
      discardPile: [],
      currentVotes: [],
      nightActions: [],
      actionHistory: [],
      voteHistory: [],
      deathLog: [],
      imprisonedId: null,
      attackQuota: {
        witchKillerUsed: false,
        killMagicUsed: 0,
      },
      // 交易系统状态
      dailyTradeTracker: {},
      activeTrade: null,
      // 卡牌选择状态
      cardSelection: {},
      config,
      phaseStartTime: 0,
      phaseEndTime: 0,
      secrets,
      chatMessages: [],
    };

    Mutations.setPhaseTimer(instance, 5); // 初始阶段（morning）5秒
    return instance;
  },

  phases: phaseConfigs,

  playerView: ({ G, playerID }) => {
    const pid = playerID || "";
    const publicState: BGGameState = {
      ...G,
      // 当处于卡牌选择阶段且玩家没有卡牌选择时，显示为深夜阶段，避免其它玩家察觉到有魔女杀手以外的杀人事件发生了
      status:
        G.status === GamePhase.CARD_SELECTION && !G.cardSelection[pid]
          ? GamePhase.DEEP_NIGHT
          : G.status,
      players: Selectors.computePublicPlayers(G),
      secrets: {},
      deck: [],
      actionHistory: [],
      chatMessages: Selectors.filterMessagesForPlayer(G.chatMessages, pid),
      deathLog: Selectors.filterDeathLogForPlayer(G.deathLog, pid) as any,
    };

    if (playerID) {
      if (playerID === "0") {
        // 调试模式：显示所有玩家的私有信息
        publicState.secrets = G.secrets;
      } else if (G.secrets[playerID]) {
        publicState.secrets[playerID] = G.secrets[playerID];
      }
    }

    return publicState;
  },

  endIf: ({ G }) => {
    if (Selectors.isGameOver(G)) {
      return {
        winner: Selectors.computeWinner(G),
      };
    }
    return undefined;
  },
} satisfies Game<BGGameState>;

export const WitchTrialGame: Game<BGGameState> = TypedWitchTrialGame;
