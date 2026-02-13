"use client";

/**
 * 夜间结算逻辑
 *
 * 优先级规则（rule.md）：
 * 1. 魔女杀手优先结算
 * 2. 其次按提交攻击行动的顺序
 * 3. 魔女杀手攻击成功时，其他人攻击魔女杀手持有者会落空
 */

export { resolveNightActions } from "./resolution/index";
