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
  /** 卡牌描述文本 */
  description: string;
  /** 卡牌图标 (Emoji) */
  icon: string;
  /** 是否为消耗品（使用后是否消失） */
  consumable: boolean;
  /** 行动优先级，数值越大优先级越高 */
  priority: number;
}

/**
 * 卡牌池配置
 */
export interface CardPoolConfig {
  /** 魔女杀手卡牌初始数量 */
  witch_killer: number;
  /** 结界魔法卡牌初始数量 */
  barrier: number;
  /** 杀人魔法卡牌初始数量 */
  kill: number;
  /** 探知魔法卡牌初始数量 */
  detect: number;
  /** 检定魔法卡牌初始数量 */
  check: number;
}

// ==================== 玩家相关（原子状态）====================

/**
 * 玩家公开信息（所有人可见）
 * witch 显示为 alive, wreck 显示为 dead
 */
export interface PublicPlayerInfo {
  id: string;
  /** 座位编号，从0开始 */
  seatNumber: number;
  /** 公开状态，仅显示存活或死亡 */
  status: PublicPlayerStatus;
}

/**
 * 玩家私有信息（仅自己可见）
 * 包含完整状态（包括 witch/wreck）和手牌等秘密信息
 */
export interface PrivatePlayerInfo {
  /** 实际内部状态，包括魔女(witch)和残骸(wreck) */
  status: PlayerStatus;
  /** 玩家当前手牌列表 */
  hand: CardRef[];
  /** 玩家是否已魔女化 */
  isWitch: boolean;
  /** 玩家本回合是否开启了结界防护 */
  hasBarrier: boolean;
  /** 玩家是否持有魔女杀手卡牌 */
  witchKillerHolder: boolean;
  /** 上次进行击杀行动的回合数 */
  lastKillRound: number;
  /** 连续未击杀的回合数，达到2次将残骸化 */
  consecutiveNoKillRounds: number;
  /** 玩家已获悉的所有揭示信息 */
  revealedInfo: RevealedInfoItem[];
  /** 玩家死亡的原因 */
  deathCause?: DeathCause;
  /** 击杀该玩家的玩家ID */
  killerId?: string;
}

// ==================== 揭示信息 ====================

/**
 * 揭示的信息项
 */
export interface RevealedInfoItem {
  /** 信息类型 */
  type: RevealedInfoType;
  /** 信息具体内容（根据类型变化） */
  content: unknown;
  /** 信息产生的时间戳 */
  timestamp: number;
}

// ==================== 行动相关 ====================

/**
 * 玩家行动
 */
export interface PlayerAction {
  id: string;
  /** 发起行动的玩家ID */
  playerId: string;
  /** 行动类型 */
  type: ActionType;
  /** 行动发生的合回 */
  round: number;
  /** 行动发生的阶段 */
  phase: GamePhase;
  /** 使用的卡牌ID */
  cardId?: string;
  /** 使用的卡牌类型 */
  cardType?: CardType;
  /** 行动目标玩家的ID */
  targetId?: string;
  /** 行动发生的时间戳 */
  timestamp: number;
}

/**
 * 投票记录
 */
export interface Vote {
  /** 投票者ID */
  voterId: string;
  /** 被投票者ID */
  targetId: string;
  /** 投票发生的合回 */
  round: number;
  /** 投票发生的时间戳 */
  timestamp: number;
}

/**
 * 夜间行动记录
 */
export interface NightAction {
  id: string;
  /** 行动玩家ID */
  playerId: string;
  /** 使用的卡牌（null 表示弃权） */
  card: CardRef | null;
  /** 目标玩家ID（可选） */
  targetId?: string;
  /** 行动产生的时间戳 */
  timestamp: number;
}

// ==================== 死亡记录 ====================

/**
 * 死亡记录（服务器端完整信息）
 */
export interface DeathRecord {
  /** 死亡发生的合回 */
  round: number;
  /** 死亡玩家ID */
  playerId: string;
  /** 死亡原因 */
  cause: DeathCause;
  /** 凶手玩家ID（如有） */
  killerId?: string;
  /** 该玩家死亡时掉落的卡牌列表 */
  droppedCards: CardRef[];
  /** 卡牌被其他玩家拾取的情况记录 */
  cardReceivers?: Record<string, CardRef[]>;
}

/**
 * 公开死亡信息（玩家可见）
 */
export interface PublicDeathInfo {
  /** 死亡发生的合回 */
  round: number;
  /** 死亡玩家ID */
  playerId: string;
  /** 是否已死亡（固定为true） */
  died: true;
}

// ==================== 消息系统（DDD + CQRS）===================

/**
 * 投票结果
 */
export interface VoteResult {
  /** 投票所属的回合 */
  round: number;
  /** 投票详情：被投票者ID -> 投票给他的玩家ID列表 */
  votes: Record<string, string[]>;
  /** 最终被监禁的玩家ID */
  imprisonedId: string | null;
  /** 本次投票是否出现平票 */
  isTie: boolean;
  /** 投票数统计：玩家ID -> 得票数 */
  voteCounts: Record<string, number>;
}

// ==================== 游戏配置 ====================

/**
 * 游戏配置
 */
export interface GameConfig {
  /** 最大玩家数量 */
  maxPlayers: number;
  /** 最大游戏回合数 */
  maxRounds: number;
  /** 日间阶段持续时间（秒） */
  dayDuration: number;
  /** 夜间阶段持续时间（秒） */
  nightDuration: number;
  /** 投票阶段持续时间（秒） */
  votingDuration: number;
  /** 卡牌池初始配置 */
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
  /** 房间ID */
  roomId: string;
  /** 当前游戏阶段 */
  status: GamePhase;
  /** 当前游戏回合 */
  round: number;

  // === 玩家（公开信息 - 所有人可见）===
  /** 玩家公开信息映射：玩家ID -> 公开信息 */
  players: Record<string, PublicPlayerInfo>;
  /** 玩家座位顺序列表 */
  playerOrder: string[];

  // === 卡牌系统（原子 - 最小化存储）===
  /** 牌堆中剩余的卡牌列表 */
  deck: CardRef[];
  /** 弃牌堆中的卡牌列表 */
  discardPile: CardRef[];

  // === 当前回合行动（原子）===
  /** 当前正在进行的玩家行动记录：玩家ID -> 行动 */
  currentActions: Record<string, PlayerAction>;
  /** 当前投票阶段已收到的投票记录 */
  currentVotes: Vote[];
  /** 夜间阶段已排队的行动列表 */
  nightActions: NightAction[];

  // === 历史记录（原子）===
  /** 游戏至今的所有玩家行动记录 */
  actionHistory: PlayerAction[];
  /** 游戏至今的所有投票结果记录 */
  voteHistory: VoteResult[];
  /** 游戏至今的所有死亡记录 */
  deathLog: DeathRecord[];

  // === 回合临时状态（原子）===
  /** 本回合被监禁的玩家ID */
  imprisonedId: string | null;
  /** 攻击配额管理 */
  attackQuota: {
    /** 魔女杀手是否已被使用 */
    witchKillerUsed: boolean;
    /** 本回合杀人魔法已使用的次数 */
    killMagicUsed: number;
  };

  // === 配置和时间戳（原子）===
  /** 当前游戏配置 */
  config: GameConfig;
  /** 当前阶段开始的时间戳 */
  phaseStartTime: number;
  /** 当前阶段结束的时间戳 */
  phaseEndTime: number;

  // === 秘密信息（会被 playerView 过滤）===
  /** 玩家私有信息映射：玩家ID -> 私有信息 */
  secrets: Record<string, PrivatePlayerInfo>;

  // === 聊天消息（公开）===
  /** 历史聊天消息列表 */
  chatMessages: TMessage[];
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

// ==================== 消息系统（DDD + CQRS）===================

/**
 * 基础消息接口
 */
interface BaseMessage {
  id: string;
  timestamp: number;
}

/**
 * 消息种类：基于业务概念分类
 */
export type TMessage =
  | AnnouncementMessage
  | PublicActionMessage
  | PrivateActionMessage
  | WitnessedActionMessage;

// ==================== 1. 公告（公开）===================
/**
 * 系统公告，对所有玩家公开
 */
type AnnouncementMessage =
  | PhaseTransitionAnnouncement
  | VoteSummaryAnnouncement
  | DeathListAnnouncement
  | SystemAnnouncement;

interface PhaseTransitionAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "phase_transition";
  from: GamePhase;
  to: GamePhase;
}

interface VoteSummaryAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "vote_summary";
  votes: Array<{ voterId: string; targetId: string }>;
  imprisonedId: string | null;
  isTie: boolean;
}

interface DeathListAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "death_list";
  deathIds: string[];
}

/**
 * 通用系统公告（携带格式化文本）
 * 用于无法用结构化数据表示的公告
 */
interface SystemAnnouncement extends BaseMessage {
  kind: "announcement";
  type: "system";
  content: string;
}

// ==================== 2. 公开行动 ====================
/**
 * 玩家执行的、对所有人公开的行动
 */
type PublicActionMessage =
  | VoteAction
  | PassAction
  | SayAction;

interface VoteAction extends BaseMessage {
  kind: "public_action";
  type: "vote";
  actorId: string;
  targetId: string;
}

interface PassAction extends BaseMessage {
  kind: "public_action";
  type: "pass";
  actorId: string;
}

interface SayAction extends BaseMessage {
  kind: "public_action";
  type: "say";
  actorId: string;
  content: string;
}

// ==================== 3. 私密行动（仅执行者可见）===================
/**
 * 玩家执行的、仅自己知道的行动
 */
type PrivateActionMessage =
  | UseCardAction
  | AttackResultAction
  | TransformWitchAction
  | WreckAction
  | BarrierAppliedAction
  | CheckResultAction
  | DetectResultAction;

interface UseCardAction extends BaseMessage {
  kind: "private_action";
  type: "use_card";
  actorId: string;
  cardType: CardType;
  targetId?: string;
}

interface AttackResultAction extends BaseMessage {
  kind: "private_action";
  type: "attack_result";
  actorId: string;
  targetId: string;
  cardType: CardType;
  result: "success" | "fail";
  failReason?: "barrier_protected" | "target_already_dead";
}

interface TransformWitchAction extends BaseMessage {
  kind: "private_action";
  type: "transform_witch";
  actorId: string;
}

interface WreckAction extends BaseMessage {
  kind: "private_action";
  type: "wreck";
  actorId: string;
}

interface BarrierAppliedAction extends BaseMessage {
  kind: "private_action";
  type: "barrier_applied";
  actorId: string;
  attackerId?: string;
}

interface CheckResultAction extends BaseMessage {
  kind: "private_action";
  type: "check_result";
  actorId: string;
  targetId: string;
  isWitchKiller: boolean;
  deathCause: DeathCause;
}

interface DetectResultAction extends BaseMessage {
  kind: "private_action";
  type: "detect_result";
  actorId: string;
  targetId: string;
  handCount: number;
  seenCard?: CardType;
}

// ==================== 4. 见证行动（actor + target 可见）===================
/**
 * 涉及两个玩家，双方都知情的行动
 */
type WitnessedActionMessage = CardReceivedAction;

interface CardReceivedAction extends BaseMessage {
  kind: "witnessed_action";
  type: "card_received";
  actorId: string; // 接收者
  targetId: string; // 受害者
  receivedCards: CardRef[];
}
