/**
 * GameStateRef - 游戏状态可变引用
 *
 * 职责：
 * 1. 用 Effect.Ref 托管 BGGameState
 * 2. 提供 get / set / update 三个统一入口
 * 3. 避免服务层直接依赖裸对象副作用
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
 * 创建 GameStateRef 的便捷 Layer，注入初始状态
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

function missingRandomApiCall(name: keyof IGameStateRef): Effect.Effect<never> {
  /* istanbul ignore next */
  return Effect.dieMessage(
    `GameStateRef.${name} called without provided layer`,
  );
}

/**
 * GameStateRef Tag
 */
export class GameStateRef extends Effect.Service<GameStateRef>()(
  "GameStateRef",
  {
    accessors: true,
    effect: Effect.succeed<IGameStateRef>({
      get: () => missingRandomApiCall("get"),
      set: () => missingRandomApiCall("set"),
      update: () => missingRandomApiCall("update"),
    }),
  },
) {
  static layer = makeGameStateRefLayer;
}
