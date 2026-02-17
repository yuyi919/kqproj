"use client";

/**
 * Assertions 单元测试
 *
 * 测试所有断言函数的正确性和错误抛出行为
 */

import { describe, expect, it } from "bun:test";
import {
  createCard,
  createTestState,
  setupPlayer,
  setupPlayers,
} from "../__tests__/testUtils";
import type { BGGameState } from "../types";
import { GamePhase } from "../types";
import {
  assertCardInHand,
  assertNotEmpty,
  assertPhase,
  assertPlayerAlive,
  assertPlayerPublicAlive,
  assertValidMessage,
  assertWitchKillerCardAllowed,
} from "./assertions";
import { GameLogicError } from "./errors";

describe("assertPhase", () => {
  it("should pass when current phase is in allowed phases", () => {
    const G = createTestState();
    G.status = GamePhase.DAY;

    expect(() => assertPhase(G, GamePhase.DAY)).not.toThrow();
    expect(() => assertPhase(G, GamePhase.DAY, GamePhase.NIGHT)).not.toThrow();
  });

  it("should throw GameLogicError when phase does not match", () => {
    const G = createTestState();
    G.status = GamePhase.DAY;

    expect(() => assertPhase(G, GamePhase.NIGHT)).toThrow(GameLogicError);
    expect(() => assertPhase(G, GamePhase.NIGHT)).toThrow(
      "Expected phases: night",
    );
  });

  it("should throw GameLogicError with multiple allowed phases", () => {
    const G = createTestState();
    G.status = GamePhase.SETUP;

    expect(() => assertPhase(G, GamePhase.DAY, GamePhase.NIGHT)).toThrow(
      GameLogicError,
    );
    expect(() => assertPhase(G, GamePhase.DAY, GamePhase.NIGHT)).toThrow(
      "Expected phases: day, night",
    );
  });
});

describe("assertNotEmpty", () => {
  it("should pass for non-null values", () => {
    expect(() => assertNotEmpty("hello", "value")).not.toThrow();
    expect(() => assertNotEmpty(0, "number")).not.toThrow();
    expect(() => assertNotEmpty(false, "boolean")).not.toThrow();
    expect(() => assertNotEmpty([], "array")).not.toThrow();
    expect(() => assertNotEmpty({}, "object")).not.toThrow();
  });

  it("should throw GameLogicError for null values", () => {
    expect(() => assertNotEmpty(null, "field")).toThrow(GameLogicError);
    expect(() => assertNotEmpty(null, "field")).toThrow("field is required");
  });

  it("should throw GameLogicError for undefined values", () => {
    expect(() => assertNotEmpty(undefined, "field")).toThrow(GameLogicError);
    expect(() => assertNotEmpty(undefined, "field")).toThrow(
      "field is required",
    );
  });

  it("should throw GameLogicError for empty strings", () => {
    expect(() => assertNotEmpty("", "name")).toThrow(GameLogicError);
    expect(() => assertNotEmpty("   ", "name")).toThrow(
      "name cannot be empty",
    );
  });

  it("should pass for strings with content", () => {
    expect(() => assertNotEmpty("a", "name")).not.toThrow();
    expect(() => assertNotEmpty("  hello  ", "name")).not.toThrow();
  });
});

describe("assertPlayerAlive", () => {
  it("should return player info when player is alive", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "alive" });

    const result = assertPlayerAlive(G, "player1");

    expect(result).toBeDefined();
    expect(result.id).toBe("player1");
    expect(result.public).toBeDefined();
    expect(result.secret).toBeDefined();
  });

  it("should throw GameLogicError when player does not exist", () => {
    const G = createTestState();

    expect(() => assertPlayerAlive(G, "nonexistent")).toThrow(GameLogicError);
    expect(() => assertPlayerAlive(G, "nonexistent")).toThrow(
      "Player nonexistent not found",
    );
  });

  it("should throw GameLogicError when player is dead", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "dead" });

    expect(() => assertPlayerAlive(G, "player1")).toThrow(GameLogicError);
    expect(() => assertPlayerAlive(G, "player1")).toThrow(
      "Player player1 is not alive",
    );
  });

  it("should throw GameLogicError when player is wreck", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "wreck" });

    expect(() => assertPlayerAlive(G, "player1")).toThrow(GameLogicError);
    expect(() => assertPlayerAlive(G, "player1")).toThrow(
      "Player player1 is not alive",
    );
  });

  it("should return player info when player is witch (considered alive)", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "witch", isWitch: true });

    const result = assertPlayerAlive(G, "player1");

    expect(result).toBeDefined();
    expect(result.id).toBe("player1");
    expect(result.secret.isWitch).toBe(true);
  });

  it("should throw GameLogicError when public info exists but secrets are missing", () => {
    const G = createTestState();
    G.players["player1"] = {
      id: "player1",
      seatNumber: 1,
      status: "alive",
    };
    // Intentionally not adding secrets

    expect(() => assertPlayerAlive(G, "player1")).toThrow(GameLogicError);
    expect(() => assertPlayerAlive(G, "player1")).toThrow(
      "Player player1 not found",
    );
  });
});

describe("assertPlayerPublicAlive", () => {
  it("should return public info when player is alive", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "alive" });

    const result = assertPlayerPublicAlive(G, "player1");

    expect(result).toBeDefined();
    expect(result.id).toBe("player1");
    expect(result.status).toBe("alive");
  });

  it("should return public info when player is witch (shows as alive)", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "witch", isWitch: true });
    // Public status for witch is "alive"
    G.players["player1"].status = "alive";

    const result = assertPlayerPublicAlive(G, "player1");

    expect(result).toBeDefined();
    expect(result.status).toBe("alive");
  });

  it("should throw GameLogicError when player does not exist", () => {
    const G = createTestState();

    expect(() => assertPlayerPublicAlive(G, "nonexistent")).toThrow(
      GameLogicError,
    );
    expect(() => assertPlayerPublicAlive(G, "nonexistent")).toThrow(
      "Player nonexistent not found",
    );
  });

  it("should throw GameLogicError when player is dead", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "dead" });

    expect(() => assertPlayerPublicAlive(G, "player1")).toThrow(GameLogicError);
    expect(() => assertPlayerPublicAlive(G, "player1")).toThrow(
      "Player player1 is not alive",
    );
  });

  it("should throw GameLogicError when player is wreck (shows as dead)", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", status: "wreck" });
    // Public status for wreck is "dead"
    G.players["player1"].status = "dead";

    expect(() => assertPlayerPublicAlive(G, "player1")).toThrow(GameLogicError);
    expect(() => assertPlayerPublicAlive(G, "player1")).toThrow(
      "Player player1 is not alive",
    );
  });
});

describe("assertCardInHand", () => {
  it("should return card info when card exists in hand", () => {
    const G = createTestState();
    const card = createCard("card1", "kill");
    setupPlayer(G, { id: "player1", hand: [card] });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    const result = assertCardInHand(player, "card1");

    expect(result).toBeDefined();
    expect(result.index).toBe(0);
    expect(result.card).toEqual(card);
  });

  it("should find card at correct index", () => {
    const G = createTestState();
    const card1 = createCard("card1", "kill");
    const card2 = createCard("card2", "detect");
    const card3 = createCard("card3", "barrier");
    setupPlayer(G, { id: "player1", hand: [card1, card2, card3] });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    const result = assertCardInHand(player, "card2");

    expect(result.index).toBe(1);
    expect(result.card.type).toBe("detect");
  });

  it("should throw GameLogicError when card is not in hand", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", hand: [createCard("card1", "kill")] });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    expect(() => assertCardInHand(player, "nonexistent")).toThrow(
      GameLogicError,
    );
    expect(() => assertCardInHand(player, "nonexistent")).toThrow(
      "Card nonexistent not found in hand",
    );
  });

  it("should throw GameLogicError when hand is empty", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", hand: [] });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    expect(() => assertCardInHand(player, "any")).toThrow(GameLogicError);
  });
});

describe("assertWitchKillerCardAllowed", () => {
  it("should pass when player is not witch killer holder", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", witchKillerHolder: false });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    expect(() => assertWitchKillerCardAllowed(player, "kill")).not.toThrow();
    expect(() => assertWitchKillerCardAllowed(player, "detect")).not.toThrow();
    expect(() => assertWitchKillerCardAllowed(player, "barrier")).not.toThrow();
  });

  it("should pass when witch killer holder uses witch killer card", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", witchKillerHolder: true });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    expect(() =>
      assertWitchKillerCardAllowed(player, "witch_killer"),
    ).not.toThrow();
  });

  it("should throw GameLogicError when witch killer holder uses other cards", () => {
    const G = createTestState();
    setupPlayer(G, { id: "player1", witchKillerHolder: true });
    const player = {
      id: "player1",
      public: G.players["player1"],
      secret: G.secrets["player1"],
    };

    expect(() => assertWitchKillerCardAllowed(player, "kill")).toThrow(
      GameLogicError,
    );
    expect(() => assertWitchKillerCardAllowed(player, "kill")).toThrow(
      "Witch killer holder can only use witch killer card",
    );
    expect(() => assertWitchKillerCardAllowed(player, "detect")).toThrow(
      GameLogicError,
    );
    expect(() => assertWitchKillerCardAllowed(player, "barrier")).toThrow(
      GameLogicError,
    );
  });
});

describe("assertValidMessage", () => {
  it("should pass for valid messages", () => {
    expect(() => assertValidMessage("Hello")).not.toThrow();
    expect(() => assertValidMessage("Hello World")).not.toThrow();
    expect(() => assertValidMessage("  Trimmed  ")).not.toThrow();
    expect(() => assertValidMessage("a".repeat(500))).not.toThrow();
  });

  it("should throw GameLogicError for empty messages", () => {
    expect(() => assertValidMessage("")).toThrow(GameLogicError);
    expect(() => assertValidMessage("")).toThrow("Message cannot be empty");
  });

  it("should throw GameLogicError for whitespace-only messages", () => {
    expect(() => assertValidMessage("   ")).toThrow(GameLogicError);
    expect(() => assertValidMessage("\t\n  ")).toThrow(GameLogicError);
  });

  it("should throw GameLogicError for messages exceeding 500 chars", () => {
    const longMessage = "a".repeat(501);
    expect(() => assertValidMessage(longMessage)).toThrow(GameLogicError);
    expect(() => assertValidMessage(longMessage)).toThrow(
      "Message too long (max 500 chars)",
    );
  });

  it("should pass for messages exactly 500 chars", () => {
    const exactMessage = "a".repeat(500);
    expect(() => assertValidMessage(exactMessage)).not.toThrow();
  });
});

describe("assertions edge cases", () => {
  it("should handle empty game state for player assertions", () => {
    const G = createTestState();
    // No players set up

    expect(() => assertPlayerAlive(G, "any")).toThrow(GameLogicError);
    expect(() => assertPlayerPublicAlive(G, "any")).toThrow(GameLogicError);
  });

  it("should handle multiple players correctly", () => {
    const G = createTestState();
    setupPlayers(G, [
      { id: "p1", status: "alive" },
      { id: "p2", status: "dead" },
      { id: "p3", status: "witch", isWitch: true },
    ]);

    // p1 is alive
    expect(() => assertPlayerAlive(G, "p1")).not.toThrow();

    // p2 is dead
    expect(() => assertPlayerAlive(G, "p2")).toThrow(GameLogicError);

    // p3 is witch (considered alive)
    expect(() => assertPlayerAlive(G, "p3")).not.toThrow();
  });
});
