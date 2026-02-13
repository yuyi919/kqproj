"use client";

/**
 * 类型定义导出入口
 *
 * 按领域拆分的类型模块：
 * - core.ts: 基础类型（GamePhase, PlayerStatus, CardType, DeathCause）
 * - card.ts: 卡牌相关（CardRef, Card, CardPoolConfig）
 * - player.ts: 玩家相关（PublicPlayerInfo, PrivatePlayerInfo）
 * - state.ts: 状态类型（Vote, NightAction, VoteResult）
 * - death.ts: 死亡记录（DeathRecord, PublicDeathInfo）
 * - message.ts: 消息类型（TMessage 及所有子类型）
 * - config.ts: 配置（GameConfig, SEVEN_PLAYER_CONFIG 等）
 * - trade.ts: 交易系统类型（Trade, DailyTradeStatus, CardSelectionState）
 */

// 卡牌相关
export type { Card, CardPoolConfig, CardRef } from "./card";
// 配置
export type { GameConfig } from "./config";
export {
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
  SEVEN_PLAYER_CONFIG,
} from "./config";
export type {
  ActionType,
  CardType,
  DeathCause,
  PlayerStatus,
  PublicPlayerStatus,
  RevealedInfoType,
} from "./core";
// 基础类型（GamePhase 需要同时作为值导出，因为它是 enum）
export { GamePhase } from "./core";

// 死亡记录
export type { DeathRecord, PublicDeathInfo } from "./death";
// 所有消息类型子类型和联合类型
export type * as Messages from "./message";
// 消息类型
export type { TMessage } from "./message";
// 玩家相关
export type {
  PlayerFullInfo,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  RevealedInfoItem,
} from "./player";
// 状态相关
export type {
  ActionFailureReason,
  NightAction,
  PlayerAction,
  Vote,
  VoteResult,
} from "./state";

// 交易系统
export type {
  ActiveTrade,
  CardSelectionState,
  DailyTradeStatus,
  DailyTradeTracker,
  Trade,
  TradeStatus,
} from "./trade";

// ==================== BGGameState (重新导出) ====================

// 重新导出 BGGameState 和 MoveContext 以保持向后兼容
export type { BGGameState, MoveContext, MoveResult } from "./state";
