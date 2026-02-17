"use client";

/**
 * Effect-TS 测试工具测试用例
 */

import { Effect } from "effect";
import { describe, expect, it } from "bun:test";

import { runSync, runPromise } from "./test-helpers";

describe("runSync", () => {
  it("should return value for successful effect", () => {
    const result = runSync(Effect.succeed(42));
    expect(result).toBe(42);
  });
});

describe("runPromise", () => {
  it("should return value for successful effect", async () => {
    const result = await runPromise(Effect.succeed(42));
    expect(result).toBe(42);
  });
});
