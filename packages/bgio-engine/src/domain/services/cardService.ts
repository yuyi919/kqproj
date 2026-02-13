"use client";

/**
 * Card Service - 卡牌工厂和定义
 */

import { nanoid } from "nanoid";
import type { Card, CardPoolConfig, CardRef, CardType } from "../../types";
import { Refinements } from "../refinements";

// ==================== 卡牌定义表 ====================

const CARD_DEFINITIONS: Record<CardType, Omit<Card, "id" | "type">> = {
  witch_killer: {
    name: "魔女杀手",
    description: "对目标发动攻击（优先度最高），持有者魔女化",
    icon: "⚔️",
    consumable: false,
    priority: 100,
  },
  barrier: {
    name: "结界魔法",
    description: "保护自身当夜免受攻击",
    icon: "🛡️",
    consumable: true,
    priority: 50,
  },
  kill: {
    name: "杀人魔法",
    description: "对目标发动攻击，成功击杀后魔女化",
    icon: "🔪",
    consumable: true,
    priority: 80,
  },
  detect: {
    name: "探知魔法",
    description: "探知目标手牌总数并随机获悉其中一张",
    icon: "🔍",
    consumable: true,
    priority: 90,
  },
  check: {
    name: "检定魔法",
    description: "查验已死亡玩家的死因",
    icon: "🔬",
    consumable: true,
    priority: 10,
  },
};

// ==================== 卡牌工厂 ====================

/**
 * 创建卡牌
 */
export function createCard(type: CardType): CardRef {
  return {
    id: nanoid(),
    type,
  };
}

/**
 * 获取卡牌完整定义
 */
export function getCardDefinition(cardRef: CardRef): Card {
  const def = CARD_DEFINITIONS[cardRef.type];
  return {
    id: cardRef.id,
    type: cardRef.type,
    ...def,
  };
}

/**
 * 通过类型获取卡牌定义
 */
export function getCardDefinitionByType(type: CardType): Omit<Card, "id"> {
  const def = CARD_DEFINITIONS[type];
  return {
    type,
    ...def,
  };
}

/**
 * 创建牌堆
 */
export function createDeck(
  config: CardPoolConfig,
  shuffle: <T>(array: T[]) => T[],
): CardRef[] {
  const deck: CardRef[] = [];

  for (const [type, count] of Object.entries(config)) {
    for (let i = 0; i < count; i++) {
      deck.push(createCard(type as CardType));
    }
  }

  // 使用 boardgame.io 的 shuffle 确保可回溯
  return shuffle(deck);
}

// ==================== 卡牌元数据获取器 ====================

/**
 * 获取卡牌名称
 */
export function getCardTypeName(type: CardType): string {
  return CARD_DEFINITIONS[type]?.name || "未知卡牌";
}

/**
 * 获取卡牌描述
 */
export function getCardTypeDescription(type: CardType): string {
  return CARD_DEFINITIONS[type]?.description || "";
}

/**
 * 获取卡牌图标
 */
export function getCardIcon(type: CardType): string {
  return CARD_DEFINITIONS[type]?.icon || "🃏";
}

/**
 * 获取所有卡牌类型列表
 */
export function getAllCardTypes(): CardType[] {
  return Object.keys(CARD_DEFINITIONS) as CardType[];
}

/**
 * 检查是否为攻击类卡牌
 */
export function isAttackCard(type: CardType): boolean {
  return Refinements.isAttackCard(type);
}

/**
 * 检查是否为防御类卡牌
 */
export function isDefenseCard(type: CardType): boolean {
  return Refinements.isDefenseCard(type);
}

/**
 * 检查是否为情报类卡牌
 */
export function isIntelligenceCard(type: CardType): boolean {
  return Refinements.isIntelligenceCard(type);
}
