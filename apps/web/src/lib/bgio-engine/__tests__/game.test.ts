import { describe, it, expect } from "bun:test";
import { WitchTrialGame } from "../game";
import type { BGGameState } from "../types";

// Mock 随机函数
const mockShuffle = <T>(arr: T[]): T[] => [...arr];
const mockRandom = {
  Number: () => 0.5,
  Shuffle: mockShuffle,
  D4: () => 2,
  D6: () => 3,
  D10: () => 5,
  D20: () => 10,
};

// 创建 mock 上下文 - 使用类型断言避免复杂的类型问题
const createMockCtx = (playerIds: string[]) =>
  ({
    turn: 1,
    currentPlayer: playerIds[0],
    phase: "night",
    numPlayers: playerIds.length,
    playOrder: playerIds,
    playOrderPos: 0,
    _random: { seed: "test-seed" },
    activePlayers: null,
  }) as any;

// 创建完整的 setup 上下文
const createSetupContext = (playerIds: string[]) =>
  ({
    ctx: createMockCtx(playerIds),
    random: mockRandom,
    events: {},
    log: [] as any[],
  }) as any;

// 创建 move 上下文
const createMoveContext = (
  G: BGGameState,
  playerId: string,
  phase: string = "night",
) =>
  ({
    G,
    ctx: { ...createMockCtx(G.playerOrder), phase },
    playerID: playerId,
    events: {},
    random: mockRandom,
  }) as any;

// 创建 phase 钩子上下文
const createPhaseContext = (G: BGGameState, phase: string = "night") =>
  ({
    G,
    ctx: { ...createMockCtx(G.playerOrder), phase },
    events: {},
    random: mockRandom,
  }) as any;

// 创建 playerView 上下文
const createPlayerViewContext = (G: BGGameState, playerId: string | null) =>
  ({
    G,
    ctx: createMockCtx(G.playerOrder),
    playerID: playerId,
  }) as any;

// 创建 endIf 上下文
const createEndIfContext = (G: BGGameState) =>
  ({
    G,
    ctx: createMockCtx(G.playerOrder),
  }) as any;

// 调用 move 函数的辅助函数
const callMove = (move: any, context: any, ...args: any[]) => {
  return move(context, ...args);
};

describe("WitchTrialGame - Setup", () => {
  it("应正确初始化游戏状态", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup!(context, { roomId: "test-room" });

    expect(G.id).toBeDefined();
    expect(G.roomId).toBe("test-room");
    expect(G.status).toBe("morning");
    expect(G.round).toBe(1);
    expect(Object.keys(G.players)).toHaveLength(3);
    expect(G.playerOrder).toEqual(playerIds);
  });

  it("应正确分配手牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup!(context, {});

    Object.values(G.secrets).forEach((secret) => {
      expect(secret.hand).toHaveLength(4);
    });
  });

  it("应正确识别魔女杀手持有者", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    const G = WitchTrialGame.setup!(context, {});

    const holders = Object.entries(G.secrets).filter(
      ([, s]) => s.witchKillerHolder,
    );
    expect(holders).toHaveLength(1);

    const holderId = holders[0][0];
    expect(G.players[holderId].status).toBe("witch");
  });
});

describe("WitchTrialGame - Voting Phase", () => {
  it("应正确记录投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "voting";

    const voteMove = WitchTrialGame.phases!.voting.moves!.vote;
    expect(voteMove).toBeDefined();

    const result = callMove(voteMove, createMoveContext(G, "p1", "voting"), "p2");

    expect(result).toBeUndefined();
    expect(G.currentVotes).toHaveLength(1);
    expect(G.currentVotes[0].voterId).toBe("p1");
    expect(G.currentVotes[0].targetId).toBe("p2");
  });

  it("应允许更新投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "voting";

    const voteMove = WitchTrialGame.phases!.voting.moves!.vote;

    callMove(voteMove, createMoveContext(G, "p1", "voting"), "p2");
    callMove(voteMove, createMoveContext(G, "p1", "voting"), "p3");

    expect(G.currentVotes).toHaveLength(1);
    expect(G.currentVotes[0].targetId).toBe("p3");
  });

  it("死亡玩家不应能投票", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "voting";
    G.players.p1.status = "dead";

    const voteMove = WitchTrialGame.phases!.voting.moves!.vote;
    const result = callMove(voteMove, createMoveContext(G, "p1", "voting"), "p2");

    expect(result).toBe("INVALID_MOVE");
  });

  it("应正确计算投票结果", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "voting";

    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p3", targetId: "p2", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases!.voting.onEnd!(createPhaseContext(G, "voting"));

    expect(G.imprisonedId).toBe("p2");
    expect(G.voteHistory).toHaveLength(1);
  });

  it("平票时不应监禁任何人", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "voting";

    G.currentVotes = [
      { voterId: "p1", targetId: "p2", round: 1, timestamp: Date.now() },
      { voterId: "p2", targetId: "p3", round: 1, timestamp: Date.now() },
    ];

    WitchTrialGame.phases!.voting.onEnd!(createPhaseContext(G, "voting"));

    expect(G.imprisonedId).toBeNull();
    expect(G.voteHistory[0].isTie).toBe(true);
  });
});

describe("WitchTrialGame - Night Phase", () => {
  it("应正确使用结界魔法", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "night";

    const nonHolderId = Object.entries(G.secrets).find(
      ([, s]) => !s.witchKillerHolder,
    )?.[0];
    expect(nonHolderId).toBeDefined();

    const barrierCard = { id: "barrier-test", type: "barrier" as const };
    G.secrets[nonHolderId!].hand.push(barrierCard);

    const useCardMove = WitchTrialGame.phases!.night.moves!.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, nonHolderId!, "night"),
      "barrier-test",
    );

    expect(result).toBeUndefined();
    expect(G.secrets[nonHolderId!].hasBarrier).toBe(true);
    expect(G.nightActions).toHaveLength(1);
  });

  it("魔女杀手持有者只能使用魔女杀手", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "night";

    const holderId = Object.entries(G.secrets).find(
      ([, s]) => s.witchKillerHolder,
    )?.[0];
    expect(holderId).toBeDefined();

    const existingCardId = G.secrets[holderId!].hand[0].id;
    G.secrets[holderId!].hand[0] = { id: existingCardId, type: "barrier" };

    const useCardMove = WitchTrialGame.phases!.night.moves!.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, holderId!, "night"),
      existingCardId,
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("被监禁的玩家不应能使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "night";
    G.imprisonedId = "p1";

    const useCardMove = WitchTrialGame.phases!.night.moves!.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, "p1", "night"),
      "some-card-id",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("死亡玩家不应能使用卡牌", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "night";
    G.players.p1.status = "dead";

    const useCardMove = WitchTrialGame.phases!.night.moves!.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, "p1", "night"),
      "some-card-id",
    );

    expect(result).toBe("INVALID_MOVE");
  });

  it("使用杀人魔法应消耗卡牌并魔女化", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.status = "night";

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

    const useCardMove = WitchTrialGame.phases!.night.moves!.useCard;
    const result = callMove(
      useCardMove,
      createMoveContext(G, nonHolderId!, "night"),
      existingCardId,
      targetId,
    );

    expect(result).toBeUndefined();
    expect(G.secrets[nonHolderId!].isWitch).toBe(true);
    expect(G.discardPile).toHaveLength(1);
    expect(G.discardPile[0].type).toBe("kill");
  });
});

describe("WitchTrialGame - End Game Conditions", () => {
  it("只剩1人时应结束游戏", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.players.p2.status = "dead";
    G.players.p3.status = "dead";

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toEqual({ winner: "p1" });
  });

  it("超过最大回合数时应结束游戏", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.round = 8;

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toBeDefined();
  });

  it("无人存活时应无获胜者", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});
    G.players.p1.status = "dead";
    G.players.p2.status = "dead";
    G.players.p3.status = "dead";

    const gameover = WitchTrialGame.endIf!(createEndIfContext(G));

    expect(gameover).toEqual({ winner: null });
  });
});

describe("WitchTrialGame - Player View", () => {
  it("应只暴露当前玩家的秘密信息", () => {
    const playerIds = ["p1", "p2", "p3"];
    const context = createSetupContext(playerIds);

    let G = WitchTrialGame.setup!(context, {});

    const playerView = WitchTrialGame.playerView!(
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

    let G = WitchTrialGame.setup!(context, {});
    G.deck = [{ id: "hidden", type: "barrier" }];

    const playerView = WitchTrialGame.playerView!(
      createPlayerViewContext(G, "p1"),
    );

    expect(playerView.deck).toHaveLength(0);
  });
});
