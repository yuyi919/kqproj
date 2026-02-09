/**
 * 魔女审判游戏引擎 - 游戏状态管理
 * 负责游戏状态的创建、更新和查询
 */

import { nanoid } from 'nanoid';
import {
  GameState,
  GamePhase,
  GameConfig,
  Player,
  PlayerAction,
  Vote,
  VoteResult,
  DeathRecord,
  GameResult,
  PendingResolution,
  GameError,
  GameErrorCode,
  Card,
} from '../types';
import { createDeck, CardManager } from '../cards';
import { createPlayer, getAlivePlayers, checkWinCondition } from '../player';

// ==================== 游戏状态工厂 ====================

/**
 * 创建新游戏
 */
export function createGame(
  roomId: string,
  config: GameConfig,
  playerIds: string[],
): GameState {
  if (playerIds.length > config.maxPlayers) {
    throw new GameError(
      GameErrorCode.INVALID_ACTION,
      `玩家数量超过上限 ${config.maxPlayers}`,
    );
  }
  
  // 创建牌堆
  const deck = createDeck(config.cardPool);
  const cardManager = new CardManager(deck);
  
  // 创建玩家并分发初始手牌
  const players = new Map<string, Player>();
  const playerOrder: string[] = [];
  
  for (let i = 0; i < playerIds.length; i++) {
    const userId = playerIds[i];
    // 初始每人发5张牌
    const initialCards = cardManager.draw(4); // 初始手牌4张
    const player = createPlayer(userId, i + 1, initialCards);
    
    players.set(userId, player);
    playerOrder.push(userId);
  }
  
  const now = Date.now();
  
  return {
    id: nanoid(),
    roomId,
    status: GamePhase.SETUP,
    round: 0,
    players,
    playerOrder,
    deck: cardManager['deck'],  // 从CardManager获取剩余牌堆
    discardPile: [],
    currentActions: new Map(),
    currentVotes: [],
    actionHistory: [],
    voteHistory: [],
    deathLog: [],
    config,
    phaseStartTime: now,
    phaseEndTime: now,
    attackQuota: {
      witchKillerUsed: false,
      killMagicUsed: 0,
    },
  };
}

// ==================== 游戏状态查询 ====================

/**
 * 获取当前回合数
 */
export function getCurrentRound(state: GameState): number {
  return state.round;
}

/**
 * 获取当前阶段
 */
export function getCurrentPhase(state: GameState): GamePhase {
  return state.status;
}

/**
 * 获取存活玩家
 */
export function getAlivePlayersInGame(state: GameState): Player[] {
  return getAlivePlayers(state.players);
}

/**
 * 获取存活玩家数量
 */
export function getAlivePlayerCount(state: GameState): number {
  return getAlivePlayersInGame(state).length;
}

/**
 * 获取指定玩家
 */
export function getPlayer(state: GameState, playerId: string): Player | undefined {
  return state.players.get(playerId);
}

/**
 * 检查玩家是否存在且存活
 */
export function isPlayerAlive(state: GameState, playerId: string): boolean {
  const player = state.players.get(playerId);
  return player ? player.status === 'alive' || player.status === 'witch' : false;
}

/**
 * 检查是否是当前玩家的回合（是否可行动）
 */
export function canPlayerAct(state: GameState, playerId: string): boolean {
  const player = state.players.get(playerId);
  if (!player) return false;
  
  // 检查是否存活
  if (!isPlayerAlive(state, playerId)) return false;
  
  // 检查阶段
  if (state.status !== GamePhase.NIGHT && state.status !== GamePhase.VOTING) {
    return false;
  }
  
  // 检查是否被监禁（在夜间阶段）
  if (state.status === GamePhase.NIGHT) {
    // 获取上一轮的投票结果
    const lastVote = state.voteHistory[state.voteHistory.length - 1];
    if (lastVote && lastVote.round === state.round - 1) {
      // 上一轮的投票结果影响当前夜间
      // 注意：实际逻辑应该在结算阶段设置被监禁状态
    }
  }
  
  return true;
}

// ==================== 游戏状态更新 ====================

/**
 * 设置游戏阶段
 */
export function setPhase(state: GameState, phase: GamePhase): void {
  const now = Date.now();
  state.status = phase;
  state.phaseStartTime = now;
  
  // 设置阶段结束时间
  let duration = 0;
  switch (phase) {
    case GamePhase.DAY:
      duration = state.config.dayDuration * 1000;
      break;
    case GamePhase.NIGHT:
      duration = state.config.nightDuration * 1000;
      break;
    case GamePhase.VOTING:
      duration = state.config.votingDuration * 1000;
      break;
    default:
      duration = 0;
  }
  state.phaseEndTime = duration > 0 ? now + duration : now;
}

/**
 * 进入下一回合
 */
export function nextRound(state: GameState): void {
  state.round++;
  state.currentActions.clear();
  state.currentVotes = [];
  state.pendingResolutions = [];
  state.attackQuota = {
    witchKillerUsed: false,
    killMagicUsed: 0,
  };
}

/**
 * 重置攻击名额
 */
export function resetAttackQuota(state: GameState): void {
  state.attackQuota = {
    witchKillerUsed: false,
    killMagicUsed: 0,
  };
}

/**
 * 使用攻击名额
 * @returns 是否成功使用
 */
export function useAttackQuota(state: GameState, isWitchKiller: boolean): boolean {
  if (isWitchKiller) {
    if (state.attackQuota.witchKillerUsed) {
      return false;
    }
    state.attackQuota.witchKillerUsed = true;
    return true;
  } else {
    // 杀人魔法
    const maxKillMagic = state.attackQuota.witchKillerUsed ? 2 : 3;
    if (state.attackQuota.killMagicUsed >= maxKillMagic) {
      return false;
    }
    state.attackQuota.killMagicUsed++;
    return true;
  }
}

/**
 * 获取剩余攻击名额
 */
export function getRemainingAttackQuota(state: GameState): {
  witchKiller: boolean;
  killMagic: number;
} {
  const maxKillMagic = state.attackQuota.witchKillerUsed ? 2 : 3;
  return {
    witchKiller: !state.attackQuota.witchKillerUsed,
    killMagic: maxKillMagic - state.attackQuota.killMagicUsed,
  };
}

// ==================== 行动管理 ====================

/**
 * 记录玩家行动
 */
export function recordAction(state: GameState, action: PlayerAction): void {
  state.currentActions.set(action.playerId, action);
  state.actionHistory.push(action);
}

/**
 * 获取玩家的当前行动
 */
export function getPlayerAction(state: GameState, playerId: string): PlayerAction | undefined {
  return state.currentActions.get(playerId);
}

/**
 * 检查玩家是否已行动
 */
export function hasPlayerActed(state: GameState, playerId: string): boolean {
  return state.currentActions.has(playerId);
}

/**
 * 获取本回合已行动玩家数
 */
export function getActionedPlayerCount(state: GameState): number {
  return state.currentActions.size;
}

/**
 * 获取所有行动
 */
export function getAllActions(state: GameState): PlayerAction[] {
  return Array.from(state.currentActions.values());
}

// ==================== 投票管理 ====================

/**
 * 记录投票
 */
export function recordVote(state: GameState, vote: Vote): void {
  // 检查是否已投票
  const existingIndex = state.currentVotes.findIndex(v => v.voterId === vote.voterId);
  if (existingIndex !== -1) {
    state.currentVotes[existingIndex] = vote;
  } else {
    state.currentVotes.push(vote);
  }
}

/**
 * 计算投票结果
 */
export function calculateVoteResult(state: GameState): VoteResult {
  const votes = new Map<string, string[]>();
  const voteCounts = new Map<string, number>();
  
  // 统计票数
  for (const vote of state.currentVotes) {
    const currentVotes = votes.get(vote.targetId) || [];
    currentVotes.push(vote.voterId);
    votes.set(vote.targetId, currentVotes);
    voteCounts.set(vote.targetId, currentVotes.length);
  }
  
  // 找出得票最高者
  let maxVotes = 0;
  let imprisonedId: string | null = null;
  let isTie = false;
  
  for (const [targetId, voterIds] of votes) {
    if (voterIds.length > maxVotes) {
      maxVotes = voterIds.length;
      imprisonedId = targetId;
      isTie = false;
    } else if (voterIds.length === maxVotes && maxVotes > 0) {
      isTie = true;
    }
  }
  
  // 平票则无人被监禁
  if (isTie) {
    imprisonedId = null;
  }
  
  const result: VoteResult = {
    round: state.round,
    votes,
    imprisonedId,
    isTie,
    voteCounts,
  };
  
  state.voteHistory.push(result);
  return result;
}

/**
 * 检查玩家是否已投票
 */
export function hasPlayerVoted(state: GameState, playerId: string): boolean {
  return state.currentVotes.some(v => v.voterId === playerId);
}

/**
 * 获取已投票玩家数
 */
export function getVotedPlayerCount(state: GameState): number {
  return state.currentVotes.length;
}

// ==================== 死亡记录 ====================

/**
 * 添加死亡记录
 */
export function addDeathRecord(state: GameState, record: DeathRecord): void {
  state.deathLog.push(record);
}

/**
 * 获取死亡记录
 */
export function getDeathRecords(state: GameState): DeathRecord[] {
  return [...state.deathLog];
}

/**
 * 获取某玩家的死亡记录
 */
export function getPlayerDeathRecord(
  state: GameState,
  playerId: string,
): DeathRecord | undefined {
  return state.deathLog.find(r => r.playerId === playerId);
}

// ==================== 卡牌管理 ====================

/**
 * 从牌堆抽牌
 */
export function drawCards(state: GameState, count: number): Card[] {
  if (count > state.deck.length) {
    // 洗入弃牌堆
    reshuffleDeck(state);
  }
  
  const drawn: Card[] = [];
  for (let i = 0; i < count && state.deck.length > 0; i++) {
    drawn.push(state.deck.pop()!);
  }
  
  return drawn;
}

/**
 * 弃牌
 */
export function discardCards(state: GameState, cards: Card | Card[]): void {
  const cardsToDiscard = Array.isArray(cards) ? cards : [cards];
  state.discardPile.push(...cardsToDiscard);
}

/**
 * 重新洗牌
 */
export function reshuffleDeck(state: GameState): void {
  const allCards = [...state.deck, ...state.discardPile];
  // Fisher-Yates洗牌
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }
  state.deck = allCards;
  state.discardPile = [];
}

/**
 * 获取牌堆剩余数量
 */
export function getDeckCount(state: GameState): number {
  return state.deck.length;
}

// ==================== 游戏结束 ====================

/**
 * 检查游戏是否结束
 */
export function checkGameEnd(state: GameState): GameResult | undefined {
  // 检查是否超过最大回合
  if (state.round > state.config.maxRounds) {
    const survivors = getAlivePlayersInGame(state).map(p => p.id);
    return {
      winnerId: survivors.length === 1 ? survivors[0] : null,
      survivors,
      roundsPlayed: state.round - 1,
      deathLog: [...state.deathLog],
      isEarlyEnd: false,
    };
  }
  
  // 检查胜利条件
  const winnerId = checkWinCondition(state.players);
  if (winnerId !== undefined) {
    const survivors = getAlivePlayersInGame(state).map(p => p.id);
    return {
      winnerId,
      survivors,
      roundsPlayed: state.round,
      deathLog: [...state.deathLog],
      isEarlyEnd: true,
    };
  }
  
  return undefined;
}

/**
 * 结束游戏
 */
export function endGame(state: GameState): GameResult {
  const result = checkGameEnd(state);
  if (result) {
    setPhase(state, GamePhase.ENDED);
    return result;
  }
  
  // 强制结束
  const survivors = getAlivePlayersInGame(state).map(p => p.id);
  return {
    winnerId: survivors.length === 1 ? survivors[0] : null,
    survivors,
    roundsPlayed: state.round,
    deathLog: [...state.deathLog],
    isEarlyEnd: true,
  };
}
