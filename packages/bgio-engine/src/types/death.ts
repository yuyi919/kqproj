"use client";

/**
 * 死亡记录类型定义
 */

import type { DeathCause } from "./core";
import type { CardRef } from "./card";

/**
 * 死亡记录（服务器端完整信息）
 */
export interface DeathRecord {
  /** 死亡发生的合回 */
  round: number;
  /** 死亡玩家ID */
  playerId: string;
  /** 死亡原因 */
  cause: DeathCause;
  /** 凶手玩家ID（如有） */
  killerId?: string;
  /** 该玩家死亡时掉落的卡牌列表 */
  droppedCards: CardRef[];
  /** 卡牌被其他玩家拾取的情况记录 */
  cardReceivers: Record<string, string[]>;
}

/**
 * 公开死亡信息（玩家可见）
 */
export interface PublicDeathInfo {
  /** 死亡发生的合回 */
  round: number;
  /** 死亡玩家ID */
  playerId: string;
  /** 是否已死亡（固定为true） */
  died: true;
}
