"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 适配版
 *
 * 导出说明：
 * - 类型定义: GamePhase, PlayerStatus, CardType, BGGameState, etc.
 * - 游戏定义: WitchTrialGame
 * - 计算层: Selectors (所有派生状态的计算)
 * - 状态修改: Mutations (用于移动函数的状态更新)
 * - 工具函数: createCard, getCardTypeName, etc.
 * - React组件: Board, PlayerList, PlayerHand, etc.
 * - Hooks: useWitchTrial
 */

// ==================== 类型定义 ====================
export type {
  // 基础类型
  GamePhase,
  PlayerStatus,
  PublicPlayerStatus,
  DeathCause,
  CardType,
  ActionType,
  RevealedInfoType,

  // 卡牌相关
  Card,
  CardRef,
  CardPoolConfig,

  // 玩家相关
  PublicPlayerInfo,
  PrivatePlayerInfo,

  // 游戏状态
  BGGameState,

  // 行动相关
  PlayerAction,
  Vote,
  VoteResult,
  NightAction,

  // 死亡记录
  DeathRecord,
  PublicDeathInfo,

  // 配置
  GameConfig,
} from "./types";

export {
  // 推荐配置
  SEVEN_PLAYER_CONFIG,
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
} from "./types";

// ==================== 游戏定义 ====================
export {
  WitchTrialGame,
  // 子模块导出
  moveFunctions,
  phaseConfigs,
  resolveNightActions,
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
  // 工具
  wrapMove,
  GameLogicError,
} from "./game";

// ==================== 计算层 & 工具函数 ====================
export {
  // 计算层（Selectors）- 用于计算派生状态
  Selectors,
  // 状态修改（Mutations）- 用于移动函数
  Mutations,
  // 卡牌工厂和定义查询
  createCard,
  createDeck,
  getCardDefinition,
  getCardDefinitionByType,
  // UI 工具
  getCardTypeName,
  getCardTypeDescription,
  getPhaseName,
  getPhaseDescription,
  getPhaseColor,
  getPlayerStatusName,
  getPlayerStatusColor,
  getDeathCauseName,
  formatDuration,
} from "./utils";

// ==================== React 组件 ====================
export { Board as WitchTrialBoard } from "./components/Board";
export { PlayerHand } from "./components/PlayerHand";
export { PlayerList } from "./components/PlayerList";
export { VotingPanel } from "./components/VotingPanel";
export { NightActionPanel } from "./components/NightActionPanel";
export { PhaseDisplay } from "./components/PhaseDisplay";
export { ChatBox } from "./components/ChatBox";
export type { ChatMessage } from "./components/ChatBox";

// ==================== UI 展示组件 ====================
export {
  CardDisplay,
  getCardIcon,
  getCardBgColor,
  getCardBorderColor,
  PlayerStatusIcon,
  getStatusIcon,
  PhaseBadge,
  getPhaseConfig,
  VoteResults,
} from "./components/ui";
export type {
  CardDisplayProps,
  PlayerStatusIconProps,
  PhaseBadgeProps,
  PhaseConfig,
  VoteResultsProps,
} from "./components/ui";

// ==================== 导出 Hook ====================
export { useWitchTrial } from "./hooks/useWitchTrial";

// ==================== 导出 Context ====================
export { GameProvider, useGameContext, useGame } from "./contexts/GameContext";

// ==================== 版本信息 ====================
export const ENGINE_VERSION = "2.0.0-bgio";
export const ENGINE_NAME = "Witch Trial Game Engine (boardgame.io)";
