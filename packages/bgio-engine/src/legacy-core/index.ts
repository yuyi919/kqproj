/**
 * 魔女审判游戏引擎
 * Witch Trial Game Engine
 *
 * 核心模块入口，提供完整的游戏逻辑控制能力
 */

// ==================== 导出类型 ====================
export * from "./types";

// ==================== 导出子模块 ====================
export * as Cards from "./cards";
export * as Player from "./player";
export * as State from "./state";
export * as Phases from "./phases";
export * as Actions from "./actions";
export * as Resolution from "./resolution";
export * as Utils from "./utils";

// ==================== 核心类 ====================

import {
  GameState,
  GamePhase,
  GameConfig,
  GameResult,
  PlayerAction,
  ActionType,
  Vote,
  GameEvent,
  GameEventType,
  GameError,
  GameErrorCode,
  SEVEN_PLAYER_CONFIG,
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
  PublicGameState,
  PlayerViewState,
  PublicPlayerInfo,
  PublicCardInfo,
  PrivatePlayerInfo,
  PublicDeathInfo,
  PlayerStatus,
} from "./types";

import {
  createGame,
  getCurrentPhase,
  getCurrentRound,
  getPlayer,
  getAlivePlayersInGame,
  checkGameEnd,
  endGame,
} from "./state";

import {
  advancePhase,
  handleSetupPhase,
  canEndNightPhase,
  canEndVotingPhase,
} from "./phases";

import {
  executeAction,
  handleUseCard,
  handleVote,
  handlePass,
  autoPassForInactivePlayers,
  UseCardParams,
  VoteParams,
  PassParams,
} from "./actions";

import { resolveTurn } from "./resolution";

import { getPhaseName, getPhaseDescription } from "./utils";

// ==================== 游戏引擎类 ====================

export interface GameEngineOptions {
  config?: GameConfig;
  onPhaseChange?: (phase: GamePhase, round: number) => void;
  onEvent?: (event: GameEvent) => void;
  onError?: (error: GameError) => void;
}

/**
 * 魔女审判游戏引擎
 *
 * 使用示例:
 * ```typescript
 * const engine = new GameEngine('room-123', SEVEN_PLAYER_CONFIG);
 * engine.initialize(['player1', 'player2', ...]);
 *
 * // 玩家行动
 * engine.useCard({ playerId: 'player1', cardId: 'card-xxx', targetId: 'player2' });
 *
 * // 推进阶段
 * engine.advancePhase();
 * ```
 */
export class GameEngine {
  private state: GameState | null = null;
  private options: GameEngineOptions;
  private eventListeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(private roomId: string, options: GameEngineOptions = {}) {
    this.options = {
      config: SEVEN_PLAYER_CONFIG,
      ...options,
    };
  }

  // ==================== 初始化 ====================

  /**
   * 初始化游戏
   * @param playerIds 参与游戏的玩家ID列表
   */
  initialize(playerIds: string[]): GameState {
    if (!this.options.config) {
      throw new GameError(GameErrorCode.INVALID_ACTION, "游戏配置未设置");
    }

    this.state = createGame(this.roomId, this.options.config, playerIds);

    // 进入准备阶段
    handleSetupPhase(this.state);

    this.emit("initialized", {
      gameId: this.state.id,
      playerCount: playerIds.length,
    });

    return this.getState();
  }

  /**
   * 加载已有游戏状态
   */
  loadState(state: GameState): void {
    this.state = state;
  }

  // ==================== 状态查询 ====================

  /**
   * 获取当前游戏状态
   */
  getState(): GameState {
    if (!this.state) {
      throw new GameError(GameErrorCode.INVALID_ACTION, "游戏尚未初始化");
    }
    return this.state;
  }

  /**
   * 获取公开状态（隐藏敏感信息）
   *
   * 隐藏的敏感信息：
   * - 手牌数量和内容
   * - 结界状态
   * - 魔女化状态（显示为ALIVE）
   * - 牌堆剩余数量
   * - 死法详情（需要通过检定魔法）
   */
  getPublicState(): PublicGameState {
    const state = this.getState();

    // 转换玩家信息，隐藏敏感字段
    const publicPlayers: Record<string, PublicPlayerInfo> = {};
    for (const [id, player] of state.players) {
      // 魔女化状态是隐藏信息！只显示ALIVE/DEAD/WRECK
      let publicStatus = player.status;
      if (player.status === PlayerStatus.WITCH) {
        publicStatus = PlayerStatus.ALIVE; // 魔女化对外显示为存活
      }

      // 只公开最基本的信息
      publicPlayers[id] = {
        id: player.id,
        seatNumber: player.seatNumber,
        status: publicStatus,
        // 注意：handCount、hasBarrier、maxHandSize 都不公开
      };
    }

    // 转换死亡记录为公开死亡信息（隐藏死因）
    const publicDeaths: PublicDeathInfo[] = state.deathLog.map((record) => ({
      round: record.round,
      playerId: record.playerId,
      died: true,
      // 注意：cause 和 killerId 不公开
    }));

    return {
      id: state.id,
      roomId: state.roomId,
      status: state.status,
      round: state.round,
      players: publicPlayers,
      playerOrder: state.playerOrder,
      deaths: publicDeaths,
      // 注意：deckCount 不公开
      phaseStartTime: state.phaseStartTime,
      phaseEndTime: state.phaseEndTime,
      config: {
        maxPlayers: state.config.maxPlayers,
        maxRounds: state.config.maxRounds,
        dayDuration: state.config.dayDuration,
        nightDuration: state.config.nightDuration,
        votingDuration: state.config.votingDuration,
      },
    };
  }

  /**
   * 获取特定玩家的游戏视角状态
   * 包含该玩家的完整私有信息 + 所有玩家的公开信息
   */
  getPlayerState(playerId: string): PlayerViewState {
    const state = this.getState();
    const player = state.players.get(playerId);

    if (!player) {
      throw new GameError(GameErrorCode.INVALID_TARGET, "玩家不存在");
    }

    // 构建私有玩家信息（完整信息，仅自己可见）
    const privatePlayerInfo: PrivatePlayerInfo = {
      id: player.id,
      seatNumber: player.seatNumber,
      status: player.status,
      hand: player.hand.map(
        (card): PublicCardInfo => ({
          type: card.type,
          name: card.name,
          description: card.description,
          consumable: card.consumable,
        }),
      ),
      maxHandSize: player.maxHandSize,
      isWitch: player.isWitch, // 私有：魔女化状态
      witchKillerHolder: player.witchKillerHolder, // 私有：是否持有魔女杀手
      lastKillRound: player.lastKillRound,
      consecutiveNoKillRounds: player.consecutiveNoKillRounds,
      hasBarrier: player.hasBarrier, // 私有：结界状态只有自己知道
      deathRound: player.deathRound,
      deathCause: player.deathCause, // 私有：死因（若已死亡）
      killerId: player.killerId, // 私有：击杀者
    };

    // 构建所有玩家的公开信息（包括自己，但使用公开信息格式）
    const publicPlayers: Record<string, PublicPlayerInfo> = {};
    for (const [id, otherPlayer] of state.players) {
      // 魔女化状态是隐藏信息！
      let publicStatus = otherPlayer.status;
      if (otherPlayer.status === PlayerStatus.WITCH) {
        publicStatus = PlayerStatus.ALIVE; // 魔女化对外显示为存活
      }

      publicPlayers[id] = {
        id: otherPlayer.id,
        seatNumber: otherPlayer.seatNumber,
        status: publicStatus,
        // 注意：handCount、hasBarrier、maxHandSize 都不公开
      };
    }

    // 转换死亡记录为公开死亡信息
    const publicDeaths: PublicDeathInfo[] = state.deathLog.map((record) => ({
      round: record.round,
      playerId: record.playerId,
      died: true,
    }));

    return {
      player: privatePlayerInfo,
      gameStatus: state.status,
      round: state.round,
      phaseEndTime: state.phaseEndTime,
      players: publicPlayers,
      deaths: publicDeaths,
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase(): GamePhase {
    return getCurrentPhase(this.getState());
  }

  /**
   * 获取当前回合
   */
  getCurrentRound(): number {
    return getCurrentRound(this.getState());
  }

  /**
   * 游戏是否已结束
   */
  isEnded(): boolean {
    return this.getCurrentPhase() === GamePhase.ENDED;
  }

  // ==================== 玩家行动 ====================

  /**
   * 使用卡牌
   */
  useCard(params: UseCardParams): PlayerAction {
    const state = this.getState();
    const action = handleUseCard(state, params);

    this.emit("action", { type: "use_card", action });

    return action;
  }

  /**
   * 投票
   */
  vote(params: VoteParams): Vote {
    const state = this.getState();
    const vote = handleVote(state, params);

    this.emit("vote", { vote });

    return vote;
  }

  /**
   * 放弃行动
   */
  pass(params: PassParams): PlayerAction {
    const state = this.getState();
    const action = handlePass(state, params);

    this.emit("action", { type: "pass", action });

    return action;
  }

  /**
   * 执行行动（通用接口）
   */
  executeAction(params: {
    playerId: string;
    type: ActionType;
    cardId?: string;
    targetId?: string;
  }): PlayerAction | Vote {
    const state = this.getState();
    const result = executeAction(state, params);

    this.emit("action", { type: params.type, result });

    return result;
  }

  // ==================== 阶段控制 ====================

  /**
   * 推进到下一阶段
   */
  advancePhase(): PhaseResult {
    const state = this.getState();
    const result = advancePhase(state);

    if (result.success) {
      this.emit("phase_change", {
        phase: state.status,
        round: state.round,
        events: result.events,
      });

      if (this.options.onPhaseChange) {
        this.options.onPhaseChange(state.status, state.round);
      }

      // 触发事件回调
      for (const event of result.events) {
        this.handleGameEvent(event);
      }
    }
    if (!result.success) {
      console.error("Error", result);
    }

    return {
      ...result,
      phase: state.status,
      round: state.round,
    };
  }

  /**
   * 检查当前阶段是否可以结束
   */
  canAdvancePhase(): boolean {
    const state = this.getState();

    switch (state.status) {
      case GamePhase.NIGHT:
        return canEndNightPhase(state);
      case GamePhase.VOTING:
        return canEndVotingPhase(state);
      case GamePhase.DAY:
        return true;
      case GamePhase.MORNING:
        return true;
      default:
        return false;
    }
  }

  /**
   * 为未行动的玩家自动弃权
   */
  autoPass(): PlayerAction[] {
    const state = this.getState();
    const actions = autoPassForInactivePlayers(state);

    for (const action of actions) {
      this.emit("action", { type: "auto_pass", action });
    }

    return actions;
  }

  /**
   * 强制结算当前回合（用于时间到）
   */
  forceResolveTurn(): TurnResult {
    // 先让所有未行动的玩家弃权
    this.autoPass();

    // 推进到结算阶段
    if (this.getCurrentPhase() === GamePhase.VOTING) {
      this.advancePhase(); // 进入结算
    }

    const state = this.getState();
    const resolution = resolveTurn(state);

    this.emit("turn_resolved", resolution);

    // 检查游戏是否结束
    if (resolution.gameEnded) {
      const result = endGame(state);
      this.emit("game_end", result);

      return {
        ...resolution,
        gameResult: result,
      };
    }

    // 进入下一回合
    this.advancePhase(); // 进入晨间

    return resolution;
  }

  // ==================== 游戏结束 ====================

  /**
   * 结束游戏
   */
  endGame(): GameResult {
    const state = this.getState();
    const result = endGame(state);

    this.emit("game_end", result);

    return result;
  }

  /**
   * 检查游戏是否可以结束
   */
  checkEndCondition(): GameResult | undefined {
    const state = this.getState();
    return checkGameEnd(state);
  }

  // ==================== 事件系统 ====================

  /**
   * 订阅事件
   */
  on<T = unknown>(
    eventType: GameEventType | string,
    handler: (data: T) => void,
  ): () => void {
    const key = eventType as string;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }

    const handlers = this.eventListeners.get(key)!;
    const wrappedHandler = handler as (data: unknown) => void;
    handlers.add(wrappedHandler);

    // 返回取消订阅函数
    return () => {
      handlers.delete(wrappedHandler);
    };
  }

  /**
   * 触发事件
   */
  private emit(eventType: GameEventType | string, data: unknown): void {
    const key = eventType as string;
    const handlers = this.eventListeners.get(key);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      }
    }

    // 通用事件回调
    if (this.options.onEvent) {
      this.options.onEvent({
        type: eventType as GameEventType,
        timestamp: Date.now(),
        data,
      });
    }
  }

  /**
   * 处理游戏事件
   */
  private handleGameEvent(event: GameEvent): void {
    if (this.options.onEvent) {
      this.options.onEvent(event);
    }
  }

  // ==================== 错误处理 ====================

  /**
   * 处理错误
   */
  private handleError(error: GameError): void {
    if (this.options.onError) {
      this.options.onError(error);
    }
  }
}

// ==================== 类型定义 ====================

export interface PhaseResult {
  success: boolean;
  events: GameEvent[];
  canAdvance: boolean;
  gameEnded?: boolean;
  gameResult?: GameResult;
  phase: GamePhase;
  round: number;
}

export interface TurnResult {
  attacks: import("./resolution").AttackResolution[];
  detects: import("./resolution").DetectResolution[];
  checks: import("./resolution").CheckResolution[];
  barriers: import("./resolution").BarrierResolution[];
  wrecks: import("./resolution").WreckResolution[];
  voting: import("./resolution").VotingResolution;
  gameEnded: boolean;
  winnerId: string | null | undefined;
  gameResult?: GameResult;
}

// ==================== 工厂函数 ====================

/**
 * 创建新的游戏引擎实例
 */
export function createEngine(
  roomId: string,
  options?: GameEngineOptions,
): GameEngine {
  return new GameEngine(roomId, options);
}

/**
 * 根据玩家数获取推荐配置
 */
export function getRecommendedConfig(playerCount: number): GameConfig {
  if (playerCount <= 7) return SEVEN_PLAYER_CONFIG;
  if (playerCount === 8) return EIGHT_PLAYER_CONFIG;
  return NINE_PLAYER_CONFIG;
}

// ==================== 版本信息 ====================

export const ENGINE_VERSION = "1.0.0";
export const ENGINE_NAME = "Witch Trial Game Engine";
