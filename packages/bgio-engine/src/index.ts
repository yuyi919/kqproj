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

// ==================== React 组件 ====================
export { Board as WitchTrialBoard } from "./components/Board";
export { ChatBox } from "./components/ChatBox";
export { NightActionPanel } from "./components/NightActionPanel";
export { PhaseDisplay } from "./components/PhaseDisplay";
export { PlayerHand } from "./components/PlayerHand";
export { PlayerList } from "./components/PlayerList";
export type {
  CardDisplayProps,
  PhaseBadgeProps,
  PhaseConfig,
  PlayerStatusIconProps,
  VoteResultsProps,
} from "./components/ui";
// ==================== UI 展示组件 ====================
export {
  CardDisplay,
  getCardBgColor,
  getCardBorderColor,
  getCardIcon,
  getPhaseConfig,
  getStatusIcon,
  PhaseBadge,
  PlayerStatusIcon,
  VoteResults,
} from "./components/ui";
export { VotingPanel } from "./components/VotingPanel";
// ==================== 导出 Context ====================
export { GameProvider, useGame, useGameContext } from "./contexts/GameContext";
// ==================== 导出 Example 游戏客户端 ====================
export { LocalGame, LocalMultiplayerGame, OnlineGame } from "./example";
// ==================== 游戏定义 ====================
export {
  assertAttackQuotaAvailable,
  assertCardInHand,
  assertNotEmpty,
  // Assertion 函数
  assertPhase,
  assertPlayerAlive,
  assertValidMessage,
  assertWitchKillerCardAllowed,
  GameLogicError,
  // 子模块导出
  moveFunctions,
  phaseConfigs,
  resolveNightActions,
  TypedWitchTrialGame,
  WitchTrialGame,
  // 工具
  wrapMove,
} from "./game";
// ==================== 导出 Hook ====================
export { useWitchTrial } from "./hooks/useWitchTrial";
// ==================== 类型定义 ====================
export type {
  ActionType,
  ActiveTrade,
  // 游戏状态
  BGGameState,
  // 卡牌相关
  Card,
  CardPoolConfig,
  CardRef,
  CardSelectionState,
  CardType,
  DailyTradeStatus,
  DailyTradeTracker,
  DeathCause,
  // 死亡记录
  DeathRecord,
  // 配置
  GameConfig,
  Messages,
  MoveContext,
  MoveResult,
  NightAction,
  // 行动相关
  PlayerAction,
  // 基础类型
  PlayerStatus,
  PrivatePlayerInfo,
  PublicDeathInfo,
  // 玩家相关
  PublicPlayerInfo,
  PublicPlayerStatus,
  RevealedInfoType,
  // 消息类型
  TMessage,
  Trade,
  // 交易系统（新增）
  TradeStatus,
  Vote,
  VoteResult,
} from "./types";
export {
  EIGHT_PLAYER_CONFIG,
  GamePhase,
  NINE_PLAYER_CONFIG,
  // 推荐配置
  SEVEN_PLAYER_CONFIG,
} from "./types";
// ==================== 计算层 & 工具函数 ====================
export {
  // 卡牌工厂和定义查询
  createCard,
  createDeck,
  formatDuration,
  getCardDefinition,
  getCardDefinitionByType,
  getCardTypeDescription,
  // UI 工具
  getCardTypeName,
  getDeathCauseName,
  getPhaseColor,
  getPhaseDescription,
  getPhaseName,
  getPlayerStatusColor,
  getPlayerStatusName,
  // 状态修改（Mutations）- 用于移动函数
  Mutations,
  // 计算层（Selectors）- 用于计算派生状态
  Selectors,
} from "./utils";

// ==================== 版本信息 ====================
export const ENGINE_VERSION = "2.0.0-bgio";
export const ENGINE_NAME = "Witch Trial Game Engine (boardgame.io)";
