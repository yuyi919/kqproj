import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { createMockRandom, createTestState, setupPlayers } from "../../__tests__/testUtils";
import { makeGameRandomLayer } from "../context/gameRandom";
import { GameStateRef } from "../context/gameStateRef";
import { AttackResolutionService, CardService, PriorityService } from "../services";
import { BaseGameLayers, GameLayers } from "./gameLayers";

describe("GameLayers", () => {
  it("provides base stateless services", () => {
    const program = Effect.gen(function* () {
      const priorityService = yield* PriorityService;
      const cardService = yield* CardService;

      const actions = priorityService.sortAttackActions([
        {
          id: "na-kill",
          timestamp: 2,
          playerId: "p1",
          targetId: "p2",
          card: { id: "k1", type: "kill" },
        },
        {
          id: "na-wk",
          timestamp: 1,
          playerId: "p3",
          targetId: "p4",
          card: { id: "wk1", type: "witch_killer" },
        },
      ]);

      return {
        firstAttackType: actions[0]?.card?.type,
        isKillAttackCard: cardService.isAttackCard("kill"),
      };
    }).pipe(Effect.provide(BaseGameLayers));

    const result = Effect.runSync(program);
    expect(result.firstAttackType).toBe("witch_killer");
    expect(result.isKillAttackCard).toBe(true);
  });

  it("wires stateful services with GameStateRef", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2"]);

    const layer = Layer.provideMerge(
      Layer.provideMerge(GameLayers, GameStateRef.layer(G)),
      makeGameRandomLayer(createMockRandom()),
    );
    const program = Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      const stateRef = yield* GameStateRef;

      yield* service.executeKill({
        playerId: "p2",
        cause: "kill_magic",
        killerId: "p1",
      });
      const updated = yield* stateRef.get();
      return updated.secrets["p2"].status;
    }).pipe(Effect.provide(layer));

    const status = Effect.runSync(program);
    expect(status).toBe("dead");
  });
});

