"use client";

/**
 * 魔女审判游戏引擎 - 工具函数
 *
 * ⚠️ 此文件已重构为模块化结构 ⚠️
 *
 * 旧结构（已废弃）:
 * - Selectors - CQRS Query
 * - Mutations - CQRS Command
 * - TMessageBuilder - 消息构建器
 * - 卡牌工厂函数
 * - UI 格式化工具
 *
 * 新结构:
 * - src/domain/queries/index.ts - Selectors
 * - src/domain/commands/index.ts - Mutations
 * - src/domain/services/messageBuilder.ts - TMessageBuilder
 * - src/domain/services/cardService.ts - 卡牌工厂
 * - src/ui/formatters.ts - UI 格式化
 *
 * @deprecated 请使用相应的子模块
 */

// ==================== 重新导出（保持向后兼容）====================

// Game Config
export {
  SEVEN_PLAYER_CONFIG,
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
} from "./types";

// Selectors
export { Selectors } from "./domain/queries";

// Mutations
export { Mutations } from "./domain/commands";

// Refinements
export { Refinements } from "./domain/refinements";

// Card Service
export {
  createCard,
  getCardDefinition,
  getCardDefinitionByType,
  createDeck,
  getCardTypeName,
  getCardTypeDescription,
  getCardIcon,
  isAttackCard,
  isDefenseCard,
  isIntelligenceCard,
  getAllCardTypes,
} from "./domain/services/cardService";

// TMessageBuilder
export { TMessageBuilder } from "./domain/services/messageBuilder";

// UI Formatters
export {
  getCardTypeName as formatCardTypeName,
  getCardTypeDescription as formatCardTypeDescription,
  getCardIcon as formatCardIcon,
  getPhaseName,
  getPhaseDescription,
  getPhaseColor,
  getPlayerStatusName,
  getPlayerStatusColor,
  getDeathCauseName,
  formatDuration,
  formatRelativeTime,
  formatVoteSummary,
  formatAlivePlayerList,
} from "./ui/formatters";
