import { describe, it, expect } from "bun:test";
import { phaseConfigs, TypedWitchTrialGame as WitchTrialGame } from "../game";
import { Selectors } from "../utils";
import { GamePhase } from "../types/core";
import {
  createMockRandom,
  createTestState,
  setupPlayers,
  createMoveContext,
  createPhaseContext,
  createSetupContext,
  createPlayerViewContext,
  createEndIfContext,
  SEVEN_PLAYER_CONFIG,
  callMove,
} from "./testUtils";

describe("WitchTrialGame - Setup", () => {
  it("应正确初始化游戏状态", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup(context, { roomId: "test-room" });

    expect(G.id).toBeDefined();
    expect(G.roomId).toBe("test-room");
    expect(G.status).toBe(GamePhase.SETUP);
    expect(G.round).toBe(1);
    expect(Object.keys(G.players)).toHaveLength(3);
    expect(G.playerOrder).toEqual(playerIds);
  });

  it("应正确分配手牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup(context, {});

    Object.values(G.secrets).forEach((secret) => {
      expect(secret.hand).toHaveLength(4);
    });
  });

  it("应正确识别魔女杀手持有者", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup(context, {});

    const holders = Object.entries(G.secrets).filter(
      ([, s]) => s.witchKillerHolder,
    );
    expect(holders).toHaveLength(1);

    const holderId = holders[0][0];
    // 公开状态显示为 alive，私有状态为 witch
    expect(G.players[holderId].status).toBe("alive");
    expect(G.secrets[holderId].status).toBe("witch");
  });
});

describe("WitchTrialGame - Voting Phase", () => {
  it("应正确记录投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    const voteMove = WitchTrialGame.phases[GamePhase.NIGHT].moves!.vote;
    expect(voteMove).toBeDefined();

    const result = callMove(
      voteMove,
      createMoveContext(G, "p1", GamePhase.NIGHT),
      "p2",
    );

    expect(result).toBeUndefined();
    expect(G.currentVotes).toHaveLength(1);
    expect(G.currentVotes[0].voterId).toBe("p1");
    expect(G.currentVotes[0].targetId).toBe("p2");
  });

  it("应允许更新投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    const voteMove = WitchTrialGame.phases[GamePhase.NIGHT].moves!.vote;

    callMove(voteMove, createMoveContext(G, "p1", GamePhase.NIGHT), "p2");
    callMove(voteMove, createMoveContext(G, "p1", GamePhase.NIGHT), "p3");

    expect(G.currentVotes).toHaveLength(1);
    expect(G.currentVotes[0].targetId).toBe("p3");
  });

  it("死亡玩家不应能投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;
    // 同时更新公开状态和私有状态
    G.players.p1.status = "dead";
    G.secrets.p1.status = "dead";

    const voteMove = WitchTrialGame.phases[GamePhase.NIGHT].moves!.vote;
    const result = callMove(
      voteMove,
      createMoveContext(G, "p1", GamePhase.NIGHT),
      "p2",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("应正确计算投票结果", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases[GamePhase.NIGHT].onEnd(createPhaseContext(G, GamePhase.NIGHT));

    expect(G.imprisonedId).toBe("p2");
    expect(G.voteHistory).toHaveLength(1);
  });

  it("平票时不应监禁任何人", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases[GamePhase.NIGHT].onEnd(createPhaseContext(G, GamePhase.NIGHT));

    expect(G.imprisonedId).toBeNull();
    expect(G.voteHistory[0].isTie).toBe(true);
  });

  it("不应投给自己（弃权除外）", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    const voteMove = WitchTrialGame.phases[GamePhase.NIGHT].moves!.vote;

    // 尝试投给自己（不是通过pass）
    const result = callMove(
      voteMove,
      createMoveContext(G, "p1", GamePhase.NIGHT),
      "p1",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("不应投给已死亡玩家", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;
    // p2 死亡
    G.players.p2.status = "dead";
    G.secrets.p2.status = "dead";

    const voteMove = WitchTrialGame.phases[GamePhase.NIGHT].moves!.vote;
    const result = callMove(
      voteMove,
      createMoveContext(G, "p1", GamePhase.NIGHT),
      "p2",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("弃权票不应计入监禁", () => {
    const playerIds = ["p1", "p2", "p3", "p4"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    // p1 和 p2 投给 p3
    // p3 弃权（投给自己）
    // p4 投给 p2
    G.currentVotes = [
      { voterId: "p1", targetId: "p3", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
      { voterId: "p3", targetId: "p3", round: 1, timestamp: Date.now() }, // 弃权
      { voterId: "p4", targetId: "p2", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases[GamePhase.NIGHT].onEnd(createPhaseContext(G, GamePhase.NIGHT));

    // p3 得 2 票，p2 得 1 票，p3 应该被监禁
    expect(G.imprisonedId).toBe("p3");
    // 弃权票不应该被当作监禁投票
    expect(G.voteHistory[0].voteCounts["p3"]).toBe(3); // 总共3票（包括弃权）
  });

  it("全部弃权时无人被监禁", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.NIGHT;

    // 所有人都弃权
    G.currentVotes = [
      { voterId: "p1", targetId: "p1", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p3", targetId: "p3", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases[GamePhase.NIGHT].onEnd(createPhaseContext(G, GamePhase.NIGHT));

    expect(G.imprisonedId).toBeNull();
  });
});

describe("WitchTrialGame - Night Phase", () => {
  it("应正确使用结界魔法", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const nonHolderId = Object.entries(G.secrets).find(
      ([, s]) => !s.witchKillerHolder,
    )?.[0];
    expect(nonHolderId).toBeDefined();

    const barrierCard = { id: "barrier-test", type: "barrier" as const };
    G.secrets[nonHolderId!].hand.push(barrierCard);

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, nonHolderId!, GamePhase.DEEP_NIGHT),
      "barrier-test",
    );

    expect(result).toBeUndefined();
    expect(G.secrets[nonHolderId!].hasBarrier).toBe(true);
    expect(G.nightActions).toHaveLength(1);
  });

  it("魔女杀手持有者只能使用魔女杀手", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const holderId = Object.entries(G.secrets).find(
      ([, s]) => s.witchKillerHolder,
    )?.[0];
    expect(holderId).toBeDefined();

    const existingCardId = G.secrets[holderId!].hand[0].id;
    G.secrets[holderId!].hand[0] = { id: existingCardId, type: "barrier" };

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, holderId!, GamePhase.DEEP_NIGHT),
      existingCardId,
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("被监禁的玩家不应能使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;
    G.imprisonedId = "p1";

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, "p1", GamePhase.DEEP_NIGHT),
      "some-card-id",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("死亡玩家不应能使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;
    // 同时更新公开状态和私有状态
    G.players.p1.status = "dead";
    G.secrets.p1.status = "dead";

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, "p1", GamePhase.DEEP_NIGHT),
      "some-card-id",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("使用杀人魔法应消耗卡牌并魔女化", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const nonHolderId = Object.entries(G.secrets).find(
      ([, s]) => !s.witchKillerHolder,
    )?.[0];
    expect(nonHolderId).toBeDefined();

    const existingCardId = G.secrets[nonHolderId!].hand[0].id;
    G.secrets[nonHolderId!].hand = [{ id: existingCardId, type: "kill" }];

    const targetId = Object.keys(G.players).find(
      (id) => id !== nonHolderId && G.players[id].status !== "dead",
    );
    expect(targetId).toBeDefined();

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, nonHolderId!, GamePhase.DEEP_NIGHT),
      existingCardId,
      targetId,
    );

    // 使用卡牌后立即魔女化 - 规则修改：只有成功击杀才会魔女化
    expect(result).toBeUndefined();
    // 注意：使用卡牌时不立即魔女化，结算成功后才魔女化

    // 卡牌在结算前保留在手中（延迟消耗）
    expect(G.discardPile).toHaveLength(0);
    expect(G.secrets[nonHolderId!].hand).toHaveLength(1);

    // 结算后：卡牌被消耗，且成功击杀导致魔女化
    phaseConfigs[GamePhase.RESOLUTION].onBegin(createPhaseContext(G, GamePhase.DEEP_NIGHT));
    expect(G.discardPile).toHaveLength(1);
    expect(G.discardPile[0].type).toBe("kill");
    expect(G.secrets[nonHolderId!].isWitch).toBe(true); // 成功击杀后魔女化

    // 检查 kill 类型卡牌不在手中
    const hasKillInHand = G.secrets[nonHolderId!].hand.some(
      (c) => c.type === "kill",
    );
    expect(hasKillInHand).toBe(false);
  });
});

describe("WitchTrialGame - End Game Conditions", () => {
  it("只剩1人时应结束游戏", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    // 同时更新公开状态和私有状态
    G.players.p2.status = "dead";
    G.secrets.p2.status = "dead";
    G.players.p3.status = "dead";
    G.secrets.p3.status = "dead";

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toEqual({ winner: "p1" });
  });

  it("超过最大回合数时应结束游戏", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.round = 8;

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toBeDefined();
  });

  it("无人存活时应无获胜者", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    // 同时更新公开状态和私有状态
    G.players.p1.status = "dead";
    G.secrets.p1.status = "dead";
    G.players.p2.status = "dead";
    G.secrets.p2.status = "dead";
    G.players.p3.status = "dead";
    G.secrets.p3.status = "dead";

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toEqual({ winner: null });
  });
});

describe("WitchTrialGame - Player View", () => {
  it("应只暴露当前玩家的秘密信息", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});

    const playerView = WitchTrialGame.playerView(
      createPlayerViewContext(G, "p1"),
    );

    expect(playerView.secrets["p1"]).toBeDefined();
    expect(playerView.secrets["p1"].hand).toBeDefined();

    expect(Object.keys(playerView.secrets)).toHaveLength(1);
    expect(playerView.secrets["p2"]).toBeUndefined();
    expect(playerView.secrets["p3"]).toBeUndefined();
  });

  it("应隐藏牌堆", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.deck = [{ id: "hidden", type: "barrier" }];

    const playerView = WitchTrialGame.playerView(
      createPlayerViewContext(G, "p1"),
    );

    expect(playerView.deck).toHaveLength(0);
  });
});

describe("WitchTrialGame - Night Card Limit", () => {
  it("应该允许玩家在第一个晚上使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const playerId = "p1";
    const cardId = G.secrets[playerId].hand[0].id;

    const result = callMove(
      useCardMove,
      createMoveContext(G, playerId, GamePhase.DEEP_NIGHT),
      cardId,
    );

    expect(result).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, playerId)).toBe(true);
    expect(G.nightActions).toHaveLength(1);
  });

  it("应该阻止玩家在同一晚上使用第二张卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const playerId = "p1";
    const cardId1 = G.secrets[playerId].hand[0].id;
    const cardId2 = G.secrets[playerId].hand[1].id;

    // 使用第一张卡牌
    const result1 = callMove(
      useCardMove,
      createMoveContext(G, playerId, GamePhase.DEEP_NIGHT),
      cardId1,
    );
    expect(result1).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, playerId)).toBe(true);

    // 尝试使用第二张卡牌应该失败
    const result2 = callMove(
      useCardMove,
      createMoveContext(G, playerId, GamePhase.DEEP_NIGHT),
      cardId2,
    );
    expect(result2).toBe("INVALID_MOVE");
  });

  it("应该允许不同玩家在同一晚上使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;

    // p1 使用卡牌
    const cardId1 = G.secrets["p1"].hand[0].id;
    const result1 = callMove(
      useCardMove,
      createMoveContext(G, "p1", GamePhase.DEEP_NIGHT),
      cardId1,
    );
    expect(result1).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p1")).toBe(true);

    // p2 也应该能使用卡牌
    const cardId2 = G.secrets["p2"].hand[0].id;
    const result2 = callMove(
      useCardMove,
      createMoveContext(G, "p2", GamePhase.DEEP_NIGHT),
      cardId2,
    );
    expect(result2).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p2")).toBe(true);
  });

  it("在下一个晚上应该重置 nightCardUsed", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});

    // 第一个晚上
    phaseConfigs[GamePhase.DEEP_NIGHT].onBegin(createPhaseContext(G, GamePhase.MORNING));
    expect(G.nightActions.length).toEqual(0);

    const useCardMove = phaseConfigs[GamePhase.DEEP_NIGHT].moves.useCard;
    // 使用 p2（不是 witch_killer 持有者）来避免继承问题
    const cardId1 = G.secrets["p2"].hand[0].id;
    const result1 = callMove(
      useCardMove,
      createMoveContext(G, "p2", GamePhase.DEEP_NIGHT),
      cardId1,
    );
    expect(result1).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p2")).toBe(true);
    expect(G.nightActions.length).toBe(1);

    // 模拟进入下一天（结算 -> 早晨 -> 晚上）
    phaseConfigs[GamePhase.RESOLUTION].onBegin(createPhaseContext(G, GamePhase.DEEP_NIGHT));
    phaseConfigs[GamePhase.MORNING].onBegin(createPhaseContext(G, GamePhase.RESOLUTION));
    phaseConfigs[GamePhase.DEEP_NIGHT].onBegin(createPhaseContext(G, GamePhase.MORNING));

    // nightCardUsed 应该被重置
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p2")).toBe(false);

    // p2 应该能再次使用卡牌
    const cardId2 = G.secrets["p2"].hand[0].id;
    const result2 = callMove(
      useCardMove,
      createMoveContext(G, "p2", GamePhase.DEEP_NIGHT),
      cardId2,
    );
    expect(result2).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p2")).toBe(true);
  });

  it("弃权也应该标记为已使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup(context, {});
    G.status = GamePhase.DEEP_NIGHT;

    const passMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.pass;
    const result = callMove(passMove, createMoveContext(G, "p1", GamePhase.DEEP_NIGHT));

    expect(result).toBeUndefined();
    expect(Selectors.hasPlayerUsedCardThisNight(G, "p1")).toBe(true);

    // 使用弃权后，应该不能再用卡牌
    const useCardMove = WitchTrialGame.phases[GamePhase.DEEP_NIGHT].moves.useCard;
    const cardId = G.secrets["p1"].hand[0].id;
    const result2 = callMove(
      useCardMove,
      createMoveContext(G, "p1", GamePhase.DEEP_NIGHT),
      cardId,
    );
    expect(result2).toBe("INVALID_MOVE");
  });
});
