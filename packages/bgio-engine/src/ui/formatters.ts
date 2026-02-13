"use client";

/**
 * UI Formatters - UI 格式化工具
 *
 * 包含：
 * - 卡牌格式化（名称、描述、图标）
 * - 阶段格式化（名称、描述、颜色）
 * - 玩家状态格式化（名称、颜色）
 * - 死因格式化
 * - 时间格式化
 */

import { GamePhase } from "../types";
import type { CardType, PlayerStatus, DeathCause } from "../types";

// ==================== 卡牌格式化 ====================

const CARD_DEFINITIONS_UI: Record<
  CardType,
  { name: string; description: string; icon: string }
> = {
  witch_killer: {
    name: "魔女杀手",
    description: "对目标发动攻击（优先度最高），持有者魔女化",
    icon: "⚔️",
  },
  barrier: {
    name: "结界魔法",
    description: "保护自身当夜免受攻击",
    icon: "🛡️",
  },
  kill: {
    name: "杀人魔法",
    description: "对目标发动攻击，成功击杀后魔女化",
    icon: "🔪",
  },
  detect: {
    name: "探知魔法",
    description: "探知目标手牌总数并随机获悉其中一张",
    icon: "🔍",
  },
  check: {
    name: "检定魔法",
    description: "查验已死亡玩家的死因",
    icon: "🔬",
  },
};

/**
 * 获取卡牌名称
 */
export function getCardTypeName(type: CardType): string {
  return CARD_DEFINITIONS_UI[type]?.name || "未知卡牌";
}

/**
 * 获取卡牌描述
 */
export function getCardTypeDescription(type: CardType): string {
  return CARD_DEFINITIONS_UI[type]?.description || "";
}

/**
 * 获取卡牌图标
 */
export function getCardIcon(type: CardType): string {
  return CARD_DEFINITIONS_UI[type]?.icon || "🃏";
}

// ==================== 阶段格式化 ====================

const PHASE_DEFINITIONS: Record<
  GamePhase,
  { name: string; description: string; color: string }
> = {
  [GamePhase.LOBBY]: {
    name: "等待加入",
    description: "等待更多玩家加入游戏",
    color: "default",
  },
  [GamePhase.SETUP]: {
    name: "游戏准备",
    description: "正在初始化游戏...",
    color: "processing",
  },
  [GamePhase.MORNING]: {
    name: "晨间阶段",
    description: "公布夜间发生的死亡信息",
    color: "orange",
  },
  [GamePhase.DAY]: {
    name: "午间阶段",
    description: "自由讨论和交易时间",
    color: "blue",
  },
  [GamePhase.NIGHT]: {
    name: "夜间阶段",
    description: "投票决定监禁对象",
    color: "warning",
  },
  [GamePhase.DEEP_NIGHT]: {
    name: "深夜阶段",
    description: "使用手牌进行暗中行动",
    color: "purple",
  },
  [GamePhase.CARD_SELECTION]: {
    name: "卡牌选择",
    description: "选择击杀后获得的卡牌",
    color: "magenta",
  },
  [GamePhase.RESOLUTION]: {
    name: "行动结算",
    description: "结算所有行动结果",
    color: "cyan",
  },
  [GamePhase.ENDED]: {
    name: "游戏结束",
    description: "游戏已结束",
    color: "success",
  },
};

/**
 * 获取阶段名称
 */
export function getPhaseName(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.name || "未知阶段";
}

/**
 * 获取阶段描述
 */
export function getPhaseDescription(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.description || "";
}

/**
 * 获取阶段颜色
 */
export function getPhaseColor(phase: GamePhase): string {
  return PHASE_DEFINITIONS[phase]?.color || "default";
}

// ==================== 玩家状态格式化 ====================

const PLAYER_STATUS_DEFINITIONS: Record<
  PlayerStatus,
  { name: string; color: string }
> = {
  alive: { name: "存活", color: "#52c41a" },
  dead: { name: "死亡", color: "#8c8c8c" },
  witch: { name: "魔女化", color: "#722ed1" },
  wreck: { name: "残骸化", color: "#f5222d" },
};

/**
 * 获取玩家状态名称
 */
export function getPlayerStatusName(status: PlayerStatus): string {
  return PLAYER_STATUS_DEFINITIONS[status]?.name || "未知";
}

/**
 * 获取玩家状态颜色
 */
export function getPlayerStatusColor(status: PlayerStatus): string {
  return PLAYER_STATUS_DEFINITIONS[status]?.color || "#000000";
}

// ==================== 死因格式化 ====================

const DEATH_CAUSE_NAMES: Record<DeathCause, string> = {
  witch_killer: "被魔女杀手击杀",
  kill_magic: "被杀人魔法击杀",
  wreck: "残骸化死亡",
};

/**
 * 获取死因名称
 */
export function getDeathCauseName(cause: DeathCause): string {
  return DEATH_CAUSE_NAMES[cause] || "未知死因";
}

// ==================== 时间格式化 ====================

/**
 * 格式化时长（秒 -> MM:SS）
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 格式化时间戳（相对时间）
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return "刚刚";
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}分钟前`;
  } else {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
}

// ==================== 投票结果格式化 ====================

/**
 * 格式化投票结果摘要
 */
export function formatVoteSummary(
  voteCounts: Record<string, number>,
  players: Record<string, { seatNumber: number }>,
): string {
  return Object.entries(voteCounts)
    .map(([playerId, count]) => {
      const player = players[playerId];
      const label = player ? `玩家${player.seatNumber}` : playerId;
      return `${label}: ${count}票`;
    })
    .join(" | ");
}

/**
 * 格式化存活玩家列表
 */
export function formatAlivePlayerList(
  players: Array<{ id: string; seatNumber: number }>,
): string {
  return players.map((p) => `玩家${p.seatNumber}`).join(", ");
}
