/** @effect-diagnostics globalErrorInEffectFailure:skip-file */
"use client";

/**
 * Effect-TS 测试工具测试用例
 */

import { describe, expect, it } from "bun:test";
import { Context, Effect, Exit, Layer } from "effect";

import {
  expectFailure,
  expectSuccess,
  makeEffectMockLayer,
  makeMockLayer,
  mergeLayers,
  runPromise,
  runPromiseExit,
  runSync,
  runSyncExit,
  runWithLayer,
  runWithLayerExit,
} from "./test-helpers";

// Define a test service for layer testing
const TestService = Context.GenericTag<number>("test/TestService");

describe("runSync", () => {
  it("should return value for successful effect", () => {
    const result = runSync(Effect.succeed(42));
    expect(result).toBe(42);
  });

  it("should throw for failed effect", () => {
    expect(() =>
      runSync(Effect.fail(new Error("test error")) as Effect.Effect<never>),
    ).toThrow();
  });

  it("should work with string return", () => {
    const result = runSync(Effect.succeed("hello"));
    expect(result).toBe("hello");
  });

  it("should work with object return", () => {
    const result = runSync(Effect.succeed({ a: 1, b: 2 }));
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe("runSyncExit", () => {
  it("should return Exit.Success for successful effect", () => {
    const exit = runSyncExit(Effect.succeed(42));
    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(42);
    }
  });

  it("should return Exit.Failure for failed effect", () => {
    const exit = runSyncExit(
      Effect.fail(new Error("test error")) as Effect.Effect<never>,
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(exit.cause).toBeDefined();
    }
  });

  it("should preserve error type", () => {
    const exit = runSyncExit(Effect.fail("string error"));
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("runPromise", () => {
  it("should return value for successful effect", async () => {
    const result = await runPromise(Effect.succeed(42));
    expect(result).toBe(42);
  });

  it("should reject for failed effect", async () => {
    await expect(
      runPromise(Effect.fail(new Error("test error")) as Effect.Effect<never>),
    ).rejects.toThrow();
  });

  it("should work with async effect", async () => {
    const result = await runPromise(Effect.succeed("hello"));
    expect(result).toBe("hello");
  });
});

describe("runPromiseExit", () => {
  it("should return Exit.Success for successful effect", async () => {
    const exit = await runPromiseExit(Effect.succeed(42));
    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(42);
    }
  });

  it("should return Exit.Failure for failed effect", async () => {
    const exit = await runPromiseExit(
      Effect.fail(new Error("test error")) as Effect.Effect<never>,
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("expectSuccess", () => {
  it("should extract value from Exit.Success", () => {
    const exit = Exit.succeed(42);
    const result = expectSuccess(exit);
    expect(result).toBe(42);
  });

  it("should throw for Exit.Failure", () => {
    const exit = Exit.fail(new Error("test error")) as Exit.Exit<never, Error>;
    expect(() => expectSuccess(exit)).toThrow("Expected success");
  });

  it("should extract string value", () => {
    const exit = Exit.succeed("hello");
    const result = expectSuccess(exit);
    expect(result).toBe("hello");
  });
});

describe("expectFailure", () => {
  it("should extract error from Exit.Failure", () => {
    const error = new Error("test error");
    const exit = Exit.fail(error);
    const result = expectFailure(exit);
    expect(result).toBeDefined();
  });

  it("should throw for Exit.Success", () => {
    const exit = Exit.succeed(42);
    expect(() => expectFailure(exit)).toThrow("Expected failure");
  });

  it("should handle string errors", () => {
    const exit = Exit.fail("string error");
    const result = expectFailure(exit);
    // The result is wrapped in a Cause object when using Exit.fail with string
    expect(result).toBeDefined();
  });
});

describe("runWithLayer", () => {
  it("should run effect with provided layer", () => {
    const mockLayer = makeMockLayer(TestService, 42);
    const result = runWithLayer(
      Effect.gen(function* () {
        const service = yield* TestService;
        return service;
      }) as Effect.Effect<number>,
      mockLayer,
    );
    expect(result).toBe(42);
  });

  it("should work with string service", () => {
    const StringService = Context.GenericTag<string>("test/StringService");
    const mockLayer = makeMockLayer(StringService, "hello");
    const result = runWithLayer(
      Effect.gen(function* () {
        const service = yield* StringService;
        return service;
      }) as Effect.Effect<string>,
      mockLayer,
    );
    expect(result).toBe("hello");
  });

  it("should work with object service", () => {
    const ObjectService = Context.GenericTag<{ a: number; b: number }>(
      "test/ObjectService",
    );
    const mockLayer = makeMockLayer(ObjectService, { a: 1, b: 2 });
    const result = runWithLayer(
      Effect.gen(function* () {
        const service = yield* ObjectService;
        return service;
      }) as Effect.Effect<{ a: number; b: number }>,
      mockLayer,
    );
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe("runWithLayerExit", () => {
  it("should return Exit.Success with layer", () => {
    const mockLayer = makeMockLayer(TestService, 42);
    const exit = runWithLayerExit(
      Effect.gen(function* () {
        const service = yield* TestService;
        return service;
      }) as Effect.Effect<number>,
      mockLayer,
    );
    expect(Exit.isSuccess(exit)).toBe(true);
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBe(42);
    }
  });

  it("should return Exit.Failure when effect fails", () => {
    const mockLayer = makeMockLayer(TestService, 42);
    const exit = runWithLayerExit(
      Effect.fail(new Error("test error")),
      mockLayer,
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("makeMockLayer", () => {
  it("should create a succeed layer for number", () => {
    const layer = makeMockLayer(TestService, 42);
    expect(layer).toBeDefined();
  });

  it("should create a succeed layer for string", () => {
    const StringService = Context.GenericTag<string>("test/StringService");
    const layer = makeMockLayer(StringService, "test");
    expect(layer).toBeDefined();
  });

  it("should work with complex objects", () => {
    const ObjectService = Context.GenericTag<{ name: string; value: number }>(
      "test/ObjectService",
    );
    const layer = makeMockLayer(ObjectService, { name: "test", value: 123 });
    expect(layer).toBeDefined();
  });
});

describe("makeEffectMockLayer", () => {
  it("should create an effect layer", async () => {
    const layer = makeEffectMockLayer(TestService, Effect.succeed(42));
    const result = await Effect.runPromiseExit(
      (
        Effect.gen(function* () {
          const service = yield* TestService;
          return service;
        }) as Effect.Effect<number>
      ).pipe(Effect.provide(layer)),
    );
    expect(Exit.isSuccess(result)).toBe(true);
    if (Exit.isSuccess(result)) {
      expect(result.value).toBe(42);
    }
  });

  it("should handle effect that fails", async () => {
    const layer = makeEffectMockLayer(
      TestService,
      Effect.fail(new Error("effect error")),
    );
    const result = await Effect.runPromiseExit(
      (
        Effect.gen(function* () {
          const service = yield* TestService;
          return service;
        }) as Effect.Effect<number>
      ).pipe(Effect.provide(layer)),
    );
    expect(Exit.isFailure(result)).toBe(true);
  });
});

describe("mergeLayers", () => {
  it("should merge two layers", () => {
    const StringService = Context.GenericTag<string>("test/StringService");
    const NumberService = Context.GenericTag<number>("test/NumberService");

    const layer1 = makeMockLayer(StringService, "hello");
    const layer2 = makeMockLayer(NumberService, 42);

    const merged = mergeLayers(layer1, layer2);
    expect(merged).toBeDefined();
  });

  it("should allow accessing both services after merge", () => {
    const StringService = Context.GenericTag<string>("test/StringService");
    const NumberService = Context.GenericTag<number>("test/NumberService");

    const layer1 = makeMockLayer(StringService, "hello");
    const layer2 = makeMockLayer(NumberService, 42);

    const result = runWithLayer(
      Effect.gen(function* () {
        const str = yield* StringService;
        const num = yield* NumberService;
        return { str, num };
      }) as Effect.Effect<{ str: string; num: number }>,
      mergeLayers(layer1, layer2),
    );

    expect(result.str).toBe("hello");
    expect(result.num).toBe(42);
  });
});
