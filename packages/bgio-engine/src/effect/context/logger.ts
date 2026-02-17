"use client";

/**
 * Logger Service - Effect-TS 日志服务
 *
 * 提供统一的日志接口，可直接调用方法。
 * Logger 方法返回 Effect.Effect<void>，由 wrapMove 自动执行。
 */

import { Effect } from "effect";

/**
 * 日志级别
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Logger Service - 直接调用的日志服务
 */
export const LoggerService = {
  debug(message: string, ...args: unknown[]): Effect.Effect<void> {
    return Effect.log(
      `[DEBUG] ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`,
    );
  },

  info(message: string, ...args: unknown[]): Effect.Effect<void> {
    return Effect.log(
      `[INFO] ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`,
    );
  },

  warn(message: string, ...args: unknown[]): Effect.Effect<void> {
    return Effect.log(
      `[WARN] ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`,
    );
  },

  error(message: string, ...args: unknown[]): Effect.Effect<void> {
    return Effect.log(
      `[ERROR] ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`,
    );
  },
};

/**
 * 兼容旧接口 - 导出 Logger 作为 Context 注入（保留以兼容现有代码）
 * @deprecated 建议直接使用 LoggerService
 */
export { LoggerService as Logger };
