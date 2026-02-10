/**
 * 魔女审判游戏引擎 - 结算系统
 * 负责处理复杂的结算逻辑，特别是攻击结算、手牌遗落分配等
 */

import {
  GameState,
  Player,
  PlayerAction,
  CardType,
  DeathCause,
  DeathRecord,
  RevealedInfo,
  Card,
} from "../types";
import {
  getRemainingAttackQuota,
  useAttackQuota,
  addDeathRecord,
  discardCards,
} from "../state";
import {
  killPlayer,
  transformToWitch,
  recordKill,
  tryDefendWithBarrier,
  addCards,
  getAlivePlayers,
  getAlivePlayerIds,
  isAlive,
  randomTransferWitchKiller,
  transformToWreck,
  updateWitchStatus,
} from "../player";
import { distributeDroppedCards } from "../cards";

// ==================== 结算结果 ====================

export interface ResolutionResult {
  success: boolean;
  message: string;
  revealedInfo: RevealedInfo[];
  killed?: boolean;
  defended?: boolean;
  missed?: boolean;
}

// ==================== 攻击结算 ====================

export interface AttackResolution {
  attackerId: string;
  targetId: string;
  cardType: CardType.WITCH_KILLER | CardType.KILL;
  result: "killed" | "defended" | "missed" | "quota_full";
  deathRecord?: DeathRecord;
}

/**
 * 结算攻击行动
 */
export function resolveAttack(
  state: GameState,
  attackerId: string,
  targetId: string,
  cardType: CardType.WITCH_KILLER | CardType.KILL,
  alreadyKilled: Set<string>,
): AttackResolution {
  const attacker = state.players.get(attackerId);
  const target = state.players.get(targetId);

  if (!attacker || !target) {
    return {
      attackerId,
      targetId,
      cardType,
      result: "missed",
    };
  }

  // 1. 检查攻击名额
  const isWitchKiller = cardType === CardType.WITCH_KILLER;
  if (!useAttackQuota(state, isWitchKiller)) {
    return {
      attackerId,
      targetId,
      cardType,
      result: "quota_full",
    };
  }

  // 2. 检查目标是否已被击杀
  if (alreadyKilled.has(targetId) || !isAlive(target)) {
    return {
      attackerId,
      targetId,
      cardType,
      result: "missed",
    };
  }

  // 3. 检查结界
  if (tryDefendWithBarrier(target)) {
    return {
      attackerId,
      targetId,
      cardType,
      result: "defended",
    };
  }

  // 4. 击杀成功
  const cause = isWitchKiller ? DeathCause.WITCH_KILLER : DeathCause.KILL_MAGIC;
  const deathRecord = killPlayer(target, cause, state.round, attackerId);

  // 5. 魔女化
  transformToWitch(attacker);
  recordKill(attacker, state.round);

  // 6. 处理手牌遗落
  if (deathRecord.droppedCards.length > 0) {
    processDroppedCards(state, deathRecord, attackerId);
  }

  // 7. 如果是杀人魔法击杀且目标持有魔女杀手，转移魔女杀手
  if (!isWitchKiller && target.witchKillerHolder) {
    transferWitchKillerFromDead(state, target);
  }

  // 8. 记录死亡
  addDeathRecord(state, deathRecord);

  return {
    attackerId,
    targetId,
    cardType,
    result: "killed",
    deathRecord,
  };
}

/**
 * 处理手牌遗落
 */
function processDroppedCards(
  state: GameState,
  deathRecord: DeathRecord,
  killerId?: string,
): void {
  const { droppedCards, playerId: deadPlayerId } = deathRecord;

  // 获取参与分配的存活玩家
  const alivePlayers = getAlivePlayers(state.players);
  const alivePlayerIds = alivePlayers.map((p) => p.id);

  // 击杀者（尸体发现者）优先
  const claimerId = killerId || alivePlayerIds[0];
  const otherPlayers = alivePlayerIds.filter((id) => id !== claimerId);

  // 分配手牌
  const distribution = distributeDroppedCards(
    droppedCards,
    claimerId,
    otherPlayers,
  );

  // 实际分配
  for (const [receiverId, cards] of distribution) {
    const receiver = state.players.get(receiverId);
    if (receiver) {
      addCards(receiver, cards);
    }
  }

  // 记录分配结果
  deathRecord.cardReceivers = distribution;
}

/**
 * 从死亡玩家转移魔女杀手
 */
function transferWitchKillerFromDead(
  state: GameState,
  deadPlayer: Player,
): void {
  // 找到魔女杀手卡牌
  const witchKillerIndex = deadPlayer.hand.findIndex(
    (c) => c.type === CardType.WITCH_KILLER,
  );

  if (witchKillerIndex === -1) return;

  // 从死亡玩家手中移除
  deadPlayer.witchKillerHolder = false;
  const [witchKillerCard] = deadPlayer.hand.splice(witchKillerIndex, 1);

  // 随机转移给其他存活玩家
  const alivePlayers = getAlivePlayers(state.players);
  randomTransferWitchKiller(witchKillerCard, alivePlayers);
}

// ==================== 探知结算 ====================

export interface DetectResolution {
  detectorId: string;
  targetId: string;
  handCount: number;
  detectedCard: {
    name: string;
    type: CardType;
  } | null;
}

/**
 * 结算探知魔法
 */
export function resolveDetect(
  state: GameState,
  detectorId: string,
  targetId: string,
): DetectResolution {
  const target = state.players.get(targetId);

  if (!target) {
    return {
      detectorId,
      targetId,
      handCount: 0,
      detectedCard: null,
    };
  }

  const handCount = target.hand.length;
  let detectedCard = null;

  if (target.hand.length > 0) {
    // 随机选择一张手牌
    const randomIndex = Math.floor(Math.random() * target.hand.length);
    const card = target.hand[randomIndex];
    detectedCard = {
      name: card.name,
      type: card.type,
    };
  }

  return {
    detectorId,
    targetId,
    handCount,
    detectedCard,
  };
}

// ==================== 检定结算 ====================

export interface CheckResolution {
  checkerId: string;
  targetId: string;
  isWitchKillerKill: boolean;
  deathCause: DeathCause | null;
}

/**
 * 结算检定魔法
 */
export function resolveCheck(
  state: GameState,
  checkerId: string,
  targetId: string,
): CheckResolution {
  const deathRecord = state.deathLog.find((r) => r.playerId === targetId);

  if (!deathRecord) {
    return {
      checkerId,
      targetId,
      isWitchKillerKill: false,
      deathCause: null,
    };
  }

  return {
    checkerId,
    targetId,
    isWitchKillerKill: deathRecord.cause === DeathCause.WITCH_KILLER,
    deathCause: deathRecord.cause,
  };
}

// ==================== 结界结算 ====================

export interface BarrierResolution {
  userId: string;
  success: boolean;
}

/**
 * 结算结界魔法
 */
export function resolveBarrier(
  state: GameState,
  userId: string,
): BarrierResolution {
  const user = state.players.get(userId);

  if (!user) {
    return {
      userId,
      success: false,
    };
  }

  user.hasBarrier = true;
  user.barrierSource = userId;

  return {
    userId,
    success: true,
  };
}

// ==================== 残骸化结算 ====================

export interface WreckResolution {
  playerId: string;
  becameWreck: boolean;
  witchKillerTransferred?: {
    fromId: string;
    toId: string;
  };
}

/**
 * 结算残骸化检查
 * 应在每回合结算阶段调用
 */
export function resolveWreckTransformations(
  state: GameState,
): WreckResolution[] {
  const results: WreckResolution[] = [];

  for (const [playerId, player] of state.players) {
    if (!player.isWitch || !isAlive(player)) continue;

    const shouldWreck = updateWitchStatus(player, state.round);

    if (shouldWreck) {
      let transferInfo: { fromId: string; toId: string } | undefined;

      // 处理魔女杀手转移
      if (player.witchKillerHolder) {
        const witchKillerCard = player.hand.find(
          (c) => c.type === CardType.WITCH_KILLER,
        );
        if (witchKillerCard) {
          // 移除魔女杀手
          player.witchKillerHolder = false;
          const index = player.hand.findIndex(
            (c) => c.id === witchKillerCard.id,
          );
          if (index !== -1) {
            player.hand.splice(index, 1);
          }

          // 随机转移
          const alivePlayers = getAlivePlayers(state.players).filter(
            (p) => p.id !== playerId,
          );
          const newHolder = randomTransferWitchKiller(
            witchKillerCard,
            alivePlayers,
          );

          if (newHolder) {
            transferInfo = {
              fromId: playerId,
              toId: newHolder.id,
            };
          }
        }
      }

      // 残骸化
      transformToWreck(player, state.round);

      results.push({
        playerId,
        becameWreck: true,
        witchKillerTransferred: transferInfo,
      });
    }
  }

  return results;
}

// ==================== 投票结算 ====================

export interface VotingResolution {
  round: number;
  voteCounts: Map<string, number>;
  imprisonedId: string | null;
  isTie: boolean;
  totalVotes: number;
}

/**
 * 结算投票
 */
export function resolveVoting(state: GameState): VotingResolution {
  const votes = new Map<string, number>();

  // 统计票数
  for (const vote of state.currentVotes) {
    const current = votes.get(vote.targetId) || 0;
    votes.set(vote.targetId, current + 1);
  }

  // 找出得票最高者
  let maxVotes = 0;
  const topVoted: string[] = [];

  for (const [targetId, count] of votes) {
    if (count > maxVotes) {
      maxVotes = count;
      topVoted.length = 0;
      topVoted.push(targetId);
    } else if (count === maxVotes) {
      topVoted.push(targetId);
    }
  }

  const isTie = topVoted.length > 1;
  const imprisonedId = isTie ? null : topVoted[0] || null;

  return {
    round: state.round,
    voteCounts: votes,
    imprisonedId,
    isTie,
    totalVotes: state.currentVotes.length,
  };
}

// ==================== 完整回合结算 ====================

export interface TurnResolution {
  attacks: AttackResolution[];
  detects: DetectResolution[];
  checks: CheckResolution[];
  barriers: BarrierResolution[];
  wrecks: WreckResolution[];
  voting: VotingResolution;
  gameEnded: boolean;
  winnerId: string | null | undefined;
}

/**
 * 结算完整回合
 * 这是结算阶段的主入口
 */
export function resolveTurn(state: GameState): TurnResolution {
  const result: TurnResolution = {
    attacks: [],
    detects: [],
    checks: [],
    barriers: [],
    wrecks: [],
    voting: resolveVoting(state),
    gameEnded: false,
    winnerId: undefined,
  };

  const killedPlayers = new Set<string>();
  const imprisonedId = result.voting.imprisonedId;

  // 按优先级排序行动
  const actions = Array.from(state.currentActions.values());
  const sortedActions = actions.sort((a, b) => {
    const priorityA = a.cardType ? getCardPriority(a.cardType) : 0;
    const priorityB = b.cardType ? getCardPriority(b.cardType) : 0;
    return priorityB - priorityA;
  });

  // 处理每个行动
  for (const action of sortedActions) {
    if (action.type !== "use_card" || !action.cardType || !action.targetId) {
      continue;
    }

    // 检查是否被监禁
    if (imprisonedId === action.playerId) {
      continue;
    }

    switch (action.cardType) {
      case CardType.WITCH_KILLER:
      case CardType.KILL: {
        const attackResult = resolveAttack(
          state,
          action.playerId,
          action.targetId,
          action.cardType,
          killedPlayers,
        );
        result.attacks.push(attackResult);

        if (attackResult.result === "killed" && attackResult.deathRecord) {
          killedPlayers.add(action.targetId);
        }
        break;
      }

      case CardType.DETECT: {
        const detectResult = resolveDetect(
          state,
          action.playerId,
          action.targetId,
        );
        result.detects.push(detectResult);
        break;
      }

      case CardType.CHECK: {
        const checkResult = resolveCheck(
          state,
          action.playerId,
          action.targetId,
        );
        result.checks.push(checkResult);
        break;
      }

      case CardType.BARRIER: {
        // 结界的目标是施法者自己
        const barrierResult = resolveBarrier(state, action.playerId);
        result.barriers.push(barrierResult);
        break;
      }
    }
  }

  // 处理残骸化
  result.wrecks = resolveWreckTransformations(state);

  // 检查游戏结束
  const alivePlayers = getAlivePlayers(state.players);
  if (alivePlayers.length <= 1) {
    result.gameEnded = true;
    result.winnerId = alivePlayers.length === 1 ? alivePlayers[0].id : null;
  }

  return result;
}

/**
 * 获取卡牌优先级
 */
function getCardPriority(cardType: CardType): number {
  const priorities: Record<CardType, number> = {
    [CardType.WITCH_KILLER]: 100,
    [CardType.DETECT]: 90,
    [CardType.KILL]: 80,
    [CardType.BARRIER]: 50,
    [CardType.CHECK]: 10,
  };
  return priorities[cardType] || 0;
}
