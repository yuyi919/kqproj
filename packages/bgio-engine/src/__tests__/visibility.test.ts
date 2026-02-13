import { describe, expect, it } from "bun:test";
import assert from "node:assert";
import { TypedWitchTrialGame as WitchTrialGame } from "../game";
import type { CardRef } from "../types";
import { GamePhase } from "../types";
import { TMessageBuilder } from "../utils";
import { createPlayerViewContext, createSetupContext } from "./testUtils";

// ==================== 测试 ====================

describe("Message Visibility System (TMessage)", () => {
  describe("基础可见性规则", () => {
    it("公开消息（公告和公开行动）应对所有玩家可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [
        TMessageBuilder.createSystem("公开消息"),
        TMessageBuilder.createVote("p1", "p2"),
      ];

      for (const pid of playerIds) {
        const view = WitchTrialGame.playerView(createPlayerViewContext(G, pid));
        expect(view.chatMessages?.length).toBe(2);
      }
    });

    it("私密消息（private_action）仅对行动者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createUseCard("p1", "detect")];

      // p1 可见
      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      // p2、p3 不可见
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });

    it("见证消息（witnessed_action）对行动者和目标可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createCardReceived("p2", "p1", [])];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(1);

      const viewP3 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      expect(viewP3.chatMessages?.length).toBe(0);
    });
  });

  describe("调试模式与观察者", () => {
    it("调试模式 playerID='0' 应显示所有消息（包括私密）", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [
        TMessageBuilder.createSystem("公开"),
        TMessageBuilder.createUseCard("p1", "detect"),
      ];

      const viewDebug = WitchTrialGame.playerView(
        createPlayerViewContext(G, "0"),
      );
      expect(viewDebug.chatMessages?.length).toBe(2);
    });

    it("无 playerID（null）时应只显示公开消息", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      // 创建一个公开消息和一个私密消息
      const publicMsg = TMessageBuilder.createSystem("公开");
      const privateMsg = TMessageBuilder.createUseCard("p1", "detect");
      G.chatMessages = [publicMsg, privateMsg];

      const viewNull = WitchTrialGame.playerView(
        createPlayerViewContext(G, null),
      );
      // null 只能看到公开消息
      expect(viewNull.chatMessages?.length).toBe(1);
      expect(viewNull.chatMessages?.[0].kind).toBe("announcement");
    });
  });

  describe("实际游戏场景的消息可见性", () => {
    it("夜间行动消息应仅行动者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});
      G.status = GamePhase.NIGHT;

      G.chatMessages = [TMessageBuilder.createUseCard("p1", "detect", "p2")];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });

    it("攻击结果消息应仅攻击者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});
      G.status = GamePhase.NIGHT;

      // 创建两条攻击消息
      const attackMsg = TMessageBuilder.createAttackResult(
        "p1",
        "p2",
        "kill",
        "success",
      );
      const failMsg = TMessageBuilder.createAttackResult(
        "p2",
        "p1",
        "detect",
        "fail",
        "target_already_dead",
      );
      G.chatMessages = [attackMsg, failMsg];

      // p1 只能看到自己的攻击成功消息
      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);
      expect(viewP1.chatMessages?.[0].kind).toBe("private_action");
      expect(viewP1.chatMessages?.[0].type).toBe("attack_result");

      // p2 只能看到自己的攻击失败消息
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(1);
      expect(viewP2.chatMessages?.[0].type).toBe("attack_result");

      // p3 什么都看不到
      const viewP3 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      expect(viewP3.chatMessages?.length).toBe(0);
    });

    it("死亡消息应对所有玩家公开", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createSystem("玩家2 已死亡")];

      for (const pid of playerIds) {
        const view = WitchTrialGame.playerView(createPlayerViewContext(G, pid));
        expect(view.chatMessages?.length).toBe(1);
        const msg = view.chatMessages![0];
        assert(msg.kind === "announcement");
        assert(msg.type === "system");
        expect(msg.content).toBe("玩家2 已死亡");
        expect(msg.content).not.toContain("击杀");
        expect(msg.content).not.toContain("凶手");
      }
    });

    it("魔女化消息应仅该玩家可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createTransformWitch("p2")];

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(1);

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(0);
    });

    it("残骸化消息应仅该玩家可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createWreck("p2")];

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(1);

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(0);
    });

    it("结界保护消息应仅结界使用者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createBarrierApplied("p2", "p1")];

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(1);

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(0);
    });

    it("检定结果消息应仅检定者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [
        TMessageBuilder.createCheckResult("p1", "p2", true, "witch_killer"),
      ];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      // p2 是死者，但检定结果对死者也不可见
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });

    it("探知结果消息应仅探知者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [
        TMessageBuilder.createDetectResult("p1", "p2", 3, "detect"),
      ];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });
  });

  describe("卡牌分配消息可见性", () => {
    it("卡牌分配的个人消息应对接收者和受害者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      // 创建两条卡牌分配消息
      const msg1 = TMessageBuilder.createCardReceived("p1", "p2", [
        { id: "c1", type: "barrier" } as CardRef,
      ]);
      const msg2 = TMessageBuilder.createCardReceived("p3", "p2", [
        { id: "c2", type: "kill" },
        { id: "c3", type: "detect" },
      ] as CardRef[]);
      G.chatMessages = [msg1, msg2];

      // p1: 只看到自己的
      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);
      expect(viewP1.chatMessages?.[0].kind).toBe("witnessed_action");

      // p2 (victim): 看到所有
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(2);

      // p3: 只看到自己的
      const viewP3 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      expect(viewP3.chatMessages?.length).toBe(1);
      expect(viewP3.chatMessages?.[0].kind).toBe("witnessed_action");
    });

    it("接收者之间不应看到彼此的卡牌分配消息", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      // 创建两条卡牌分配消息
      const msg1 = TMessageBuilder.createCardReceived("p1", "p2", [
        { id: "c1", type: "barrier" } as CardRef,
      ]);
      const msg2 = TMessageBuilder.createCardReceived("p3", "p2", [
        { id: "c2", type: "kill" } as CardRef,
      ]);
      G.chatMessages = [msg1, msg2];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      // p1 只能看到自己的消息，看不到 p3 的消息
      expect(viewP1.chatMessages?.length).toBe(1);

      const viewP3 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      // p3 只能看到自己的消息，看不到 p1 的消息
      expect(viewP3.chatMessages?.length).toBe(1);
    });
  });

  describe("边界条件和组合场景", () => {
    it("多个私密消息应对不同玩家正确过滤", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      // 创建三条私密消息和一条公开消息
      const msg1 = TMessageBuilder.createUseCard("p1", "detect");
      const msg2 = TMessageBuilder.createUseCard("p2", "barrier");
      const msg3 = TMessageBuilder.createUseCard("p3", "check");
      const publicMsg = TMessageBuilder.createSystem("公开消息");
      G.chatMessages = [msg1, msg2, msg3, publicMsg];

      // 每个玩家应该看到自己的一条私密消息 + 公开消息
      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(2);
      expect(
        viewP1.chatMessages?.some(
          (m: any) => m.kind === "private_action" && m.actorId === "p1",
        ),
      ).toBe(true);
      expect(
        viewP1.chatMessages?.some((m: any) => m.kind === "announcement"),
      ).toBe(true);

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(2);
      expect(
        viewP2.chatMessages?.some(
          (m: any) => m.kind === "private_action" && m.actorId === "p2",
        ),
      ).toBe(true);

      const viewP3 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      expect(viewP3.chatMessages?.length).toBe(2);
      expect(
        viewP3.chatMessages?.some(
          (m: any) => m.kind === "private_action" && m.actorId === "p3",
        ),
      ).toBe(true);
    });

    it("private_action 对不存在的 actor 无人可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createUseCard("ghost", "detect")];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );

      expect(viewP1.chatMessages?.length).toBe(0);
      expect(viewP2.chatMessages?.length).toBe(0);
    });

    it("witnessed_action 对不存在的参与者无人可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createCardReceived("pX", "pY", [])];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(0);
    });

    it("消息按时间顺序保持原序", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      const msg1 = TMessageBuilder.createSystem("消息1");
      const msg2 = TMessageBuilder.createVote("p1", "p2");
      const msg3 = TMessageBuilder.createSystem("消息3");

      // 手动设置 id 以便验证
      msg1.id = "msg1";
      msg2.id = "msg2";
      msg3.id = "msg3";

      G.chatMessages = [msg1, msg2, msg3];

      const view = WitchTrialGame.playerView(createPlayerViewContext(G, "p1"));
      expect(view.chatMessages?.map((m: any) => m.id)).toEqual([
        "msg1",
        "msg2",
        "msg3",
      ]);
    });
  });

  describe("真实游戏流程集成测试", () => {
    it("夜间行动完整流程：只有行动者能看到自己的行动", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});
      G.status = GamePhase.NIGHT;

      G.chatMessages = [TMessageBuilder.createUseCard("p1", "detect", "p2")];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });

    it("攻击成功消息只对攻击者可见", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});
      G.status = GamePhase.NIGHT;

      G.chatMessages = [
        TMessageBuilder.createAttackResult("p1", "p2", "kill", "success"),
      ];

      const viewAttacker = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewAttacker.chatMessages?.length).toBe(1);

      const viewVictim = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewVictim.chatMessages?.length).toBe(0);

      const viewOther = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p3"),
      );
      expect(viewOther.chatMessages?.length).toBe(0);
    });

    it("死亡消息对所有玩家公开", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [TMessageBuilder.createSystem("玩家2 已死亡")];

      for (const pid of playerIds) {
        const view = WitchTrialGame.playerView(createPlayerViewContext(G, pid));
        expect(view.chatMessages?.length).toBe(1);
        const msg = view.chatMessages![0];
        expect(msg.kind).toBe("announcement");
        expect(msg.type).toBe("system");
      }
    });

    it("检定结果只对检定者可见，即使检定的是已死亡玩家", () => {
      const playerIds = ["p1", "p2", "p3"];
      const context = createSetupContext(playerIds);
      const G = WitchTrialGame.setup(context, {});

      G.chatMessages = [
        TMessageBuilder.createCheckResult("p1", "p2", true, "witch_killer"),
      ];

      const viewP1 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p1"),
      );
      expect(viewP1.chatMessages?.length).toBe(1);

      // p2 是死者，但检定结果对死者也不可见
      const viewP2 = WitchTrialGame.playerView(
        createPlayerViewContext(G, "p2"),
      );
      expect(viewP2.chatMessages?.length).toBe(0);
    });
  });
});
