"use client";

/**
 * GameStateRef - 游戏状态可变引用
 *
 * 职责：提供对 BGGameState 的可变引用访问
 * 使用 Effect-TS 的 Ref 实现线程安全的状态管理
 */

import { Effect, Layer, Ref } from "effect";
import type { BGGameState } from "../../types";

export interface IGameStateRef {
  readonly get: () => Effect.Effect<BGGameState>;
  readonly set: (state: BGGameState) => Effect.Effect<void>;
  readonly update: (
    updater: (state: BGGameState) => BGGameState,
  ) => Effect.Effect<void>;
}

/**
 * 创建 GameStateRef 的便捷 Layer
 * 接受初始状态
 */
export const makeGameStateRefLayer = (initialState: BGGameState) =>
  Layer.effect(
    GameStateRef,
    makeGameStateRefService(initialState).pipe(
      Effect.map((d) => GameStateRef.make(d)),
    ),
  );

function makeGameStateRefService(
  initialState: BGGameState,
): Effect.Effect<IGameStateRef> {
  return Effect.gen(function* () {
    const ref = yield* Ref.make(initialState);
    return {
      get: () => Ref.get(ref),
      set: (state) => Ref.set(ref, state),
      update: (updater) => Ref.update(ref, updater),
    } satisfies IGameStateRef;
  });
}

/**
 * GameStateRef Tag
 */
export class GameStateRef extends Effect.Service<GameStateRef>()(
  "GameStateRef",
  {
    accessors: true,
    effect: Effect.succeed<IGameStateRef>({
      get: () =>
        Effect.dieMessage("GameStateRef.get called without provided layer"),
      set: () =>
        Effect.dieMessage("GameStateRef.set called without provided layer"),
      update: () =>
        Effect.dieMessage("GameStateRef.update called without provided layer"),
    }),
  },
) {
  static layer = makeGameStateRefLayer;
}
