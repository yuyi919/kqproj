"use client";

/**
 * GameLayers - 游戏服务层组合配置
 *
 * 使用 Layer.mergeAll 组合多个服务层
 */

import { Layer } from "effect";
import {
  AttackResolutionService,
  CardServiceLayer,
  PriorityServiceLayer,
} from "../services";

/**
 * 基础服务层组合 - 无依赖的服务
 */
const BaseServices = Layer.mergeAll(PriorityServiceLayer, CardServiceLayer);

/**
 * 游戏服务层组合 - 包含所有服务
 * AttackResolutionService 依赖其他服务，使用 Layer.provide 链接
 */
export const GameLayers = Layer.mergeAll(
  AttackResolutionService.Default,
  BaseServices,
);

/**
 * 简化版本：只包含基础服务（无依赖）
 * 适用于只需要读取/修改状态的场景
 */
export const BaseGameLayers = BaseServices;
