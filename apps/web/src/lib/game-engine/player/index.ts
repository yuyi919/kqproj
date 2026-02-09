/**
 * 魔女审判游戏引擎 - 玩家系统
 * 负责玩家状态管理、魔女化判定、死亡处理
 */

import {
  Player,
  PlayerStatus,
  PublicPlayerInfo,
  DeathCause,
  DeathRecord,
  Card,
  CardType,
} from '../types';

/**
 * 转换玩家状态为公开状态
 * 魔女化状态对外显示为存活（ALIVE）
 */
function toPublicStatus(status: PlayerStatus): PlayerStatus {
  if (status === PlayerStatus.WITCH) {
    return PlayerStatus.ALIVE;
  }
  return status;
}

// ==================== 玩家工厂 ====================

/**
 * 创建新玩家
 */
export function createPlayer(
  userId: string,
  seatNumber: number,
  initialCards: Card[] = [],
): Player {
  const witchKillerHolder = initialCards.some(c => c.type === CardType.WITCH_KILLER);
  
  return {
    id: userId,
    seatNumber,
    status: PlayerStatus.ALIVE,
    hand: initialCards,
    maxHandSize: 4, // 手牌上限为4张
    isWitch: false,
    witchKillerHolder,
    lastKillRound: 0,
    consecutiveNoKillRounds: 0,
    hasBarrier: false,
  };
}

// ==================== 玩家状态管理 ====================

/**
 * 获取玩家公开信息
 * 
 * 保密信息（不公开）：
 * - 手牌数量和内容
 * - 结界状态
 * - 魔女化状态（显示为ALIVE）
 * - 死法详情
 */
export function getPublicInfo(player: Player): PublicPlayerInfo {
  return {
    id: player.id,
    seatNumber: player.seatNumber,
    status: toPublicStatus(player.status),  // 魔女化显示为存活
    // 注意：handCount、hasBarrier、maxHandSize 都不公开
  };
}

/**
 * 检查玩家是否存活
 */
export function isAlive(player: Player): boolean {
  return player.status === PlayerStatus.ALIVE || player.status === PlayerStatus.WITCH;
}

/**
 * 检查玩家是否可以行动
 */
export function canAct(player: Player, isImprisoned: boolean = false): boolean {
  if (!isAlive(player)) return false;
  if (isImprisoned) return false;  // 被监禁者无法使用手牌
  return true;
}

// ==================== 魔女化系统 ====================

/**
 * 使玩家魔女化
 * @returns 是否成功魔女化（如果已经是魔女则返回false）
 */
export function transformToWitch(player: Player): boolean {
  if (player.isWitch) return false;
  
  player.isWitch = true;
  if (player.status === PlayerStatus.ALIVE) {
    player.status = PlayerStatus.WITCH;
  }
  return true;
}

/**
 * 更新魔女化状态（连续击杀检查）
 * @param currentRound 当前回合
 * @returns 是否需要残骸化
 */
export function updateWitchStatus(player: Player, currentRound: number): boolean {
  if (!player.isWitch) return false;
  
  // 检查连续未击杀回合
  if (player.lastKillRound > 0) {
    const roundsSinceLastKill = currentRound - player.lastKillRound;
    player.consecutiveNoKillRounds = roundsSinceLastKill;
    
    // 连续2夜未击杀则残骸化
    if (roundsSinceLastKill >= 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * 记录击杀
 */
export function recordKill(player: Player, round: number): void {
  player.lastKillRound = round;
  player.consecutiveNoKillRounds = 0;
}

// ==================== 死亡系统 ====================

/**
 * 击杀玩家
 */
export function killPlayer(
  player: Player,
  cause: DeathCause,
  round: number,
  killerId?: string,
): DeathRecord {
  // 标记死亡
  player.status = PlayerStatus.DEAD;
  player.deathRound = round;
  player.deathCause = cause;
  player.killerId = killerId;
  
  // 清除防御状态
  player.hasBarrier = false;
  player.barrierSource = undefined;
  
  // 收集遗落的手牌
  const droppedCards = [...player.hand];
  player.hand = [];
  
  // 清除魔女杀手持有者状态
  if (player.witchKillerHolder) {
    player.witchKillerHolder = false;
  }
  
  return {
    round,
    playerId: player.id,
    cause,
    killerId,
    droppedCards,
  };
}

/**
 * 残骸化死亡
 */
export function transformToWreck(player: Player, round: number): DeathRecord {
  player.status = PlayerStatus.WRECK;
  player.deathRound = round;
  player.deathCause = DeathCause.WRECK;
  
  // 收集遗落的手牌
  const droppedCards = [...player.hand];
  player.hand = [];
  
  // 魔女杀手随机转移的逻辑由游戏引擎处理
  
  return {
    round,
    playerId: player.id,
    cause: DeathCause.WRECK,
    droppedCards,
  };
}

// ==================== 防御系统 ====================

/**
 * 设置结界
 */
export function setBarrier(player: Player, sourceId?: string): void {
  player.hasBarrier = true;
  player.barrierSource = sourceId;
}

/**
 * 清除结界
 */
export function clearBarrier(player: Player): void {
  player.hasBarrier = false;
  player.barrierSource = undefined;
}

/**
 * 检查是否成功防御攻击
 */
export function tryDefendWithBarrier(player: Player): boolean {
  if (player.hasBarrier) {
    clearBarrier(player);
    return true;
  }
  return false;
}

// ==================== 魔女杀手系统 ====================

/**
 * 转移魔女杀手
 */
export function transferWitchKiller(from: Player, to: Player, card: Card): void {
  if (card.type !== CardType.WITCH_KILLER) {
    throw new Error('只能转移魔女杀手');
  }
  
  // 从原持有者移除
  from.witchKillerHolder = false;
  const index = from.hand.findIndex(c => c.id === card.id);
  if (index !== -1) {
    from.hand.splice(index, 1);
  }
  
  // 给新持有者
  to.witchKillerHolder = true;
  to.hand.push(card);
  
  // 新持有者魔女化
  transformToWitch(to);
}

/**
 * 随机转移魔女杀手给存活玩家
 * @returns 接收者ID，如果没有存活玩家则返回null
 */
export function randomTransferWitchKiller(
  card: Card,
  alivePlayers: Player[],
): Player | null {
  if (alivePlayers.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * alivePlayers.length);
  const receiver = alivePlayers[randomIndex];
  
  receiver.witchKillerHolder = true;
  receiver.hand.push(card);
  transformToWitch(receiver);
  
  return receiver;
}

// ==================== 手牌管理 ====================

/**
 * 添加手牌
 */
export function addCards(player: Player, cards: Card | Card[]): void {
  const cardsToAdd = Array.isArray(cards) ? cards : [cards];
  player.hand.push(...cardsToAdd);
}

/**
 * 移除手牌
 */
export function removeCard(player: Player, cardId: string): Card | null {
  const index = player.hand.findIndex(c => c.id === cardId);
  if (index === -1) return null;
  
  const [removed] = player.hand.splice(index, 1);
  
  // 如果移除的是魔女杀手，更新持有者状态
  if (removed.type === CardType.WITCH_KILLER) {
    player.witchKillerHolder = false;
  }
  
  return removed;
}

/**
 * 获取手牌数量
 */
export function getHandCount(player: Player): number {
  return player.hand.length;
}

/**
 * 检查手牌是否已满
 */
export function isHandFull(player: Player): boolean {
  return player.hand.length >= player.maxHandSize;
}

// ==================== 玩家列表操作 ====================

/**
 * 获取存活玩家
 */
export function getAlivePlayers(players: Map<string, Player>): Player[] {
  return Array.from(players.values()).filter(p => isAlive(p));
}

/**
 * 获取存活玩家ID列表
 */
export function getAlivePlayerIds(players: Map<string, Player>): string[] {
  return getAlivePlayers(players).map(p => p.id);
}

/**
 * 获取可行动的玩家（存活且未被监禁）
 */
export function getActionablePlayers(
  players: Map<string, Player>,
  imprisonedId?: string | null,
): Player[] {
  return getAlivePlayers(players).filter(p => p.id !== imprisonedId);
}

/**
 * 按座位号排序玩家
 */
export function sortPlayersBySeat(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.seatNumber - b.seatNumber);
}

/**
 * 检查游戏是否应该结束
 * @returns 胜利者ID，如果无人生还返回null，如果游戏继续返回undefined
 */
export function checkWinCondition(players: Map<string, Player>): string | null | undefined {
  const alivePlayers = getAlivePlayers(players);
  
  // 只剩1人存活，游戏结束
  if (alivePlayers.length === 1) {
    return alivePlayers[0].id;
  }
  
  // 无人生还
  if (alivePlayers.length === 0) {
    return null;
  }
  
  // 游戏继续
  return undefined;
}
