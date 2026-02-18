/**
 * UI Formatters Tests
 *
 * 测试 UI 格式化函数：
 * - 卡牌名称格式化
 * - 阶段格式化
 * - 玩家状态格式化
 * - 死因格式化
 * - 时间格式化
 * - 投票结果格式化
 */

import { describe, expect, it } from "bun:test";
import { GamePhase } from "../types";
import {
  formatAlivePlayerList,
  formatDuration,
  formatRelativeTime,
  formatVoteSummary,
  getCardIcon,
  getCardTypeDescription,
  getCardTypeName,
  getDeathCauseName,
  getPhaseColor,
  getPhaseDescription,
  getPhaseName,
  getPlayerStatusColor,
  getPlayerStatusName,
} from "./formatters";

// ==================== 卡牌格式化测试 ====================

describe("卡牌格式化", () => {
  describe("getCardTypeName", () => {
    it("应返回正确的中文名称", () => {
      expect(getCardTypeName("witch_killer")).toBe("魔女杀手");
      expect(getCardTypeName("barrier")).toBe("结界魔法");
      expect(getCardTypeName("kill")).toBe("杀人魔法");
      expect(getCardTypeName("detect")).toBe("探知魔法");
      expect(getCardTypeName("check")).toBe("检定魔法");
    });

    it("未知卡牌类型应返回默认文本", () => {
      // @ts-expect-error - 测试无效输入
      expect(getCardTypeName("unknown")).toBe("未知卡牌");
    });
  });

  describe("getCardTypeDescription", () => {
    it("应返回正确的卡牌描述", () => {
      expect(getCardTypeDescription("witch_killer")).toBe(
        "对目标发动攻击（优先度最高），持有者魔女化",
      );
      expect(getCardTypeDescription("barrier")).toBe("保护自身当夜免受攻击");
      expect(getCardTypeDescription("kill")).toBe(
        "对目标发动攻击，成功击杀后魔女化",
      );
      expect(getCardTypeDescription("detect")).toBe(
        "探知目标手牌总数并随机获悉其中一张",
      );
      expect(getCardTypeDescription("check")).toBe("查验已死亡玩家的死因");
    });

    it("未知卡牌类型应返回空字符串", () => {
      // @ts-expect-error - 测试无效输入
      expect(getCardTypeDescription("unknown")).toBe("");
    });
  });

  describe("getCardIcon", () => {
    it("应返回正确的图标", () => {
      expect(getCardIcon("witch_killer")).toBe("⚔️");
      expect(getCardIcon("barrier")).toBe("🛡️");
      expect(getCardIcon("kill")).toBe("🔪");
      expect(getCardIcon("detect")).toBe("🔍");
      expect(getCardIcon("check")).toBe("🔬");
    });

    it("未知卡牌类型应返回默认图标", () => {
      // @ts-expect-error - 测试无效输入
      expect(getCardIcon("unknown")).toBe("🃏");
    });
  });
});

// ==================== 阶段格式化测试 ====================

describe("阶段格式化", () => {
  describe("getPhaseName", () => {
    it("应返回正确的阶段名称", () => {
      expect(getPhaseName(GamePhase.LOBBY)).toBe("等待加入");
      expect(getPhaseName(GamePhase.SETUP)).toBe("游戏准备");
      expect(getPhaseName(GamePhase.MORNING)).toBe("晨间阶段");
      expect(getPhaseName(GamePhase.DAY)).toBe("午间阶段");
      expect(getPhaseName(GamePhase.NIGHT)).toBe("夜间阶段");
      expect(getPhaseName(GamePhase.DEEP_NIGHT)).toBe("深夜阶段");
      expect(getPhaseName(GamePhase.CARD_SELECTION)).toBe("卡牌选择");
      expect(getPhaseName(GamePhase.RESOLUTION)).toBe("行动结算");
      expect(getPhaseName(GamePhase.ENDED)).toBe("游戏结束");
    });

    it("未知阶段应返回默认文本", () => {
      // @ts-expect-error - 测试无效输入
      expect(getPhaseName("unknown")).toBe("未知阶段");
    });
  });

  describe("getPhaseDescription", () => {
    it("应返回正确的阶段描述", () => {
      expect(getPhaseDescription(GamePhase.LOBBY)).toBe("等待更多玩家加入游戏");
      expect(getPhaseDescription(GamePhase.SETUP)).toBe("正在初始化游戏...");
      expect(getPhaseDescription(GamePhase.MORNING)).toBe(
        "公布夜间发生的死亡信息",
      );
      expect(getPhaseDescription(GamePhase.DAY)).toBe("自由讨论和交易时间");
      expect(getPhaseDescription(GamePhase.NIGHT)).toBe("投票决定监禁对象");
      expect(getPhaseDescription(GamePhase.DEEP_NIGHT)).toBe(
        "使用手牌进行暗中行动",
      );
      expect(getPhaseDescription(GamePhase.CARD_SELECTION)).toBe(
        "选择击杀后获得的卡牌",
      );
      expect(getPhaseDescription(GamePhase.RESOLUTION)).toBe(
        "结算所有行动结果",
      );
      expect(getPhaseDescription(GamePhase.ENDED)).toBe("游戏已结束");
    });

    it("未知阶段应返回空字符串", () => {
      // @ts-expect-error - 测试无效输入
      expect(getPhaseDescription("unknown")).toBe("");
    });
  });

  describe("getPhaseColor", () => {
    it("应返回正确的阶段颜色", () => {
      expect(getPhaseColor(GamePhase.LOBBY)).toBe("default");
      expect(getPhaseColor(GamePhase.SETUP)).toBe("processing");
      expect(getPhaseColor(GamePhase.MORNING)).toBe("orange");
      expect(getPhaseColor(GamePhase.DAY)).toBe("blue");
      expect(getPhaseColor(GamePhase.NIGHT)).toBe("warning");
      expect(getPhaseColor(GamePhase.DEEP_NIGHT)).toBe("purple");
      expect(getPhaseColor(GamePhase.CARD_SELECTION)).toBe("magenta");
      expect(getPhaseColor(GamePhase.RESOLUTION)).toBe("cyan");
      expect(getPhaseColor(GamePhase.ENDED)).toBe("success");
    });

    it("未知阶段应返回默认颜色", () => {
      // @ts-expect-error - 测试无效输入
      expect(getPhaseColor("unknown")).toBe("default");
    });
  });
});

// ==================== 玩家状态格式化测试 ====================

describe("玩家状态格式化", () => {
  describe("getPlayerStatusName", () => {
    it("应返回正确的状态名称", () => {
      expect(getPlayerStatusName("alive")).toBe("存活");
      expect(getPlayerStatusName("dead")).toBe("死亡");
      expect(getPlayerStatusName("witch")).toBe("魔女化");
      expect(getPlayerStatusName("wreck")).toBe("残骸化");
    });

    it("未知状态应返回默认文本", () => {
      // @ts-expect-error - 测试无效输入
      expect(getPlayerStatusName("unknown")).toBe("未知");
    });
  });

  describe("getPlayerStatusColor", () => {
    it("应返回正确的状态颜色", () => {
      expect(getPlayerStatusColor("alive")).toBe("#52c41a");
      expect(getPlayerStatusColor("dead")).toBe("#8c8c8c");
      expect(getPlayerStatusColor("witch")).toBe("#722ed1");
      expect(getPlayerStatusColor("wreck")).toBe("#f5222d");
    });

    it("未知状态应返回默认颜色", () => {
      // @ts-expect-error - 测试无效输入
      expect(getPlayerStatusColor("unknown")).toBe("#000000");
    });
  });
});

// ==================== 死因格式化测试 ====================

describe("死因格式化", () => {
  describe("getDeathCauseName", () => {
    it("应返回正确的死因名称", () => {
      expect(getDeathCauseName("witch_killer")).toBe("被魔女杀手击杀");
      expect(getDeathCauseName("kill_magic")).toBe("被杀人魔法击杀");
      expect(getDeathCauseName("wreck")).toBe("残骸化死亡");
    });

    it("未知死因应返回默认文本", () => {
      // @ts-expect-error - 测试无效输入
      expect(getDeathCauseName("unknown")).toBe("未知死因");
    });
  });
});

// ==================== 时间格式化测试 ====================

describe("时间格式化", () => {
  describe("formatDuration", () => {
    it("应正确格式化时长", () => {
      expect(formatDuration(0)).toBe("00:00");
      expect(formatDuration(30)).toBe("00:30");
      expect(formatDuration(60)).toBe("01:00");
      expect(formatDuration(90)).toBe("01:30");
      expect(formatDuration(125)).toBe("02:05");
      expect(formatDuration(3600)).toBe("60:00");
    });

    it("应处理超过60分钟的情况", () => {
      expect(formatDuration(3661)).toBe("61:01");
    });

    it("应正确处理边界值", () => {
      // 小数会被取整
      expect(formatDuration(1)).toBe("00:01");
    });
  });

  describe("formatRelativeTime", () => {
    it("应返回刚刚", () => {
      const now = Date.now();
      expect(formatRelativeTime(now)).toBe("刚刚");
      expect(formatRelativeTime(now - 30000)).toBe("刚刚");
      expect(formatRelativeTime(now - 59999)).toBe("刚刚");
    });

    it("应返回分钟前", () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60000)).toBe("1分钟前");
      expect(formatRelativeTime(now - 120000)).toBe("2分钟前");
      expect(formatRelativeTime(now - 3540000)).toBe("59分钟前");
    });

    it("应返回小时前", () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 3600000)).toBe("1小时前");
      expect(formatRelativeTime(now - 7200000)).toBe("2小时前");
      expect(formatRelativeTime(now - 86400000)).toBe("24小时前");
    });
  });
});

// ==================== 投票结果格式化测试 ====================

describe("投票结果格式化", () => {
  describe("formatVoteSummary", () => {
    it("应正确格式化投票摘要", () => {
      const voteCounts = { p1: 3, p2: 2, p3: 1 };
      const players = {
        p1: { seatNumber: 1 },
        p2: { seatNumber: 2 },
        p3: { seatNumber: 3 },
      };
      const result = formatVoteSummary(voteCounts, players);
      expect(result).toContain("玩家1: 3票");
      expect(result).toContain("玩家2: 2票");
      expect(result).toContain("玩家3: 1票");
    });

    it("应处理空投票", () => {
      const result = formatVoteSummary({}, {});
      expect(result).toBe("");
    });

    it("应处理无座位信息的玩家", () => {
      const voteCounts = { p1: 1 };
      const players = {};
      const result = formatVoteSummary(voteCounts, players);
      expect(result).toContain("p1: 1票");
    });
  });

  describe("formatAlivePlayerList", () => {
    it("应正确格式化存活玩家列表", () => {
      const players = [
        { id: "p1", seatNumber: 1 },
        { id: "p2", seatNumber: 2 },
        { id: "p3", seatNumber: 3 },
      ];
      const result = formatAlivePlayerList(players);
      expect(result).toContain("玩家1");
      expect(result).toContain("玩家2");
      expect(result).toContain("玩家3");
    });

    it("应处理空玩家列表", () => {
      const result = formatAlivePlayerList([]);
      expect(result).toBe("");
    });

    it("应正确连接多个玩家", () => {
      const players = [
        { id: "p1", seatNumber: 1 },
        { id: "p2", seatNumber: 2 },
      ];
      const result = formatAlivePlayerList(players);
      expect(result).toContain(", ");
    });
  });
});
