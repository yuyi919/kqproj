"use client";

/**
 * Move 函数包装器
 */

import type { Move } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import type { BGGameState } from "../types";
import { GameLogicError } from "./errors";
import type { MoveContext } from "./types";

/**
 * 执行 move 函数的包装器
 * 捕获 GameLogicError 并返回 INVALID_MOVE
 */
export function wrapMove<T extends unknown[]>(
  fn: (ctx: MoveContext, ...args: T) => void,
) {
  return ((
    ctx: MoveContext,
    ...args: T
  ): void | BGGameState | typeof INVALID_MOVE => {
    try {
      fn(ctx as MoveContext, ...(args as T));
    } catch (error) {
      if (error instanceof GameLogicError) {
        console.error(error.message);
        return INVALID_MOVE;
      }
      throw error;
    }
  }) satisfies Move<BGGameState>;
}
