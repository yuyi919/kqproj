/**
 * 测试工具模块
 *
 * 提供统一的测试辅助函数，消除测试代码中的重复代码
 */

import { expect } from "bun:test";
import type { Ctx, DefaultPluginAPIs, FnContext, MoveFn } from "boardgame.io";
import type { EventsAPI, PhaseHookContext } from "../game";
import type {
  BGGameState,
  GameConfig,
  MoveContext,
  PlayerStatus,
  RandomAPI,
} from "../types";
import { GamePhase } from "../types";
import type { CardRef } from "../types/card";
import type { PrivatePlayerInfo, RevealedInfoItem } from "../types/player";

// ==================== 标准配置 ====================

export const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 15,
    kill: 3,
    detect: 5,
    check: 4,
  },
  maxHandSize: 4,
  minVoteParticipationRate: 0.5,
  cardSelectionDuration: 15,
};

export const EIGHT_PLAYER_CONFIG: GameConfig = {
  ...SEVEN_PLAYER_CONFIG,
  maxPlayers: 8,
  cardPool: {
    ...SEVEN_PLAYER_CONFIG.cardPool,
    barrier: 17,
  },
};

export const NINE_PLAYER_CONFIG: GameConfig = {
  ...SEVEN_PLAYER_CONFIG,
  maxPlayers: 9,
  cardPool: {
    ...SEVEN_PLAYER_CONFIG.cardPool,
    barrier: 20,
  },
};

// ==================== MockRandom 构建器 ====================

/**
 * 创建模拟随机数生成器
 *
 * @param overrides - 可选的覆盖配置
 * @returns 符合 RandomAPI 接口的模拟对象
 */
export function createMockRandom(
  overrides: Partial<RandomAPI> = {},
): RandomAPI {
  return {
    Number: () => 0.5,
    Shuffle: <T>(arr: T[]): T[] => [...arr],
    Die: (sides: number) => Math.floor(sides / 2) + 1,
    D4: () => 2,
    D6: () => 3,
    D10: () => 5,
    D12: () => 6,
    D20: () => 10,
    ...overrides,
  } as RandomAPI;
}

/**
 * 创建确定性随机数生成器（固定值）
 */
export function createFixedRandom(): RandomAPI {
  return {
    Number: () => 0.5,
    Shuffle: <T>(arr: T[]): T[] => [...arr],
    Die: (sides: number) => 1, // 总是返回最小值
    D4: () => 1,
    D6: () => 1,
    D10: () => 1,
    D12: () => 1,
    D20: () => 1,
  } as RandomAPI;
}

/**
 * 创建确定性随机数生成器（固定最大值）
 */
export function createMaxRandom(): RandomAPI {
  return {
    Number: () => 0.99,
    Shuffle: <T>(arr: T[]): T[] => [...arr].reverse(),
    Die: (sides: number) => sides,
    D4: () => 4,
    D6: () => 6,
    D10: () => 10,
    D12: () => 12,
    D20: () => 20,
  } as RandomAPI;
}

// ==================== 游戏状态工厂 ====================

/**
 * 创建测试用游戏状态
 */
export function createTestState(
  config: GameConfig = SEVEN_PLAYER_CONFIG,
): BGGameState {
  return {
    id: `test-${Date.now()}`,
    roomId: "test-room",
    config: { ...config },
    players: {},
    playerOrder: [],
    secrets: {},
    deathLog: [],
    currentVotes: [],
    nightActions: [],
    actionHistory: [],
    voteHistory: [],
    deck: [],
    discardPile: [],
    chatMessages: [],
    phaseStartTime: 0,
    phaseEndTime: 0,
    round: 1,
    status: GamePhase.DEEP_NIGHT,
    imprisonedId: null,
    attackQuota: { witchKillerUsed: false, killMagicUsed: 0 },
    dailyTradeTracker: {},
    activeTrade: null,
    cardSelection: {},
  };
}

// ==================== 玩家工厂 ====================

export interface PlayerSetup {
  id: string;
  seatNumber?: number;
  status?: PlayerStatus;
  isWitch?: boolean;
  witchKillerHolder?: boolean;
  hand?: CardRef[];
  hasBarrier?: boolean;
  consecutiveNoKillRounds?: number;
  revealedInfo?: RevealedInfoItem[];
  deathCause?: "witch_killer" | "kill_magic" | "wreck";
  killerId?: string;
}

/**
 * 设置单个玩家
 */
export function setupPlayer(G: BGGameState, player: PlayerSetup): void {
  const seatNumber = player.seatNumber ?? Object.keys(G.players).length;
  const secret: PrivatePlayerInfo = {
    // id: player.id,
    hand: player.hand ?? [],
    status: player.status ?? "alive",
    isWitch: player.isWitch ?? false,
    witchKillerHolder: player.witchKillerHolder ?? false,
    hasBarrier: player.hasBarrier ?? false,
    consecutiveNoKillRounds: player.consecutiveNoKillRounds ?? 0,
    revealedInfo: player.revealedInfo ?? [],
    lastKillRound: 0,
  };

  if (player.deathCause) {
    secret.deathCause = player.deathCause;
  }
  if (player.killerId) {
    secret.killerId = player.killerId;
  }

  G.players[player.id] = {
    id: player.id,
    seatNumber,
    status:
      player.status === "wreck"
        ? "dead"
        : player.status === "witch"
          ? "alive"
          : (player.status ?? "alive"),
  };
  G.playerOrder.push(player.id);
  G.secrets[player.id] = secret;
}

/**
 * 设置多个玩家（支持简单 ID 数组或完整 PlayerSetup 数组）
 */
export function setupPlayers(
  G: BGGameState,
  players: (PlayerSetup | string)[],
): void {
  players.forEach((player, index) => {
    if (typeof player === "string") {
      // 简单 ID 格式
      setupPlayer(G, { id: player, seatNumber: index });
    } else {
      // 完整 PlayerSetup 格式
      const playerWithSeat = {
        ...player,
        seatNumber: player.seatNumber ?? index,
      };
      setupPlayer(G, playerWithSeat);
    }
  });
}

/**
 * 快速创建带手牌的玩家
 */
export function createPlayerWithHand(
  playerId: string,
  hand: CardRef[],
  seatNumber: number = 0,
): PlayerSetup {
  return {
    id: playerId,
    seatNumber,
    hand,
    status: "alive",
    isWitch: false,
    witchKillerHolder: false,
  };
}

/**
 * 创建 witch 玩家
 */
export function createWitchPlayer(
  playerId: string,
  seatNumber: number = 0,
): PlayerSetup {
  return {
    id: playerId,
    seatNumber,
    status: "alive",
    isWitch: true,
    witchKillerHolder: false,
  };
}

/**
 * 创建 witch_killer 持有者
 */
export function createWitchKillerHolder(
  playerId: string,
  hand?: CardRef[],
  seatNumber: number = 0,
): PlayerSetup {
  return {
    id: playerId,
    seatNumber,
    hand,
    status: "witch" as const,
    isWitch: true,
    witchKillerHolder: true,
  };
}

// ==================== 卡牌工厂 ====================

/**
 * 创建卡牌引用
 */
export function createCard(id: string, type: CardRef["type"]): CardRef {
  return { id, type };
}

/**
 * 创建探测卡
 */
export function createDetectCard(id: string = "detect"): CardRef {
  return createCard(id, "detect");
}

/**
 * 创建检定卡
 */
export function createCheckCard(id: string = "check"): CardRef {
  return createCard(id, "check");
}

/**
 * 创建结界卡
 */
export function createBarrierCard(id: string = "barrier"): CardRef {
  return createCard(id, "barrier");
}

/**
 * 创建杀人卡
 */
export function createKillCard(id: string = "kill"): CardRef {
  return createCard(id, "kill");
}

/**
 * 创建魔女杀手卡
 */
export function createWitchKillerCard(id: string = "witch_killer"): CardRef {
  return createCard(id, "witch_killer");
}

/**
 * 创建玩家手牌
 */
export function createHand(...cards: CardRef[]): CardRef[] {
  return cards;
}

// ==================== NightAction 工厂 ====================

export interface NightActionSetup {
  playerId: string;
  cardType: CardRef["type"];
  targetId?: string;
  timestamp?: number;
}

// 导出类型供其他地方使用
export type { CardRef } from "../types/card";

/**
 * 创建夜间行动 - 函数重载签名
 */
export function createNightAction(
  playerId: string,
  cardType: CardRef["type"],
  targetId?: string,
): {
  id: string;
  timestamp: number;
  playerId: string;
  targetId?: string;
  card: CardRef;
};

export function createNightAction(setup: NightActionSetup): {
  id: string;
  timestamp: number;
  playerId: string;
  targetId?: string;
  card: CardRef;
};

export function createNightAction(
  playerIdOrSetup: string | NightActionSetup,
  cardType?: CardRef["type"],
  targetId?: string,
) {
  const setup =
    typeof playerIdOrSetup === "string"
      ? { playerId: playerIdOrSetup, cardType: cardType!, targetId }
      : playerIdOrSetup;

  const timestamp = setup.timestamp ?? Date.now();
  return {
    id: `na-${setup.playerId}-${timestamp}`,
    timestamp,
    playerId: setup.playerId,
    targetId: setup.targetId,
    card: {
      id: `card-${setup.playerId}-${timestamp}`,
      type: setup.cardType,
    },
  };
}

/**
 * 创建探测行动
 */
export function createDetectAction(
  playerId: string,
  targetId: string,
  timestamp?: number,
) {
  return createNightAction({
    playerId,
    cardType: "detect",
    targetId,
    timestamp,
  });
}

/**
 * 创建检定行动
 */
export function createCheckAction(
  playerId: string,
  targetId: string,
  timestamp?: number,
) {
  return createNightAction({
    playerId,
    cardType: "check",
    targetId,
    timestamp,
  });
}

/**
 * 创建结界行动
 */
export function createBarrierAction(playerId: string, timestamp?: number) {
  return createNightAction({ playerId, cardType: "barrier", timestamp });
}

/**
 * 创建杀人行动
 */
export function createKillAction(
  playerId: string,
  targetId: string,
  timestamp?: number,
) {
  return createNightAction({ playerId, cardType: "kill", targetId, timestamp });
}

/**
 * 创建魔女杀手行动
 */
export function createWitchKillerAction(
  playerId: string,
  targetId: string,
  timestamp?: number,
) {
  return createNightAction({
    playerId,
    cardType: "witch_killer",
    targetId,
    timestamp,
  });
}

/**
 * 创建弃权行动
 */
export function createPassAction(playerId: string, timestamp?: number) {
  const ts = timestamp ?? Date.now();
  return {
    id: `na-${playerId}-${ts}`,
    timestamp: ts,
    playerId,
    card: null,
  };
}

// ==================== Vote 工厂 ====================

export interface VoteSetup {
  voterId: string;
  targetId: string;
  round?: number;
  timestamp?: number;
}

/**
 * 创建投票
 */
export function createVote(setup: VoteSetup) {
  return {
    voterId: setup.voterId,
    targetId: setup.targetId,
    round: setup.round ?? 1,
    timestamp: setup.timestamp ?? Date.now(),
  };
}

/**
 * 创建弃权投票
 */
export function createAbstentionVote(
  voterId: string,
  round?: number,
  timestamp?: number,
) {
  return createVote({ voterId, targetId: voterId, round, timestamp });
}

// ==================== 断言辅助函数 ====================

/**
 * 验证玩家状态
 */
export function expectPlayerAlive(G: BGGameState, playerId: string): void {
  expect(G.players[playerId].status).toBe("alive");
  expect(G.secrets[playerId].status).toBe("alive");
}

export function expectPlayerDead(G: BGGameState, playerId: string): void {
  expect(G.players[playerId].status).toBe("dead");
}

/**
 * 验证手牌数量
 */
export function expectHandCount(
  G: BGGameState,
  playerId: string,
  count: number,
): void {
  expect(G.secrets[playerId].hand).toHaveLength(count);
}

/**
 * 验证卡牌存在于手牌
 */
export function expectCardInHand(
  G: BGGameState,
  playerId: string,
  cardType: CardRef["type"],
): void {
  expect(G.secrets[playerId].hand.some((c) => c.type === cardType)).toBe(true);
}

/**
 * 验证卡牌不存在于手牌
 */
export function expectCardNotInHand(
  G: BGGameState,
  playerId: string,
  cardType: CardRef["type"],
): void {
  expect(G.secrets[playerId].hand.some((c) => c.type === cardType)).toBe(false);
}

/**
 * 验证玩家是 witch
 */
export function expectPlayerIsWitch(G: BGGameState, playerId: string): void {
  expect(G.secrets[playerId].isWitch).toBe(true);
}

/**
 * 验证玩家持有 witch_killer
 */
export function expectPlayerHasWitchKiller(
  G: BGGameState,
  playerId: string,
): void {
  expect(G.secrets[playerId].witchKillerHolder).toBe(true);
}

// ==================== Phase Context 工厂 ====================

/**
 * 创建 move 上下文
 */
export function createMoveContext(
  G: BGGameState,
  playerId: string,
  phase: GamePhase = GamePhase.DEEP_NIGHT,
) {
  return {
    G,
    ctx: {
      turn: 1,
      currentPlayer: playerId,
      phase,
      numPlayers: G.playerOrder.length,
      playOrder: G.playerOrder,
      playOrderPos: G.playerOrder.indexOf(playerId),
      _random: { seed: "test-seed" },
      activePlayers: null,
    },
    playerID: playerId,
    events: {},
    random: createMockRandom(),
  } as MoveContext;
}

/**
 * 创建 phase 上下文
 */
export function createPhaseContext(G: BGGameState, phase?: GamePhase) {
  return {
    G,
    ctx: {
      turn: 1,
      currentPlayer: G.playerOrder[0],
      phase: phase ?? GamePhase.DEEP_NIGHT,
      numPlayers: G.playerOrder.length,
      playOrder: G.playerOrder,
      playOrderPos: 0,
      activePlayers: null,
    },
    random: createMockRandom(),
    events: {
      endPhase: () => {},
    } as EventsAPI,
    log: {},
  } as PhaseHookContext;
}

/**
 * 创建 setup 上下文
 */
export function createSetupContext(playerIds: string[]) {
  return {
    ctx: {
      turn: 1,
      currentPlayer: playerIds[0],
      phase: "setup",
      numPlayers: playerIds.length,
      playOrder: playerIds,
      playOrderPos: 0,
      activePlayers: null,
    },
    random: createMockRandom(),
    events: {},
    log: {},
  } as MockContext;
}

type MockContext = Record<string, unknown> &
  DefaultPluginAPIs & {
    ctx: Ctx;
  };

/**
 * 调用 move 函数
 */
export function callMove<G extends BGGameState = BGGameState>(
  move: MoveFn<G>,
  context: FnContext<G> & { playerID: string },
  ...args: unknown[]
) {
  return move(context, ...args);
}

/**
 * 创建 playerView 上下文
 */
export function createPlayerViewContext(
  G: BGGameState,
  playerId: string | null,
) {
  return {
    G,
    ctx: {
      turn: 1,
      currentPlayer: G.playerOrder[0],
      phase: "deepNight",
      numPlayers: G.playerOrder.length,
      playOrder: G.playerOrder,
      playOrderPos: 0,
      _random: { seed: "test-seed" },
      activePlayers: null,
    },
    playerID: playerId,
  };
}

/**
 * 创建 endIf 上下文
 */
export function createEndIfContext(G: BGGameState) {
  return {
    G,
    ctx: {
      turn: 1,
      currentPlayer: G.playerOrder[0],
      phase: "deepNight",
      numPlayers: G.playerOrder.length,
      playOrder: G.playerOrder,
      playOrderPos: 0,
      _random: { seed: "test-seed" },
      activePlayers: null,
    },
  } as FnContext;
}
