"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 类型定义
 *
 * 设计原则：
 * 1. 分离原子状态和计算状态 - 计算状态通过工具函数计算
 * 2. 可见性分层 - 公开信息 vs 私有信息
 * 3. 无冗余字段 - 不使用别名
 * 4. JSON 可序列化 - 符合 boardgame.io 要求
 */

// ==================== 基础类型（字符串字面量）====================

/** 游戏阶段 */
export type GamePhase =
  | "lobby"
  | "setup"
  | "morning"
  | "day"
  | "night"
  | "voting"
  | "resolution"
  | "ended";

/** 玩家状态（内部完整状态） */
export type PlayerStatus = "alive" | "dead" | "witch" | "wreck";

/** 玩家公开状态（仅 alive/dead，witch 显示为 alive，wreck 显示为 dead） */
export type PublicPlayerStatus = "alive" | "dead";

/** 死因类型 */
export type DeathCause = "witch_killer" | "kill_magic" | "wreck";

/** 卡牌类型 */
export type CardType = "witch_killer" | "barrier" | "kill" | "detect" | "check";

/** 行动类型 */
export type ActionType = "use_card" | "vote" | "pass";

/** 揭示信息类型 */
export type RevealedInfoType =
  | "detect"
  | "check"
  | "death"
  | "barrier"
  | "attack_failed"
  | "card_received"
  | "witch_transform";

// ==================== 卡牌相关 ====================

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
  description: string;
  consumable: boolean;
  priority: number;
}

/**
 * 卡牌池配置
 */
export interface CardPoolConfig {
  witch_killer: number;
  barrier: number;
  kill: number;
  detect: number;
  check: number;
}

// ==================== 玩家相关（原子状态）====================

/**
 * 玩家公开信息（所有人可见）
 * witch 显示为 alive, wreck 显示为 dead
 */
export interface PublicPlayerInfo {
  id: string;
  seatNumber: number;
  status: PublicPlayerStatus;
}

/**
 * 玩家私有信息（仅自己可见）
 * 包含完整状态（包括 witch/wreck）和手牌等秘密信息
 */
export interface PrivatePlayerInfo {
  status: PlayerStatus;
  hand: CardRef[];
  isWitch: boolean;
  hasBarrier: boolean;
  witchKillerHolder: boolean;
  lastKillRound: number;
  consecutiveNoKillRounds: number;
  revealedInfo: RevealedInfoItem[];
  deathCause?: DeathCause;
  killerId?: string;
}

// ==================== 揭示信息 ====================

/**
 * 揭示的信息项
 */
export interface RevealedInfoItem {
  type: RevealedInfoType;
  content: unknown;
  timestamp: number;
}

// ==================== 行动相关 ====================

/**
 * 玩家行动
 */
export interface PlayerAction {
  id: string;
  playerId: string;
  type: ActionType;
  round: number;
  phase: GamePhase;
  cardId?: string;
  cardType?: CardType;
  targetId?: string;
  timestamp: number;
}

/**
 * 投票记录
 */
export interface Vote {
  voterId: string;
  targetId: string;
  round: number;
  timestamp: number;
}

/**
 * 夜间行动记录
 */
export interface NightAction {
  id: string;
  playerId: string;
  cardId: string;
  cardType: CardType;
  targetId?: string;
  timestamp: number;
}

// ==================== 死亡记录 ====================

/**
 * 死亡记录（服务器端完整信息）
 */
export interface DeathRecord {
  round: number;
  playerId: string;
  cause: DeathCause;
  killerId?: string;
  droppedCards: CardRef[];
  cardReceivers?: Record<string, CardRef[]>;
}

/**
 * 公开死亡信息（玩家可见）
 */
export interface PublicDeathInfo {
  round: number;
  playerId: string;
  died: true;
}

// ==================== 聊天消息 ====================

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  type: "say" | "action";
  playerId: string;
  playerName?: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

// ==================== 投票结果 ====================

/**
 * 投票结果
 */
export interface VoteResult {
  round: number;
  votes: Record<string, string[]>;
  imprisonedId: string | null;
  isTie: boolean;
  voteCounts: Record<string, number>;
}

// ==================== 游戏配置 ====================

/**
 * 游戏配置
 */
export interface GameConfig {
  maxPlayers: number;
  maxRounds: number;
  dayDuration: number;
  nightDuration: number;
  votingDuration: number;
  cardPool: CardPoolConfig;
}

// ==================== 原子游戏状态（最小存储）====================

/**
 * boardgame.io 游戏状态 (G)
 * 只包含原子状态，所有可计算状态通过工具函数计算
 */
export interface BGGameState {
  // === 基本信息（原子）===
  id: string;
  roomId: string;
  status: GamePhase;
  round: number;

  // === 玩家（公开信息 - 所有人可见）===
  players: Record<string, PublicPlayerInfo>;
  playerOrder: string[];

  // === 卡牌系统（原子 - 最小化存储）===
  deck: CardRef[];
  discardPile: CardRef[];

  // === 当前回合行动（原子）===
  currentActions: Record<string, PlayerAction>;
  currentVotes: Vote[];
  nightActions: NightAction[];

  // === 历史记录（原子）===
  actionHistory: PlayerAction[];
  voteHistory: VoteResult[];
  deathLog: DeathRecord[];

  // === 回合临时状态（原子）===
  imprisonedId: string | null;
  attackQuota: {
    witchKillerUsed: boolean;
    killMagicUsed: number;
  };

  // === 配置和时间戳（原子）===
  config: GameConfig;
  phaseStartTime: number;
  phaseEndTime: number;

  // === 秘密信息（会被 playerView 过滤）===
  secrets: Record<string, PrivatePlayerInfo>;

  // === 聊天消息（公开）===
  chatMessages: ChatMessage[];
}

// ==================== 移动函数上下文 ====================

/**
 * boardgame.io 移动函数上下文
 */
export interface MoveContext {
  G: BGGameState;
  ctx: {
    turn: number;
    currentPlayer: string;
    phase: string;
    numPlayers: number;
    playOrder: string[];
    playOrderPos: number;
  };
  playerID: string;
  events: {
    endTurn?: () => void;
    endPhase?: () => void;
    setPhase?: (phase: string) => void;
    setActivePlayers?: (arg: unknown) => void;
  };
  random: {
    Shuffle: <T>(deck: T[]) => T[];
    Number: () => number;
    D4: () => number;
    D6: () => number;
    D10: () => number;
    D20: () => number;
  };
}

export type MoveResult = BGGameState | void | "INVALID_MOVE";

// ==================== 推荐配置 ====================

export const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 15,
    kill: 3,
    detect: 5,
    check: 4,
  },
};

export const EIGHT_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 8,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 18,
    kill: 4,
    detect: 5,
    check: 4,
  },
};

export const NINE_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 9,
  maxRounds: 7,
  dayDuration: 300,
  nightDuration: 60,
  votingDuration: 30,
  cardPool: {
    witch_killer: 1,
    barrier: 20,
    kill: 5,
    detect: 6,
    check: 4,
  },
};
