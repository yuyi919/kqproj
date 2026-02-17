"use client";

/**
 * Logger Context - Effect-TS 日志服务
 *
 * 提供统一的日志接口，支持通过 Context 注入。
 * Logger 方法返回 Effect.Effect<void>，由 wrapMove 自动执行。
 */

import { Context, Effect, Layer } from "effect";

/**
 * 日志级别
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Logger 接口
 * 所有方法返回 Effect.Effect<void>，而非 void
 */
export interface LoggerInterface {
  debug(message: string, ...args: unknown[]): Effect.Effect<void>;
  info(message: string, ...args: unknown[]): Effect.Effect<void>;
  warn(message: string, ...args: unknown[]): Effect.Effect<void>;
  error(message: string, ...args: unknown[]): Effect.Effect<void>;
}

/**
 * Logger Tag - 用于 Context 注入
 */
export const Logger = Context.GenericTag<LoggerInterface>("Logger");

/**
 * 控制台日志实现
 * 使用 Effect.log (3.19+ API) 代替 Effect.logInfo
 */
class ConsoleLogger implements LoggerInterface {
  private readonly minLevel: LogLevel;

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(minLevel: LogLevel = "info") {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, args: unknown[]): string {
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : "";
    return `[${level.toUpperCase()}] ${message}${argsStr}`;
  }

  debug(message: string, ...args: unknown[]): Effect.Effect<void> {
    if (!this.shouldLog("debug")) {
      return Effect.void;
    }
    return Effect.log(this.formatMessage("debug", message, args)).pipe(
      Effect.annotateLogs({ level: "debug" }),
    );
  }

  info(message: string, ...args: unknown[]): Effect.Effect<void> {
    if (!this.shouldLog("info")) {
      return Effect.void;
    }
    return Effect.log(this.formatMessage("info", message, args)).pipe(
      Effect.annotateLogs({ level: "info" }),
    );
  }

  warn(message: string, ...args: unknown[]): Effect.Effect<void> {
    if (!this.shouldLog("warn")) {
      return Effect.void;
    }
    return Effect.log(this.formatMessage("warn", message, args)).pipe(
      Effect.annotateLogs({ level: "warn" }),
    );
  }

  error(message: string, ...args: unknown[]): Effect.Effect<void> {
    if (!this.shouldLog("error")) {
      return Effect.void;
    }
    return Effect.log(this.formatMessage("error", message, args)).pipe(
      Effect.annotateLogs({ level: "error" }),
    );
  }
}

/**
 * 创建 Logger Layer
 * @param minLevel 最小日志级别，默认 "info"
 */
export const makeLoggerLayer = (minLevel: LogLevel = "info") =>
  Layer.succeed(Logger, Logger.of(new ConsoleLogger(minLevel)));

/**
 * 默认 Logger Layer (info 级别)
 */
export const LoggerLayer = makeLoggerLayer("info");
