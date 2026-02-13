"use client";

/**
 * 玩家相关类型定义
 */

import type { CardRef } from "./card";
import type {
  PlayerStatus,
  PublicPlayerStatus,
  RevealedInfoType,
} from "./core";

/**
 * 玩家公开信息（所有人可见）
 * witch 显示为 alive, wreck 显示为 dead
 */
export interface PublicPlayerInfo {
  id: string;
  /** 座位编号，从0开始 */
  seatNumber: number;
  /** 公开状态，仅显示存活或死亡 */
  status: PublicPlayerStatus;
}

/**
 * 玩家私有信息（仅自己可见）
 * 包含完整状态（包括 witch/wreck）和手牌等秘密信息
 */
export interface PrivatePlayerInfo {
  /** 实际内部状态，包括魔女(witch)和残骸(wreck) */
  status: PlayerStatus;
  /** 玩家当前手牌列表 */
  hand: CardRef[];
  /** 玩家是否已魔女化（当witchKillerHolder=true 时，isWitch=true） */
  isWitch: boolean;
  /** 玩家本回合是否开启了结界防护 */
  hasBarrier: boolean;
  /** 玩家是否持有魔女杀手卡牌 */
  witchKillerHolder: boolean;
  /** 上次进行击杀行动的回合数 */
  lastKillRound: number;
  /** 连续未击杀的回合数，达到2次将残骸化 */
  consecutiveNoKillRounds: number;
  /** 玩家已获悉的所有揭示信息 */
  revealedInfo: RevealedInfoItem[];
  /** 玩家死亡的原因 */
  deathCause?: "witch_killer" | "kill_magic" | "wreck";
  /** 击杀该玩家的玩家ID */
  killerId?: string;
}

/**
 * 揭示的信息项
 */
export interface RevealedInfoItem {
  /** 信息类型 */
  type: RevealedInfoType;
  /** 信息具体内容（根据类型变化） */
  content: unknown;
  /** 信息产生的时间戳 */
  timestamp: number;
}

/** 玩家完整信息（公开 + 私有） */
export interface PlayerFullInfo {
  id: string;
  public: PublicPlayerInfo;
  secret: PrivatePlayerInfo;
}
