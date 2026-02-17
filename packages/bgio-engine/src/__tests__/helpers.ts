"use client";

/**
 * 通用测试工厂函数
 *
 * 提供统一的测试数据构建函数，符合 Phase 4 决策：
 * - 工厂函数使用 `make` 前缀
 * - 支持覆盖默认配置
 * - 与 Effect-TS 服务层测试兼容
 */

import { Layer } from "effect";
import type { RandomAPI } from "../game";
import type {
  BGGameState,
  CardRef,
  CardType,
  GameConfig,
  PlayerStatus,
  PrivatePlayerInfo,
  PublicPlayerInfo,
} from "../types";
import { GamePhase } from "../types";
import { makeGameRandomLayer } from "../effect/context/gameRandom";
import { GameStateRef } from "../effect/context/gameStateRef";
import { BaseGameLayers } from "../effect/layers/gameLayers";

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

// ==================== MockRandom 构建器 ====================

/**
 * 创建模拟随机数生成器
 */
export function createMockRandom(overrides: Partial<RandomAPI> = {}): RandomAPI {
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

// ==================== 游戏状态工厂 ====================

export interface MakeGameStateOptions {
  config?: GameConfig;
  overrides?: Partial<BGGameState>;
}

/**
 * 创建基础游戏状态
 *
 * @param options - 可选配置和覆盖项
 * @returns 完整的 BGGameState
 */
export function makeGameState(options: MakeGameStateOptions = {}): BGGameState {
  const config = options.config ?? SEVEN_PLAYER_CONFIG;
  const overrides = options.overrides ?? {};

  return {
    id: overrides.id ?? `test-${Date.now()}`,
    roomId: overrides.roomId ?? "test-room",
    config: { ...config },
    players: overrides.players ?? {},
    playerOrder: overrides.playerOrder ?? [],
    secrets: overrides.secrets ?? {},
    deathLog: overrides.deathLog ?? [],
    currentVotes: overrides.currentVotes ?? [],
    nightActions: overrides.nightActions ?? [],
    actionHistory: overrides.actionHistory ?? [],
    voteHistory: overrides.voteHistory ?? [],
    deck: overrides.deck ?? [],
    discardPile: overrides.discardPile ?? [],
    chatMessages: overrides.chatMessages ?? [],
    phaseStartTime: overrides.phaseStartTime ?? 0,
    phaseEndTime: overrides.phaseEndTime ?? 0,
    round: overrides.round ?? 1,
    status: overrides.status ?? GamePhase.DEEP_NIGHT,
    imprisonedId: overrides.imprisonedId ?? null,
    attackQuota: overrides.attackQuota ?? { witchKillerUsed: false, killMagicUsed: 0 },
    dailyTradeTracker: overrides.dailyTradeTracker ?? {},
    activeTrade: overrides.activeTrade ?? null,
    cardSelection: overrides.cardSelection ?? {},
  };
}

// ==================== 玩家工厂 ====================

export interface MakePlayerOptions {
  seatNumber?: number;
  status?: PlayerStatus;
  isWitch?: boolean;
  witchKillerHolder?: boolean;
  hand?: CardRef[];
  hasBarrier?: boolean;
  consecutiveNoKillRounds?: number;
}

/**
 * 创建玩家对象
 *
 * @param id - 玩家ID
 * @param options - 玩家配置选项
 * @returns 包含 public 和 secret 状态的对象
 */
export function makePlayer(
  id: string,
  options: MakePlayerOptions = {},
): { public: PublicPlayerInfo; secret: PrivatePlayerInfo } {
  const status = options.status ?? "alive";
  const isWitch = options.isWitch ?? false;
  const witchKillerHolder = options.witchKillerHolder ?? false;

  // 计算公开状态（witch 显示为 alive，wreck 显示为 dead）
  const publicStatus: "alive" | "dead" =
    status === "witch"
      ? "alive"
      : status === "wreck"
        ? "dead"
        : status;

  const publicInfo: PublicPlayerInfo = {
    id,
    seatNumber: options.seatNumber ?? 0,
    status: publicStatus,
  };

  const secretInfo: PrivatePlayerInfo = {
    hand: options.hand ?? [],
    status,
    isWitch,
    witchKillerHolder,
    hasBarrier: options.hasBarrier ?? false,
    consecutiveNoKillRounds: options.consecutiveNoKillRounds ?? 0,
    revealedInfo: [],
    lastKillRound: 0,
  };

  return { public: publicInfo, secret: secretInfo };
}

/**
 * 添加玩家到游戏状态
 *
 * @param state - 游戏状态
 * @param id - 玩家ID
 * @param options - 玩家配置选项
 */
export function addPlayerToState(
  state: BGGameState,
  id: string,
  options: MakePlayerOptions = {},
): void {
  const seatNumber = options.seatNumber ?? state.playerOrder.length;
  const player = makePlayer(id, { ...options, seatNumber });

  state.players[id] = player.public;
  state.secrets[id] = player.secret;
  state.playerOrder.push(id);
}

// ==================== 卡牌工厂 ====================

let cardIdCounter = 0;

/**
 * 生成唯一卡牌ID
 */
function generateCardId(): string {
  return `card-${Date.now()}-${++cardIdCounter}`;
}

/**
 * 创建卡牌对象
 *
 * @param type - 卡牌类型
 * @param id - 可选的卡牌ID（默认自动生成）
 * @returns CardRef 对象
 */
export function makeCard(type: CardType, id?: string): CardRef {
  return {
    id: id ?? generateCardId(),
    type,
  };
}

/**
 * 创建魔女杀手卡
 */
export function makeWitchKillerCard(id?: string): CardRef {
  return makeCard("witch_killer", id);
}

/**
 * 创建结界卡
 */
export function makeBarrierCard(id?: string): CardRef {
  return makeCard("barrier", id);
}

/**
 * 创建杀人卡
 */
export function makeKillCard(id?: string): CardRef {
  return makeCard("kill", id);
}

/**
 * 创建探知卡
 */
export function makeDetectCard(id?: string): CardRef {
  return makeCard("detect", id);
}

/**
 * 创建检定卡
 */
export function makeCheckCard(id?: string): CardRef {
  return makeCard("check", id);
}

// ==================== 测试场景工厂 ====================

export interface MakeTestScenarioOptions {
  playerCount?: number;
  withWitchKiller?: boolean;
  withDeadPlayers?: string[];
  config?: GameConfig;
}

/**
 * 创建完整测试场景
 *
 * @param options - 场景配置选项
 * @returns 配置好的游戏状态
 */
export function makeTestScenario(options: MakeTestScenarioOptions = {}): BGGameState {
  const playerCount = options.playerCount ?? 7;
  const withWitchKiller = options.withWitchKiller ?? false;
  const withDeadPlayers = options.withDeadPlayers ?? [];
  const config = options.config ?? SEVEN_PLAYER_CONFIG;

  const state = makeGameState({ config });

  // 创建玩家
  for (let i = 0; i < playerCount; i++) {
    const playerId = `p${i + 1}`;
    const isDead = withDeadPlayers.includes(playerId);
    const isWitchKillerHolder = withWitchKiller && i === 0;

    addPlayerToState(state, playerId, {
      seatNumber: i,
      status: isDead ? "dead" : isWitchKillerHolder ? "witch" : "alive",
      isWitch: isWitchKillerHolder,
      witchKillerHolder: isWitchKillerHolder,
    });
  }

  return state;
}

// ==================== Effect Layer 工厂 ====================

/**
 * 创建带状态的 Effect Layer
 *
 * 包装 GameLayers + GameStateRef + GameRandom
 *
 * @param state - 游戏状态
 * @param random - 可选的随机数生成器（默认使用 createMockRandom）
 * @returns 可直接用于 Effect.provide 的 Layer
 */
export function makeLayerWithState(
  state: BGGameState,
  random?: RandomAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Layer.Layer<any, never, any> {
  const mockRandom = random ?? createMockRandom();

  return Layer.provideMerge(
    Layer.provideMerge(BaseGameLayers, GameStateRef.layer(state)),
    makeGameRandomLayer(mockRandom),
  );
}

/**
 * 创建仅带基础服务的 Layer（无状态依赖）
 *
 * 适用于 CardService、PriorityService 等无状态服务测试
 *
 * @returns 包含基础服务的 Layer
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeBaseLayer(): Layer.Layer<any, never, any> {
  return BaseGameLayers;
}
