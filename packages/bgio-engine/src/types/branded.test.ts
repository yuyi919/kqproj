/**
 * Branded Types Tests
 *
 * 测试 Branded 类型：
 * - PlayerId 品牌类型
 * - CardId 品牌类型
 * - 类型守卫函数
 * - 工厂函数
 */

import { describe, expect, it } from "bun:test";
import { isCardId, isPlayerId, makeCardId, makePlayerId } from "./branded";

// ==================== PlayerId 测试 ====================

describe("PlayerId", () => {
  describe("makePlayerId", () => {
    it("应创建有效的 PlayerId", () => {
      const playerId = makePlayerId("p1");
      expect(playerId).toBe(makePlayerId("p1"));
      expect(typeof playerId).toBe("string");
    });

    it("应接受任意字符串作为 ID", () => {
      expect(makePlayerId("player1")).toBe(makePlayerId("player1"));
      expect(makePlayerId("")).toBe(makePlayerId(""));
      expect(makePlayerId("123")).toBe(makePlayerId("123"));
    });
  });

  describe("isPlayerId", () => {
    it("对 PlayerId 应返回 true", () => {
      const playerId = makePlayerId("p1");
      expect(isPlayerId(playerId)).toBe(true);
    });

    it("对普通字符串应返回 true", () => {
      // 注: isPlayerId 只是检查是否为字符串类型
      expect(isPlayerId("p1")).toBe(true);
      expect(isPlayerId("")).toBe(true);
    });

    it("对非字符串应返回 false", () => {
      expect(isPlayerId(null)).toBe(false);
      expect(isPlayerId(undefined)).toBe(false);
      expect(isPlayerId(123)).toBe(false);
      expect(isPlayerId({})).toBe(false);
      expect(isPlayerId([])).toBe(false);
    });
  });
});

// ==================== CardId 测试 ====================

describe("CardId", () => {
  describe("makeCardId", () => {
    it("应创建有效的 CardId", () => {
      const cardId = makeCardId("c1");
      expect(cardId).toBe(makeCardId("c1"));
      expect(typeof cardId).toBe("string");
    });

    it("应接受任意字符串作为 ID", () => {
      expect(makeCardId("card-001")).toBe(makeCardId("card-001"));
      expect(makeCardId("")).toBe(makeCardId(""));
      expect(makeCardId("abc123")).toBe(makeCardId("abc123"));
    });
  });

  describe("isCardId", () => {
    it("对 CardId 应返回 true", () => {
      const cardId = makeCardId("c1");
      expect(isCardId(cardId)).toBe(true);
    });

    it("对普通字符串应返回 true", () => {
      // 注: isCardId 只是检查是否为字符串类型
      expect(isCardId("c1")).toBe(true);
      expect(isCardId("")).toBe(true);
    });

    it("对非字符串应返回 false", () => {
      expect(isCardId(null)).toBe(false);
      expect(isCardId(undefined)).toBe(false);
      expect(isCardId(456)).toBe(false);
      expect(isCardId({})).toBe(false);
      expect(isCardId([])).toBe(false);
    });
  });
});

// ==================== 类型行为测试 ====================

describe("类型行为", () => {
  it("PlayerId 应该可以被赋值给 string 类型", () => {
    const playerId = makePlayerId("p1");
    const str: string = playerId;
    expect(str).toBe("p1");
  });

  it("CardId 应该可以被赋值给 string 类型", () => {
    const cardId = makeCardId("c1");
    const str: string = cardId;
    expect(str).toBe("c1");
  });

  it("两个 PlayerId 应该可以比较", () => {
    const p1 = makePlayerId("p1");
    const p2 = makePlayerId("p1");
    expect(p1).toBe(p2);
  });

  it("PlayerId 和 CardId 是不同的类型", () => {
    const playerId = makePlayerId("p1");
    const cardId = makeCardId("c1");
    // 它们在运行时都是字符串，但 TypeScript 会区分类型
    expect(playerId).not.toBe(cardId);
  });
});

// ==================== 边界情况测试 ====================

describe("边界情况", () => {
  it("空字符串应该是有效的 ID", () => {
    const playerId = makePlayerId("");
    expect(playerId).toBe(makePlayerId(""));
    expect(isPlayerId(playerId)).toBe(true);
  });

  it("特殊字符应该是有效的 ID", () => {
    const playerId = makePlayerId("player_1-2");
    expect(playerId).toBe(makePlayerId("player_1-2"));
  });

  it("应该可以用于对象键", () => {
    const playerId = makePlayerId("p1");
    const obj = { [playerId]: "test" };
    expect(obj.p1).toBe("test");
  });

  it("应该可以拼接字符串", () => {
    const playerId = makePlayerId("p1");
    const result = "player-" + playerId;
    expect(result).toBe("player-p1");
  });
});
