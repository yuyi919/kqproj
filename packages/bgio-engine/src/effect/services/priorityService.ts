"use client";

/**
 * PriorityService - 优先级计算服务
 *
 * 职责：计算夜间行动的结算优先级
 * 评估层：纯函数，可独立测试
 */

import { Effect, Layer, Context } from "effect";
import type { CardRef, NightAction } from "../../types";
import type { AttackType } from "../../game/resolution/services/priority";
import {
  getAttackType as importedGetAttackType,
  isAttackAction as importedIsAttackAction,
  sortActionsByPriority as importedSortActionsByPriority,
  sortAttackActions as importedSortAttackActions,
  isWitchKillerUsed as importedIsWitchKillerUsed,
} from "../../game/resolution/services/priority";

/**
 * 优先级服务接口
 */
export interface IPriorityService {
  /** 获取行动的攻击类型 */
  readonly getAttackType: (card: CardRef | null) => AttackType | null;

  /** 判断是否为攻击行动 */
  readonly isAttackAction: (action: NightAction) => boolean;

  /** 按优先级排序行动 */
  readonly sortActionsByPriority: (actions: NightAction[]) => NightAction[];

  /** 只保留攻击行动并排序 */
  readonly sortAttackActions: (actions: NightAction[]) => NightAction[];

  /** 判断 witch_killer 是否已使用 */
  readonly isWitchKillerUsed: (actions: NightAction[]) => boolean;
}

/**
 * PriorityService Tag
 */
export const PriorityService =
  Context.GenericTag<IPriorityService>("PriorityService");

/**
 * PriorityService Live Layer
 * 包装现有的纯函数，无运行时开销
 */
export const PriorityServiceLayer = Layer.succeed(PriorityService, {
  getAttackType: (card) => importedGetAttackType(card),
  isAttackAction: (action) => importedIsAttackAction(action),
  sortActionsByPriority: (actions) => importedSortActionsByPriority(actions),
  sortAttackActions: (actions) => importedSortAttackActions(actions),
  isWitchKillerUsed: (actions) => importedIsWitchKillerUsed(actions),
});
