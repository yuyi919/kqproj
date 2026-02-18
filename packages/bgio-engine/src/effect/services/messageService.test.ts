import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { createTestState, setupPlayers } from "../../__tests__/testUtils";
import { GameStateRef } from "../context/gameStateRef";
import { BaseGameLayers } from "../layers/gameLayers";
import { MessageService } from "./messageService";

function makeLayer(state: ReturnType<typeof createTestState>) {
  return Layer.provideMerge(
    MessageService.Default,
    GameStateRef.layer(state),
  ).pipe(Layer.provide(BaseGameLayers));
}

describe("MessageService", () => {
  it("supports catchTag for PlayerNotFoundError", () => {
    const G = createTestState();
    setupPlayers(G, ["p1"]);

    const program = Effect.gen(function* () {
      const service = yield* MessageService;
      return yield* service.addRevealedInfo("missing-player", "detect", {
        cardCount: 1,
      });
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

  it("consumes barrier and writes revealed info on barrier protection", () => {
    const G = createTestState();
    setupPlayers(G, [
      "p1",
      { id: "p2", hasBarrier: true, hand: [{ id: "b1", type: "barrier" }] },
    ]);

    const program = Effect.gen(function* () {
      const service = yield* MessageService;
      const stateRef = yield* GameStateRef;

      yield* service.handleAttackFailureBarrierProtected(
        "a1",
        "p1",
        "p2",
        "kill",
      );

      const updated = yield* stateRef.get();
      return {
        hasBarrier: updated.secrets["p2"].hasBarrier,
        actorRevealedInfoCount: updated.secrets["p1"].revealedInfo.length,
        targetRevealedInfoCount: updated.secrets["p2"].revealedInfo.length,
        chatMessageCount: updated.chatMessages.length,
      };
    }).pipe(Effect.provide(makeLayer(G)));

    const result = Effect.runSync(program);

    expect(result.hasBarrier).toBe(false);
    expect(result.actorRevealedInfoCount).toBe(1);
    expect(result.targetRevealedInfoCount).toBe(1);
    expect(result.chatMessageCount).toBe(2);
  });

  it("emits structured witch_killer_obtained notification", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2"]);

    const program = Effect.gen(function* () {
      const service = yield* MessageService;
      const stateRef = yield* GameStateRef;

      yield* service.handleWitchKillerObtained("p1", "p2", "passive");

      const updated = yield* stateRef.get();
      return updated.chatMessages.findLast(
        (message) =>
          message.kind === "private_response" &&
          message.type === "witch_killer_obtained" &&
          message.actorId === "p1",
      );
    }).pipe(Effect.provide(makeLayer(G)));

    const notification = Effect.runSync(program);

    expect(notification).toBeDefined();
    expect(notification?.kind).toBe("private_response");
    expect(notification?.type).toBe("witch_killer_obtained");
    if (
      notification &&
      notification.kind === "private_response" &&
      notification.type === "witch_killer_obtained"
    ) {
      expect(notification.fromPlayerId).toBe("p2");
      expect(notification.mode).toBe("passive");
    }
  });
});
