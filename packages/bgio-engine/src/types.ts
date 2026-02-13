"use client";

/**
 * 魔女审判游戏引擎 - 类型定义
 *
 * ⚠️ 此文件已重构为模块化结构 ⚠️
 *
 * 按领域拆分的类型模块：
 * - types/core.ts: 基础类型（GamePhase, PlayerStatus, CardType, DeathCause）
 * - types/card.ts: 卡牌相关（CardRef, Card, CardPoolConfig）
 * - types/player.ts: 玩家相关（PublicPlayerInfo, PrivatePlayerInfo）
 * - types/state.ts: 状态类型（Vote, NightAction, BGGameState）
 * - types/death.ts: 死亡记录（DeathRecord, PublicDeathInfo）
 * - types/message.ts: 消息类型（TMessage 及所有子类型）
 * - types/config.ts: 配置（GameConfig, SEVEN_PLAYER_CONFIG 等）
 * - types/trade.ts: 交易系统类型（Trade, DailyTradeStatus）
 *
 * @deprecated 请使用 src/types/index.ts 或具体的子模块
 */

export type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";
export type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";

// ==================== 卡牌相关 ====================
export type { Card, CardPoolConfig, CardRef } from "./types/card";
// ==================== 配置 ====================
export type { GameConfig } from "./types/config";
export {
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
  SEVEN_PLAYER_CONFIG,
} from "./types/config";
// ==================== 基础类型 ====================
export type * from "./types/core";
export { GamePhase } from "./types/core";
// ==================== 死亡记录 ====================
export type { DeathRecord, PublicDeathInfo } from "./types/death";
// ==================== 消息类型 ====================
export type { Messages, TMessage } from "./types/index";
// ==================== 玩家相关 ====================
export type {
  PlayerFullInfo,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  RevealedInfoItem,
} from "./types/player";
// ==================== 状态相关 ====================
// ==================== BGGameState ====================
export type {
  ActionFailureReason,
  BGGameState,
  MoveContext,
  MoveResult,
  NightAction,
  PlayerAction,
  Vote,
  VoteResult,
} from "./types/state";
// ==================== 交易系统 ====================
export type {
  ActiveTrade,
  CardSelectionState,
  DailyTradeStatus,
  DailyTradeTracker,
  Trade,
  TradeStatus,
} from "./types/trade";
