"use client";

/**
 * Phase 2: 攻击结算入口
 *
 * 该入口仅负责运行 Effect 程序，具体结算/结果组装/后处理
 * 均下沉至 AttackResolutionService.resolvePhase2。
 */

import { Effect, Layer } from "effect";
import {
  AttackResolutionService,
  GameLayers,
  GameStateRef,
  makeGameRandomLayer,
  taggedErrorToGameLogicError,
} from "../../effect";
import type { BGGameState, RandomAPI } from "../../types";
import type { PhaseResult } from "./types";

export function processAttackActions(
  G: Readonly<BGGameState>,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  return runAttackResolution(G as BGGameState, random, previousResult);
}

function runAttackResolution(
  G: BGGameState,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  const program = Effect.gen(function* () {
    const service = yield* AttackResolutionService;
    return yield* service.resolvePhase2(previousResult);
  }).pipe(
    Effect.provide(
      Layer.provideMerge(
        Layer.provideMerge(GameLayers, GameStateRef.layer(G)),
        makeGameRandomLayer(random),
      ),
    ),
  );

  const exit = Effect.runSyncExit(program);
  if (exit._tag === "Failure") {
    console.error(exit.cause);
    throw taggedErrorToGameLogicError(exit.cause);
  }

  return exit.value;
}
