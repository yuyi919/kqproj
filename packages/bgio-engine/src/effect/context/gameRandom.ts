"use client";

import { Effect, Layer } from "effect";
import type { RandomAPI } from "../../types";

function missingRandomApiCall(name: keyof RandomAPI): never {
  throw new Error(`${name} called without provided GameRandom layer`);
}

const MissingRandomApi: RandomAPI = {
  D4: ((..._args: number[]) => missingRandomApiCall("D4")) as RandomAPI["D4"],
  D6: ((..._args: number[]) => missingRandomApiCall("D6")) as RandomAPI["D6"],
  D10: ((..._args: number[]) =>
    missingRandomApiCall("D10")) as RandomAPI["D10"],
  D12: ((..._args: number[]) =>
    missingRandomApiCall("D12")) as RandomAPI["D12"],
  D20: ((..._args: number[]) =>
    missingRandomApiCall("D20")) as RandomAPI["D20"],
  Die: ((..._args: number[]) =>
    missingRandomApiCall("Die")) as RandomAPI["Die"],
  Number: () => missingRandomApiCall("Number"),
  Shuffle: (<T>(_deck: T[]) =>
    missingRandomApiCall("Shuffle")) as RandomAPI["Shuffle"],
};

export const makeGameRandomLayer = (random: RandomAPI) =>
  Layer.succeed(GameRandom, GameRandom.make(random));

export class GameRandom extends Effect.Service<GameRandom>()("GameRandom", {
  effect() {
    return Effect.succeed(MissingRandomApi);
  },
}) {
  static layer = makeGameRandomLayer;
}
