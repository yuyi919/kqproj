"use client";

/**
 * 基础类型定义
 *
 * 包含：
 * - 游戏阶段 (GamePhase)
 * - 玩家状态 (PlayerStatus, PublicPlayerStatus)
 * - 死因类型 (DeathCause)
 * - 卡牌类型 (CardType)
 * - 行动类型 (ActionType)
 * - 揭示信息类型 (RevealedInfoType)
 */

/** 游戏阶段 */
export enum GamePhase {
  LOBBY = "lobby",
  SETUP = "setup",
  MORNING = "morning",
  DAY = "day",
  /** 夜间阶段 */
  NIGHT = "night",
  /** 深夜阶段 */
  DEEP_NIGHT = "deepNight",
  CARD_SELECTION = "cardSelection",
  RESOLUTION = "resolution",
  ENDED = "ended",
}

/** 玩家状态（内部完整状态） */
export type PlayerStatus = "alive" | "dead" | "witch" | "wreck";

/** 玩家公开状态（仅 alive/dead，witch 显示为 alive，wreck 显示为 dead） */
export type PublicPlayerStatus = "alive" | "dead";

/** 死因类型 */
export type DeathCause = "witch_killer" | "kill_magic" | "wreck";

/** 卡牌类型 */
export type CardType = "witch_killer" | "barrier" | "kill" | "detect" | "check";

/** 行动类型 */
export type ActionType = "use_card" | "vote" | "pass";

/** 揭示信息类型 */
export type RevealedInfoType =
  | "detect"
  | "check"
  | "death"
  | "barrier"
  | "attack_failed"
  | "card_received"
  | "witch_transform"
  | "attack_excess"
  | "witch_killer_stolen"
  | "witch_killer_obtained";
