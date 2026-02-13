"use client";

/**
 * 游戏模块类型定义
 */

import type { Ctx, DefaultPluginAPIs } from "boardgame.io";
import type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { BGGameState } from "../types";

/** Boardgame.io 扩展的 Ctx 类型 */
export interface GameCtx extends Ctx {}

export type { MoveContext } from "../types";

/** Phase 钩子上下文 */
export interface PhaseHookContext {
  G: BGGameState;
  ctx: GameCtx;
  events: EventsAPI;
  random: RandomAPI;
}
