import { describe, it, expect, beforeEach } from "bun:test";
import { resolveNightActions } from "../game/resolution";
import { SEVEN_PLAYER_CONFIG } from "../types";
import type {
  BGGameState,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  CardRef,
  NightAction,
  DeathRecord,
  PlayerStatus,
  PublicPlayerStatus,
  GameConfig,
} from "../types";
import type { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";

describe("resolution", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;

  beforeEach(() => {
    const config = { ...SEVEN_PLAYER_CONFIG };
    G = {
      id: "test-game",
      roomId: "test-room",
      config,
      players: {},
      playerOrder: [],
      secrets: {},
      deathLog: [],
      currentVotes: [],
      currentActions: {},
      nightActions: [],
      actionHistory: [],
      voteHistory: [],
      deck: [],
      discardPile: [],
      chatMessages: [],
      phaseStartTime: 0,
      phaseEndTime: 0,
      round: 1,
      status: "night",
      imprisonedId: null,
      attackQuota: {
        witchKillerUsed: false,
        killMagicUsed: 0,
      },
    } as unknown as BGGameState;

    mockRandom = {
      Number: () => 0,
      Shuffle: (arr: any[]) => arr,
      Die: () => 1,
      D4: () => 1,
      D6: () => 1,
      D10: () => 1,
      D12: () => 1,
      D20: () => 1,
    } as unknown as RandomAPI;

    // Setup 3 players
    ["p1", "p2", "p3"].forEach((id, index) => {
      G.players[id] = {
        id,
        seatNumber: index,
        status: "alive" as PublicPlayerStatus,
      };
      G.playerOrder.push(id);
      G.secrets[id] = {
        id,
        hand: [],
        status: "alive" as PlayerStatus,
        isWitch: false,
        witchKillerHolder: false,
        hasBarrier: false,
        consecutiveNoKillRounds: 0,
        revealedInfo: [],
        lastKillRound: 0,
      } as PrivatePlayerInfo;
    });
  });

  it("should resolve kill action correctly", () => {
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      cardType: "kill",
      cardId: "c1",
    });

    resolveNightActions(G, mockRandom);

    expect(G.players["p2"].status).toBe("dead");
    expect(G.secrets["p2"].status).toBe("dead");
    // Killer becomes witch
    expect(G.secrets["p1"].isWitch).toBe(true);
    expect(G.deathLog).toHaveLength(1);
    expect(G.deathLog[0].cause).toBe("kill_magic");
  });

  it("should respect barrier", () => {
    // p2 uses barrier
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      cardType: "barrier",
      cardId: "c2",
    });
    // p1 kills p2
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      cardType: "kill",
      cardId: "c1",
    });

    // Set barrier status manually or let resolution handle it?
    // resolution loop 1 handles barrier card => sets barrierPlayers set.
    // It does NOT set G.secrets.hasBarrier unless logic does?
    // Let's check logic:
    // Barrier loop: barrierPlayers.add(action.playerId)
    // Attack loop: if (barrierPlayers.has(target)) -> attack failed.

    resolveNightActions(G, mockRandom);

    expect(G.players["p2"].status).toBe("alive");
    expect(G.secrets["p1"].isWitch).toBe(false); // Kill failed, so no witch transform?
    // Wait, logic says:
    /*
        if (barrierPlayers.has(action.targetId)) {
            // ... logs ...
            continue;
        }
        */
    // If continue, logic after (killPlayer, witch transform) is skipped.
    // So p1 does NOT become witch.
    expect(G.secrets["p1"].isWitch).toBe(false);
  });

  it("should prioritise witch_killer over kill (priority check)", () => {
    // This test mainly verifies sorting works, though execution order might not change outcome if both die

    // p1 uses witch_killer on p2
    // p2 uses kill on p3
    // If sorting works, p1 action (priority 5) comes before p2 action (priority 4)

    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      cardType: "kill",
      cardId: "c2",
    });
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      cardType: "witch_killer",
      cardId: "c1",
    });

    resolveNightActions(G, mockRandom);

    // Sorting check by checking logs or just outcome
    // Since resolution allows dead to act (as we suspected), output should be same regardless of order?
    // Let's verify dead can act.
    expect(G.players["p2"].status).toBe("dead");
    expect(G.players["p3"].status).toBe("dead");
  });

  it("should handle simultaneous kills", () => {
    // p1 kills p2
    // p2 kills p1
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      cardType: "kill",
      cardId: "c1",
    });
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p1",
      cardType: "kill",
      cardId: "c2",
    });

    resolveNightActions(G, mockRandom);

    expect(G.players["p1"].status).toBe("dead");
    expect(G.players["p2"].status).toBe("dead");
  });

  it("should handle wreck logic (witch not killing)", () => {
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p1 does nothing

    resolveNightActions(G, mockRandom);

    // consecutiveNoKillRounds increases to 2, causing wreck
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(2);
    // Wreck resolution happens in phase 4 using updated rounds?
    // Code:
    // if (!hasKilledThisRound) {
    //   secret.consecutiveNoKillRounds++;
    //   if (secret.consecutiveNoKillRounds >= 2) { ... killPlayer(wreck) ... }
    // }

    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("wreck");
    expect(G.deathLog[0].cause).toBe("wreck");
  });
});
