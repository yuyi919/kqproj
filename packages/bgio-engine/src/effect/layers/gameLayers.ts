"use client";

/**
 * GameLayers - 游戏服务层组合配置
 *
 * 使用 Layer.mergeAll 组合多个服务层。
 */

import { Layer } from "effect";
import {
  AttackResolutionService,
  CardServiceLayer,
  MessageService,
  PlayerStateService,
  PriorityServiceLayer,
} from "../services";

/**
 * 基础服务层组合（无状态依赖）
 */
const BaseServices = Layer.mergeAll(PriorityServiceLayer, CardServiceLayer);

/**
 * 游戏完整服务层：
 * 包含 AttackResolutionService 与基础服务层。
 */
export const GameLayers = Layer.mergeAll(
  AttackResolutionService.Default.pipe(
    Layer.provideMerge(MessageService.Default),
    Layer.provideMerge(PlayerStateService.Default),
    Layer.provideMerge(BaseServices),
  ),
);

/**
 * 精简版：仅包含基础服务层。
 * 适用于只需要排序/卡牌判定等无状态能力的场景。
 */
export const BaseGameLayers = BaseServices;
