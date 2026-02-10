/**
 * React Hook for Witch Trial Game Engine
 * 提供在React组件中使用游戏引擎的便捷方式
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GameEngine,
  GameState,
  GamePhase,
  GameConfig,
  PlayerAction,
  Vote,
  GameEvent,
  GameError,
  createEngine,
  getRecommendedConfig,
  PlayerViewState,
  PublicGameState,
} from "../index";

export interface UseGameOptions {
  roomId: string;
  playerId?: string;
  config?: GameConfig;
  onPhaseChange?: (phase: GamePhase, round: number) => void;
  onEvent?: (event: GameEvent) => void;
  onError?: (error: GameError) => void;
}

export interface UseGameReturn {
  // 状态
  engine: GameEngine | null;
  gameState: GameState | null;
  currentPhase: GamePhase | null;
  currentRound: number;
  isInitialized: boolean;
  isEnded: boolean;
  error: GameError | null;

  // 初始化
  initialize: (playerIds: string[]) => void;
  loadState: (state: GameState) => void;

  // 行动
  useCard: (cardId: string, targetId?: string) => PlayerAction | null;
  vote: (targetId: string) => Vote | null;
  pass: () => PlayerAction | null;

  // 阶段控制
  advancePhase: () => void;
  canAdvancePhase: () => boolean;
  autoPass: () => void;

  // 工具
  getPlayerState: () => PlayerViewState | null;
  getPublicState: () => PublicGameState | null;
}

/**
 * 游戏引擎 Hook
 *
 * 使用示例:
 * ```typescript
 * const game = useGame({
 *   roomId: 'room-123',
 *   playerId: 'player-1',
 *   onPhaseChange: (phase, round) => console.log(`Phase: ${phase}, Round: ${round}`),
 * });
 *
 * // 初始化游戏
 * game.initialize(['player-1', 'player-2', 'player-3']);
 *
 * // 使用卡牌
 * game.useCard('card-id', 'target-player-id');
 * ```
 */
export function useGame(options: UseGameOptions): UseGameReturn {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GamePhase | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [error, setError] = useState<GameError | null>(null);

  // 创建引擎实例
  useEffect(() => {
    const config = options.config || getRecommendedConfig(7);

    engineRef.current = createEngine(options.roomId, {
      config,
      onPhaseChange: (phase, round) => {
        setCurrentPhase(phase);
        setCurrentRound(round);
        setIsEnded(phase === GamePhase.ENDED);

        // 同步状态
        if (engineRef.current) {
          setGameState(engineRef.current.getState());
        }

        options.onPhaseChange?.(phase, round);
      },
      onEvent: (event) => {
        // 同步状态
        if (engineRef.current) {
          setGameState(engineRef.current.getState());
        }
        options.onEvent?.(event);
      },
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      },
    });

    return () => {
      engineRef.current = null;
    };
  }, [options.roomId]);

  // 初始化游戏
  const initialize = useCallback((playerIds: string[]) => {
    try {
      setError(null);
      if (!engineRef.current) return;

      const state = engineRef.current.initialize(playerIds);
      setGameState(state);
      setCurrentPhase(state.status);
      setCurrentRound(state.round);
      setIsInitialized(true);
      setIsEnded(false);
    } catch (err) {
      if (err instanceof GameError) {
        setError(err);
      }
      throw err;
    }
  }, []);

  // 加载状态
  const loadState = useCallback((state: GameState) => {
    try {
      setError(null);
      if (!engineRef.current) return;

      engineRef.current.loadState(state);
      setGameState(state);
      setCurrentPhase(state.status);
      setCurrentRound(state.round);
      setIsInitialized(true);
      setIsEnded(state.status === GamePhase.ENDED);
    } catch (err) {
      if (err instanceof GameError) {
        setError(err);
      }
      throw err;
    }
  }, []);

  // 使用卡牌
  const useCard = useCallback(
    (cardId: string, targetId?: string): PlayerAction | null => {
      try {
        setError(null);
        if (!engineRef.current || !options.playerId) return null;

        const action = engineRef.current.useCard({
          playerId: options.playerId,
          cardId,
          targetId,
        });

        setGameState(engineRef.current.getState());
        return action;
      } catch (err) {
        if (err instanceof GameError) {
          setError(err);
        }
        throw err;
      }
    },
    [options.playerId],
  );

  // 投票
  const vote = useCallback(
    (targetId: string): Vote | null => {
      try {
        setError(null);
        if (!engineRef.current || !options.playerId) return null;

        const voteResult = engineRef.current.vote({
          voterId: options.playerId,
          targetId,
        });

        setGameState(engineRef.current.getState());
        return voteResult;
      } catch (err) {
        if (err instanceof GameError) {
          setError(err);
        }
        throw err;
      }
    },
    [options.playerId],
  );

  // 放弃行动
  const pass = useCallback((): PlayerAction | null => {
    try {
      setError(null);
      if (!engineRef.current || !options.playerId) return null;

      const action = engineRef.current.pass({
        playerId: options.playerId,
      });

      setGameState(engineRef.current.getState());
      return action;
    } catch (err) {
      if (err instanceof GameError) {
        setError(err);
      }
      throw err;
    }
  }, [options.playerId]);

  // 推进阶段
  const advancePhase = useCallback(() => {
    try {
      setError(null);
      if (!engineRef.current) return;

      engineRef.current.advancePhase();
      setGameState(engineRef.current.getState());
    } catch (err) {
      if (err instanceof GameError) {
        setError(err);
      }
      throw err;
    }
  }, []);

  // 检查是否可以推进
  const canAdvancePhase = useCallback((): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.canAdvancePhase();
  }, []);

  // 自动弃权
  const autoPass = useCallback(() => {
    try {
      setError(null);
      if (!engineRef.current) return;

      engineRef.current.autoPass();
      setGameState(engineRef.current.getState());
    } catch (err) {
      if (err instanceof GameError) {
        setError(err);
      }
      throw err;
    }
  }, []);

  // 获取玩家状态（类型安全）
  const getPlayerState = useCallback((): PlayerViewState | null => {
    if (!engineRef.current || !options.playerId) return null;
    return engineRef.current.getPlayerState(options.playerId);
  }, [options.playerId]);

  // 获取公开状态（类型安全）
  const getPublicState = useCallback((): PublicGameState | null => {
    if (!engineRef.current) return null;
    return engineRef.current.getPublicState();
  }, []);

  return {
    engine: engineRef.current,
    gameState,
    currentPhase,
    currentRound,
    isInitialized,
    isEnded,
    error,
    initialize,
    loadState,
    useCard,
    vote,
    pass,
    advancePhase,
    canAdvancePhase,
    autoPass,
    getPlayerState,
    getPublicState,
  };
}

export default useGame;
