"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 游戏定义
 *
 * 设计原则：
 * 1. G 只存储原子状态
 * 2. 计算状态通过 selectors/computeds 计算
 * 3. 秘密信息通过 playerView 过滤
 * 4. 所有 moves/phases 都有确定的类型
 * 5. Assertion: 验证失败抛出错误，由 wrapMove 捕获返回 INVALID_MOVE
 * 6. Refinement: 验证失败继续执行，用于条件逻辑分支
 */

import type {
  Game,
  Ctx,
  Move,
  DefaultPluginAPIs,
  PhaseConfig,
  ActivePlayersArg,
} from "boardgame.io";
import { ActivePlayers, TurnOrder, INVALID_MOVE } from "boardgame.io/core";
import { nanoid } from "nanoid";
import type {
  BGGameState,
  PrivatePlayerInfo,
  GamePhase,
  DeathCause,
  CardRef,
  PublicPlayerInfo,
  ChatMessage,
  CardType,
} from "./types";
import { SEVEN_PLAYER_CONFIG } from "./types";
import { createDeck, getCardDefinition, Selectors, Mutations } from "./utils";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";
import { mapValues } from "es-toolkit";
export type { RandomAPI, EventsAPI };

// ==================== 错误类型 ====================

class GameLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameLogicError";
  }
}

// ==================== 类型定义 ====================

/** Boardgame.io 扩展的 Ctx 类型 */
interface GameCtx extends Ctx {
  playOrder: string[];
}

/** Move 函数上下文 - 使用 boardgame.io 标准类型 */
interface MoveContext {
  G: BGGameState;
  ctx: GameCtx;
  playerID: string;
  events: DefaultPluginAPIs["events"];
  random: RandomAPI;
}

/** Phase 钩子上下文 */
interface PhaseHookContext {
  G: BGGameState;
  ctx: GameCtx;
  events: EventsAPI;
  random: RandomAPI;
}

/** 玩家完整信息（公开 + 私有） */
interface PlayerFullInfo {
  id: string;
  public: PublicPlayerInfo;
  secret: PrivatePlayerInfo;
}

// ==================== Assertion（验证失败返回 INVALID_MOVE）====================

/**
 * Assertion: 验证游戏阶段
 * @throws GameLogicError 阶段不匹配时抛出
 */
function assertPhase(G: BGGameState, ...allowedPhases: GamePhase[]): void {
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
function assertNotEmpty<T>(
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
function assertPlayerAlive(G: BGGameState, playerID: string): PlayerFullInfo {
  const publicInfo = G.players[playerID];
  const secret = G.secrets[playerID];

  if (!publicInfo || !secret) {
    throw new GameLogicError(`Player ${playerID} not found`);
  }

  const isAlive = secret.status === "alive" || secret.status === "witch";
  if (!isAlive) {
    throw new GameLogicError(`Player ${playerID} is not alive`);
  }

  return {
    id: playerID,
    public: publicInfo,
    secret,
  };
}

/**
 * Assertion: 验证卡牌在手牌中
 * @returns 卡牌索引和卡牌对象
 * @throws GameLogicError 卡牌不存在时抛出
 */
function assertCardInHand(
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
function assertWitchKillerCardAllowed(
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
 * @throws GameLogicError 名额不足时抛出
 */
function assertAttackQuotaAvailable(G: BGGameState, cardType: CardType): void {
  if (cardType === "witch_killer" || cardType === "kill") {
    if (cardType === "witch_killer") {
      if (G.attackQuota.witchKillerUsed) {
        throw new GameLogicError("Witch killer quota already used");
      }
    } else {
      const maxKillMagic = G.attackQuota.witchKillerUsed ? 2 : 3;
      if (G.attackQuota.killMagicUsed >= maxKillMagic) {
        throw new GameLogicError("Kill magic quota exceeded");
      }
    }
  }
}

/**
 * Assertion: 验证发言内容
 * @throws GameLogicError 内容无效时抛出
 */
function assertValidMessage(content: string): void {
  if (!content || content.trim().length === 0) {
    throw new GameLogicError("Message cannot be empty");
  }
  if (content.length > 500) {
    throw new GameLogicError("Message too long (max 500 chars)");
  }
}

// ==================== Refinement（验证失败不抛出，用于条件分支）====================

/**
 * Refinement: 检查玩家是否被监禁
 */
function isImprisoned(G: BGGameState, playerID: string): boolean {
  return G.imprisonedId === playerID;
}

/**
 * Refinement: 检查玩家是否是魔女
 */
function isWitch(player: PlayerFullInfo): boolean {
  return player.secret.isWitch;
}

/**
 * Refinement: 检查玩家本回合是否已击杀
 */
function hasKilledThisRound(G: BGGameState, playerID: string): boolean {
  return G.nightActions.some(
    (a) =>
      a.playerId === playerID &&
      (a.cardType === "witch_killer" || a.cardType === "kill"),
  );
}

/**
 * Refinement: 检查投票是否已存在
 * @returns 已有投票的索引，不存在返回 -1
 */
function findExistingVoteIndex(G: BGGameState, playerID: string): number {
  return G.currentVotes.findIndex((v) => v.voterId === playerID);
}

// ==================== Move 包装器 ====================

/**
 * 执行 move 函数的包装器
 * 捕获 GameLogicError 并返回 INVALID_MOVE
 */
function wrapMove<T extends unknown[]>(
  fn: (ctx: MoveContext, ...args: T) => void,
): Move<BGGameState> {
  return (ctx, ...args) => {
    try {
      fn(ctx, ...(args as T));
    } catch (error) {
      if (error instanceof GameLogicError) {
        console.error(error);
        return INVALID_MOVE;
      }
      throw error;
    }
  };
}

// ==================== Move 函数定义 ====================

const moveFunctions = {
  /** 投票 move */
  vote: wrapMove(({ G, playerID }: MoveContext, targetId: string) => {
    assertPhase(G, "voting");
    assertNotEmpty(targetId, "targetId");
    assertPlayerAlive(G, playerID);

    const existingIndex = findExistingVoteIndex(G, playerID);
    const vote = {
      voterId: playerID,
      targetId,
      round: G.round,
      timestamp: Date.now(),
    };

    if (existingIndex !== -1) {
      G.currentVotes[existingIndex] = vote;
    } else {
      G.currentVotes.push(vote);
    }
  }),

  /** 弃权 move */
  pass: wrapMove(({ G, playerID }: MoveContext) => {
    assertPhase(G, "voting");
    assertPlayerAlive(G, playerID);

    const existingIndex = findExistingVoteIndex(G, playerID);
    const vote = {
      voterId: playerID,
      targetId: playerID,
      round: G.round,
      timestamp: Date.now(),
    };

    if (existingIndex !== -1) {
      G.currentVotes[existingIndex] = vote;
    } else {
      G.currentVotes.push(vote);
    }
  }),

  /** 使用卡牌 move */
  useCard: wrapMove(
    ({ G, playerID }: MoveContext, cardId: string, targetId?: string) => {
      assertPhase(G, "night");
      const player = assertPlayerAlive(G, playerID);

      // Refinement: 被监禁是条件限制，不是非法移动
      if (isImprisoned(G, playerID)) {
        throw new GameLogicError("Player is imprisoned");
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
        cardId: card.id,
        cardType: card.type,
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

    const message: ChatMessage = {
      id: nanoid(),
      playerId: playerID,
      playerName: `玩家${player.public.seatNumber}`,
      content: content.trim(),
      timestamp: Date.now(),
    };

    G.chatMessages.push(message);

    // 限制聊天记录数量，避免状态过大
    if (G.chatMessages.length > 200) {
      G.chatMessages.shift();
    }
  }),
};

// ==================== Phase 配置 ====================

const phaseConfigs = {
  morning: {
    start: true,
    moves: {},
    next: "day",
    turn: {
      order: TurnOrder.RESET,
      activePlayers: {
        all: "wait",
      },
      stages: {
        wait: {
          moves: {
            say: moveFunctions.say,
          },
        },
      },
    },
    endIf({ G }: PhaseHookContext) {
      return G.phaseEndTime <= Date.now();
    },
    onBegin: ({ G, events }: PhaseHookContext) => {
      const duration = 5000;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + duration;
    },
  } as PhaseConfig<BGGameState>,

  day: {
    moves: {
      say: moveFunctions.say,
    },
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    next: "voting",
    onBegin: ({ G, ctx }: PhaseHookContext) => {
      console.log("dayPhase onBegin", ctx._random);
      G.status = "day" as GamePhase;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.dayDuration * 1000;
    },
  } as PhaseConfig<BGGameState>,

  voting: {
    moves: {
      vote: moveFunctions.vote,
      pass: moveFunctions.pass,
    },
    next: "night",
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = "voting" as GamePhase;
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.votingDuration * 1000;
    },
    onEnd: ({ G }: PhaseHookContext) => {
      const voteCounts: Record<string, number> = {};
      for (const vote of G.currentVotes) {
        voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
      }

      let maxVotes = 0;
      let imprisonedId: string | null = null;
      let isTie = false;

      for (const [targetId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          imprisonedId = targetId;
          isTie = false;
        } else if (count === maxVotes && maxVotes > 0) {
          isTie = true;
        }
      }

      if (isTie) {
        imprisonedId = null;
      }

      G.imprisonedId = imprisonedId;

      const votes: Record<string, string[]> = {};
      for (const vote of G.currentVotes) {
        if (!votes[vote.targetId]) {
          votes[vote.targetId] = [];
        }
        votes[vote.targetId].push(vote.voterId);
      }

      G.voteHistory.push({
        round: G.round,
        votes,
        imprisonedId,
        isTie,
        voteCounts,
      });
    },
  } as PhaseConfig<BGGameState>,

  night: {
    moves: {
      useCard: moveFunctions.useCard,
      pass: moveFunctions.passNight,
    },
    next: "resolution",
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = "night" as GamePhase;
      G.attackQuota = {
        witchKillerUsed: false,
        killMagicUsed: 0,
      };
      G.phaseStartTime = Date.now();
      G.phaseEndTime = Date.now() + G.config.nightDuration * 1000;
    },
    onEnd: ({ G, random }: PhaseHookContext) => {
      resolveNightActions(G, random);
    },
  } as PhaseConfig<BGGameState>,

  resolution: {
    moves: {},
    next: "morning",
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = "resolution" as GamePhase;
    },
  } as PhaseConfig<BGGameState>,
};

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

// ==================== 夜间结算逻辑 ====================

function resolveNightActions(G: BGGameState, random: RandomAPI): void {
  const sortedActions = [...G.nightActions].sort((a, b) => {
    const priorityA = getCardPriority(a.cardType);
    const priorityB = getCardPriority(b.cardType);
    return priorityB - priorityA;
  });

  const deadPlayers = new Set<string>();
  const barrierPlayers = new Set<string>();

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

  for (const [playerId, secret] of Object.entries(G.secrets)) {
    if (!secret.isWitch) continue;
    if (deadPlayers.has(playerId)) continue;

    const hasKilled = G.nightActions.some(
      (a) =>
        a.playerId === playerId &&
        (a.cardType === "witch_killer" || a.cardType === "kill"),
    );

    if (!hasKilled) {
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

  G.round++;
  G.currentVotes = [];
  G.nightActions = [];
  G.imprisonedId = null;
}

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

// ==================== 导出 ====================

export {
  moveFunctions,
  phaseConfigs,
  GameLogicError,
  wrapMove,
  // Assertion 函数
  assertPhase,
  assertNotEmpty,
  assertPlayerAlive,
  assertCardInHand,
  assertWitchKillerCardAllowed,
  assertAttackQuotaAvailable,
  assertValidMessage,
  // Refinement 函数
  isImprisoned,
  isWitch,
  hasKilledThisRound,
  findExistingVoteIndex,
};
