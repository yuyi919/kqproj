import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import {
  makeBaseLayer,
  makeCard,
  makeBarrierCard,
  makeCheckCard,
  makeDetectCard,
  makeKillCard,
  makeWitchKillerCard,
} from "../../__tests__/helpers";
import { CardService } from "./cardService";
import type { CardPoolConfig, CardType } from "../../types";

// ==================== Test Helpers ====================

/**
 * 运行 CardService Effect
 */
function runCardService<T>(effect: Effect.Effect<T, never, unknown>): T {
  return Effect.runSync(effect.pipe(Effect.provide(makeBaseLayer())));
}

/**
 * 创建测试用的牌池配置
 */
function createTestCardPool(): CardPoolConfig {
  return {
    witch_killer: 1,
    barrier: 3,
    kill: 2,
    detect: 2,
    check: 2,
  };
}

// ==================== Tests ====================

describe("CardService", () => {
  describe("createCard", () => {
    it("should create a card with valid id and type", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.createCard("kill");
      });

      const card = runCardService(program);

      expect(card.type).toBe("kill");
      expect(card.id).toBeDefined();
      expect(typeof card.id).toBe("string");
      expect(card.id.length).toBeGreaterThan(0);
    });

    it("should create cards of all types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const types: CardType[] = ["witch_killer", "barrier", "kill", "detect", "check"];
        return types.map((type) => service.createCard(type));
      });

      const cards = runCardService(program);

      expect(cards).toHaveLength(5);
      expect(cards.map((c) => c.type)).toEqual(["witch_killer", "barrier", "kill", "detect", "check"]);
    });

    it("should create unique card ids", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const card1 = service.createCard("kill");
        const card2 = service.createCard("kill");
        return [card1.id, card2.id];
      });

      const [id1, id2] = runCardService(program);

      expect(id1).not.toBe(id2);
    });
  });

  describe("getCardDefinition", () => {
    it("should return complete card definition for valid card ref", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const cardRef = makeKillCard("test-kill-1");
        return service.getCardDefinition(cardRef);
      });

      const card = runCardService(program);

      expect(card.id).toBe("test-kill-1");
      expect(card.type).toBe("kill");
      expect(card.name).toBe("杀人魔法");
      expect(card.description).toContain("攻击");
      expect(card.icon).toBe("🔪");
      expect(card.consumable).toBe(true);
      expect(card.priority).toBe(80);
    });

    it("should return correct definition for witch_killer", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const cardRef = makeWitchKillerCard("test-wk-1");
        return service.getCardDefinition(cardRef);
      });

      const card = runCardService(program);

      expect(card.type).toBe("witch_killer");
      expect(card.name).toBe("魔女杀手");
      expect(card.consumable).toBe(false);
      expect(card.priority).toBe(100);
    });

    it("should return correct definition for barrier", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const cardRef = makeBarrierCard("test-barrier-1");
        return service.getCardDefinition(cardRef);
      });

      const card = runCardService(program);

      expect(card.type).toBe("barrier");
      expect(card.name).toBe("结界魔法");
      expect(card.consumable).toBe(true);
      expect(card.priority).toBe(50);
    });
  });

  describe("getCardDefinitionByType", () => {
    it("should return definition without id for each card type", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return {
          kill: service.getCardDefinitionByType("kill"),
          detect: service.getCardDefinitionByType("detect"),
          check: service.getCardDefinitionByType("check"),
        };
      });

      const defs = runCardService(program);

      expect(defs.kill.type).toBe("kill");
      expect(defs.kill.name).toBe("杀人魔法");
      expect(defs.detect.name).toBe("探知魔法");
      expect(defs.check.name).toBe("检定魔法");
    });
  });

  describe("createDeck", () => {
    it("should create deck with correct card count", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const config = createTestCardPool();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return service.createDeck(config, (arr: any[]) => [...arr]);
      });

      const deck = runCardService(program);

      // 1 + 3 + 2 + 2 + 2 = 10 cards
      expect(deck).toHaveLength(10);
    });

    it("should use provided shuffle function", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const config = createTestCardPool();
        const shuffleMock = <T>(arr: T[]): T[] => arr.reverse();
        return service.createDeck(config, shuffleMock);
      });

      const deck = runCardService(program);

      // After reverse, check cards should be first
      expect(deck.slice(0, 2).every((c) => c.type === "check")).toBe(true);
    });

    it("should create unique card ids for all cards", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const config = createTestCardPool();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return service.createDeck(config, (arr: any[]) => [...arr]);
      });

      const deck = runCardService(program);
      const ids = deck.map((c) => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should create correct distribution of card types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const config = createTestCardPool();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return service.createDeck(config, (arr: any[]) => [...arr]);
      });

      const deck = runCardService(program);
      const typeCounts = deck.reduce(
        (acc, card) => {
          acc[card.type] = (acc[card.type] || 0) + 1;
          return acc;
        },
        {} as Record<CardType, number>,
      );

      expect(typeCounts.witch_killer).toBe(1);
      expect(typeCounts.barrier).toBe(3);
      expect(typeCounts.kill).toBe(2);
      expect(typeCounts.detect).toBe(2);
      expect(typeCounts.check).toBe(2);
    });
  });

  describe("getCardTypeName", () => {
    it("should return correct names for all card types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return {
          witch_killer: service.getCardTypeName("witch_killer"),
          barrier: service.getCardTypeName("barrier"),
          kill: service.getCardTypeName("kill"),
          detect: service.getCardTypeName("detect"),
          check: service.getCardTypeName("check"),
        };
      });

      const names = runCardService(program);

      expect(names.witch_killer).toBe("魔女杀手");
      expect(names.barrier).toBe("结界魔法");
      expect(names.kill).toBe("杀人魔法");
      expect(names.detect).toBe("探知魔法");
      expect(names.check).toBe("检定魔法");
    });

    it("should return unknown name for invalid type", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return service.getCardTypeName("invalid" as any);
      });

      const name = runCardService(program);

      expect(name).toBe("未知卡牌");
    });
  });

  describe("getCardTypeDescription", () => {
    it("should return non-empty descriptions for all card types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        const types: CardType[] = ["witch_killer", "barrier", "kill", "detect", "check"];
        return types.map((type) => service.getCardTypeDescription(type));
      });

      const descriptions = runCardService(program);

      descriptions.forEach((desc) => {
        expect(typeof desc).toBe("string");
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getCardIcon", () => {
    it("should return correct icons for all card types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return {
          witch_killer: service.getCardIcon("witch_killer"),
          barrier: service.getCardIcon("barrier"),
          kill: service.getCardIcon("kill"),
          detect: service.getCardIcon("detect"),
          check: service.getCardIcon("check"),
        };
      });

      const icons = runCardService(program);

      expect(icons.witch_killer).toBe("⚔️");
      expect(icons.barrier).toBe("🛡️");
      expect(icons.kill).toBe("🔪");
      expect(icons.detect).toBe("🔍");
      expect(icons.check).toBe("🔬");
    });

    it("should return default icon for invalid type", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return service.getCardIcon("invalid" as any);
      });

      const icon = runCardService(program);

      expect(icon).toBe("🃏");
    });
  });

  describe("getAllCardTypes", () => {
    it("should return all 5 card types", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.getAllCardTypes();
      });

      const types = runCardService(program);

      expect(types).toHaveLength(5);
      expect(types).toContain("witch_killer");
      expect(types).toContain("barrier");
      expect(types).toContain("kill");
      expect(types).toContain("detect");
      expect(types).toContain("check");
    });
  });

  describe("isAttackCard", () => {
    it("should return true for witch_killer", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isAttackCard("witch_killer");
      });

      expect(runCardService(program)).toBe(true);
    });

    it("should return true for kill", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isAttackCard("kill");
      });

      expect(runCardService(program)).toBe(true);
    });

    it("should return false for barrier", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isAttackCard("barrier");
      });

      expect(runCardService(program)).toBe(false);
    });

    it("should return false for detect", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isAttackCard("detect");
      });

      expect(runCardService(program)).toBe(false);
    });

    it("should return false for check", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isAttackCard("check");
      });

      expect(runCardService(program)).toBe(false);
    });
  });

  describe("isDefenseCard", () => {
    it("should return true for barrier", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isDefenseCard("barrier");
      });

      expect(runCardService(program)).toBe(true);
    });

    it("should return false for attack cards", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return {
          witch_killer: service.isDefenseCard("witch_killer"),
          kill: service.isDefenseCard("kill"),
        };
      });

      const result = runCardService(program);
      expect(result.witch_killer).toBe(false);
      expect(result.kill).toBe(false);
    });
  });

  describe("isIntelligenceCard", () => {
    it("should return true for detect", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isIntelligenceCard("detect");
      });

      expect(runCardService(program)).toBe(true);
    });

    it("should return true for check", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return service.isIntelligenceCard("check");
      });

      expect(runCardService(program)).toBe(true);
    });

    it("should return false for non-intelligence cards", () => {
      const program = Effect.gen(function* () {
        const service = yield* CardService;
        return {
          witch_killer: service.isIntelligenceCard("witch_killer"),
          barrier: service.isIntelligenceCard("barrier"),
          kill: service.isIntelligenceCard("kill"),
        };
      });

      const result = runCardService(program);
      expect(result.witch_killer).toBe(false);
      expect(result.barrier).toBe(false);
      expect(result.kill).toBe(false);
    });
  });
});
