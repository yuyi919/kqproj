"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 游戏定义
 *
 * 目录结构：
 * - errors.ts       错误类型
 * - types.ts        类型定义
 * - assertions.ts   Assertion 函数
 * - refinements.ts  Refinement 函数
 * - wrapMove.ts     Move 包装器
 * - moves.ts        Move 函数
 * - phases.ts       Phase 配置
 * - resolution.ts   夜间结算逻辑
 * - index.ts        主游戏定义（本文件）
 */

import type { Game } from "boardgame.io";
import { nanoid } from "nanoid";
import type {
  BGGameState,
  PrivatePlayerInfo,
  GamePhase,
  PublicPlayerInfo,
} from "../types";
import { SEVEN_PLAYER_CONFIG } from "../types";
import { createDeck } from "../utils";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";
import { mapValues } from "es-toolkit";
import { phaseConfigs } from "./phases";
import { resolveNightActions } from "./resolution";

export type { RandomAPI, EventsAPI };

// 重新导出子模块
export {
  GameLogicError,
} from "./errors";

export type {
  GameCtx,
  MoveContext,
  PhaseHookContext,
  PlayerFullInfo,
} from "./types";

export {
  assertPhase,
  assertNotEmpty,
  assertPlayerAlive,
  assertCardInHand,
  assertWitchKillerCardAllowed,
  assertAttackQuotaAvailable,
  assertValidMessage,
} from "./assertions";

export {
  isImprisoned,
  isWitch,
  hasKilledThisRound,
  findExistingVoteIndex,
} from "./refinements";

export { wrapMove } from "./wrapMove";
export { moveFunctions } from "./moves";
export { phaseConfigs } from "./phases";
export { resolveNightActions } from "./resolution";

// ==================== 游戏定义 ====================

export const WitchTrialGame: Game<BGGameState> = {
  name: "witch-trial",
  minPlayers: 2,
  maxPlayers: 14,

  setup: ({ ctx, random }, setupData): BGGameState => {
    console.log("setupData", setupData);
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

    const now = Date.now();

    return {
      id: nanoid(),
      roomId: setupData?.roomId || "default",
      status: "morning",
      round: 1,
      players,
      playerOrder: [...playerIds],
      deck,
      discardPile: [],
      currentActions: {},
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
      config,
      phaseStartTime: now,
      phaseEndTime: now + config.dayDuration * 1000,
      secrets,
      chatMessages: [],
    };
  },

  phases: phaseConfigs,

  playerView: ({ G, playerID }) => {
    // G.players 已经是公开状态，直接使用
    // 根据私有状态更新公开状态：witch -> alive, wreck -> dead
    const publicPlayers = mapValues(
      G.players,
      (player, id): PublicPlayerInfo => {
        const privateStatus = G.secrets[id]?.status;
        const isDead = privateStatus === "dead" || privateStatus === "wreck";
        return {
          ...player,
          status: isDead ? "dead" : "alive",
        };
      },
    );

    const publicState: BGGameState = {
      ...G,
      players: publicPlayers,
      secrets: {},
      deck: [],
    };

    if (playerID && G.secrets[playerID]) {
      publicState.secrets[playerID] = G.secrets[playerID];
    }

    return publicState;
  },

  endIf: ({ G }) => {
    // 从私有状态中判断存活玩家（witch 也算存活）
    const alivePlayers = Object.values(G.players).filter((p) => {
      const privateStatus = G.secrets[p.id]?.status;
      return privateStatus === "alive" || privateStatus === "witch";
    });

    if (alivePlayers.length <= 1) {
      return {
        winner: alivePlayers.length === 1 ? alivePlayers[0].id : null,
      };
    }

    if (G.round > G.config.maxRounds) {
      return {
        winner: alivePlayers.length === 1 ? alivePlayers[0].id : null,
      };
    }

    return undefined;
  },
};
