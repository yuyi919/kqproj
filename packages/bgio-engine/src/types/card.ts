"use client";

/**
 * 卡牌相关类型定义
 */

import type { CardType } from "./core";

/**
 * 最小化卡牌存储（原子状态）
 * 只存储 id 和 type，其他信息通过 getCardDefinition(type) 获取
 */
export interface CardRef {
  id: string;
  type: CardType;
}

/**
 * 卡牌定义（完整信息，通过工具函数计算获得）
 */
export interface Card extends CardRef {
  name: string;
  /** 卡牌描述文本 */
  description: string;
  /** 卡牌图标 (Emoji) */
  icon: string;
  /** 是否为消耗品（使用后是否消失） */
  consumable: boolean;
  /** 行动优先级，数值越大优先级越高 */
  priority: number;
}

/**
 * 卡牌池配置
 */
export interface CardPoolConfig {
  /** 魔女杀手卡牌初始数量 */
  witch_killer: number;
  /** 结界魔法卡牌初始数量 */
  barrier: number;
  /** 杀人魔法卡牌初始数量 */
  kill: number;
  /** 探知魔法卡牌初始数量 */
  detect: number;
  /** 检定魔法卡牌初始数量 */
  check: number;
}
