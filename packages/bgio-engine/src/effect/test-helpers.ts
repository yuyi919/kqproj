"use client";

/**
 * Effect-TS 测试工具函数
 *
 * 提供 Effect-TS 代码的测试辅助函数
 */

import { Context, Effect, Exit, Layer } from "effect";

/**
 * 运行同步 Effect
 *
 * @example
 * const result = runSync(Effect.succeed(42));
 * expect(result).toBe(42);
 */
export function runSync<A>(effect: Effect.Effect<A>): A {
  return Effect.runSync(effect);
}

/**
 * 运行同步 Effect 并返回 Exit
 *
 * @example
 * const exit = runSyncExit(Effect.succeed(42));
 * expect(Exit.isSuccess(exit)).toBe(true);
 */
export function runSyncExit<A, E>(
  effect: Effect.Effect<A, E>,
): Exit.Exit<A, E> {
  return Effect.runSyncExit(effect);
}

/**
 * 运行 Effect 并返回 Promise
 *
 * @example
 * const result = await runPromise(Effect.succeed(42));
 * expect(result).toBe(42);
 */
export async function runPromise<A>(effect: Effect.Effect<A>): Promise<A> {
  return Effect.runPromise(effect);
}

/**
 * 运行 Effect 并返回 Promise Exit
 *
 * @example
 * const exit = await runPromiseExit(Effect.succeed(42));
 * expect(Exit.isSuccess(exit)).toBe(true);
 */
export async function runPromiseExit<A, E>(
  effect: Effect.Effect<A, E>,
): Promise<Exit.Exit<A, E>> {
  return Effect.runPromiseExit(effect);
}

/**
 * 断言 Effect 成功
 *
 * @throws 如果 Effect 失败
 * @example
 * const result = expectSuccess(runSyncExit(Effect.succeed(42)));
 * expect(result).toBe(42);
 */
export function expectSuccess<A, E>(exit: Exit.Exit<A, E>): A {
  if (Exit.isFailure(exit)) {
    throw new Error(
      `Expected success but got failure: ${JSON.stringify(exit.cause)}`,
    );
  }
  return exit.value;
}

/**
 * 断言 Effect 失败并返回错误
 *
 * @throws 如果 Effect 成功
 * @example
 * const error = expectFailure(runSyncExit(Effect.fail(new Error("test"))));
 * expect(error.message).toBe("test");
 */
export function expectFailure<E, A>(exit: Exit.Exit<A, E>): E {
  if (Exit.isSuccess(exit)) {
    throw new Error(`Expected failure but got success: ${exit.value}`);
  }
  return exit.cause as unknown as E;
}

/**
 * 使用 Layer 运行 Effect 的测试版本
 *
 * @example
 * const mockLayer = Layer.succeed(MyService, { method: () => Effect.succeed("mock") });
 * const result = runWithLayer(
 *   Effect.gen(function* () {
 *     const service = yield* MyService;
 *     return service.method();
 *   }),
 *   mockLayer
 * );
 * expect(result).toBe("mock");
 */
export function runWithLayer<A>(
  effect: Effect.Effect<A>,
  layer: Layer.Layer<any>,
): A {
  return Effect.runSync(effect.pipe(Effect.provide(layer)));
}

/**
 * 使用 Layer 运行 Effect 并返回 Exit
 */
export function runWithLayerExit<A, E>(
  effect: Effect.Effect<A, E>,
  layer: Layer.Layer<any>,
): Exit.Exit<A, E> {
  return Effect.runSyncExit(effect.pipe(Effect.provide(layer)));
}

/**
 * 创建 Mock Layer
 *
 * @example
 * const mockPlayerState = makeMockLayer(
 *   PlayerStateService,
 *   {
 *     getPlayer: (id) => ({ id, status: "alive" }),
 *     isAlive: (id) => true,
 *   }
 * );
 */
export function makeMockLayer<T>(impl: T): Layer.Layer<any> {
  // 使用 any 来简化类型
  return Layer.succeed(
    Context.GenericTag<any>("mock"),
    impl,
  ) as unknown as Layer.Layer<any>;
}

/**
 * 创建 Effect Mock Layer（用于异步或需要 Effect 的场景）
 */
export function makeEffectMockLayer(
  impl: Effect.Effect<any>,
): Layer.Layer<any> {
  return Layer.effect(
    Context.GenericTag<any>("mock"),
    impl,
  ) as unknown as Layer.Layer<any>;
}

/**
 * 组合多个 Mock Layer
 */
export function mergeLayers(
  layer1: Layer.Layer<any>,
  layer2: Layer.Layer<any>,
): Layer.Layer<any> {
  return Layer.mergeAll(layer1, layer2);
}
