import { describe, it, expect, beforeEach } from "bun:test";
import type {
  BGGameState,
  PrivatePlayerInfo,
  PublicPlayerInfo,
  PlayerStatus,
  PublicPlayerStatus,
  GameConfig,
} from "../../types";
import type { PhaseResult } from "./types";
import { processCheckActions } from "./phase3-check";
import {
  createTestState,
  setupPlayers,
  SEVEN_PLAYER_CONFIG,
  createNightAction,
} from "../../__tests__/testUtils";

// ==================== Phase 3 Tests ====================
describe("Phase 3: Check", () => {
  let G: BGGameState;
  let result: PhaseResult;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    result = {
      stateUpdates: {},
      deadPlayers: new Set(),
      barrierPlayers: new Set(),
    };
  });

  describe("processCheckActions", () => {
    it("应该检测到死于 witch_killer", () => {
      G.secrets["p2"].status = "dead";
      G.secrets["p2"].deathCause = "witch_killer";
      G.players["p2"].status = "dead";
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "check1", type: "check" },
      });

      processCheckActions(G, result);

      // content 内部包含 isWitchKiller
      const revealedInfo = G.secrets["p1"].revealedInfo.find(
        (r: any) => r.type === "check",
      ) as any;
      expect(revealedInfo.content.isWitchKiller).toBe(true);
      expect(revealedInfo.content.targetId).toBe("p2");
    });

    it("应该检测到死于其他原因", () => {
      G.secrets["p2"].status = "dead";
      G.secrets["p2"].deathCause = "kill_magic";
      G.players["p2"].status = "dead";
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "check1", type: "check" },
      });

      processCheckActions(G, result);

      const revealedInfo = G.secrets["p1"].revealedInfo.find(
        (r: any) => r.type === "check",
      ) as any;
      expect(revealedInfo.content.isWitchKiller).toBe(false);
      expect(revealedInfo.content.deathCause).toBe("kill_magic");
    });

    it("应该处理无死因的情况（默认为 wreck）", () => {
      G.secrets["p2"].status = "dead";
      G.players["p2"].status = "dead";
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "check1", type: "check" },
      });

      processCheckActions(G, result);

      const revealedInfo = G.secrets["p1"].revealedInfo.find(
        (r: any) => r.type === "check",
      ) as any;
      expect(revealedInfo.content.deathCause).toBe("wreck");
    });

    it("应该跳过非 check 行动", () => {
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        targetId: "p2",
        card: { id: "detect1", type: "detect" },
      });

      processCheckActions(G, result);

      expect(G.chatMessages.length).toBe(0);
    });

    it("应该跳过无目标的行动", () => {
      G.nightActions.push({
        id: "na1",
        timestamp: Date.now(),
        playerId: "p1",
        card: { id: "check1", type: "check" },
      });

      processCheckActions(G, result);

      expect(G.chatMessages.length).toBe(0);
    });
  });
});
