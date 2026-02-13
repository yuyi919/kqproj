import { beforeEach, describe, expect, it } from "bun:test";
import {
  createMockRandom,
  createTestState,
  SEVEN_PLAYER_CONFIG,
  setupPlayers,
} from "../../__tests__/testUtils";
import type { BGGameState, RandomAPI } from "../../types";
import { applyPhaseResult } from "./applyPhaseResult";
import type { PhaseResult } from "./types";

// ==================== Apply Phase Result Tests ====================
describe("Apply PhaseResult", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2"]);
    mockRandom = createMockRandom();
  });

  it("应该应用状态更新", () => {
    const result: PhaseResult = {
      stateUpdates: { round: 5 },
      deadPlayers: new Set(),
      barrierPlayers: new Set(),
    };

    applyPhaseResult(G, mockRandom, result);

    expect(G.round).toBe(5);
  });

  it("应该更新 deadPlayers 的状态", () => {
    const result: PhaseResult = {
      stateUpdates: {},
      deadPlayers: new Set(["p1"]),
      barrierPlayers: new Set(),
    };

    applyPhaseResult(G, mockRandom, result);

    expect(G.secrets["p1"].status).toBe("dead");
    expect(G.players["p1"].status).toBe("dead");
  });

  it("不应该覆盖已死亡玩家的状态", () => {
    G.secrets["p1"].status = "dead";
    G.players["p1"].status = "dead";
    const result: PhaseResult = {
      stateUpdates: {},
      deadPlayers: new Set(["p1"]),
      barrierPlayers: new Set(),
    };

    applyPhaseResult(G, mockRandom, result);

    expect(G.secrets["p1"].status).toBe("dead");
  });

  it("应该处理空的 deadPlayers", () => {
    const result: PhaseResult = {
      stateUpdates: {},
      deadPlayers: new Set(),
      barrierPlayers: new Set(),
    };

    expect(() => applyPhaseResult(G, mockRandom, result)).not.toThrow();
  });
});
