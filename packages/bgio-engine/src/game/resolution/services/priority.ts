"use client";

import { orderBy } from "es-toolkit";
import { Refinements } from "../../../domain/refinements";
/**
 * 优先级计算服务
 *
 * 职责：计算夜间行动的结算优先级
 */

import type { CardRef, NightAction } from "../../../types";
import { CARD_PRIORITY, getCardPriority } from "../types";

/**
 * 攻击类型定义
 */
export type AttackType = "witch_killer" | "kill";

/**
 * 获取行动的攻击类型
 */
export function getAttackType(card: CardRef | null): AttackType | null {
  return Refinements.getAttackType(card);
}

/**
 * 判断是否为攻击行动
 */
export function isAttackAction(action: NightAction): boolean {
  return Refinements.isAttackCardOptional(action.card);
}

/**
 * 按优先级排序行动
 *
 * 规则：
 * 1. witch_killer 优先（优先级 5）
 * 2. kill 按时间戳顺序（优先级 4）
 * 3. barrier, detect, check 按时间戳顺序
 *
 * @param actions - 要排序的行动列表
 * @returns 排序后的行动列表
 */
export function sortActionsByPriority(actions: NightAction[]): NightAction[] {
  return orderBy(
    actions,
    [(a) => getCardPriority(a.card), "timestamp"],
    ["desc", "asc"],
  );
}

/**
 * 只保留攻击行动并排序
 */
export function sortAttackActions(actions: NightAction[]): NightAction[] {
  return sortActionsByPriority(actions.filter((a) => isAttackAction(a)));
}

/**
 * 判断 witch_killer 是否已使用
 */
export function isWitchKillerUsed(actions: NightAction[]): boolean {
  return actions.some((a) => a.card?.type === "witch_killer");
}
