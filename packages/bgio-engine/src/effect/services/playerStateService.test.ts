import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import {
  createMockRandom,
  createTestState,
  setupPlayers,
} from "../../__tests__/testUtils";
import { GameStateRef } from "../context/gameStateRef";
import { makeGameLayers } from "../layers/gameLayers";
import { PlayerStateService } from "./playerStateService";

function makeLayer(state: ReturnType<typeof createTestState>) {
  return makeGameLayers({ G: state, random: createMockRandom() });
}

describe("PlayerStateService", () => {
  it("supports catchTag for PlayerNotFoundError", () => {
    const G = createTestState();
    setupPlayers(G, ["p1"]);

    const program = Effect.gen(function* () {
      const service = yield* PlayerStateService;
      return yield* service.isAlive("missing-player");
    }).pipe(
      Effect.map(() => "ok"),
      Effect.catchTag("PlayerNotFoundError", (error) =>
        Effect.succeed(`missing:${error.playerId}`),
      ),
      Effect.provide(makeLayer(G)),
    );

    const result = Effect.runSync(program);
    expect(result).toBe("missing:missing-player");
  });

  it("supports catchTag for PlayerNotAliveError", () => {
    const G = createTestState();
    setupPlayers(G, [{ id: "p1", status: "dead" }, "p2"]);

    const program = Effect.gen(function* () {
      const service = yield* PlayerStateService;
      return yield* service.killPlayer({
        playerId: "p1",
        cause: "kill_magic",
        killerId: "p2",
      });
    }).pipe(
      Effect.map(() => "ok"),
      Effect.catchTag("PlayerNotAliveError", (error) =>
        Effect.succeed(`not-alive:${error.playerId}:${error.status}`),
      ),
      Effect.provide(makeLayer(G)),
    );

    const result = Effect.runSync(program);
    expect(result).toBe("not-alive:p1:dead");
  });

  it("writes kill result back to GameStateRef", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2"]);

    const program = Effect.gen(function* () {
      const service = yield* PlayerStateService;
      const stateRef = yield* GameStateRef;

      yield* service.killPlayer({
        playerId: "p2",
        cause: "kill_magic",
        killerId: "p1",
      });
      const updated = yield* stateRef.get();
      return updated;
    }).pipe(Effect.provide(makeLayer(G)));

    const updated = Effect.runSync(program);

    expect(updated.players["p2"].status).toBe("dead");
    expect(updated.secrets["p2"].status).toBe("dead");
    expect(updated.deathLog).toHaveLength(1);
    expect(updated.deathLog[0].playerId).toBe("p2");
  });

  it("handles wreck with no killer by random transfer and passive notification", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    const program = Effect.gen(function* () {
      const service = yield* PlayerStateService;
      const stateRef = yield* GameStateRef;

      yield* service.killPlayer({
        playerId: "p1",
        cause: "wreck",
      });
      return yield* stateRef.get();
    }).pipe(Effect.provide(makeLayer(G)));

    const updated = Effect.runSync(program);
    const receiverId = (["p2", "p3"] as const).find(
      (id) => updated.secrets[id].witchKillerHolder,
    );

    expect(receiverId).toBeDefined();
    if (!receiverId) {
      throw new Error("receiverId should be defined");
    }
    expect(updated.secrets[receiverId].isWitch).toBe(true);
    expect(
      updated.chatMessages.some(
        (message) =>
          message.kind === "private_response" &&
          message.type === "witch_killer_obtained" &&
          message.actorId === receiverId &&
          message.fromPlayerId === "p1" &&
          message.mode === "passive",
      ),
    ).toBe(true);
  });
});
