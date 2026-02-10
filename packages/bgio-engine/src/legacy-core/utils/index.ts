/**
 * 魔女审判游戏引擎 - 工具函数
 * 提供各种辅助函数
 */

import { CardType, GamePhase, PlayerStatus, DeathCause } from "../types";

// ==================== 卡牌相关工具 ====================

/**
 * 获取卡牌类型名称
 */
export function getCardTypeName(type: CardType): string {
  const names: Record<CardType, string> = {
    [CardType.WITCH_KILLER]: "魔女杀手",
    [CardType.BARRIER]: "结界魔法",
    [CardType.KILL]: "杀人魔法",
    [CardType.DETECT]: "探知魔法",
    [CardType.CHECK]: "检定魔法",
  };
  return names[type] || "未知卡牌";
}

/**
 * 获取卡牌类型描述
 */
export function getCardTypeDescription(type: CardType): string {
  const descriptions: Record<CardType, string> = {
    [CardType.WITCH_KILLER]: "对目标发动攻击（优先度最高），持有者魔女化",
    [CardType.BARRIER]: "保护自身当夜免受攻击",
    [CardType.KILL]: "对目标发动攻击，成功击杀后魔女化",
    [CardType.DETECT]: "探知目标手牌总数并随机获悉其中一张",
    [CardType.CHECK]: "查验已死亡玩家的死因",
  };
  return descriptions[type] || "";
}

/**
 * 获取卡牌图标（可用于UI）
 */
export function getCardIcon(type: CardType): string {
  const icons: Record<CardType, string> = {
    [CardType.WITCH_KILLER]: "⚔️",
    [CardType.BARRIER]: "🛡️",
    [CardType.KILL]: "🔪",
    [CardType.DETECT]: "🔍",
    [CardType.CHECK]: "🔬",
  };
  return icons[type] || "🃏";
}

// ==================== 游戏阶段工具 ====================

/**
 * 获取阶段名称
 */
export function getPhaseName(phase: GamePhase): string {
  const names: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: "等待加入",
    [GamePhase.SETUP]: "游戏准备",
    [GamePhase.MORNING]: "晨间",
    [GamePhase.DAY]: "日间",
    [GamePhase.NIGHT]: "夜间",
    [GamePhase.VOTING]: "投票",
    [GamePhase.RESOLUTION]: "结算",
    [GamePhase.ENDED]: "游戏结束",
  };
  return names[phase] || "未知阶段";
}

/**
 * 获取阶段描述
 */
export function getPhaseDescription(phase: GamePhase): string {
  const descriptions: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: "等待更多玩家加入游戏",
    [GamePhase.SETUP]: "正在初始化游戏...",
    [GamePhase.MORNING]: "公布夜间发生的死亡信息",
    [GamePhase.DAY]: "自由讨论和交易时间",
    [GamePhase.NIGHT]: "使用手牌进行暗中行动",
    [GamePhase.VOTING]: "投票决定监禁对象",
    [GamePhase.RESOLUTION]: "结算所有行动结果",
    [GamePhase.ENDED]: "游戏已结束",
  };
  return descriptions[phase] || "";
}

/**
 * 获取阶段颜色（用于 Ant Design Tag 等 UI 组件）
 */
export function getPhaseColor(phase: GamePhase): string {
  const colors: Record<GamePhase, string> = {
    [GamePhase.LOBBY]: "default",
    [GamePhase.SETUP]: "processing",
    [GamePhase.MORNING]: "orange",
    [GamePhase.DAY]: "blue",
    [GamePhase.NIGHT]: "purple",
    [GamePhase.VOTING]: "warning",
    [GamePhase.RESOLUTION]: "cyan",
    [GamePhase.ENDED]: "success",
  };
  return colors[phase] || "default";
}

/**
 * 检查阶段是否可以行动
 */
export function isActionPhase(phase: GamePhase): boolean {
  return phase === GamePhase.NIGHT || phase === GamePhase.VOTING;
}

/**
 * 检查阶段是否可以讨论
 */
export function isDiscussionPhase(phase: GamePhase): boolean {
  return phase === GamePhase.DAY || phase === GamePhase.MORNING;
}

// ==================== 玩家状态工具 ====================

/**
 * 获取玩家状态名称
 */
export function getPlayerStatusName(status: PlayerStatus): string {
  const names: Record<PlayerStatus, string> = {
    [PlayerStatus.ALIVE]: "存活",
    [PlayerStatus.DEAD]: "死亡",
    [PlayerStatus.WITCH]: "魔女化",
    [PlayerStatus.WRECK]: "残骸化",
  };
  return names[status] || "未知";
}

/**
 * 获取玩家状态颜色（可用于UI）
 */
export function getPlayerStatusColor(status: PlayerStatus): string {
  const colors: Record<PlayerStatus, string> = {
    [PlayerStatus.ALIVE]: "#52c41a", // 绿色
    [PlayerStatus.DEAD]: "#8c8c8c", // 灰色
    [PlayerStatus.WITCH]: "#722ed1", // 紫色
    [PlayerStatus.WRECK]: "#f5222d", // 红色
  };
  return colors[status] || "#000000";
}

// ==================== 死因工具 ====================

/**
 * 获取死因名称
 */
export function getDeathCauseName(cause: DeathCause): string {
  const names: Record<DeathCause, string> = {
    [DeathCause.WITCH_KILLER]: "被魔女杀手击杀",
    [DeathCause.KILL_MAGIC]: "被杀人魔法击杀",
    [DeathCause.WRECK]: "残骸化死亡",
  };
  return names[cause] || "未知死因";
}

/**
 * 获取死因描述
 */
export function getDeathCauseDescription(cause: DeathCause): string {
  const descriptions: Record<DeathCause, string> = {
    [DeathCause.WITCH_KILLER]: "被魔女杀手优先攻击致死",
    [DeathCause.KILL_MAGIC]: "被杀人魔法攻击致死，击杀者魔女化",
    [DeathCause.WRECK]: "连续2夜未击杀而残骸化死亡",
  };
  return descriptions[cause] || "";
}

// ==================== 时间工具 ====================

/**
 * 格式化时间（秒 -> 分:秒）
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 获取阶段剩余时间
 */
export function getPhaseRemainingTime(phaseEndTime: number): number {
  const remaining = phaseEndTime - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

// ==================== 游戏配置工具 ====================

/**
 * 根据人数获取推荐配置
 */
export function getRecommendedConfig(playerCount: number) {
  if (playerCount <= 7) {
    return {
      maxPlayers: 7,
      cardPool: {
        [CardType.WITCH_KILLER]: 1,
        [CardType.BARRIER]: 15,
        [CardType.DETECT]: 5,
        [CardType.CHECK]: 4,
        [CardType.KILL]: 3,
      },
    };
  } else if (playerCount === 8) {
    return {
      maxPlayers: 8,
      cardPool: {
        [CardType.WITCH_KILLER]: 1,
        [CardType.BARRIER]: 18,
        [CardType.DETECT]: 5,
        [CardType.CHECK]: 4,
        [CardType.KILL]: 4,
      },
    };
  } else {
    return {
      maxPlayers: 9,
      cardPool: {
        [CardType.WITCH_KILLER]: 1,
        [CardType.BARRIER]: 20,
        [CardType.DETECT]: 6,
        [CardType.CHECK]: 4,
        [CardType.KILL]: 5,
      },
    };
  }
}

// ==================== 验证工具 ====================

/**
 * 验证玩家数量是否合法
 */
export function isValidPlayerCount(count: number): boolean {
  return count >= 4 && count <= 12;
}

/**
 * 获取合法玩家数范围
 */
export function getValidPlayerCountRange(): { min: number; max: number } {
  return { min: 4, max: 12 };
}

// ==================== 随机工具 ====================

/**
 * 从数组中随机选择指定数量的元素
 */
export function randomSample<T>(array: T[], count: number): T[] {
  if (count >= array.length) return [...array];

  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 从数组中随机选择一个元素
 */
export function randomPick<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

// ==================== 数组工具 ====================

/**
 * 将Map转换为对象（用于序列化）
 */
export function mapToObject<K extends string | number | symbol, V>(
  map: Map<K, V>,
): Record<K, V> {
  const obj = {} as Record<K, V>;
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

/**
 * 将对象转换为Map
 */
export function objectToMap<K extends string | number | symbol, V>(
  obj: Record<K, V>,
): Map<K, V> {
  const map = new Map<K, V>();
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}

// ==================== ID生成 ====================

let idCounter = 0;

/**
 * 生成简单ID（用于测试）
 */
export function generateSimpleId(prefix: string = ""): string {
  return `${prefix}${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

// ==================== 深度克隆 ====================

/**
 * 深度克隆对象（简单实现）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj))
    return obj.map((item) => deepClone(item)) as unknown as T;

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
