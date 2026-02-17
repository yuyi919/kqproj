"use client";

/**
 * Effect-TS 错误类型定义
 */

import { Data } from "effect";

/**
 * 基础错误类型
 */
export class BaseError extends Data.TaggedError("BaseError")<{
  message: string;
}> {}

/**
 * 玩家不存在错误
 */
export class PlayerNotFoundError extends Data.TaggedError(
  "PlayerNotFoundError",
)<{ playerId: string }> {}

/**
 * 玩家非存活状态错误
 */
export class PlayerNotAliveError extends Data.TaggedError("PlayerNotAliveError")<{
  playerId: string;
  status: string;
}> {}

/**
 * 攻击者已死亡错误
 */
export class ActorDeadError extends Data.TaggedError("ActorDeadError")<{
  actorId: string;
}> {}

/**
 * 目标已死亡错误
 */
export class TargetAlreadyDeadError extends Data.TaggedError(
  "TargetAlreadyDeadError",
)<{ targetId: string }> {}

/**
 * 目标因 witch_killer 持有者保护而失败
 */
export class TargetWitchKillerFailedError extends Data.TaggedError(
  "TargetWitchKillerFailedError",
)<{ targetId: string }> {}

/**
 * 配额超限错误
 */
export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  current: number;
  max: number;
}> {}

/**
 * 目标受保护错误
 */
export class BarrierProtectedError extends Data.TaggedError(
  "BarrierProtectedError",
)<{ targetId: string }> {}

/**
 * 攻击结算错误
 */
export type AttackError =
  | ActorDeadError
  | TargetAlreadyDeadError
  | TargetWitchKillerFailedError
  | QuotaExceededError
  | BarrierProtectedError;
