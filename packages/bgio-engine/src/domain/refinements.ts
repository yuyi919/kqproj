"use client";

/**
 * Refinement 函数 - 纯逻辑判断，不依赖 BGGameState
 * 用于特定的领域模型对象（如 PlayerSecret, Vote, NightAction）
 */

import type {
  CardRef,
  CardType,
  NightAction,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  Vote,
} from "../types";

export const Refinements = {
  /**
   * 判断玩家是否处于魔女状态
   *
   * 规则（rule.md FAQ Q1）：
   * 持有魔女杀手的玩家也受魔女化影响
   * 即 witchKillerHolder 也应视为 witch 进行计时器检查
   */
  isWitch(secret: PrivatePlayerInfo): boolean {
    return secret.isWitch || secret.witchKillerHolder;
  },

  /**
   * 判断玩家是否存活
   * 规则：状态为 alive 或 witch
   */
  isAlive(secret: PrivatePlayerInfo | PublicPlayerInfo): boolean {
    return secret.status === "alive" || secret.status === "witch";
  },

  /**
   * 判断玩家是否死亡（包括残骸化）
   */
  isDead(secret: PrivatePlayerInfo): boolean {
    return secret.status === "dead" || secret.status === "wreck";
  },

  /**
   * 判断玩家是否被囚禁
   */
  isImprisoned(imprisonedId: string | null, playerId: string): boolean {
    return !!imprisonedId && imprisonedId === playerId;
  },

  /**
   * 计算玩家是否需要残骸化
   */
  shouldWreck(secret: PrivatePlayerInfo): boolean {
    return Refinements.isWitch(secret) && secret.consecutiveNoKillRounds >= 2;
  },

  /**
   * 查找玩家的投票记录
   */
  findVote(votes: Vote[], voterId: string): Vote | null {
    return votes.find((v) => v.voterId === voterId) ?? null;
  },

  /**
   * 查找玩家投票记录的索引
   */
  findVoteIndex(votes: Vote[], voterId: string): number {
    return votes.findIndex((v) => v.voterId === voterId);
  },

  /**
   * 判断是否是弃权票（投给自己）
   */
  isAbstention(vote: Vote): boolean {
    return vote.voterId === vote.targetId;
  },

  /**
   * 判断玩家在本回合是否有成功的击杀记录
   */
  hasKilledSuccessfully(actions: NightAction[], playerId: string): boolean {
    return actions.some(
      (a) => a.playerId === playerId && Refinements.isAnyAttackSuccess(a),
    );
  },

  /**
   * 判断行动是否成功击杀
   */
  isAnyAttackSuccess(action: NightAction): boolean {
    return (
      action.executed === true && Refinements.isAttackCardOptional(action.card)
    );
  },

  /**
   * 判断是否是杀人魔法成功击杀
   */
  isKillMagicSuccess(action: NightAction): boolean {
    return (
      action.executed === true &&
      !!action.card &&
      Refinements.isKillMagicCard(action.card)
    );
  },

  /**
   * 判断是否是魔女杀手成功击杀
   */
  isWitchKillerSuccess(action: NightAction): boolean {
    return (
      action.executed === true &&
      !!action.card &&
      Refinements.isWitchKillerCard(action.card)
    );
  },

  /**
   * 获取卡牌的攻击类型
   */
  getAttackType(
    card?: CardRef | CardType | null,
  ): "witch_killer" | "kill" | null {
    if (!card) return null;
    const type = typeof card === "string" ? card : card.type;
    if (type === "witch_killer") return "witch_killer";
    if (type === "kill") return "kill";
    return null;
  },

  /**
   * 判断卡牌是否是攻击类卡牌或为null
   */
  isAttackCardOptional(card?: CardRef | null): boolean {
    return !!card && Refinements.isAttackCard(card);
  },

  /**
   * 判断卡牌是否是攻击类卡牌
   */
  isAttackCard(card: CardRef | CardType): boolean {
    return !!Refinements.getAttackType(card);
  },

  /**
   * 判断卡牌是否是攻击魔法
   */
  isKillMagicCard(card: CardRef | CardType): boolean {
    return (typeof card === "string" ? card : card.type) === "kill";
  },

  /**
   * 判断卡牌是否是魔女杀手
   */
  isWitchKillerCard(card: CardRef | CardType): boolean {
    return (typeof card === "string" ? card : card.type) === "witch_killer";
  },

  /**
   * 判断卡牌是否是防御卡
   */
  isDefenseCard(card: CardRef | CardType): boolean {
    return (typeof card === "string" ? card : card.type) === "barrier";
  },

  /**
   * 判断卡牌是否是情报卡
   */
  isIntelligenceCard(card: CardRef | CardType): boolean {
    const type = typeof card === "string" ? card : card.type;
    return type === "detect" || type === "check";
  },

  /**
   * 检查手牌是否已满
   */
  isHandFull(handLength: number, maxHandSize: number): boolean {
    return handLength >= maxHandSize;
  },

  /**
   * 检查游戏是否结束
   */
  isGameOver(
    aliveCount: number,
    currentRound: number,
    maxRounds: number,
  ): boolean {
    return aliveCount <= 1 || currentRound > maxRounds;
  },
};
