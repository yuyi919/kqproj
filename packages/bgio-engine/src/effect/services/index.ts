"use client";

/**
 * Effect-TS 服务层导出入口
 */

// Attack Resolution Service
export {
  type AttackResolutionResult,
  AttackResolutionService,
  type IAttackResolutionService,
  type KillResult,
} from "./attackResolutionService";
// Card Service
export {
  CardService,
  CardServiceLayer,
  type ICardService,
} from "./cardService";
// Message Service
export {
  createMessageService,
  type IMessageService,
  MessageService,
} from "./messageService";
// Player State Service
export {
  type IPlayerStateService,
  PlayerStateService,
} from "./playerStateService";
// Priority Service
export {
  type IPriorityService,
  PriorityService,
  PriorityServiceLayer,
} from "./priorityService";
