/**
 * 魔女审判游戏引擎 - 类型定义
 * 包含游戏所有核心类型、接口和枚举
 */

// ==================== 基础枚举 ====================

/**
 * 游戏阶段
 */
export enum GamePhase {
  // 准备阶段
  LOBBY = 'lobby',           // 等待玩家加入
  SETUP = 'setup',           // 游戏初始化
  
  // 白天阶段
  MORNING = 'morning',       // 晨间（公布死亡信息）
  DAY = 'day',               // 日间（讨论、交易）
  
  // 夜晚阶段
  NIGHT = 'night',           // 夜间（行动阶段）
  VOTING = 'voting',         // 监禁投票
  
  // 结算阶段
  RESOLUTION = 'resolution', // 行动结算
  
  // 结束阶段
  ENDED = 'ended',           // 游戏结束
}

/**
 * 玩家状态
 */
export enum PlayerStatus {
  ALIVE = 'alive',           // 存活
  DEAD = 'dead',             // 死亡
  WITCH = 'witch',           // 魔女化（存活的一种状态）
  WRECK = 'wreck',           // 残骸化（死亡的一种状态）
}

/**
 * 死因类型
 */
export enum DeathCause {
  WITCH_KILLER = 'witch_killer',  // 被魔女杀手击杀
  KILL_MAGIC = 'kill_magic',      // 被杀人魔法击杀
  WRECK = 'wreck',                // 残骸化死亡
}

/**
 * 卡牌类型
 */
export enum CardType {
  WITCH_KILLER = 'witch_killer',  // 魔女杀手
  BARRIER = 'barrier',            // 结界魔法
  KILL = 'kill',                  // 杀人魔法
  DETECT = 'detect',              // 探知魔法
  CHECK = 'check',                // 检定魔法
}

/**
 * 行动类型
 */
export enum ActionType {
  USE_CARD = 'use_card',          // 使用卡牌
  VOTE = 'vote',                  // 投票
  PASS = 'pass',                  // 放弃行动
}

// ==================== 卡牌相关 ====================

/**
 * 卡牌定义
 */
export interface Card {
  id: string;                     // 唯一ID
  type: CardType;                 // 卡牌类型
  name: string;                   // 显示名称
  description: string;            // 描述
  consumable: boolean;            // 是否消耗
  priority: number;               // 优先级（越高越先执行）
}

/**
 * 卡牌使用记录
 */
export interface CardUsage {
  cardId: string;
  cardType: CardType;
  targetId?: string;              // 目标玩家ID
  timestamp: number;
}

/**
 * 卡牌配置（用于初始化牌池）
 */
export interface CardPoolConfig {
  [CardType.WITCH_KILLER]: number;
  [CardType.BARRIER]: number;
  [CardType.KILL]: number;
  [CardType.DETECT]: number;
  [CardType.CHECK]: number;
}

// ==================== 玩家相关 ====================

/**
 * 玩家游戏内数据
 */
export interface Player {
  id: string;                     // 用户ID
  seatNumber: number;             // 座位号
  status: PlayerStatus;
  hand: Card[];                   // 手牌
  maxHandSize: number;            // 手牌上限（默认4）
  
  // 魔女化相关
  isWitch: boolean;               // 是否魔女化
  witchKillerHolder: boolean;     // 是否持有魔女杀手
  lastKillRound: number;          // 上次击杀的回合（0表示从未）
  consecutiveNoKillRounds: number; // 连续未击杀回合数
  
  // 防御相关
  hasBarrier: boolean;            // 是否有结界
  barrierSource?: string;         // 结界来源（玩家ID）
  
  // 死亡信息
  deathRound?: number;
  deathCause?: DeathCause;
  killerId?: string;              // 击杀者ID
}

/**
 * 玩家公开信息（其他玩家可见）
 * 
 * 保密信息（不公开）：
 * - 手牌数量和内容
 * - 结界状态（只有自己知道是否有结界）
 * - 魔女化状态（显示为存活）
 * - 死法（需要通过检定魔法才能知道）
 */
export interface PublicPlayerInfo {
  id: string;
  seatNumber: number;
  status: PlayerStatus;           // 存活/死亡/残骸化（魔女化显示为ALIVE）
}

/**
 * 卡牌公开信息（不含内部ID等敏感信息）
 */
export interface PublicCardInfo {
  type: CardType;
  name: string;
  description: string;
  consumable: boolean;
}

/**
 * 玩家完整信息（仅玩家自己可见）
 */
export interface PrivatePlayerInfo {
  id: string;
  seatNumber: number;
  status: PlayerStatus;
  hand: PublicCardInfo[];         // 完整手牌信息
  maxHandSize: number;
  isWitch: boolean;               // 魔女化状态（仅自己可见）
  witchKillerHolder: boolean;     // 是否持有魔女杀手
  lastKillRound: number;
  consecutiveNoKillRounds: number;
  hasBarrier: boolean;
  deathRound?: number;
  deathCause?: DeathCause;
  killerId?: string;
}

// ==================== 行动相关 ====================

/**
 * 玩家行动
 */
export interface PlayerAction {
  id: string;                     // 行动唯一ID
  playerId: string;               // 行动玩家
  type: ActionType;
  round: number;                  // 回合数
  phase: GamePhase;
  
  // 使用卡牌
  cardId?: string;
  cardType?: CardType;
  targetId?: string;              // 目标玩家
  
  // 投票
  voteTargetId?: string;
  
  timestamp: number;
}

/**
 * 行动结果
 */
export interface ActionResult {
  actionId: string;
  success: boolean;
  message: string;
  revealedInfo?: RevealedInfo[];  // 揭示的信息
}

/**
 * 揭示的信息
 */
export interface RevealedInfo {
  playerId: string;               // 信息接收者
  type: 'detect' | 'check' | 'death' | 'barrier' | 'attack_failed' | 'card_received';
  content: unknown;
}

// ==================== 公开状态（客户端可见） ====================

/**
 * 游戏公开配置
 */
export interface PublicGameConfig {
  maxPlayers: number;
  maxRounds: number;
  dayDuration: number;
  nightDuration: number;
  votingDuration: number;
}

/**
 * 游戏公开状态（发送给所有客户端）
 * 
 * 隐藏的敏感信息：
 * - 手牌数量和内容
 * - 结界状态
 * - 魔女化状态
 * - 牌堆剩余数量
 * - 攻击名额使用情况
 * - 死法详情（需要通过检定魔法）
 */
export interface PublicGameState {
  id: string;
  roomId: string;
  status: GamePhase;
  round: number;
  players: Record<string, PublicPlayerInfo>;  // 玩家ID -> 公开信息
  playerOrder: string[];
  deaths: PublicDeathInfo[];      // 公开死亡信息（不含死因）
  phaseStartTime: number;
  phaseEndTime: number;
  config: PublicGameConfig;
}

/**
 * 单个玩家的游戏视角状态
 * 包含该玩家的完整私有信息 + 其他玩家的公开信息
 */
export interface PlayerViewState {
  player: PrivatePlayerInfo;
  gameStatus: GamePhase;
  round: number;
  phaseEndTime: number;
  players: Record<string, PublicPlayerInfo>;  // 所有玩家的公开信息（包括自己）
  deaths: PublicDeathInfo[];      // 公开死亡信息
}

// ==================== 投票相关 ====================

/**
 * 投票记录
 */
export interface Vote {
  voterId: string;                // 投票者
  targetId: string;               // 被投票者
  round: number;
  timestamp: number;
}

/**
 * 投票结果
 */
export interface VoteResult {
  round: number;
  votes: Map<string, string[]>;   // 被投票者ID -> 投票者ID列表
  imprisonedId: string | null;    // 被监禁者（得票最高）
  isTie: boolean;                 // 是否平票
  voteCounts: Map<string, number>; // 被投票者ID -> 票数
}

// ==================== 游戏状态 ====================

/**
 * 游戏配置
 */
export interface GameConfig {
  maxPlayers: number;             // 最大玩家数（推荐7-9人）
  maxRounds: number;              // 最大回合数（默认7日）
  dayDuration: number;            // 白天阶段时长（秒）
  nightDuration: number;          // 夜间阶段时长（秒）
  votingDuration: number;         // 投票时长（秒）
  cardPool: CardPoolConfig;       // 牌池配置
}

/**
 * 游戏房间状态
 */
export interface GameState {
  // 基本信息
  id: string;                     // 游戏ID
  roomId: string;                 // 房间ID
  status: GamePhase;
  round: number;                  // 当前回合（第几天）
  
  // 玩家
  players: Map<string, Player>;   // 玩家ID -> 玩家数据
  playerOrder: string[];          // 玩家顺序（座位顺序）
  
  // 卡牌
  deck: Card[];                   // 牌堆
  discardPile: Card[];            // 弃牌堆
  
  // 当前回合数据
  currentActions: Map<string, PlayerAction>;  // 玩家ID -> 行动
  currentVotes: Vote[];           // 当前投票
  
  // 历史记录
  actionHistory: PlayerAction[];
  voteHistory: VoteResult[];
  deathLog: DeathRecord[];        // 死亡记录
  
  // 配置
  config: GameConfig;
  
  // 时间戳
  phaseStartTime: number;
  phaseEndTime: number;
  
  // 结算缓存（用于结算阶段）
  pendingResolutions?: PendingResolution[];
  
  // 攻击名额
  attackQuota: {
    witchKillerUsed: boolean;     // 魔女杀手是否已被使用
    killMagicUsed: number;        // 已使用的杀人魔法数量
  };
}

/**
 * 死亡记录（完整信息，仅服务器/GM可见）
 */
export interface DeathRecord {
  round: number;
  playerId: string;
  cause: DeathCause;              // 死因（魔女杀手/杀人魔法/残骸化）
  killerId?: string;              // 击杀者ID
  droppedCards: Card[];           // 遗落的手牌
  cardReceivers?: Map<string, Card[]>;  // 手牌分配记录
}

/**
 * 公开死亡信息（玩家可见）
 * 死因默认不公开，需要通过检定魔法才能知道
 */
export interface PublicDeathInfo {
  round: number;
  playerId: string;
  died: true;                     // 确认死亡
  // 注意：cause 和 killerId 不公开，需要通过检定魔法才能知道
}

/**
 * 待结算的行动
 */
export interface PendingResolution {
  action: PlayerAction;
  priority: number;
  resolved: boolean;
  result?: ActionResult;
}

// ==================== 游戏结果 ====================

/**
 * 游戏结果
 */
export interface GameResult {
  winnerId: string | null;        // 获胜者ID（null表示无人生还）
  survivors: string[];            // 幸存者列表
  roundsPlayed: number;           // 进行回合数
  deathLog: DeathRecord[];
  isEarlyEnd: boolean;            // 是否提前结束
}

// ==================== 事件 ====================

/**
 * 游戏事件类型
 */
export enum GameEventType {
  PHASE_CHANGE = 'phase_change',
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_DIE = 'player_die',
  CARD_USED = 'card_used',
  CARD_DRAWN = 'card_drawn',
  VOTE_CAST = 'vote_cast',
  VOTE_RESULT = 'vote_result',
  WITCH_TRANSFORM = 'witch_transform',
  WRECK_TRANSFORM = 'wreck_transform',
  GAME_END = 'game_end',
}

/**
 * 游戏事件
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: unknown;
}

// ==================== 游戏错误 ====================

export enum GameErrorCode {
  INVALID_ACTION = 'invalid_action',
  INVALID_PHASE = 'invalid_phase',
  INVALID_TARGET = 'invalid_target',
  CARD_NOT_FOUND = 'card_not_found',
  CARD_NOT_USABLE = 'card_not_usable',
  ATTACK_QUOTA_FULL = 'attack_quota_full',
  PLAYER_ALREADY_DEAD = 'player_already_dead',
  WITCH_KILLER_ONLY = 'witch_killer_only',
  ALREADY_VOTED = 'already_voted',
  NOT_WITCH_KILLER_HOLDER = 'not_witch_killer_holder',
}

export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// ==================== 推荐配置 ====================

/**
 * 七人局推荐配置
 */
export const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    [CardType.WITCH_KILLER]: 1,
    [CardType.BARRIER]: 15,
    [CardType.DETECT]: 5,
    [CardType.CHECK]: 4,
    [CardType.KILL]: 3,
  },
};

/**
 * 八人局推荐配置
 */
export const EIGHT_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 8,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    [CardType.WITCH_KILLER]: 1,
    [CardType.BARRIER]: 18,
    [CardType.DETECT]: 5,
    [CardType.CHECK]: 4,
    [CardType.KILL]: 4,
  },
};

/**
 * 九人局推荐配置
 */
export const NINE_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 9,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    [CardType.WITCH_KILLER]: 1,
    [CardType.BARRIER]: 20,
    [CardType.DETECT]: 6,
    [CardType.CHECK]: 4,
    [CardType.KILL]: 5,
  },
};
