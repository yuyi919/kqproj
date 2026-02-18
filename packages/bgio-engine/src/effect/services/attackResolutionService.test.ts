import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createMockRandom,
  createTestState,
  setupPlayers,
} from "../../__tests__/testUtils";
import type { PhaseResult } from "../../game/resolution/types";
import type { BGGameState, TMessage } from "../../types";
import { makeGameRandomLayer } from "../context/gameRandom";
import { GameStateRef } from "../context/gameStateRef";
import { makeGameLayers, StaticGameLayers } from "../layers/gameLayers";
import { AttackResolutionService } from "./attackResolutionService";

function makeLayer(state: ReturnType<typeof createTestState>) {
  return Layer.provideMerge(
    Layer.provideMerge(StaticGameLayers, GameStateRef.layer(state)),
    makeGameRandomLayer(createMockRandom()),
  );
}

function runPhase2AndGetState(
  state: BGGameState,
  barrierPlayers: Set<string> = new Set<string>(),
) {
  const previousResult: PhaseResult = {
    stateUpdates: {},
    deadPlayers: new Set<string>(),
    barrierPlayers,
  };

  const program = Effect.gen(function* () {
    const service = yield* AttackResolutionService;
    yield* service.resolvePhase2(previousResult);
    const stateRef = yield* GameStateRef;
    return yield* stateRef.get();
  }).pipe(
    Effect.provide(makeGameLayers({ G: state, random: createMockRandom() })),
  );

  return Effect.runSync(program);
}

function hasMessage(
  messages: TMessage[],
  predicate: (message: TMessage) => boolean,
): boolean {
  return messages.some(predicate);
}

describe("AttackResolutionService", () => {
  it("processes successful kill action", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2"]);

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "k1", type: "kill" },
    });

    const program = Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      return yield* service.processAttackActions(new Set<string>());
    }).pipe(Effect.provide(makeGameLayers({ G, random: createMockRandom() })));

    const result = Effect.runSync(program);

    expect(result.executedActions.has("na1")).toBe(true);
    expect(result.deadPlayers.has("p2")).toBe(true);
  });

  it("emits dead response and transform message for successful kill_magic", () => {
    const G = createTestState();
    setupPlayers(G, ["p1", "p2"]);

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "k1", type: "kill" },
    });

    const program = Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      yield* service.processAttackActions(new Set<string>());
      const stateRef = yield* GameStateRef;
      return yield* stateRef.get();
    }).pipe(Effect.provide(makeGameLayers({ G, random: createMockRandom() })));

    const state = Effect.runSync(program);
    const messageTypes = state.chatMessages.map((m) => m.type);

    expect(messageTypes).toContain("dead_response");
    expect(messageTypes).toContain("transform_witch");
  });

  it("supports catchTag for PlayerNotFoundError", () => {
    const G = createTestState();
    setupPlayers(G, ["p1"]);

    G.nightActions.push({
      id: "na-missing-actor",
      timestamp: Date.now(),
      playerId: "ghost",
      targetId: "p1",
      card: { id: "k1", type: "kill" },
    });

    const program = Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      return yield* service.processAttackActions(new Set<string>());
    }).pipe(
      Effect.map(() => "ok"),
      Effect.catchTag("PlayerNotFoundError", (error) =>
        Effect.succeed(`missing:${error.playerId}`),
      ),
      Effect.provide(makeGameLayers({ G, random: createMockRandom() })),
    );

    const result = Effect.runSync(program);
    expect(result).toBe("missing:ghost");
  });

  it("keeps internal rule errors as tagged failed reason", () => {
    const G = createTestState();
    setupPlayers(G, [{ id: "p1", status: "dead" }, "p2"]);

    G.nightActions.push({
      id: "na-dead-actor",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "k1", type: "kill" },
    });

    const program = Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      return yield* service.processAttackActions(new Set<string>());
    }).pipe(Effect.provide(makeGameLayers({ G, random: createMockRandom() })));

    const result = Effect.runSync(program);

    expect(result.executedActions.has("na-dead-actor")).toBe(false);
    expect(result.failedActions).toHaveLength(1);
    expect(result.failedActions[0]?.actionId).toBe("na-dead-actor");
    expect(result.failedActions[0]?.reason._tag).toBe("ActorDeadError");
  });

  it("phase2 message checklist (table-driven)", () => {
    const cases: Array<{
      name: string;
      createState: () => BGGameState;
      barrierPlayers?: Set<string>;
      expected: Array<(messages: TMessage[]) => boolean>;
      unexpected?: Array<(messages: TMessage[]) => boolean>;
    }> = [
      {
        name: "kill success",
        createState: () => {
          const G = createTestState();
          setupPlayers(G, ["p1", "p2"]);
          G.nightActions.push({
            id: "na1",
            timestamp: Date.now(),
            playerId: "p1",
            targetId: "p2",
            card: { id: "k1", type: "kill" },
          });
          return G;
        },
        expected: [
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "attack_result" &&
                m.actorId === "p1" &&
                m.result === "success" &&
                m.cardType === "kill",
            ),
          (messages) =>
            hasMessage(
              messages,
              (m) => m.type === "dead_response" && m.actorId === "p2",
            ),
          (messages) =>
            hasMessage(
              messages,
              (m) => m.type === "transform_witch" && m.actorId === "p1",
            ),
          (messages) =>
            hasMessage(
              messages,
              (m) => m.type === "private_message" && m.actorId === "p1",
            ),
        ],
      },
      {
        name: "barrier protected",
        createState: () => {
          const G = createTestState();
          setupPlayers(G, ["p1", "p2"]);
          G.nightActions.push({
            id: "na1",
            timestamp: Date.now(),
            playerId: "p1",
            targetId: "p2",
            card: { id: "k1", type: "kill" },
          });
          return G;
        },
        barrierPlayers: new Set(["p2"]),
        expected: [
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "attack_result" &&
                m.actorId === "p1" &&
                m.result === "fail" &&
                m.failReason === "barrier_protected",
            ),
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "barrier_applied" &&
                m.actorId === "p2" &&
                m.attackerId === "p1",
            ),
        ],
        unexpected: [
          (messages) =>
            hasMessage(
              messages,
              (m) => m.type === "dead_response" && m.actorId === "p2",
            ),
          (messages) =>
            hasMessage(
              messages,
              (m) => m.type === "transform_witch" && m.actorId === "p1",
            ),
        ],
      },
      {
        name: "quota exceeded",
        createState: () => {
          const G = createTestState();
          setupPlayers(G, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
          G.nightActions.push(
            {
              id: "na1",
              timestamp: Date.now(),
              playerId: "p1",
              targetId: "p5",
              card: { id: "k1", type: "kill" },
            },
            {
              id: "na2",
              timestamp: Date.now() + 1,
              playerId: "p2",
              targetId: "p6",
              card: { id: "k2", type: "kill" },
            },
            {
              id: "na3",
              timestamp: Date.now() + 2,
              playerId: "p3",
              targetId: "p7",
              card: { id: "k3", type: "kill" },
            },
            {
              id: "na4",
              timestamp: Date.now() + 3,
              playerId: "p4",
              targetId: "p1",
              card: { id: "k4", type: "kill" },
            },
          );
          return G;
        },
        expected: [
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "attack_excess" &&
                m.actorId === "p4" &&
                m.reason === "quota_exceeded",
            ),
        ],
      },
      {
        name: "witch_killer holder protection",
        createState: () => {
          const G = createTestState();
          setupPlayers(G, ["p1", "p2", "p3"]);
          G.nightActions.push(
            {
              id: "na1",
              timestamp: Date.now(),
              playerId: "p1",
              targetId: "p2",
              card: { id: "wk1", type: "witch_killer" },
            },
            {
              id: "na2",
              timestamp: Date.now() + 1,
              playerId: "p3",
              targetId: "p1",
              card: { id: "k1", type: "kill" },
            },
          );
          return G;
        },
        expected: [
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "attack_result" &&
                m.actorId === "p3" &&
                m.result === "fail" &&
                m.failReason === "target_witch_killer_failed",
            ),
        ],
      },
      {
        name: "actor dead",
        createState: () => {
          const G = createTestState();
          setupPlayers(G, [{ id: "p1", status: "dead" }, "p2"]);
          G.nightActions.push({
            id: "na1",
            timestamp: Date.now(),
            playerId: "p1",
            targetId: "p2",
            card: { id: "k1", type: "kill" },
          });
          return G;
        },
        expected: [
          (messages) =>
            hasMessage(
              messages,
              (m) =>
                m.type === "attack_result" &&
                m.actorId === "p1" &&
                m.result === "fail" &&
                m.failReason === "actor_dead",
            ),
        ],
      },
    ];

    for (const testCase of cases) {
      const state = runPhase2AndGetState(
        testCase.createState(),
        testCase.barrierPlayers ?? new Set<string>(),
      );
      const messages = state.chatMessages;

      for (const expectMessage of testCase.expected) {
        expect(expectMessage(messages)).toBe(true);
      }
      for (const unexpectedMessage of testCase.unexpected ?? []) {
        expect(unexpectedMessage(messages)).toBe(false);
      }
    }
  });
});
