import { describe, expect, it } from "bun:test";
import { TMessageBuilder } from "../domain/services/messageBuilder";
import { Selectors } from "../domain/queries";
import { createTestState, setupPlayers } from "../__tests__/testUtils";
import type { TMessage } from "./message";
import { GamePhase } from "./core";

// ==================== 测试数据工厂 ====================

const createMockGameState = () => {
  const state = createTestState();
  setupPlayers(state, ["p1", "p2", "p3", "p4"]);
  return state;
};

// ==================== 消息类型测试 ====================

describe("Message Types", () => {
  describe("TMessage structure", () => {
    it("应包含基础字段 id 和 timestamp", () => {
      const msg = TMessageBuilder.createSystem("测试消息");
      expect(msg.id).toBeDefined();
      expect(typeof msg.id).toBe("string");
      expect(msg.timestamp).toBeDefined();
      expect(typeof msg.timestamp).toBe("number");
    });

    it("应包含 kind 字段标识消息种类", () => {
      const announcement = TMessageBuilder.createSystem("公告");
      expect(announcement.kind).toBe("announcement");

      const publicAction = TMessageBuilder.createVote("p1", "p2");
      expect(publicAction.kind).toBe("public_action");

      const privateAction = TMessageBuilder.createUseCard("p1", "detect");
      expect(privateAction.kind).toBe("private_action");

      const witnessedAction = TMessageBuilder.createCardReceived("p1", "p2", []);
      expect(witnessedAction.kind).toBe("witnessed_action");
    });

    it("应包含 type 字段标识具体类型", () => {
      const system = TMessageBuilder.createSystem("系统消息");
      expect(system.type).toBe("system");

      const vote = TMessageBuilder.createVote("p1", "p2");
      expect(vote.type).toBe("vote");

      const useCard = TMessageBuilder.createUseCard("p1", "detect");
      expect(useCard.type).toBe("use_card");
    });
  });

  describe("消息 kind 类型完整覆盖", () => {
    it("应支持 announcement 所有子类型", () => {
      const phaseTransition = TMessageBuilder.createPhaseTransition(
        GamePhase.DAY,
        GamePhase.NIGHT,
      );
      expect(phaseTransition.kind).toBe("announcement");
      expect(phaseTransition.type).toBe("phase_transition");

      const voteSummary = TMessageBuilder.createVoteSummary([], null, false);
      expect(voteSummary.kind).toBe("announcement");
      expect(voteSummary.type).toBe("vote_summary");

      const deathList = TMessageBuilder.createDeathList(["p1", "p2"]);
      expect(deathList.kind).toBe("announcement");
      expect(deathList.type).toBe("death_list");

      const deathRecord = TMessageBuilder.createDeathRecord("p1", []);
      expect(deathRecord.kind).toBe("announcement");
      expect(deathRecord.type).toBe("death_record");

      const system = TMessageBuilder.createSystem("系统消息");
      expect(system.kind).toBe("announcement");
      expect(system.type).toBe("system");

      const hiddenSystem = TMessageBuilder.createHiddenSystem("隐藏消息");
      expect(hiddenSystem.kind).toBe("announcement");
      expect(hiddenSystem.type).toBe("system");
      expect(hiddenSystem.status).toBe("hidden");
    });

    it("应支持 public_action 所有子类型", () => {
      const vote = TMessageBuilder.createVote("p1", "p2");
      expect(vote.kind).toBe("public_action");
      expect(vote.type).toBe("vote");
      expect(vote.actorId).toBe("p1");
      expect(vote.targetId).toBe("p2");

      const pass = TMessageBuilder.createPass("p1");
      expect(pass.kind).toBe("public_action");
      expect(pass.type).toBe("pass");
      expect(pass.actorId).toBe("p1");

      const say = TMessageBuilder.createSay("p1", "Hello");
      expect(say.kind).toBe("public_action");
      expect(say.type).toBe("say");
      expect(say.actorId).toBe("p1");
      expect(say.content).toBe("Hello");
    });

    it("应支持 private_action 所有子类型", () => {
      const useCard = TMessageBuilder.createUseCard("p1", "detect", "p2");
      expect(useCard.kind).toBe("private_action");
      expect(useCard.type).toBe("use_card");
      expect(useCard.actorId).toBe("p1");
      expect(useCard.cardType).toBe("detect");
      expect(useCard.targetId).toBe("p2");

      const attackResult = TMessageBuilder.createAttackResult(
        "p1",
        "p2",
        "kill",
        "success",
      );
      expect(attackResult.kind).toBe("private_action");
      expect(attackResult.type).toBe("attack_result");
      expect(attackResult.result).toBe("success");

      const transformWitch = TMessageBuilder.createTransformWitch("p1");
      expect(transformWitch.kind).toBe("private_action");
      expect(transformWitch.type).toBe("transform_witch");

      const wreck = TMessageBuilder.createWreck("p1");
      expect(wreck.kind).toBe("private_action");
      expect(wreck.type).toBe("wreck");

      const attackExcess = TMessageBuilder.createAttackExcessNotification(
        "p1",
        "kill",
        "quota_exceeded",
      );
      expect(attackExcess.kind).toBe("private_action");
      expect(attackExcess.type).toBe("attack_excess");

      const tradeOffer = TMessageBuilder.createTradeOffer("p1", "p2", "card1");
      expect(tradeOffer.kind).toBe("private_action");
      expect(tradeOffer.type).toBe("trade_offer");

      const tradeResponse = TMessageBuilder.createTradeResponse("p2", "p1", true);
      expect(tradeResponse.kind).toBe("private_action");
      expect(tradeResponse.type).toBe("trade_response");
    });

    it("应支持 private_response 所有子类型", () => {
      const barrierApplied = TMessageBuilder.createBarrierApplied("p1", "p2");
      expect(barrierApplied.kind).toBe("private_response");
      expect(barrierApplied.type).toBe("barrier_applied");
      expect(barrierApplied.actorId).toBe("p1");

      const deadResponse = TMessageBuilder.createDeadResponse("p1", "p2");
      expect(deadResponse.kind).toBe("private_response");
      expect(deadResponse.type).toBe("dead_response");

      const witchKillerObtained = TMessageBuilder.createWitchKillerObtainedNotification(
        "p1",
        "p2",
        "active",
      );
      expect(witchKillerObtained.kind).toBe("private_response");
      expect(witchKillerObtained.type).toBe("witch_killer_obtained");

      const checkResult = TMessageBuilder.createCheckResult(
        "p1",
        "p2",
        true,
        "witch_killer",
      );
      expect(checkResult.kind).toBe("private_response");
      expect(checkResult.type).toBe("check_result");

      const detectResult = TMessageBuilder.createDetectResult("p1", "p2", 3, "detect");
      expect(detectResult.kind).toBe("private_response");
      expect(detectResult.type).toBe("detect_result");

      const privateMessage = TMessageBuilder.createPrivateMessageResponse("p1", "私密内容");
      expect(privateMessage.kind).toBe("private_response");
      expect(privateMessage.type).toBe("private_message");
    });

    it("应支持 witnessed_action 所有子类型", () => {
      const cardReceived = TMessageBuilder.createCardReceived("p1", "p2", [
        { id: "c1", type: "barrier" },
      ]);
      expect(cardReceived.kind).toBe("witnessed_action");
      expect(cardReceived.type).toBe("card_received");
      expect(cardReceived.actorId).toBe("p1");
      expect(cardReceived.targetId).toBe("p2");
    });
  });
});

// ==================== 消息可见性过滤测试 ====================

describe("Message Visibility Filtering", () => {
  describe("filterMessagesForPlayer", () => {
    it("announcement 消息应对所有玩家可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createSystem("系统公告"),
        TMessageBuilder.createPhaseTransition(GamePhase.DAY, GamePhase.NIGHT),
        TMessageBuilder.createDeathList(["p1"]),
      ];

      const state = createMockGameState();
      const filtered = Selectors.filterMessagesForPlayer(messages, "p1");

      expect(filtered).toHaveLength(3);
    });

    it("public_action 消息应对所有玩家可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createVote("p1", "p2"),
        TMessageBuilder.createPass("p3"),
        TMessageBuilder.createSay("p2", "Hello"),
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");

      expect(filteredP1).toHaveLength(3);
      expect(filteredP2).toHaveLength(3);
      expect(filteredP3).toHaveLength(3);
    });

    it("private_action 消息仅对 actor 可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createUseCard("p1", "detect", "p2"),
        TMessageBuilder.createUseCard("p2", "kill", "p3"),
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(1);
      expect((filteredP1[0] as any).actorId).toBe("p1");

      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      expect(filteredP2).toHaveLength(1);
      expect((filteredP2[0] as any).actorId).toBe("p2");

      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");
      expect(filteredP3).toHaveLength(0);
    });

    it("private_response 消息仅对 actor 可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createDetectResult("p1", "p2", 3, "detect"),
        TMessageBuilder.createCheckResult("p2", "p3", true, "kill_magic"),
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(1);

      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      expect(filteredP2).toHaveLength(1);

      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");
      expect(filteredP3).toHaveLength(0);
    });

    it("witnessed_action 消息对 actor 和 target 可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createCardReceived("p1", "p2", [{ id: "c1", type: "barrier" }]),
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(1);

      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      expect(filteredP2).toHaveLength(1);

      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");
      expect(filteredP3).toHaveLength(0);
    });

    it("调试模式 playerID='0' 应显示所有消息", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createSystem("公开"),
        TMessageBuilder.createUseCard("p1", "detect"),
        TMessageBuilder.createDetectResult("p2", "p3", 3, "detect"),
      ];

      const filtered = Selectors.filterMessagesForPlayer(messages, "0");
      expect(filtered).toHaveLength(3);
    });
  });

  describe("复杂可见性场景", () => {
    it("混合消息类型应正确过滤", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createSystem("系统公告"), // 所有人可见
        TMessageBuilder.createVote("p1", "p2"), // 所有人可见
        TMessageBuilder.createUseCard("p1", "detect", "p2"), // 仅 p1 可见
        TMessageBuilder.createUseCard("p2", "kill", "p3"), // 仅 p2 可见
        TMessageBuilder.createDetectResult("p3", "p1", 2, "barrier"), // 仅 p3 可见
        TMessageBuilder.createCardReceived("p1", "p2", []), // p1, p2 可见
      ];

      // p1 可见: 系统公告 + vote + 自己的 use_card + card_received
      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(4);

      // p2 可见: 系统公告 + vote + 自己的 use_card + card_received
      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      expect(filteredP2).toHaveLength(4);

      // p3 可见: 系统公告 + vote + 自己的 detect_result
      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");
      expect(filteredP3).toHaveLength(3);

      // p4 可见: 系统公告 + vote
      const filteredP4 = Selectors.filterMessagesForPlayer(messages, "p4");
      expect(filteredP4).toHaveLength(2);
    });

    it("多个 witnessed_action 消息应正确过滤", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createCardReceived("p1", "p3", []), // p1, p3 可见
        TMessageBuilder.createCardReceived("p2", "p3", []), // p2, p3 可见
        TMessageBuilder.createCardReceived("p1", "p2", []), // p1, p2 可见
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(2); // 第1条和第3条

      const filteredP2 = Selectors.filterMessagesForPlayer(messages, "p2");
      expect(filteredP2).toHaveLength(2); // 第2条和第3条

      const filteredP3 = Selectors.filterMessagesForPlayer(messages, "p3");
      expect(filteredP3).toHaveLength(2); // 第1条和第2条
    });
  });
});

// ==================== TMessageBuilder 测试 ====================

describe("TMessageBuilder", () => {
  describe("消息 ID 生成", () => {
    it("每条消息应有唯一 ID", () => {
      const msg1 = TMessageBuilder.createSystem("消息1");
      const msg2 = TMessageBuilder.createSystem("消息2");

      expect(msg1.id).not.toBe(msg2.id);
      expect(msg1.id).toBeDefined();
      expect(msg1.id.length).toBeGreaterThan(0);
    });

    it("每条消息应有时间戳", () => {
      const before = Date.now();
      const msg = TMessageBuilder.createSystem("测试");
      const after = Date.now();

      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("createSystem", () => {
    it("应创建系统公告消息", () => {
      const msg = TMessageBuilder.createSystem("游戏开始");
      expect(msg.kind).toBe("announcement");
      expect(msg.type).toBe("system");
      expect(msg.content).toBe("游戏开始");
    });

    it("应支持隐藏状态", () => {
      const msg = TMessageBuilder.createHiddenSystem("隐藏消息");
      expect(msg.status).toBe("hidden");
    });
  });

  describe("createVote", () => {
    it("应创建投票消息", () => {
      const msg = TMessageBuilder.createVote("player1", "player2");
      expect(msg.kind).toBe("public_action");
      expect(msg.type).toBe("vote");
      expect(msg.actorId).toBe("player1");
      expect(msg.targetId).toBe("player2");
    });
  });

  describe("createPass", () => {
    it("应创建弃权消息", () => {
      const msg = TMessageBuilder.createPass("player1");
      expect(msg.kind).toBe("public_action");
      expect(msg.type).toBe("pass");
      expect(msg.actorId).toBe("player1");
    });
  });

  describe("createUseCard", () => {
    it("应创建使用卡牌消息（有目标）", () => {
      const msg = TMessageBuilder.createUseCard("p1", "detect", "p2");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("use_card");
      expect(msg.actorId).toBe("p1");
      expect(msg.cardType).toBe("detect");
      expect(msg.targetId).toBe("p2");
    });

    it("应创建使用卡牌消息（无目标）", () => {
      const msg = TMessageBuilder.createUseCard("p1", "barrier");
      expect(msg.targetId).toBeUndefined();
    });
  });

  describe("createAttackResult", () => {
    it("应创建成功攻击结果", () => {
      const msg = TMessageBuilder.createAttackResult("p1", "p2", "kill", "success");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("attack_result");
      expect(msg.result).toBe("success");
      expect(msg.failReason).toBeUndefined();
    });

    it("应创建失败攻击结果（带原因）", () => {
      const msg = TMessageBuilder.createAttackResult(
        "p1",
        "p2",
        "kill",
        "fail",
        "barrier_protected",
      );
      expect(msg.result).toBe("fail");
      expect(msg.failReason).toBe("barrier_protected");
    });
  });

  describe("createTransformWitch", () => {
    it("应创建魔女转化消息", () => {
      const msg = TMessageBuilder.createTransformWitch("p1");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("transform_witch");
      expect(msg.actorId).toBe("p1");
    });
  });

  describe("createCardReceived", () => {
    it("应创建卡牌接收消息", () => {
      const cards = [{ id: "c1", type: "barrier" as const }];
      const msg = TMessageBuilder.createCardReceived("p1", "p2", cards);
      expect(msg.kind).toBe("witnessed_action");
      expect(msg.type).toBe("card_received");
      expect(msg.actorId).toBe("p1");
      expect(msg.targetId).toBe("p2");
      expect(msg.receivedCards).toEqual(cards);
    });
  });

  describe("createDetectResult", () => {
    it("应创建探知结果（带看到的卡牌）", () => {
      const msg = TMessageBuilder.createDetectResult("p1", "p2", 3, "detect");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("detect_result");
      expect(msg.handCount).toBe(3);
      expect(msg.seenCard).toBe("detect");
    });

    it("应创建探知结果（未看到卡牌）", () => {
      const msg = TMessageBuilder.createDetectResult("p1", "p2", 0);
      expect(msg.seenCard).toBeUndefined();
    });
  });

  describe("createCheckResult", () => {
    it("应创建检定结果", () => {
      const msg = TMessageBuilder.createCheckResult("p1", "p2", true, "witch_killer");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("check_result");
      expect(msg.isWitchKiller).toBe(true);
      expect(msg.deathCause).toBe("witch_killer");
    });
  });

  describe("createPhaseTransition", () => {
    it("应创建阶段转换消息", () => {
      const msg = TMessageBuilder.createPhaseTransition(GamePhase.DAY, GamePhase.NIGHT);
      expect(msg.kind).toBe("announcement");
      expect(msg.type).toBe("phase_transition");
      expect(msg.from).toBe(GamePhase.DAY);
      expect(msg.to).toBe(GamePhase.NIGHT);
    });
  });

  describe("createVoteSummary", () => {
    it("应创建投票摘要（无平票）", () => {
      const votes = [
        { voterId: "p1", targetId: "p2" },
        { voterId: "p2", targetId: "p3" },
        { voterId: "p3", targetId: "p2" },
      ];
      const msg = TMessageBuilder.createVoteSummary(votes, "p2", false);
      expect(msg.kind).toBe("announcement");
      expect(msg.type).toBe("vote_summary");
      expect(msg.votes).toEqual(votes);
      expect(msg.imprisonedId).toBe("p2");
      expect(msg.isTie).toBe(false);
    });

    it("应创建投票摘要（平票）", () => {
      const msg = TMessageBuilder.createVoteSummary([], null, true);
      expect(msg.imprisonedId).toBeNull();
      expect(msg.isTie).toBe(true);
    });
  });

  describe("createDeathList", () => {
    it("应创建死亡列表", () => {
      const msg = TMessageBuilder.createDeathList(["p1", "p2"]);
      expect(msg.kind).toBe("announcement");
      expect(msg.type).toBe("death_list");
      expect(msg.deathIds).toEqual(["p1", "p2"]);
    });

    it("应支持空死亡列表", () => {
      const msg = TMessageBuilder.createDeathList([]);
      expect(msg.deathIds).toEqual([]);
    });
  });

  describe("createDeathRecord", () => {
    it("应创建死亡记录", () => {
      const dropped = [{ id: "c1", type: "barrier" as const }];
      const msg = TMessageBuilder.createDeathRecord("p1", dropped);
      expect(msg.kind).toBe("announcement");
      expect(msg.type).toBe("death_record");
      expect(msg.playerId).toBe("p1");
      expect(msg.dropped).toEqual(dropped);
    });
  });

  describe("createBarrierApplied", () => {
    it("应创建结界应用消息（带攻击者）", () => {
      const msg = TMessageBuilder.createBarrierApplied("p1", "p2");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("barrier_applied");
      expect(msg.actorId).toBe("p1");
      expect(msg.attackerId).toBe("p2");
    });

    it("应创建结界应用消息（不带攻击者）", () => {
      const msg = TMessageBuilder.createBarrierApplied("p1");
      expect(msg.attackerId).toBeUndefined();
    });
  });

  describe("createWitchKillerObtainedNotification", () => {
    it("应创建魔女杀手获得通知", () => {
      const msg = TMessageBuilder.createWitchKillerObtainedNotification("p1", "p2", "passive");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("witch_killer_obtained");
      expect(msg.actorId).toBe("p1");
      expect(msg.fromPlayerId).toBe("p2");
      expect(msg.mode).toBe("passive");
    });
  });

  describe("createTradeOffer", () => {
    it("应创建交易提议", () => {
      const msg = TMessageBuilder.createTradeOffer("p1", "p2", "card123");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("trade_offer");
      expect(msg.actorId).toBe("p1");
      expect(msg.targetId).toBe("p2");
      expect(msg.offeredCardId).toBe("card123");
    });
  });

  describe("createTradeResponse", () => {
    it("应创建接受交易的响应", () => {
      const msg = TMessageBuilder.createTradeResponse("p2", "p1", true, "card456");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("trade_response");
      expect(msg.accepted).toBe(true);
      expect(msg.responseCardId).toBe("card456");
    });

    it("应创建拒绝交易的响应", () => {
      const msg = TMessageBuilder.createTradeResponse("p2", "p1", false);
      expect(msg.accepted).toBe(false);
      expect(msg.responseCardId).toBeUndefined();
    });
  });

  describe("createAttackExcessNotification", () => {
    it("应创建攻击超额通知", () => {
      const msg = TMessageBuilder.createAttackExcessNotification("p1", "kill", "quota_exceeded");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("attack_excess");
      expect(msg.actorId).toBe("p1");
      expect(msg.cardType).toBe("kill");
      expect(msg.reason).toBe("quota_exceeded");
    });
  });

  describe("createWreck", () => {
    it("应创建残骸化消息", () => {
      const msg = TMessageBuilder.createWreck("p1");
      expect(msg.kind).toBe("private_action");
      expect(msg.type).toBe("wreck");
      expect(msg.actorId).toBe("p1");
    });
  });

  describe("createSay", () => {
    it("应创建发言消息", () => {
      const msg = TMessageBuilder.createSay("p1", "大家好");
      expect(msg.kind).toBe("public_action");
      expect(msg.type).toBe("say");
      expect(msg.actorId).toBe("p1");
      expect(msg.content).toBe("大家好");
    });
  });

  describe("createPrivateMessageResponse", () => {
    it("应创建私密消息响应", () => {
      const msg = TMessageBuilder.createPrivateMessageResponse("p1", "私密内容");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("private_message");
      expect(msg.actorId).toBe("p1");
      expect(msg.content).toBe("私密内容");
    });
  });

  describe("createDeadResponse", () => {
    it("应创建死亡响应（带攻击者）", () => {
      const msg = TMessageBuilder.createDeadResponse("p1", "p2");
      expect(msg.kind).toBe("private_response");
      expect(msg.type).toBe("dead_response");
      expect(msg.actorId).toBe("p1");
      expect(msg.attackerId).toBe("p2");
    });

    it("应创建死亡响应（不带攻击者）", () => {
      const msg = TMessageBuilder.createDeadResponse("p1");
      expect(msg.attackerId).toBeUndefined();
    });
  });
});

// ==================== 边界情况测试 ====================

describe("Edge Cases", () => {
  describe("空消息列表", () => {
    it("空消息列表应返回空数组", () => {
      const filtered = Selectors.filterMessagesForPlayer([], "p1");
      expect(filtered).toEqual([]);
    });
  });

  describe("无效 playerId", () => {
    it("不存在的 actorId 的 private_action 应无人可见", () => {
      const messages: TMessage[] = [TMessageBuilder.createUseCard("ghost", "detect")];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(0);
    });

    it("不存在的参与者的 witnessed_action 应无人可见", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createCardReceived("ghost1", "ghost2", []),
      ];

      const filteredP1 = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filteredP1).toHaveLength(0);
    });
  });

  describe("消息顺序保持", () => {
    it("过滤后应保持消息原始顺序", () => {
      const messages: TMessage[] = [
        TMessageBuilder.createSystem("第一条"),
        TMessageBuilder.createVote("p1", "p2"),
        TMessageBuilder.createSystem("第三条"),
        TMessageBuilder.createPass("p3"),
      ];

      // 手动设置 id 以便验证顺序
      (messages[0] as any).id = "msg1";
      (messages[1] as any).id = "msg2";
      (messages[2] as any).id = "msg3";
      (messages[3] as any).id = "msg4";

      const filtered = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filtered.map((m) => m.id)).toEqual(["msg1", "msg2", "msg3", "msg4"]);
    });
  });

  describe("大量消息过滤性能", () => {
    it("应能处理大量消息", () => {
      const messages: TMessage[] = [];
      for (let i = 0; i < 100; i++) {
        messages.push(TMessageBuilder.createSystem(`消息${i}`));
      }

      const filtered = Selectors.filterMessagesForPlayer(messages, "p1");
      expect(filtered).toHaveLength(100);
    });
  });

  describe("特殊字符内容", () => {
    it("应支持包含特殊字符的消息内容", () => {
      const specialContent = "特殊字符: <>&\"' 中文 🎮";
      const msg = TMessageBuilder.createSystem(specialContent);
      expect(msg.content).toBe(specialContent);
    });
  });
});
