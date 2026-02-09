"use client";

/**
 * 游戏模块类型定义
 */

import type { Ctx, DefaultPluginAPIs } from "boardgame.io";
import type { BGGameState, PublicPlayerInfo, PrivatePlayerInfo } from "../types";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import type { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";

/** Boardgame.io 扩展的 Ctx 类型 */
export interface GameCtx extends Ctx {
  playOrder: string[];
}

/** Move 函数上下文 */
export interface MoveContext {
  G: BGGameState;
  ctx: GameCtx;
  playerID: string;
  events: DefaultPluginAPIs["events"];
  random: RandomAPI;
}

/** Phase 钩子上下文 */
export interface PhaseHookContext {
  G: BGGameState;
  ctx: GameCtx;
  events: EventsAPI;
  random: RandomAPI;
}

/** 玩家完整信息（公开 + 私有） */
export interface PlayerFullInfo {
  id: string;
  public: PublicPlayerInfo;
  secret: PrivatePlayerInfo;
}
