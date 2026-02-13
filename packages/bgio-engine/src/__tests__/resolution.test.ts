import { describe, it, expect, beforeEach } from "bun:test";
import { resolveNightActions } from "../game/resolution";
import { WitchTrialGame } from "../game";
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
import {
  createMockRandom,
  createTestState,
  createPlayerViewContext,
  setupPlayers,
  SEVEN_PLAYER_CONFIG,
} from "./testUtils";

// ==================== 测试 ====================

describe("resolution", () => {
  let G: BGGameState;
  let mockRandom: RandomAPI;

  beforeEach(() => {
    G = createTestState();
    setupPlayers(G, ["p1", "p2", "p3"]);
    mockRandom = createMockRandom();
  });

  it("should resolve kill action correctly", () => {
    G.secrets.p1.hand = [{ id: "c1", type: "kill" }];
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "c1", type: "kill" },
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
    G.secrets.p2.hand = [{ id: "c2", type: "barrier" }];
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      card: { id: "c2", type: "barrier" },
    });
    // p1 kills p2
    G.secrets.p1.hand = [{ id: "c1", type: "kill" }];
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "c1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    expect(G.players["p2"].status).toBe("alive");
    expect(G.secrets["p1"].isWitch).toBe(false); // Kill failed, so no witch transform
  });

  it("should prioritise witch_killer over kill (priority check)", () => {
    // Priority rule: witch_killer (priority 5) resolves before kill (priority 4)
    // p1 uses witch_killer on p2
    // p2 uses kill on p3
    // If sorting works, p1 action comes before p2 action
    // Since p1's witch_killer kills p2 first, p2's kill should fail

    G.secrets.p1.hand = [{ id: "c1", type: "witch_killer" }];
    G.secrets.p1.witchKillerHolder = true;
    G.secrets.p2.hand = [{ id: "c2", type: "kill" }];

    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      card: { id: "c2", type: "kill" },
    });
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "c1", type: "witch_killer" },
    });

    resolveNightActions(G, mockRandom);

    // p1's witch_killer kills p2 first
    expect(G.players["p2"].status).toBe("dead");
    // p2's kill fails because p2 was killed by witch_killer
    expect(G.players["p3"].status).toBe("alive");
  });

  it("should handle simultaneous kills", () => {
    // p1 kills p2
    // p2 kills p1
    G.secrets.p1.hand = [{ id: "c1", type: "kill" }];
    G.secrets.p2.hand = [{ id: "c2", type: "kill" }];

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "c1", type: "kill" },
    });
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p1",
      card: { id: "c2", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // 按时间戳排序，p1先结算（先提交），p2被杀后 actor_dead
    // 只有 p2 死亡，p1 存活
    expect(G.players["p2"].status).toBe("dead");
    expect(G.players["p1"].status).toBe("alive");
  });

  it("should handle wreck logic (witch not killing)", () => {
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p1 does nothing

    resolveNightActions(G, mockRandom);

    // consecutiveNoKillRounds 增加到 2 后触发残骸化
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(2);
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("wreck");
    expect(G.deathLog[0].cause).toBe("wreck");
  });

  it("dead player should not trigger wreck in next round", () => {
    // p1 是魔女，p2 杀死 p1
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;
    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];

    // p2 杀死 p1
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已死亡
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("dead");
    expect(G.secrets["p2"].consecutiveNoKillRounds).toBe(0); // p2 成功击杀，重置

    // 在下一回合，p1 的 consecutiveNoKillRounds 应该保持不变
    const originalRounds = G.secrets["p1"].consecutiveNoKillRounds;
    resolveNightActions(G, mockRandom);
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(originalRounds);
  });

  it("previously dead player should not accumulate witch timer", () => {
    // 模拟一个之前已经死亡的玩家
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;
    G.secrets["p1"].status = "dead";
    G.players["p1"].status = "dead";

    // p2 使用 kill（不涉及 p1）
    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];
    G.secrets["p3"].hand = [{ id: "kill2", type: "kill" }];
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 的 consecutiveNoKillRounds 应该保持不变
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(1);
    // p3 应该已死亡
    expect(G.players["p3"].status).toBe("dead");
  });

  it("witch_killer holder should not trigger wreck after death", () => {
    // p1 是 witch_killer 持有者
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = false;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p1 攻击 p2（被 barrier 防御）
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
    G.secrets["p2"].hand = [{ id: "barrier1", type: "barrier" }];

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "wk1", type: "witch_killer" },
    });

    // p2 使用 barrier
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now() + 1,
      playerId: "p2",
      card: { id: "barrier1", type: "barrier" },
    });

    // p3 杀死 p1
    G.secrets["p3"].hand = [{ id: "kill1", type: "kill" }];
    G.nightActions.push({
      id: "na3",
      timestamp: Date.now() + 2,
      playerId: "p3",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已死亡
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("dead");

    // p1 的 consecutiveNoKillRounds 应该保持不变
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(1);
  });

  it("witch_killer holder should wreck after 2 consecutive no-kill rounds", () => {
    // p1 是 witch_killer 持有者
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p1 放弃行动
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    // p2 使用 barrier 防御
    G.secrets["p2"].hand = [{ id: "barrier1", type: "barrier" }];
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      card: { id: "barrier1", type: "barrier" },
    });

    resolveNightActions(G, mockRandom);

    // witch_killer 持有者连续两晚未击杀，应该 wreck
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("wreck");
    expect(G.secrets["p1"].consecutiveNoKillRounds).toBe(2);
    expect(G.deathLog[0].cause).toBe("wreck");
  });

  it("witch_killer card should not be consumed on successful use", () => {
    // p1 使用 witch_killer 杀死 p3
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];
    G.secrets["p3"].status = "alive";

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p3",
      card: { id: "wk1", type: "witch_killer" },
    });

    resolveNightActions(G, mockRandom);

    // witch_killer 不应该被消耗
    expect(G.discardPile.some((c) => c.type === "witch_killer")).toBe(false);
    // p1 应该仍然持有 witch_killer
    expect(G.secrets["p1"].hand.some((c) => c.type === "witch_killer")).toBe(
      true,
    );
    // p3 应该已死亡
    expect(G.players["p3"].status).toBe("dead");
  });

  it("kill card should be consumed on successful use", () => {
    // p2 使用 kill 杀死 p3
    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];
    G.secrets["p3"].status = "alive";

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // kill 应该被消耗
    expect(G.discardPile.some((c) => c.type === "kill")).toBe(true);
    // p2 不应该持有 kill
    expect(G.secrets["p2"].hand.some((c) => c.type === "kill")).toBe(false);
    // p3 应该已死亡
    expect(G.players["p3"].status).toBe("dead");
  });

  it("failed kill card should still be consumed", () => {
    // p2 使用 kill 但被 p1 的 barrier 防御
    G.secrets["p1"].hand = [{ id: "barrier1", type: "barrier" }];
    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];

    // p1 使用 barrier
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      card: { id: "barrier1", type: "barrier" },
    });

    // p2 尝试杀死 p1（被 barrier 防御）
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // kill 应该仍然被消耗
    expect(G.discardPile.some((c) => c.type === "kill")).toBe(true);
  });

  it("playerView should hide killerId from deathLog", () => {
    // p2 杀死 p3
    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // 验证服务器端 deathLog 有 killerId
    expect(G.deathLog[0].killerId).toBe("p2");

    // 通过 playerView 获取过滤后的状态
    const playerView = WitchTrialGame.playerView!(
      createPlayerViewContext(G, "p1"),
    );

    // 验证过滤后的 deathLog 没有 killerId
    expect(playerView.deathLog[0].killerId).toBeUndefined();
  });

  // ==================== 残骸化分配相关测试 ====================

  it("wreck card consumption: hand space after consumption", () => {
    // p1 使用 kill 杀死 p2（kill 会被消耗），p2 wreck
    G.secrets["p1"].hand = [
      { id: "kill1", type: "kill" },
      { id: "c2", type: "detect" },
      { id: "c3", type: "check" },
      { id: "c4", type: "barrier" },
    ];
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p1 使用 kill 杀死 p2
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "kill1", type: "kill" },
    });

    // p2 会 wreck
    G.secrets["p2"].witchKillerHolder = true;
    G.secrets["p2"].isWitch = false;
    G.secrets["p2"].consecutiveNoKillRounds = 2;

    // p3 正常存活
    G.secrets["p3"].hand = [{ id: "v1", type: "detect" }];

    resolveNightActions(G, mockRandom);

    // p2 应该已死亡
    expect(G.players["p2"].status).toBe("dead");
    expect(G.secrets["p2"].status).toBe("dead");

    // kill 应该被消耗
    expect(G.discardPile.some((c) => c.type === "kill")).toBe(true);

    // p1 手牌应该是 3 张
    expect(G.secrets["p1"].hand.length).toBeLessThanOrEqual(4);
  });

  it("wreck distribution with full hand (no consumption)", () => {
    // p1 手牌已满（4张），p2 wreck
    G.secrets["p1"].hand = [
      { id: "c1", type: "detect" },
      { id: "c2", type: "detect" },
      { id: "c3", type: "check" },
      { id: "c4", type: "barrier" },
    ];
    G.secrets["p1"].isWitch = false;
    G.secrets["p1"].consecutiveNoKillRounds = 1;

    // p2 wreck（持有 witch_killer）
    G.secrets["p2"].witchKillerHolder = true;
    G.secrets["p2"].isWitch = true;
    G.secrets["p2"].consecutiveNoKillRounds = 2;

    // p3 有 1 张手牌
    G.secrets["p3"].hand = [{ id: "v1", type: "detect" }];

    resolveNightActions(G, mockRandom);

    // p2 应该已 wreck
    expect(G.players["p2"].status).toBe("dead");

    // p1 手牌仍为 4 张（已满）
    expect(G.secrets["p1"].hand).toHaveLength(4);

    // witch_killer 应该被分配给 p3
    expect(G.secrets["p3"].witchKillerHolder).toBe(true);
  });

  // ==================== witch_killer 消耗相关测试 ====================

  it("witch_killer should NOT be consumed when blocked by barrier", () => {
    // p1 使用 witch_killer 攻击 p2，但 p2 有 barrier
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    G.secrets["p2"].hand = [{ id: "barrier1", type: "barrier" }];

    // p1 使用 witch_killer 攻击 p2
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      targetId: "p2",
      card: { id: "wk1", type: "witch_killer" },
    });

    // p2 使用 barrier 防御
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now() + 1,
      playerId: "p2",
      card: { id: "barrier1", type: "barrier" },
    });

    resolveNightActions(G, mockRandom);

    // witch_killer 不应该被消耗（即使被 barrier 防御）
    expect(G.discardPile.some((c) => c.type === "witch_killer")).toBe(false);
    // p1 应该仍然持有 witch_killer
    expect(G.secrets["p1"].hand.some((c) => c.type === "witch_killer")).toBe(
      true,
    );
    // p2 应该存活（barrier 防御成功）
    expect(G.players["p2"].status).toBe("alive");
  });

  it("witch_killer should NOT be consumed when failed due to target already dead", () => {
    // p1 使用 witch_killer 攻击 p3，p2 使用 kill 杀死 p3
    // p3 先被 kill 杀死，然后 witch_killer 攻击失败
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    G.secrets["p2"].hand = [{ id: "kill1", type: "kill" }];
    G.secrets["p3"].hand = [{ id: "c1", type: "detect" }];

    // p2 先提交 kill 攻击 p3
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p2",
      targetId: "p3",
      card: { id: "kill1", type: "kill" },
    });

    // p1 后提交 witch_killer 攻击 p3（p3 已死，攻击失败）
    G.nightActions.push({
      id: "na2",
      timestamp: Date.now() + 1,
      playerId: "p1",
      targetId: "p3",
      card: { id: "wk1", type: "witch_killer" },
    });

    resolveNightActions(G, mockRandom);

    // witch_killer 不应该被消耗（执行失败）
    expect(G.discardPile.some((c) => c.type === "witch_killer")).toBe(false);
    // p1 应该仍然持有 witch_killer
    expect(G.secrets["p1"].hand.some((c) => c.type === "witch_killer")).toBe(
      true,
    );
    // p3 应该已死亡
    expect(G.players["p3"].status).toBe("dead");
  });

  // ==================== 残骸化 witch_killer 转移测试 ====================

  it("witch_killer should transfer to killer on normal kill", () => {
    // p1 持有 witch_killer，p3 使用 kill 杀死 p1
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1;
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    // p2 有手牌
    G.secrets["p2"].hand = [{ id: "c1", type: "detect" }];

    // p3 杀死 p1
    G.secrets["p3"].hand = [{ id: "kill1", type: "kill" }];

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p3",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已死亡（不是 wreck，因为被击杀）
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("dead");

    // witch_killer 应该转移给击杀者 p3
    expect(G.secrets["p3"].witchKillerHolder).toBe(true);
    // p3 应该变成魔女
    expect(G.secrets["p3"].isWitch).toBe(true);
    // p3 手牌应该有 witch_killer
    expect(G.secrets["p3"].hand.some((c) => c.type === "witch_killer")).toBe(
      true,
    );
  });

  it("wreck: witch_killer should transfer to killer when killer exists", () => {
    // p1 持有 witch_killer，连续2晚未击杀，但这一晚被 p3 杀死
    // 这种情况下 p1 会被击杀而不是残骸化（因为先被杀死）
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 1; // 只有1晚，第二晚被杀死
    G.secrets["p1"].hand = [{ id: "wk1", type: "witch_killer" }];

    // p2 有手牌
    G.secrets["p2"].hand = [{ id: "c1", type: "detect" }];

    // p3 杀死 p1
    G.secrets["p3"].hand = [{ id: "kill1", type: "kill" }];

    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p3",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已死亡
    expect(G.players["p1"].status).toBe("dead");

    // witch_killer 应该转移给击杀者 p3（因为有击杀者）
    expect(G.secrets["p3"].witchKillerHolder).toBe(true);
  });

  it("wreck: witch_killer should transfer randomly when no killer", () => {
    // p1 持有 witch_killer，连续2晚未击杀，无击杀者
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 2;
    G.secrets["p1"].hand = [
      { id: "wk1", type: "witch_killer" },
      { id: "c2", type: "detect" },
    ];

    // p2 和 p3 都存活
    G.secrets["p2"].hand = [{ id: "c1", type: "detect" }];
    G.secrets["p3"].hand = [{ id: "c3", type: "check" }];

    // p1 放弃行动（无击杀者）
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p1",
      card: null,
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已 wreck
    expect(G.players["p1"].status).toBe("dead");
    expect(G.secrets["p1"].status).toBe("wreck");

    // witch_killer 应该随机转移给 p2 或 p3（其中一个）
    const p2HasWK = G.secrets["p2"].witchKillerHolder;
    const p3HasWK = G.secrets["p3"].witchKillerHolder;
    expect(p2HasWK || p3HasWK).toBe(true);
    // 确保只有一个玩家持有
    expect(p2HasWK && p3HasWK).toBe(false);

    // 获得 witch_killer 的玩家应该变成魔女
    if (p2HasWK) {
      expect(G.secrets["p2"].isWitch).toBe(true);
    }
    if (p3HasWK) {
      expect(G.secrets["p3"].isWitch).toBe(true);
    }
  });

  it("wreck: witch_killer should NOT check hand space (can exceed 4 cards)", () => {
    // p1 持有 witch_killer，连续2晚未击杀
    G.secrets["p1"].witchKillerHolder = true;
    G.secrets["p1"].isWitch = true;
    G.secrets["p1"].consecutiveNoKillRounds = 2;
    G.secrets["p1"].hand = [
      { id: "wk1", type: "witch_killer" },
      { id: "c2", type: "detect" },
    ];

    // p2 手牌已满（4张）
    G.secrets["p2"].hand = [
      { id: "c1", type: "detect" },
      { id: "c3", type: "check" },
      { id: "c4", type: "barrier" },
      { id: "c5", type: "kill" },
    ];

    // p3 手牌为空
    G.secrets["p3"].hand = [];

    // p3 杀死 p1
    G.nightActions.push({
      id: "na1",
      timestamp: Date.now(),
      playerId: "p3",
      targetId: "p1",
      card: { id: "kill1", type: "kill" },
    });

    resolveNightActions(G, mockRandom);

    // p1 应该已 wreck
    expect(G.players["p1"].status).toBe("dead");

    // witch_killer 应该强制转移给 p3，不检查手牌空间
    expect(G.secrets["p3"].witchKillerHolder).toBe(true);
    // p3 手牌应该有 witch_killer，即使这会让手牌变成 2 张（超过4张限制）
    expect(G.secrets["p3"].hand.some((c) => c.type === "witch_killer")).toBe(
      true,
    );
  });
});
