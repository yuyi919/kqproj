"use client";

/**
 * Move 函数包装器
 */

import type { Move } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";
import { Effect } from "effect";
import { isEffect } from "effect/Effect";
import {
  GameRandom,
  GameStateRef,
  MessageService,
  makeGameLayers,
  taggedErrorToGameLogicError,
} from "../effect";
import type { BGGameState } from "../types";
import { GameLogicError } from "./errors";
import type { MoveContext, PhaseHookContext } from "./types";

/**
 * 执行 move 函数的包装器
 * 捕获 GameLogicError 并返回 INVALID_MOVE
 */
export function wrapMove<T extends unknown[]>(
  fn: (
    ctx: MoveContext,
    ...args: T
  ) =>
    | void
    | BGGameState
    | Effect.Effect<
        void | BGGameState,
        unknown,
        GameStateRef | GameRandom | MessageService
      >,
) {
  return ((
    ctx: MoveContext,
    ...args: T
  ): void | BGGameState | typeof INVALID_MOVE => {
    try {
      const g = fn(ctx as MoveContext, ...(args as T));
      if (g) {
        if (isEffect(g)) {
          const program = g.pipe(Effect.provide(makeGameLayers(ctx)));
          const exit = Effect.runSyncExit(program);
          if (exit._tag === "Failure") {
            throw taggedErrorToGameLogicError(exit.cause);
          }

          return exit.value;
        }
        return g;
      }
    } catch (error) {
      if (error instanceof GameLogicError) {
        console.error(error.message);
        return INVALID_MOVE;
      }
      throw error;
    }
  }) satisfies Move<BGGameState>;
}

export function wrapHook<T extends unknown[]>(
  fn: (
    ctx: PhaseHookContext,
    ...args: T
  ) =>
    | void
    | BGGameState
    | Effect.Effect<
        void | BGGameState,
        unknown,
        GameStateRef | GameRandom | MessageService
      >,
) {
  return ((ctx: PhaseHookContext, ...args: T): void | BGGameState => {
    try {
      const g = fn(ctx, ...(args as T));
      if (g) {
        if (isEffect(g)) {
          const program = g.pipe(Effect.provide(makeGameLayers(ctx)));
          const exit = Effect.runSyncExit(program);
          if (exit._tag === "Failure") {
            throw taggedErrorToGameLogicError(exit.cause);
          }

          return exit.value;
        }
        return g;
      }
    } catch (error) {
      if (error instanceof GameLogicError) {
        console.error(error.message);
      }
      throw error;
    }
  }) satisfies Move<BGGameState>;
}
