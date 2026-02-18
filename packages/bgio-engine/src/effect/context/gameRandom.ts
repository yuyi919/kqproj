"use client";

import { Effect, Layer } from "effect";
import { mapValues } from "es-toolkit";
import type { RandomAPI } from "../../types";

export interface IRandomService {
  D4(diceCount: number): Effect.Effect<number[]>;
  D4(): Effect.Effect<number>;
  D6(diceCount: number): Effect.Effect<number[]>;
  D6(): Effect.Effect<number>;
  D10(diceCount: number): Effect.Effect<number[]>;
  D10(): Effect.Effect<number>;
  D12(diceCount: number): Effect.Effect<number[]>;
  D12(): Effect.Effect<number>;
  D20(diceCount: number): Effect.Effect<number[]>;
  D20(): Effect.Effect<number>;
  Die(spotvalue: number, diceCount: number): Effect.Effect<number[]>;
  Die(spotvalue?: number): Effect.Effect<number>;
  Number(): Effect.Effect<number>;
  Shuffle<T>(deck: T[]): Effect.Effect<T[]>;
}

function missingRandomApiCall(name: keyof RandomAPI): Effect.Effect<never> {
  /* istanbul ignore next */
  return Effect.dieMessage(`${name} called without provided GameRandom layer`);
}

const MissingRandomApi: IRandomService = {
  D4: (..._args: number[]) => missingRandomApiCall("D4"),
  D6: (..._args: number[]) => missingRandomApiCall("D6"),
  D10: (..._args: number[]) => missingRandomApiCall("D10"),
  D12: (..._args: number[]) => missingRandomApiCall("D12"),
  D20: (..._args: number[]) => missingRandomApiCall("D20"),
  Die: (..._args: number[]) => missingRandomApiCall("Die"),
  Number: () => missingRandomApiCall("Number"),
  Shuffle: <T>(_deck: T[]) => missingRandomApiCall("Shuffle"),
};

export const makeGameRandomLayer = (random: RandomAPI) =>
  Layer.succeed(
    GameRandom,
    GameRandom.make(
      mapValues(
        random,
        (_, key) =>
          (...args: unknown[]) =>
            Effect.sync(() => random[key as "D4"]!(...(args as [])) as never),
      ),
    ),
  );

export class GameRandom extends Effect.Service<GameRandom>()("GameRandom", {
  effect() {
    return Effect.succeed(MissingRandomApi);
  },
}) {
  static layer = makeGameRandomLayer;
}
