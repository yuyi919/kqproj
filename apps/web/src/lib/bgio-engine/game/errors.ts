"use client";

/**
 * 游戏逻辑错误类型
 */

export class GameLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameLogicError";
  }
}
