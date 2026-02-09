'use client';

/**
 * 魔女审判游戏引擎 - UI 展示组件
 * 
 * 通用的展示组件，用于显示游戏相关的视觉元素
 */

// 卡牌展示组件
export {
  CardDisplay,
  getCardIcon,
  getCardBgColor,
  getCardBorderColor,
} from './CardDisplay';
export type { CardDisplayProps } from './CardDisplay';

// 玩家状态图标组件
export { PlayerStatusIcon, getStatusIcon } from './PlayerStatusIcon';
export type { PlayerStatusIconProps } from './PlayerStatusIcon';

// 阶段徽章组件
export { PhaseBadge, getPhaseConfig } from './PhaseBadge';
export type { PhaseBadgeProps, PhaseConfig } from './PhaseBadge';

// 投票结果组件
export { VoteResults } from './VoteResults';
export type { VoteResultsProps } from './VoteResults';
