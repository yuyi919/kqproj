/**
 * 魔女审判游戏引擎 - 游戏阶段管理
 * 负责游戏各阶段的转换和阶段内逻辑
 */

import {
  GameState,
  GamePhase,
  GameEvent,
  GameEventType,
  Player,
  DeathCause,
  CardType,
} from '../types';
import {
  setPhase,
  nextRound,
  calculateVoteResult,
  checkGameEnd,
  endGame,
  getAlivePlayersInGame,
  drawCards,
  resetAttackQuota,
} from '../state';
import {
  transformToWitch,
  updateWitchStatus,
  transformToWreck,
  randomTransferWitchKiller,
  killPlayer,
  addCards,
  getAlivePlayers,
  getAlivePlayerIds,
} from '../player';
import { distributeDroppedCards } from '../cards';

// ==================== 阶段处理器类型 ====================

export type PhaseHandler = (state: GameState) => PhaseResult;

export interface PhaseResult {
  success: boolean;
  events: GameEvent[];
  canAdvance: boolean;  // 是否可以进入下一阶段
  gameEnded?: boolean;
  gameResult?: ReturnType<typeof checkGameEnd>;
}

// ==================== 事件辅助函数 ====================

function createEvent(type: GameEventType, data: unknown): GameEvent {
  return {
    type,
    timestamp: Date.now(),
    data,
  };
}

// ==================== 各阶段处理器 ====================

/**
 * 准备阶段处理器
 */
export function handleSetupPhase(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  // 初始化第一回合
  nextRound(state);
  
  // 给持有魔女杀手的玩家添加魔女化状态
  for (const player of state.players.values()) {
    if (player.witchKillerHolder) {
      transformToWitch(player);
      events.push(createEvent(GameEventType.WITCH_TRANSFORM, {
        playerId: player.id,
        reason: 'initial_holder',
      }));
    }
  }
  
  // 进入晨间阶段
  setPhase(state, GamePhase.MORNING);
  
  return {
    success: true,
    events,
    canAdvance: true,
  };
}

/**
 * 晨间阶段处理器
 * 公布死亡信息，检查游戏结束
 */
export function handleMorningPhase(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  // 检查上一轮的死亡情况
  const recentDeaths = state.deathLog.filter(d => d.round === state.round - 1);
  
  for (const death of recentDeaths) {
    events.push(createEvent(GameEventType.PLAYER_DIE, {
      playerId: death.playerId,
      cause: death.cause,
      round: death.round,
    }));
  }
  
  // 检查游戏是否结束
  const gameResult = checkGameEnd(state);
  if (gameResult) {
    return {
      success: true,
      events: [...events, createEvent(GameEventType.GAME_END, gameResult)],
      canAdvance: false,
      gameEnded: true,
      gameResult,
    };
  }
  
  // 自动进入日间阶段
  setPhase(state, GamePhase.DAY);
  
  return {
    success: true,
    events,
    canAdvance: true,
  };
}

/**
 * 日间阶段处理器
 * 玩家讨论和交易
 */
export function handleDayPhase(state: GameState): PhaseResult {
  return {
    success: true,
    events: [],
    canAdvance: true,
  };
}

/**
 * 从日间进入投票阶段
 */
export function startVotingFromDay(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  setPhase(state, GamePhase.VOTING);
  
  return {
    success: true,
    events,
    canAdvance: false, // 等待玩家投票
  };
}

/**
 * 从投票进入夜间阶段
 * 此时投票结果已确定，玩家知道谁被监禁
 */
export function handleNightPhaseStart(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  // 重置攻击名额
  resetAttackQuota(state);
  
  // 重置结界状态
  for (const player of state.players.values()) {
    player.hasBarrier = false;
    player.barrierSource = undefined;
  }
  
  setPhase(state, GamePhase.NIGHT);
  
  return {
    success: true,
    events,
    canAdvance: false,  // 等待玩家行动（已知道监禁结果）
  };
}

/**
 * 检查夜间阶段是否可以结束
 */
export function canEndNightPhase(state: GameState): boolean {
  // 所有存活玩家都已行动，或者时间到
  const alivePlayers = getAlivePlayersInGame(state);
  const actionedPlayers = state.currentActions.size;
  
  // 这里可以添加更多逻辑，比如最少需要多少人行动
  return actionedPlayers >= alivePlayers.length;
}

/**
 * 投票阶段处理器（初始）
 * 玩家投票决定监禁对象，结果将在夜间行动前公布
 */
export function handleVotingPhaseStart(state: GameState): PhaseResult {
  setPhase(state, GamePhase.VOTING);
  
  return {
    success: true,
    events: [],
    canAdvance: false,  // 等待玩家投票
  };
}

/**
 * 结束投票阶段并公布结果
 */
export function endVotingPhase(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  // 计算并公布投票结果
  const voteResult = calculateVoteResult(state);
  events.push(createEvent(GameEventType.VOTE_RESULT, {
    round: state.round,
    imprisonedId: voteResult.imprisonedId,
    isTie: voteResult.isTie,
    voteCounts: Object.fromEntries(voteResult.voteCounts),
  }));
  
  if (voteResult.imprisonedId) {
    console.log(`[投票结果] ${voteResult.imprisonedId} 被监禁，本回合无法使用手牌`);
  } else if (voteResult.isTie) {
    console.log('[投票结果] 平票，无人被监禁');
  }
  
  return {
    success: true,
    events,
    canAdvance: true, // 可以进入夜间阶段
  };
}

/**
 * 检查投票阶段是否可以结束
 */
export function canEndVotingPhase(state: GameState): boolean {
  // 所有存活玩家都已投票，或者时间到
  const alivePlayers = getAlivePlayersInGame(state);
  return state.currentVotes.length >= alivePlayers.length;
}

/**
 * 结算阶段处理器
 * 处理所有夜间行动（投票已在夜间前完成）
 */
export function handleResolutionPhase(state: GameState): PhaseResult {
  const events: GameEvent[] = [];
  
  setPhase(state, GamePhase.RESOLUTION);
  
  // 1. 获取当前回合的投票结果（投票阶段已完成）
  const lastVoteResult = state.voteHistory[state.voteHistory.length - 1];
  const imprisonedId = lastVoteResult?.round === state.round 
    ? lastVoteResult.imprisonedId 
    : null;
  
  // 2. 处理夜间行动（按优先级排序）
  const actions = Array.from(state.currentActions.values());
  const sortedActions = actions.sort((a, b) => {
    const priorityA = a.cardType ? getCardPriority(a.cardType) : 0;
    const priorityB = b.cardType ? getCardPriority(b.cardType) : 0;
    return priorityB - priorityA;
  });
  
  // 被击杀的玩家（用于处理攻击落空）
  const killedPlayers = new Set<string>();
  
  for (const action of sortedActions) {
    const actor = state.players.get(action.playerId);
    if (!actor || !isAlive(actor)) continue;
    
    // 检查是否被监禁（投票结果已知）
    if (imprisonedId === action.playerId) {
      // 被监禁者无法使用手牌
      continue;
    }
    
    if (action.type === 'use_card' && action.cardType && action.targetId) {
      const result = processCardAction(
        state,
        action.playerId,
        action.cardType,
        action.targetId,
        killedPlayers,
      );
      
      if (result.events) {
        events.push(...result.events);
      }
      
      if (result.killed) {
        killedPlayers.add(action.targetId);
      }
    }
  }
  
  // 3. 处理残骸化
  const wreckedPlayers = processWreckTransformations(state);
  for (const player of wreckedPlayers) {
    events.push(createEvent(GameEventType.WRECK_TRANSFORM, {
      playerId: player.id,
      round: state.round,
    }));
  }
  
  // 4. 补牌（给存活玩家补充手牌）
  replenishCards(state);
  
  // 5. 检查游戏结束
  const gameResult = checkGameEnd(state);
  if (gameResult) {
    return {
      success: true,
      events: [...events, createEvent(GameEventType.GAME_END, gameResult)],
      canAdvance: false,
      gameEnded: true,
      gameResult,
    };
  }
  
  // 6. 进入下一回合的晨间
  nextRound(state);
  setPhase(state, GamePhase.MORNING);
  
  return {
    success: true,
    events,
    canAdvance: true,
  };
}

// ==================== 辅助函数 ====================

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

/**
 * 检查玩家是否存活
 */
function isAlive(player: Player): boolean {
  return player.status === 'alive' || player.status === 'witch';
}

/**
 * 处理卡牌行动
 */
function processCardAction(
  state: GameState,
  actorId: string,
  cardType: CardType,
  targetId: string,
  alreadyKilled: Set<string>,
): { events: GameEvent[]; killed: boolean } {
  const events: GameEvent[] = [];
  let killed = false;
  
  const actor = state.players.get(actorId);
  const target = state.players.get(targetId);
  
  if (!actor || !target) return { events, killed };
  
  switch (cardType) {
    case CardType.WITCH_KILLER:
    case CardType.KILL: {
      // 攻击类卡牌
      const isWitchKiller = cardType === CardType.WITCH_KILLER;
      
      // 检查攻击名额
      const quota = state.attackQuota;
      if (isWitchKiller) {
        if (quota.witchKillerUsed) return { events, killed };
        quota.witchKillerUsed = true;
      } else {
        const maxKill = quota.witchKillerUsed ? 2 : 3;
        if (quota.killMagicUsed >= maxKill) return { events, killed };
        quota.killMagicUsed++;
      }
      
      // 检查目标是否已被击杀
      if (alreadyKilled.has(targetId) || !isAlive(target)) {
        // 攻击落空
        events.push(createEvent(GameEventType.CARD_USED, {
          actorId,
          cardType,
          targetId,
          result: 'missed',
          reason: 'target_already_dead',
        }));
        return { events, killed };
      }
      
      // 检查结界
      if (target.hasBarrier) {
        target.hasBarrier = false;
        events.push(createEvent(GameEventType.CARD_USED, {
          actorId,
          cardType,
          targetId,
          result: 'blocked',
        }));
        // 通知双方
        return { events, killed };
      }
      
      // 击杀成功
      const cause = isWitchKiller ? DeathCause.WITCH_KILLER : DeathCause.KILL_MAGIC;
      const deathRecord = killPlayer(target, cause, state.round, actorId);
      
      // 魔女化
      transformToWitch(actor);
      recordKill(actor, state.round);
      
      // 分配遗落手牌
      if (deathRecord.droppedCards.length > 0) {
        const alivePlayerIds = getAlivePlayerIds(state.players);
        // 排除击杀者，其他存活玩家参与分配
        const otherPlayers = alivePlayerIds.filter(id => id !== actorId);
        const distribution = distributeDroppedCards(
          deathRecord.droppedCards,
          actorId,
          otherPlayers,
        );
        deathRecord.cardReceivers = distribution;
        
        // 实际分配手牌
        for (const [receiverId, cards] of distribution) {
          const receiver = state.players.get(receiverId);
          if (receiver) {
            addCards(receiver, cards);
          }
        }
      }
      
      // 如果是杀人魔法击杀，转移魔女杀手
      if (!isWitchKiller && target.witchKillerHolder) {
        // 从死亡玩家中找到魔女杀手
        const witchKillerCard = deathRecord.droppedCards.find(
          c => c.type === CardType.WITCH_KILLER
        );
        if (witchKillerCard) {
          const alivePlayers = getAlivePlayers(state.players);
          const newHolder = randomTransferWitchKiller(witchKillerCard, alivePlayers);
          if (newHolder) {
            events.push(createEvent(GameEventType.WITCH_TRANSFORM, {
              playerId: newHolder.id,
              reason: 'transferred_from_dead',
              sourceId: targetId,
            }));
          }
        }
      }
      
      events.push(createEvent(GameEventType.CARD_USED, {
        actorId,
        cardType,
        targetId,
        result: 'killed',
      }));
      
      killed = true;
      break;
    }
    
    case CardType.DETECT: {
      // 探知魔法
      const handCount = target.hand.length;
      const randomCard = target.hand.length > 0 
        ? target.hand[Math.floor(Math.random() * target.hand.length)]
        : null;
      
      events.push(createEvent(GameEventType.CARD_USED, {
        actorId,
        cardType,
        targetId,
        result: 'success',
        detectedInfo: {
          handCount,
          cardName: randomCard?.name || null,
          cardType: randomCard?.type || null,
        },
      }));
      break;
    }
    
    case CardType.BARRIER: {
      // 结界魔法
      actor.hasBarrier = true;
      actor.barrierSource = actorId;
      
      events.push(createEvent(GameEventType.CARD_USED, {
        actorId,
        cardType,
        result: 'activated',
      }));
      break;
    }
    
    case CardType.CHECK: {
      // 检定魔法
      const deathRecord = state.deathLog.find(r => r.playerId === targetId);
      const isWitchKillerKill = deathRecord?.cause === DeathCause.WITCH_KILLER;
      
      events.push(createEvent(GameEventType.CARD_USED, {
        actorId,
        cardType,
        targetId,
        result: 'success',
        checkedInfo: {
          isWitchKillerKill,
          deathCause: deathRecord?.cause || null,
        },
      }));
      break;
    }
  }
  
  return { events, killed };
}

// 引入recordKill函数
import { recordKill } from '../player';

/**
 * 处理残骸化
 */
function processWreckTransformations(state: GameState): Player[] {
  const wreckedPlayers: Player[] = [];
  
  for (const player of state.players.values()) {
    if (player.isWitch && isAlive(player)) {
      const shouldWreck = updateWitchStatus(player, state.round);
      if (shouldWreck) {
        // 检查是否持有魔女杀手
        if (player.witchKillerHolder) {
          const witchKillerCard = player.hand.find(c => c.type === CardType.WITCH_KILLER);
          if (witchKillerCard) {
            // 移除魔女杀手
            player.witchKillerHolder = false;
            const index = player.hand.findIndex(c => c.id === witchKillerCard.id);
            if (index !== -1) {
              player.hand.splice(index, 1);
            }
            
            // 随机转移给其他存活玩家
            const alivePlayers = getAlivePlayers(state.players).filter(p => p.id !== player.id);
            const newHolder = randomTransferWitchKiller(witchKillerCard, alivePlayers);
            
            // 残骸化
            transformToWreck(player, state.round);
            wreckedPlayers.push(player);
            
            if (newHolder) {
              // 触发转移事件在结算阶段处理
            }
          }
        } else {
          transformToWreck(player, state.round);
          wreckedPlayers.push(player);
        }
      }
    }
  }
  
  return wreckedPlayers;
}

/**
 * 补牌
 */
function replenishCards(state: GameState): void {
  const alivePlayers = getAlivePlayers(state.players);
  
  for (const player of alivePlayers) {
    const neededCards = player.maxHandSize - player.hand.length;
    if (neededCards > 0) {
      const newCards = drawCards(state, neededCards);
      addCards(player, newCards);
    }
  }
}

// ==================== 阶段推进 ====================

/**
 * 推进到下一阶段
 * 正确顺序：DAY(日间) → VOTING(投票) → NIGHT(夜间行动) → RESOLUTION(结算) → MORNING(晨间)
 */
export function advancePhase(state: GameState): PhaseResult {
  switch (state.status) {
    case GamePhase.LOBBY:
    case GamePhase.SETUP:
      return handleSetupPhase(state);
    
    case GamePhase.MORNING:
      return handleMorningPhase(state);
    
    case GamePhase.DAY:
      // 日间结束 -> 投票阶段
      setPhase(state, GamePhase.VOTING);
      return handleVotingPhaseStart(state);
    
    case GamePhase.VOTING:
      // 投票结束 -> 计算投票结果 -> 夜间行动阶段
      calculateVoteResult(state); // 先计算投票结果
      return handleNightPhaseStart(state);
    
    case GamePhase.NIGHT:
      // 夜间行动结束 -> 结算阶段
      return handleResolutionPhase(state);
    
    case GamePhase.RESOLUTION:
      // 结算阶段后进入下一回合的晨间
      return handleMorningPhase(state);
    
    case GamePhase.ENDED:
      return {
        success: true,
        events: [],
        canAdvance: false,
        gameEnded: true,
      };
    
    default:
      return {
        success: false,
        events: [],
        canAdvance: false,
      };
  }
}
