"use client";

/**
 * Branded Types - 品牌类型定义
 *
 * 使用 Effect Brand.nominal 创建无校验的品牌类型（内部 API 优先）
 * Brand 模块提供轻量级的类型标记，不带 Schema 校验开销
 */

import { Brand } from "effect";

/**
 * PlayerId - 品牌化玩家 ID
 *
 * 使用 Brand.nominal 创建，无运行时校验开销
 * 适用于内部 API 传值
 */
export type PlayerId = string & Brand.Brand<"PlayerId">;
export const PlayerId = Brand.nominal<PlayerId>();

/**
 * CardId - 品牌化卡牌 ID
 *
 * 使用 Brand.nominal 创建，无运行时校验开销
 * 适用于内部 API 传值
 */
export type CardId = string & Brand.Brand<"CardId">;
export const CardId = Brand.nominal<CardId>();

/**
 * 创建 PlayerId（品牌类型）
 *
 * 内部使用，无校验开销
 */
export function makePlayerId(id: string): PlayerId {
  return PlayerId(id);
}

/**
 * 创建 CardId（品牌类型）
 */
export function makeCardId(id: string): CardId {
  return CardId(id);
}

/**
 * 类型守卫：检查是否为 PlayerId
 */
export function isPlayerId(id: unknown): id is PlayerId {
  return typeof id === "string";
}

/**
 * 类型守卫：检查是否为 CardId
 */
export function isCardId(id: unknown): id is CardId {
  return typeof id === "string";
}
