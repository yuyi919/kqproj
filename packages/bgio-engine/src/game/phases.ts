"use client";

/**
 * Phase 配置
 */

import type { PhaseConfig } from "boardgame.io";
import { ActivePlayers, TurnOrder } from "boardgame.io/core";
import { isEmptyObject } from "es-toolkit";
import type { BGGameState } from "../types";
import { GamePhase } from "../types/core";
import { Mutations, Selectors, TMessageBuilder as TB } from "../utils";
import { moveFunctions } from "./moves";
import { resolveNightActions } from "./resolution";
import type { PhaseHookContext } from "./types";

const phaseConfigs = {
  [GamePhase.LOBBY]: {
    next: GamePhase.SETUP,
  },
  [GamePhase.SETUP]: {
    next: GamePhase.MORNING,
  },
  [GamePhase.MORNING]: {
    start: true,
    moves: {},
    next: GamePhase.DAY,
    turn: {
      order: TurnOrder.RESET,
      activePlayers: {
        all: "wait",
      },
      stages: {
        wait: {
          moves: {
            say: moveFunctions.say,
          },
        },
      },
    },
    endIf({ G }: PhaseHookContext) {
      // 防止刚进入就超时
      return G.status === GamePhase.MORNING && G.phaseEndTime <= Date.now();
    },
    onBegin: ({ G, events }: PhaseHookContext) => {
      if (G.status !== GamePhase.SETUP) {
        G.status = GamePhase.MORNING;
        const prevRound = G.round++;
        Mutations.msg(G, TB.createSystem(`📜 第 ${prevRound} 天过去了`));
        // 显示死亡日志
        const lastRoundDeaths = G.deathLog.filter(
          (record) => record.round === prevRound,
        );
        if (lastRoundDeaths.length > 0) {
          const deathIds = lastRoundDeaths.map((d) => d.playerId);
          Mutations.msg(G, TB.createDeathList(deathIds));

          for (const death of lastRoundDeaths) {
            const receivedCardIds = new Set(
              Object.values(death.cardReceivers).flat(),
            );
            const unclaimed = death.droppedCards.filter(
              (c) => !receivedCardIds.has(c.id),
            );
            if (unclaimed.length > 0) {
              Mutations.msg(G, TB.createDeathRecord(death.playerId, unclaimed));
            }
          }
        }
      } else {
        G.status = GamePhase.MORNING;
      }
      // 添加早晨阶段消息
      Mutations.msg(
        G,
        TB.createPhaseTransition(GamePhase.DAY, GamePhase.MORNING),
      );
      Mutations.setPhaseTimer(G, 5); // 5 seconds duration
    },
  } satisfies PhaseConfig<BGGameState>,

  [GamePhase.DAY]: {
    moves: {
      say: moveFunctions.say,
      initiateTrade: moveFunctions.initiateTrade,
      respondTrade: moveFunctions.respondTrade,
      cancelTrade: moveFunctions.cancelTrade,
    },
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    next: GamePhase.NIGHT,
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = GamePhase.DAY;
      Mutations.setPhaseTimer(G, G.config.dayDuration);

      // 重置每日交易状态
      Mutations.resetDailyTradeStatus(G);

      // 清除未完成的交易
      G.activeTrade = null;

      // 添加日间阶段消息
      Mutations.msg(
        G,
        TB.createPhaseTransition(GamePhase.MORNING, GamePhase.DAY),
      );
    },
  } satisfies PhaseConfig<BGGameState>,

  /**
   * 夜间阶段（投票）
   *
   * 规则：
   * 1. 所有存活玩家可以投票
   * 2. 每人一票，可以改票
   * 3. 可以弃权（投给自己）
   * 4. 得票最高者被监禁
   * 5. 平票时无人被监禁
   */
  [GamePhase.NIGHT]: {
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    moves: {
      vote: moveFunctions.vote,
      pass: moveFunctions.pass,
    },
    next: GamePhase.DEEP_NIGHT,
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = GamePhase.NIGHT;
      Mutations.setPhaseTimer(G, G.config.votingDuration);
      console.log(`[Phase] Voting phase started, round ${G.round}`);

      // 添加夜间阶段消息
      Mutations.msg(
        G,
        TB.createPhaseTransition(GamePhase.DAY, GamePhase.NIGHT),
      );
    },
    onEnd: ({ G }: PhaseHookContext) => {
      console.log(
        `[Phase] Voting phase ended, processing ${G.currentVotes.length} votes`,
      );

      // 使用 Selectors 计算投票结果
      const voteResult = Selectors.computeVoteResult(G);
      const { imprisonedId, isTie, voteCounts, stats } = voteResult;
      const { totalAlive, participationCount, isValid, maxVotes } = stats;

      const participationRate =
        totalAlive > 0 ? participationCount / totalAlive : 0;

      console.log(
        `[VoteResult] Participation: ${(participationRate * 100).toFixed(
          1,
        )}%, valid: ${isValid}`,
      );

      // 投票参与率验证
      if (!isValid) {
        console.log(
          `[VoteResult] Vote invalid: participation rate ${(
            participationRate * 100
          ).toFixed(1)}% below minimum`,
        );
        Mutations.msg(
          G,
          TB.createSystem(
            `⚠️ 投票无效：参与率 ${participationCount}/${totalAlive}(${(
              participationRate * 100
            ).toFixed(1)}%) 未达到最低要求`,
          ),
        );
      } else if (isTie) {
        console.log(`[VoteResult] Tie! No one will be imprisoned`);
        Mutations.msg(G, TB.createSystem("⚠️ 投票平票，无人被监禁"));
      } else if (imprisonedId) {
        console.log(
          `[VoteResult] ${imprisonedId} will be imprisoned with ${maxVotes} votes`,
        );
        const imprisonedPlayer = G.players[imprisonedId];
        if (imprisonedPlayer) {
          Mutations.msg(
            G,
            TB.createSystem(
              `🔒 玩家${imprisonedPlayer.seatNumber} 以 ${maxVotes} 票被监禁`,
            ),
          );
        }
      } else {
        console.log(`[VoteResult] No valid votes, no one imprisoned`);
        Mutations.msg(G, TB.createSystem("⚠️ 无有效投票，无人被监禁"));
      }

      G.imprisonedId = imprisonedId;

      // 记录到历史
      G.voteHistory.push(voteResult);

      console.log(
        `[VoteResult] Vote history updated, total records: ${G.voteHistory.length}`,
      );

      // 添加投票结果摘要
      const voteSummary = Object.entries(voteCounts)
        .map(([targetId, count]) => {
          const player = G.players[targetId];
          return player
            ? `玩家${player.seatNumber}: ${count}票`
            : `${targetId}: ${count}票`;
        })
        .join(" | ");
      if (voteSummary) {
        Mutations.msg(G, TB.createSystem(`投票结果：${voteSummary}`));
      }
    },
  } satisfies PhaseConfig<BGGameState>,

  /**
   * 深夜阶段
   *
   * 规则：
   * 1. 深夜阶段进行卡牌行动
   * 2. 最后进行行动结算
   */
  [GamePhase.DEEP_NIGHT]: {
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    moves: {
      useCard: moveFunctions.useCard,
      pass: moveFunctions.passNight,
    },
    next: GamePhase.RESOLUTION,
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = GamePhase.DEEP_NIGHT;
      G.attackQuota = {
        witchKillerUsed: false,
        killMagicUsed: 0,
      };
      Mutations.setPhaseTimer(G, G.config.nightDuration);

      // 添加夜间阶段消息
      Mutations.msg(
        G,
        TB.createPhaseTransition(GamePhase.NIGHT, GamePhase.DEEP_NIGHT),
      );
    },
  } satisfies PhaseConfig<BGGameState>,

  resolution: {
    moves: {},
    turn: { order: TurnOrder.RESET, activePlayers: ActivePlayers.ALL },
    onBegin: ({ G, random, events }: PhaseHookContext) => {
      G.status = GamePhase.RESOLUTION;

      // 添加结算阶段开始消息
      Mutations.msg(G, TB.createSystem("⚖️ 正在结算……"));

      resolveNightActions(G, random);

      // 添加结算完成消息
      Mutations.msg(G, TB.createSystem("✅ 夜间行动结算完成"));

      // 显示本轮死亡汇总
      const currentRoundDeaths = G.deathLog.filter(
        (record) => record.round === G.round,
      );
      if (currentRoundDeaths.length > 0) {
        const deathCount = currentRoundDeaths.length;
        Mutations.msg(G, TB.createSystem(`☠️ 本轮共有 ${deathCount} 人死亡`));
      }

      events.endPhase?.();
    },
    // 如果存在卡牌选择，进入 cardSelection 阶段，否则进入 morning
    next: ({ G }: PhaseHookContext) => {
      return !isEmptyObject(G.cardSelection)
        ? GamePhase.CARD_SELECTION
        : GamePhase.MORNING;
    },
  } satisfies PhaseConfig<BGGameState>,

  /**
   * 卡牌选择阶段
   *
   * 用于杀手击杀后选择获得哪张卡牌
   */
  [GamePhase.CARD_SELECTION]: {
    moves: {
      selectDroppedCard: moveFunctions.selectDroppedCard,
      skipCardSelection: moveFunctions.skipCardSelection,
    },
    next: GamePhase.MORNING,
    turn: {
      order: TurnOrder.RESET,
      activePlayers: {
        all: "cardSelection",
      },
      stages: {
        cardSelection: {
          moves: {
            selectDroppedCard: moveFunctions.selectDroppedCard,
            skipCardSelection: moveFunctions.skipCardSelection,
          },
        },
      },
    },
    onBegin: ({ G }: PhaseHookContext) => {
      G.status = GamePhase.CARD_SELECTION;
      Mutations.setPhaseTimer(G, G.config.cardSelectionDuration);

      Object.values(G.cardSelection).forEach((cardSelection) => {
        Mutations.msg(
          G,
          TB.createPrivateMessageResponse(
            cardSelection.selectingPlayerId,
            `请选择一张卡牌`,
          ),
        );
      });
    },
    onEnd: ({ G, random }: PhaseHookContext) => {
      // 如果有卡牌选择但超时，随机分配
      Object.values(G.cardSelection).forEach((cardSelection) => {
        if (cardSelection) {
          const selectingPlayerId = cardSelection.selectingPlayerId;
          const availableCards = cardSelection.availableCards;

          if (availableCards.length > 0) {
            // 随机选择一张卡牌
            const randomIndex = random.Die(availableCards.length) - 1;
            const selectedCard = availableCards[randomIndex];

            // 完成卡牌选择过程（随机分配）
            Mutations.completeCardSelection(G, selectingPlayerId, selectedCard);

            Mutations.msg(
              G,
              TB.createPrivateMessageResponse(
                selectingPlayerId,
                `你超时未选择，随机获得了一张卡牌`,
              ),
            );

            console.log(
              `[CardSelection] ${selectingPlayerId} timed out, randomly assigned card ${selectedCard.type}`,
            );
          }
        }
      });
    },
  } satisfies PhaseConfig<BGGameState>,
  [GamePhase.ENDED]: {},
} satisfies Record<GamePhase, PhaseConfig<BGGameState>>;

export { phaseConfigs };
