"use client";

/**
 * CardService - 卡牌服务
 *
 * 职责：卡牌创建、定义查询、牌堆管理
 * 包装现有的 domain/services/cardService.ts 纯函数
 */

import { Context, Layer } from "effect";
import {
  createCard as importedCreateCard,
  createDeck as importedCreateDeck,
  getAllCardTypes as importedGetAllCardTypes,
  getCardDefinition as importedGetCardDefinition,
  getCardDefinitionByType as importedGetCardDefinitionByType,
  getCardIcon as importedGetCardIcon,
  getCardTypeDescription as importedGetCardTypeDescription,
  getCardTypeName as importedGetCardTypeName,
  isAttackCard as importedIsAttackCard,
  isDefenseCard as importedIsDefenseCard,
  isIntelligenceCard as importedIsIntelligenceCard,
} from "../../domain/services/cardService";
import type { Card, CardPoolConfig, CardRef, CardType } from "../../types";

/**
 * 卡牌服务接口
 */
export interface ICardService {
  /** 创建卡牌 */
  readonly createCard: (type: CardType) => CardRef;

  /** 获取卡牌完整定义 */
  readonly getCardDefinition: (cardRef: CardRef) => Card;

  /** 通过类型获取卡牌定义 */
  readonly getCardDefinitionByType: (type: CardType) => Omit<Card, "id">;

  /** 创建牌堆 */
  readonly createDeck: (
    config: CardPoolConfig,
    shuffle: <T>(array: T[]) => T[],
  ) => CardRef[];

  /** 获取卡牌名称 */
  readonly getCardTypeName: (type: CardType) => string;

  /** 获取卡牌描述 */
  readonly getCardTypeDescription: (type: CardType) => string;

  /** 获取卡牌图标 */
  readonly getCardIcon: (type: CardType) => string;

  /** 获取所有卡牌类型列表 */
  readonly getAllCardTypes: () => CardType[];

  /** 检查是否为攻击类卡牌 */
  readonly isAttackCard: (type: CardType) => boolean;

  /** 检查是否为防御类卡牌 */
  readonly isDefenseCard: (type: CardType) => boolean;

  /** 检查是否为情报类卡牌 */
  readonly isIntelligenceCard: (type: CardType) => boolean;
}

/**
 * CardService Tag
 */
export const CardService = Context.GenericTag<ICardService>("CardService");

/**
 * CardService Live Layer
 * 包装现有的纯函数
 */
export const CardServiceLayer = Layer.succeed(CardService, {
  createCard: (type) => importedCreateCard(type),
  getCardDefinition: (cardRef) => importedGetCardDefinition(cardRef),
  getCardDefinitionByType: (type) => importedGetCardDefinitionByType(type),
  createDeck: (config, shuffle) => importedCreateDeck(config, shuffle),
  getCardTypeName: (type) => importedGetCardTypeName(type),
  getCardTypeDescription: (type) => importedGetCardTypeDescription(type),
  getCardIcon: (type) => importedGetCardIcon(type),
  getAllCardTypes: () => importedGetAllCardTypes(),
  isAttackCard: (type) => importedIsAttackCard(type),
  isDefenseCard: (type) => importedIsDefenseCard(type),
  isIntelligenceCard: (type) => importedIsIntelligenceCard(type),
});
