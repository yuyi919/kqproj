"use client";

/**
 * 魔女审判游戏引擎 - GameContext
 *
 * 提供游戏状态、玩家信息、操作函数等全局上下文，
 * 避免通过 props 层层传递。
 */

import type { PlayerID } from "boardgame.io";
import type { BoardProps as BGBoardProps } from "boardgame.io/react";
import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import type {
  BGGameState,
  CardRef,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  TMessage,
} from "../types";
import { Selectors, TMessageBuilder } from "../utils";

// 扩展 BoardProps 类型以匹配 useWitchTrial hook
interface ExtendedBoardProps extends BGBoardProps<BGGameState> {
  currentPlayerId?: string;
}

// Moves 类型定义
type GameMoves = {
  vote?: (targetId: string) => void;
  pass?: () => void;
  useCard?: (cardId: string, targetId: string) => void;
  say?: (content: string) => void;
  selectDroppedCard?: (cardId: string) => void;
  skipCardSelection?: () => void;
};

// Events 类型定义
type GameEvents = {
  endPhase?: () => void;
};

// Context 值类型
interface GameContextValue {
  // 原始游戏状态
  G: BGGameState;
  ctx: ExtendedBoardProps["ctx"];

  // 玩家相关
  playerID: string | null;
  currentPlayerId: string | null;

  // 派生状态
  currentPhase: BGGameState["status"];
  currentRound: number;
  currentPlayer: PublicPlayerInfo | null;
  playerSecrets: PrivatePlayerInfo | null;
  isGameOver: boolean;
  winner: string | null | undefined;
  players: PublicPlayerInfo[];
  alivePlayers: PublicPlayerInfo[];
  voteCounts: ReturnType<typeof Selectors.computeVoteCounts>;
  remainingQuota: ReturnType<typeof Selectors.computeRemainingAttackQuota>;
  isWitchKillerAvailable: boolean;
  killMagicQuota: number;
  isCurrentPlayerWitchKillerHolder: boolean;
  hasPlayerVoted: boolean;
  isImprisoned: boolean;
  isPlayerAlive: boolean;

  // 聊天消息
  chatMessages: {
    id: string;
    sender: PlayerID;
    payload: TMessage;
  }[];

  // 操作函数
  moves: GameMoves;
  events: GameEvents;
  sendChatMessage: (message: TMessage) => void;

  // 处理器
  handleVote: (targetId: string) => void;
  handlePass: () => void;
  handleUseCard: (cardId: string, targetId: string) => void;
  handleSendMessage: (content: string) => void;
  handleEndPhase: () => void;
  handleSelectCard: (cardId: string) => void;
  handleSkipCardSelection: () => void;

  // 卡牌选择状态
  currentCardSelection: {
    selectingPlayerId: string;
    availableCards: CardRef[];
    victimId: string;
    deadline: number;
  } | null;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: React.ReactNode;
  boardProps: ExtendedBoardProps;
}

export function GameProvider({
  children,
  boardProps,
}: GameProviderProps): React.ReactElement {
  const {
    G,
    ctx,
    moves,
    playerID,
    currentPlayerId,
    sendChatMessage,
    chatMessages,
    events,
  } = boardProps;

  const playerId = currentPlayerId || playerID;

  // 派生状态计算
  const derivedState = useMemo(() => {
    const currentPhase = G.status;
    const currentRound = G.round;
    const currentPlayer = playerId ? G.players[playerId] : null;
    const playerSecrets = playerId ? G.secrets[playerId] : null;
    const isGameOver = ctx.gameover !== undefined;
    const winner = ctx.gameover?.winner;

    const players = Object.values(G.players) as PublicPlayerInfo[];
    const alivePlayers = Selectors.getAlivePlayers(G) as PublicPlayerInfo[];
    const voteCounts = Selectors.computeVoteCounts(G);
    const remainingQuota = Selectors.computeRemainingAttackQuota(G);
    const isWitchKillerAvailable = remainingQuota.witchKiller;
    const killMagicQuota = remainingQuota.killMagic;

    const isCurrentPlayerWitchKillerHolder = playerId
      ? Selectors.isWitchKillerHolder(G, playerId)
      : false;

    const hasPlayerVoted = playerId
      ? Selectors.hasPlayerVoted(G, playerId)
      : false;

    // 获取当前玩家的卡牌选择状态
    const currentCardSelection =
      playerId && G.cardSelection?.[playerId]
        ? G.cardSelection[playerId]
        : null;

    console.log(G);
    return {
      currentPhase,
      currentRound,
      currentPlayer,
      playerSecrets,
      isGameOver,
      winner,
      players,
      alivePlayers,
      voteCounts,
      remainingQuota,
      isWitchKillerAvailable,
      killMagicQuota,
      isCurrentPlayerWitchKillerHolder,
      hasPlayerVoted,
      isImprisoned: playerId
        ? Selectors.isPlayerImprisoned(G, playerId)
        : false,
      isPlayerAlive: playerId ? Selectors.isPlayerAlive(G, playerId) : false,
      currentCardSelection,
    };
  }, [G, ctx, playerId]);

  // 事件处理函数
  const handleVote = useCallback(
    (targetId: string) => {
      moves.vote?.(targetId);
    },
    [moves],
  );

  const handlePass = useCallback(() => {
    moves.pass?.();
  }, [moves]);

  const handleUseCard = useCallback(
    (cardId: string, targetId: string) => {
      moves.useCard?.(cardId, targetId);
    },
    [moves],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (playerId) {
        moves.say?.(content);
        const newMessage = TMessageBuilder.createSay(playerId, content);
        sendChatMessage(newMessage);
      }
    },
    [moves, playerId, sendChatMessage],
  );

  const handleEndPhase = useCallback(() => {
    events.endPhase?.();
  }, [events]);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      moves.selectDroppedCard?.(cardId);
    },
    [moves],
  );

  const handleSkipCardSelection = useCallback(() => {
    moves.skipCardSelection?.();
  }, [moves]);

  // 构建 context 值
  const contextValue = useMemo<GameContextValue>(
    () => ({
      G,
      ctx,
      playerID,
      currentPlayerId: playerId,
      chatMessages: chatMessages || [],
      moves,
      events,
      sendChatMessage,
      handleVote,
      handlePass,
      handleUseCard,
      handleSendMessage,
      handleEndPhase,
      handleSelectCard,
      handleSkipCardSelection,
      ...derivedState,
    }),
    [
      G,
      ctx,
      playerID,
      playerId,
      chatMessages,
      moves,
      events,
      sendChatMessage,
      handleVote,
      handlePass,
      handleUseCard,
      handleSendMessage,
      handleEndPhase,
      handleSelectCard,
      handleSkipCardSelection,
      derivedState,
    ],
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}

// Hook 用于消费 GameContext
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}

// Hook 用于安全消费 GameContext（可选）
export function useGame(): GameContextValue | null {
  return useContext(GameContext);
}
