"use client";

/**
 * 魔女审判游戏引擎 - UI 展示组件
 *
 * 通用的展示组件，用于显示游戏相关的视觉元素
 */

export type { CardDisplayProps } from "./CardDisplay";
// 卡牌展示组件
export {
  CardDisplay,
  getCardBgColor,
  getCardBorderColor,
  getCardIcon,
} from "./CardDisplay";
export type { PhaseBadgeProps, PhaseConfig } from "./PhaseBadge";
// 阶段徽章组件
export { getPhaseConfig, PhaseBadge } from "./PhaseBadge";
export type { PlayerStatusIconProps } from "./PlayerStatusIcon";
// 玩家状态图标组件
export { getStatusIcon, PlayerStatusIcon } from "./PlayerStatusIcon";
export type { VoteResultsProps } from "./VoteResults";
// 投票结果组件
export { VoteResults } from "./VoteResults";
