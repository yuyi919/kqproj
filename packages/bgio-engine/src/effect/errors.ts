"use client";

/**
 * Effect-TS 错误类型定义
 */

import { Data } from "effect";
import { GameLogicError } from "../game/errors";

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
export class PlayerNotAliveError extends Data.TaggedError(
  "PlayerNotAliveError",
)<{
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

/**
 * 将 Effect-TS TaggedError 转换为 GameLogicError
 *
 * 用于服务边界：错误从 Effect-TS 服务抛出时，转换为游戏逻辑错误
 */
export function taggedErrorToGameLogicError(error: unknown): GameLogicError {
  if (error instanceof BaseError) {
    return new GameLogicError(error.message);
  }

  if (error instanceof PlayerNotFoundError) {
    return new GameLogicError(`Player ${error.playerId} not found`);
  }

  if (error instanceof PlayerNotAliveError) {
    return new GameLogicError(
      `Player ${error.playerId} is not alive (${error.status})`,
    );
  }

  if (error instanceof ActorDeadError) {
    return new GameLogicError(`Actor ${error.actorId} is dead`);
  }

  if (error instanceof TargetAlreadyDeadError) {
    return new GameLogicError(`Target ${error.targetId} is already dead`);
  }

  if (error instanceof TargetWitchKillerFailedError) {
    return new GameLogicError(
      `Target ${error.targetId} is protected by witch_killer`,
    );
  }

  if (error instanceof QuotaExceededError) {
    return new GameLogicError(
      `Kill quota exceeded (${error.current}/${error.max})`,
    );
  }

  if (error instanceof BarrierProtectedError) {
    return new GameLogicError(
      `Target ${error.targetId} is protected by barrier`,
    );
  }

  // Default case - include original error message
  const message = error instanceof Error ? error.message : String(error);
  return new GameLogicError(`Unknown error: ${message}`);
}
