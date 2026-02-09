/**
 * 魔女审判游戏引擎 - 卡牌系统
 * 负责卡牌的创建、管理和使用
 */

import { nanoid } from 'nanoid';
import {
  Card,
  CardType,
  CardPoolConfig,
  GameError,
  GameErrorCode,
} from '../types';

// ==================== 卡牌定义 ====================

/**
 * 卡牌基础定义
 */
export const CARD_DEFINITIONS: Record<CardType, Omit<Card, 'id'>> = {
  [CardType.WITCH_KILLER]: {
    type: CardType.WITCH_KILLER,
    name: '魔女杀手',
    description: '对目标发动攻击（优先度最高），持有者魔女化。如果不使用，杀人魔法有3个名额；如果使用，杀人魔法只有2个名额。',
    consumable: false,
    priority: 100,  // 最高优先级
  },
  [CardType.BARRIER]: {
    type: CardType.BARRIER,
    name: '结界魔法',
    description: '保护自身当夜免受攻击，成功防御时会收到通知。',
    consumable: true,
    priority: 50,
  },
  [CardType.KILL]: {
    type: CardType.KILL,
    name: '杀人魔法',
    description: '对目标发动攻击（优先度低于魔女杀手），成功击杀后魔女化。当晚最多3人可使用（魔女杀手使用时只有2个名额）。',
    consumable: true,
    priority: 80,
  },
  [CardType.DETECT]: {
    type: CardType.DETECT,
    name: '探知魔法',
    description: '探知目标手牌总数并随机获悉其中一张名称。以目标使用手牌前的状态为准。',
    consumable: true,
    priority: 90,  // 先于攻击结算
  },
  [CardType.CHECK]: {
    type: CardType.CHECK,
    name: '检定魔法',
    description: '查验已死亡玩家的死因是否为魔女杀手所致。',
    consumable: true,
    priority: 10,
  },
};

// ==================== 卡牌工厂 ====================

/**
 * 创建单张卡牌
 */
export function createCard(type: CardType): Card {
  const definition = CARD_DEFINITIONS[type];
  return {
    id: nanoid(),
    ...definition,
  };
}

/**
 * 根据配置创建牌堆
 */
export function createDeck(config: CardPoolConfig): Card[] {
  const deck: Card[] = [];
  
  for (const [type, count] of Object.entries(config)) {
    const cardType = type as CardType;
    for (let i = 0; i < count; i++) {
      deck.push(createCard(cardType));
    }
  }
  
  return shuffleDeck(deck);
}

/**
 * 洗牌（Fisher-Yates算法）
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ==================== 卡牌管理器 ====================

export class CardManager {
  private deck: Card[] = [];
  private discardPile: Card[] = [];
  
  constructor(deck: Card[]) {
    this.deck = [...deck];
  }
  
  /**
   * 获取牌堆剩余数量
   */
  getDeckCount(): number {
    return this.deck.length;
  }
  
  /**
   * 获取弃牌堆
   */
  getDiscardPile(): Card[] {
    return [...this.discardPile];
  }
  
  /**
   * 抽牌
   * @param count 抽取数量
   * @returns 抽到的卡牌
   */
  draw(count: number = 1): Card[] {
    if (count > this.deck.length) {
      // 牌堆不够，洗入弃牌堆
      this.reshuffle();
    }
    
    const drawn: Card[] = [];
    for (let i = 0; i < count && this.deck.length > 0; i++) {
      drawn.push(this.deck.pop()!);
    }
    
    return drawn;
  }
  
  /**
   * 弃牌
   */
  discard(cards: Card | Card[]): void {
    const cardsToDiscard = Array.isArray(cards) ? cards : [cards];
    this.discardPile.push(...cardsToDiscard);
  }
  
  /**
   * 重新洗牌（弃牌堆洗入牌堆）
   */
  reshuffle(): void {
    this.deck = shuffleDeck([...this.deck, ...this.discardPile]);
    this.discardPile = [];
  }
  
  /**
   * 查找特定卡牌
   */
  findCard(cardId: string): Card | undefined {
    return (
      this.deck.find(c => c.id === cardId) ||
      this.discardPile.find(c => c.id === cardId)
    );
  }
}

// ==================== 手牌管理 ====================

/**
 * 验证是否可以使用卡牌
 */
export function validateCardUsage(
  card: Card,
  holder: { witchKillerHolder: boolean; status: string },
  isNight: boolean,
): void {
  // 检查是否持有魔女杀手
  if (holder.witchKillerHolder) {
    // 持有魔女杀手时，只能使用魔女杀手或放弃
    if (card.type !== CardType.WITCH_KILLER) {
      throw new GameError(
        GameErrorCode.WITCH_KILLER_ONLY,
        '持有魔女杀手时，只能使用魔女杀手或放弃行动',
      );
    }
  }
  
  // 检查卡牌是否可用（某些卡牌只能在夜间使用）
  if (!isNight && (card.type === CardType.KILL || card.type === CardType.BARRIER)) {
    throw new GameError(
      GameErrorCode.INVALID_PHASE,
      '该卡牌只能在夜间使用',
    );
  }
}

/**
 * 查找手牌中的卡牌
 */
export function findCardInHand(hand: Card[], cardId: string): Card | undefined {
  return hand.find(c => c.id === cardId);
}

/**
 * 从手牌中移除卡牌
 */
export function removeCardFromHand(hand: Card[], cardId: string): Card {
  const index = hand.findIndex(c => c.id === cardId);
  if (index === -1) {
    throw new GameError(
      GameErrorCode.CARD_NOT_FOUND,
      '手牌中找不到该卡牌',
    );
  }
  
  const [removed] = hand.splice(index, 1);
  return removed;
}

/**
 * 获取手牌中特定类型的卡牌
 */
export function getCardsByType(hand: Card[], type: CardType): Card[] {
  return hand.filter(c => c.type === type);
}

/**
 * 检查是否持有魔女杀手
 */
export function hasWitchKiller(hand: Card[]): boolean {
  return hand.some(c => c.type === CardType.WITCH_KILLER);
}

/**
 * 获取手牌摘要（用于公开信息）
 */
export function getHandSummary(hand: Card[]): Map<CardType, number> {
  const summary = new Map<CardType, number>();
  
  for (const card of hand) {
    const count = summary.get(card.type) || 0;
    summary.set(card.type, count + 1);
  }
  
  return summary;
}

// ==================== 手牌遗落分配 ====================

/**
 * 分配遗落的手牌
 * @param droppedCards 遗落的手牌
 * @param claimerId 领取者ID（击杀者或尸体发现者）
 * @param otherPlayers 其他存活玩家
 * @returns 分配结果
 */
export function distributeDroppedCards(
  droppedCards: Card[],
  claimerId: string,
  otherPlayers: string[],
): Map<string, Card[]> {
  const distribution = new Map<string, Card[]>();
  
  // 初始化
  distribution.set(claimerId, []);
  for (const playerId of otherPlayers) {
    distribution.set(playerId, []);
  }
  
  // 随机打乱遗落卡牌
  const shuffled = shuffleDeck([...droppedCards]);
  
  // 轮流分配
  const allRecipients = [claimerId, ...otherPlayers];
  for (let i = 0; i < shuffled.length; i++) {
    const recipient = allRecipients[i % allRecipients.length];
    const currentCards = distribution.get(recipient) || [];
    currentCards.push(shuffled[i]);
    distribution.set(recipient, currentCards);
  }
  
  return distribution;
}
