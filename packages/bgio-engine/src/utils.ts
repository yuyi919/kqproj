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

// Mutations
export { Mutations } from "./domain/commands";

// Selectors
export { Selectors } from "./domain/queries";
// Refinements
export { Refinements } from "./domain/refinements";
// Card Service
export {
  createCard,
  createDeck,
  getAllCardTypes,
  getCardDefinition,
  getCardDefinitionByType,
  getCardIcon,
  getCardTypeDescription,
  getCardTypeName,
  isAttackCard,
  isDefenseCard,
  isIntelligenceCard,
} from "./domain/services/cardService";
// TMessageBuilder
export { TMessageBuilder } from "./domain/services/messageBuilder";
// Game Config
export {
  EIGHT_PLAYER_CONFIG,
  NINE_PLAYER_CONFIG,
  SEVEN_PLAYER_CONFIG,
} from "./types";

// UI Formatters
export {
  formatAlivePlayerList,
  formatDuration,
  formatRelativeTime,
  formatVoteSummary,
  getCardIcon as formatCardIcon,
  getCardTypeDescription as formatCardTypeDescription,
  getCardTypeName as formatCardTypeName,
  getDeathCauseName,
  getPhaseColor,
  getPhaseDescription,
  getPhaseName,
  getPlayerStatusColor,
  getPlayerStatusName,
} from "./ui/formatters";
