/**
 * 测试场景工厂模块
 *
 * 提供可复用的游戏场景设置，消除测试中的重复代码
 */

import { beforeEach, describe, expect, it } from "bun:test";
import type {
  BGGameState,
  CardRef,
  NightAction,
  PlayerStatus,
  PrivatePlayerInfo,
  PublicPlayerStatus,
} from "../types";
import { GamePhase } from "../types/core";
import {
  createMockRandom,
  createNightAction,
  createPlayerWithHand,
  createTestState,
  createWitchKillerHolder,
  createWitchPlayer,
  type PlayerSetup,
  SEVEN_PLAYER_CONFIG,
  setupPlayers,
} from "./testUtils";

// ==================== 场景接口 ====================

export interface Scenario {
  name: string;
  setup: () => BGGameState;
  expected: {
    deadPlayers?: string[];
    alivePlayers?: string[];
    witchPlayers?: string[];
    handCounts?: Record<string, number>;
  };
}

// ==================== 基础场景构建器 ====================

/**
 * 创建基础 3 玩家场景（适合简单测试）
 */
export function createBasic3PlayerScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, ["p1", "p2", "p3"]);
  return G;
}

/**
 * 创建基础 4 玩家场景（适合配额测试）
 */
export function createBasic4PlayerScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, ["p1", "p2", "p3", "p4"]);
  return G;
}

/**
 * 创建 7 玩家完整配置场景
 */
export function createFull7PlayerScenario(): BGGameState {
  const G = createTestState(SEVEN_PLAYER_CONFIG);
  setupPlayers(G, ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
  return G;
}

// ==================== 击杀场景 ====================

/**
 * 场景：基本 witch_killer 击杀
 *
 * p1 持有 witch_killer 攻击 p2
 * p2 持有 kill 攻击 p3
 * p3 使用 detect 查看 p1
 *
 * 预期：p2 被 witch_killer 杀死
 */
export function createWitchKillerKillScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "wk1", type: "witch_killer" }] },
    { id: "p2", hand: [{ id: "k1", type: "kill" }] },
    { id: "p3", hand: [{ id: "d1", type: "detect" }] },
  ]);

  G.nightActions.push(
    createNightAction("p1", "witch_killer", "p2"),
    createNightAction("p2", "kill", "p3"),
    createNightAction("p3", "detect", "p1"),
  );

  return G;
}

/**
 * 场景：Barrier 防御成功
 *
 * p1 使用 barrier
 * p2 持有 kill 攻击 p1
 *
 * 预期：p1 存活（barrier 防御成功）
 */
export function createBarrierDefenseScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "b1", type: "barrier" }] },
    { id: "p2", hand: [{ id: "k1", type: "kill" }] },
    { id: "p3", hand: [] },
  ]);

  G.nightActions.push(
    createNightAction("p1", "barrier"),
    createNightAction("p2", "kill", "p1"),
  );

  return G;
}

/**
 * 场景：配额超额
 *
 * 4 个玩家各持有 1 个 kill
 * 所有 kill 攻击不同目标
 *
 * 预期：3 个玩家死亡（超出配额的部分失败）
 */
export function createQuotaExceededScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "k2", type: "kill" }] },
    { id: "p3", hand: [{ id: "k3", type: "kill" }] },
    { id: "p4", hand: [{ id: "k4", type: "kill" }] },
  ]);

  // 所有 kill 攻击不同目标
  G.nightActions.push(
    createNightAction("p1", "kill", "p2"),
    createNightAction("p2", "kill", "p3"),
    createNightAction("p3", "kill", "p4"),
    createNightAction("p4", "kill", "p1"),
  );

  return G;
}

/**
 * 场景：目标已死亡
 *
 * p1 和 p2 都攻击 p3
 *
 * 预期：只有 p3 死亡，第二个攻击失败
 */
export function createTargetAlreadyDeadScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "k2", type: "kill" }] },
    { id: "p3", hand: [{ id: "k3", type: "kill" }] },
  ]);

  // p1 和 p2 都攻击 p3
  G.nightActions.push(
    createNightAction("p1", "kill", "p3"),
    createNightAction("p2", "kill", "p3"),
  );

  return G;
}

/**
 * 场景：Witch 转换
 *
 * p1 持有 witch_killer 杀死 p3
 * p2 使用 kill 攻击 p1
 *
 * 预期：p3 死亡，p1 成为 witch
 */
export function createWitchTransformationScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "wk1", type: "witch_killer" }] },
    { id: "p2", hand: [{ id: "k1", type: "kill" }] },
    { id: "p3", hand: [{ id: "d1", type: "detect" }] },
  ]);

  // p1 用 witch_killer 杀死 p3，p2 用 kill 攻击 p1
  G.nightActions.push(
    createNightAction("p1", "witch_killer", "p3"),
    createNightAction("p2", "kill", "p1"),
  );

  return G;
}

// ==================== 探测场景 ====================

/**
 * 场景：基本 Detect 行动
 *
 * p1 使用 detect 查看 p2
 * p2 持有 detect 和 check
 *
 * 预期：p1 获得 p2 的手牌信息
 */
export function createDetectScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "d1", type: "detect" }] },
    {
      id: "p2",
      hand: [
        { id: "d2", type: "detect" },
        { id: "c1", type: "check" },
      ],
    },
    { id: "p3", hand: [] },
  ]);

  G.nightActions.push(createNightAction("p1", "detect", "p2"));

  return G;
}

/**
 * 场景：Detect 空手牌目标
 *
 * p1 使用 detect 查看 p2
 * p2 手牌为空
 *
 * 预期：p1 获得手牌数为 0，无可见卡牌
 */
export function createDetectEmptyHandScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "d1", type: "detect" }] },
    { id: "p2", hand: [] },
  ]);

  G.nightActions.push(createNightAction("p1", "detect", "p2"));

  return G;
}

/**
 * 场景：Detect witch_killer 显示为 kill
 *
 * p1 使用 detect 查看 p2
 * p2 持有 witch_killer
 *
 * 预期：p1 看到 witch_killer 显示为 "kill"
 */
export function createDetectWitchKillerHiddenScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "d1", type: "detect" }] },
    { id: "p2", hand: [{ id: "wk1", type: "witch_killer" }] },
  ]);

  G.nightActions.push(createNightAction("p1", "detect", "p2"));

  return G;
}

// ==================== 检定场景 ====================

/**
 * 场景：检定 witch_killer 死亡
 *
 * p1 使用 check 查看 p2
 * p2 死于 witch_killer
 *
 * 预期：检定结果为 witch_killer
 */
export function createCheckWitchKillerDeathScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "c1", type: "check" }] },
    { id: "p2", hand: [] },
  ]);

  // 先设置 p2 死亡原因为 witch_killer
  G.secrets["p2"].status = "dead";
  G.secrets["p2"].deathCause = "witch_killer";
  G.players["p2"].status = "dead";

  G.nightActions.push(createNightAction("p1", "check", "p2"));

  return G;
}

/**
 * 场景：检定其他原因死亡
 *
 * p1 使用 check 查看 p2
 * p2 死于 kill_magic
 *
 * 预期：检定结果为 kill_magic
 */
export function createCheckOtherDeathScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "c1", type: "check" }] },
    { id: "p2", hand: [] },
  ]);

  G.secrets["p2"].status = "dead";
  G.secrets["p2"].deathCause = "kill_magic";
  G.players["p2"].status = "dead";

  G.nightActions.push(createNightAction("p1", "check", "p2"));

  return G;
}

/**
 * 场景：检定 wreck 死亡（无死因）
 *
 * p1 使用 check 查看 p2
 * p2 死亡但无死因记录
 *
 * 预期：检定结果默认为 wreck
 */
export function createCheckWreckDeathScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "c1", type: "check" }] },
    { id: "p2", hand: [] },
  ]);

  G.secrets["p2"].status = "dead";
  G.players["p2"].status = "dead";
  // 不设置 deathCause，默认为 wreck

  G.nightActions.push(createNightAction("p1", "check", "p2"));

  return G;
}

// ==================== 弃权场景 ====================

/**
 * 场景：部分玩家弃权
 *
 * p1 使用 kill 攻击 p2
 * p3 弃权
 *
 * 预期：p2 死亡，弃权不产生效果
 */
export function createPartialPassScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "k2", type: "kill" }] },
    { id: "p3", hand: [{ id: "k3", type: "kill" }] },
  ]);

  G.nightActions.push(createNightAction("p1", "kill", "p2"), {
    id: "na-p3",
    timestamp: Date.now(),
    playerId: "p3",
    card: null,
  } as NightAction);

  return G;
}

/**
 * 场景：全部弃权
 *
 * 所有玩家都弃权
 *
 * 预期：无玩家死亡
 */
export function createAllPassScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, ["p1", "p2", "p3"]);

  G.nightActions.push(
    {
      id: "na-p1",
      timestamp: Date.now(),
      playerId: "p1",
      card: null,
    } as NightAction,
    {
      id: "na-p2",
      timestamp: Date.now() + 1,
      playerId: "p2",
      card: null,
    } as NightAction,
    {
      id: "na-p3",
      timestamp: Date.now() + 2,
      playerId: "p3",
      card: null,
    } as NightAction,
  );

  return G;
}

// ==================== 投票场景 ====================

/**
 * 场景：简单投票
 *
 * p1 投票给 p2
 * p2 投票给 p3
 *
 * 预期：形成投票记录
 */
export function createSimpleVotingScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, ["p1", "p2", "p3"]);
  G.status = GamePhase.NIGHT;

  G.currentVotes.push(
    { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
    { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() + 1 },
  );

  return G;
}

/**
 * 场景：平票投票
 *
 * p1 投票给 p2
 * p2 投票给 p1
 *
 * 预期：平票，无人被囚禁
 */
export function createTiedVotingScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, ["p1", "p2", "p3"]);
  G.status = GamePhase.NIGHT;

  G.currentVotes.push(
    { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
    { voterId: "p2", targetId: "p1", round: 1, timestamp: Date.now() + 1 },
  );

  return G;
}

// ==================== 交易场景 ====================

/**
 * 场景：主动交易
 *
 * p1 向 p2 请求交易
 *
 * 预期：创建活跃交易
 */
export function createTradeRequestScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "d1", type: "detect" }] },
  ]);
  G.status = GamePhase.DAY;

  G.activeTrade = {
    tradeId: "t1",
    initiatorId: "p1",
    targetId: "p2",
    offeredCardId: "k1",
    expiresAt: Date.now() + 60000,
  };

  return G;
}

/**
 * 场景：拒绝交易
 *
 * p1 向 p2 请求交易，p2 拒绝
 *
 * 预期：交易被拒绝，无卡牌转移
 */
export function createTradeRejectedScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "d1", type: "detect" }] },
  ]);
  G.status = GamePhase.DAY;

  // 模拟拒绝
  G.dailyTradeTracker = {
    p1: {
      hasInitiatedToday: true,
      hasReceivedOfferToday: false,
      hasTradedToday: false,
    },
    p2: {
      hasInitiatedToday: false,
      hasReceivedOfferToday: true,
      hasTradedToday: false,
    },
  };

  return G;
}

// ==================== 边缘情况场景 ====================

/**
 * 场景：连续无击杀回合
 *
 * p1 是 witch，连续多个回合无击杀
 *
 * 预期：consecutiveNoKillRounds 增加
 */
export function createConsecutiveNoKillScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [createWitchPlayer("p1"), { id: "p2", hand: [] }]);
  G.secrets["p1"].consecutiveNoKillRounds = 2;

  return G;
}

/**
 * 场景：夜间行动无目标
 *
 * p1 使用 kill 但无目标
 *
 * 预期：行动无效，不消耗卡牌
 */
export function createNoTargetActionScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [{ id: "p1", hand: [{ id: "k1", type: "kill" }] }]);

  G.nightActions.push(
    createNightAction("p1", "kill"), // 无 targetId
  );

  return G;
}

/**
 * 场景：玩家手牌已满
 *
 * p1 手牌已满（4 张），需要抽卡
 *
 * 预期：无法抽卡或需要弃牌
 */
export function createFullHandScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    {
      id: "p1",
      hand: [
        { id: "k1", type: "kill" },
        { id: "d1", type: "detect" },
        { id: "c1", type: "check" },
        { id: "b1", type: "barrier" },
      ],
    },
    { id: "p2", hand: [] },
  ]);
  G.deck = [{ id: "new1", type: "kill" }];

  return G;
}

/**
 * 场景：游戏结束检测
 *
 * 所有 witch 死亡
 *
 * 预期：游戏结束
 */
export function createGameOverScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", status: "dead" },
    { id: "p2", status: "dead" },
    { id: "p3", status: "alive", isWitch: false },
  ]);

  // 所有 witch 已死亡
  G.secrets["p1"].isWitch = true;
  G.secrets["p2"].isWitch = true;
  G.secrets["p1"].status = "dead";
  G.secrets["p2"].status = "dead";

  return G;
}

// =================组合=== 复杂场景 ====================

/**
 * 场景：完整夜间结算流程
 *
 * 包含：detect + barrier + kill + check
 *
 * 预期：正确处理所有行动
 */
export function createFullNightResolutionScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    {
      id: "p1",
      hand: [
        { id: "b1", type: "barrier" },
        { id: "k1", type: "kill" },
      ],
    },
    {
      id: "p2",
      hand: [
        { id: "d1", type: "detect" },
        { id: "c1", type: "check" },
      ],
    },
    { id: "p3", hand: [{ id: "k2", type: "kill" }] },
  ]);

  // p1 使用 barrier，p2 使用 detect 查看 p3，p3 攻击 p1
  G.nightActions.push(
    createNightAction("p1", "barrier"),
    createNightAction("p2", "detect", "p3"),
    createNightAction("p3", "kill", "p1"),
  );

  return G;
}

/**
 * 场景：多玩家同时结算
 *
 * p1, p2, p3 都使用 kill 互相攻击
 *
 * 预期：所有玩家死亡
 */
export function createMutualDestructionScenario(): BGGameState {
  const G = createTestState();
  setupPlayers(G, [
    { id: "p1", hand: [{ id: "k1", type: "kill" }] },
    { id: "p2", hand: [{ id: "k2", type: "kill" }] },
    { id: "p3", hand: [{ id: "k3", type: "kill" }] },
  ]);

  // 互相攻击
  G.nightActions.push(
    createNightAction("p1", "kill", "p2"),
    createNightAction("p2", "kill", "p3"),
    createNightAction("p3", "kill", "p1"),
  );

  return G;
}

// ==================== 辅助函数 ====================

/**
 * 运行场景并返回游戏状态
 */
export function runScenario(
  scenario: () => BGGameState,
  randomOverrides?: Partial<ReturnType<typeof createMockRandom>>,
): { G: BGGameState; random: ReturnType<typeof createMockRandom> } {
  const G = scenario();
  const random = createMockRandom(randomOverrides);
  return { G, random };
}

/**
 * 验证场景预期结果
 */
export function verifyScenario(
  G: BGGameState,
  expected: Scenario["expected"],
): void {
  if (expected.deadPlayers) {
    for (const pid of expected.deadPlayers) {
      expect(G.players[pid].status).toBe("dead");
    }
  }

  if (expected.alivePlayers) {
    for (const pid of expected.alivePlayers) {
      expect(G.players[pid].status).toBe("alive");
    }
  }

  if (expected.witchPlayers) {
    for (const pid of expected.witchPlayers) {
      expect(G.secrets[pid].isWitch).toBe(true);
    }
  }

  if (expected.handCounts) {
    for (const [pid, count] of Object.entries(expected.handCounts)) {
      expect(G.secrets[pid].hand).toHaveLength(count);
    }
  }
}
