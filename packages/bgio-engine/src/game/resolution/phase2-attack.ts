"use client";

/**
 * Phase 2: 攻击结算
 *
 * 职责：处理 witch_killer 和 kill 攻击的结算
 * 规则：
 * 1. witch_killer 优先结算
 * 2. kill 按配额和顺序结算（无 witch_killer 时 3 个，有 witch_killer 时 2 个）
 * 3. 结算时如果攻击者已死亡，自动失败，不消耗卡牌
 * 4. witch_killer 成功后，针对原持有者的攻击失败，消耗卡牌
 * 5. witch_killer 防御成功后，攻击者获得 witch_killer
 */

import { Refinements } from "../../domain/refinements";
import type {
  ActionFailureReason,
  BGGameState,
  DeathCause,
  RandomAPI,
} from "../../types";
import { Mutations, TMessageBuilder } from "../../utils";
import {
  getAttackType,
  isWitchKillerUsed,
  sortAttackActions,
} from "./services/priority";
import type { PhaseResult } from "./types";
import { KILL_QUOTA } from "./types";

/**
 * 处理攻击结算
 */
export function processAttackActions(
  G: Readonly<BGGameState>,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  // 从 previousResult 获取 barrierPlayers
  const barrierPlayers = previousResult.barrierPlayers ?? new Set<string>();

  // 过滤并排序攻击行动
  const attackActions = sortAttackActions(G.nightActions);

  // 检查 witch_killer 是否已使用
  const witchKillerUsed = isWitchKillerUsed(attackActions);
  const maxKill = witchKillerUsed
    ? KILL_QUOTA.withWitchKiller
    : KILL_QUOTA.withoutWitchKiller;

  // 初始化结果
  const result: PhaseResult = {
    stateUpdates: { ...previousResult.stateUpdates },
    deadPlayers: new Set(previousResult.deadPlayers),
    barrierPlayers: new Set(barrierPlayers),
    attackResult: {
      killedByWitchKiller: new Set(),
      executedActions: new Set(),
      failedActions: [],
    },
  };

  // 跟踪已死亡的玩家
  const deadPlayers = new Set<string>();

  // 跟踪 witch_killer 成功击杀后，持有者受保护（其他攻击落空）
  let protectedWitchKillerHolderId: string | null = null;

  // 辅助函数：标记行动失败（直接修改行动对象）
  const takeActionFailed = (
    action: (typeof attackActions)[0],
    reason: ActionFailureReason,
  ) => {
    action.executed = false;
    action.failedReason = reason;
    result.attackResult!.failedActions.push({ actionId: action.id, reason });
  };

  // 跟踪已处理的攻击数量（用于配额计算）
  let processedKillCount = 0;

  // 处理每个攻击行动
  for (const action of attackActions) {
    if (!action.card) continue;
    if (!action.targetId) continue;

    const actorSecret = G.secrets[action.playerId];
    const targetPlayer = G.players[action.targetId];
    const targetSecret = G.secrets[action.targetId];
    const actorPlayer = G.players[action.playerId];

    if (!actorSecret || !targetPlayer || !targetSecret || !actorPlayer)
      continue;

    // 获取攻击类型（用于配额计算）
    const attackType = getAttackType(action.card);

    // ============================================
    // 规则 4.5: "对方同样以你为目标：你被击杀，杀人魔法未使用故不消耗"
    // 攻击者已死亡 → 自动失败，不消耗卡牌，不计入配额
    // ============================================
    if (deadPlayers.has(action.playerId)) {
      takeActionFailed(action, "actor_dead");
      Mutations.msg(
        G,
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "actor_dead",
        ),
      );
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "actor_dead",
      });
      continue;
    }

    // ============================================
    // 规则 4.5: "对方攻击他人且成功：你的攻击落空；杀人魔法消耗"
    // witch_killer 成功后，针对持有者的攻击落空，消耗卡牌，计入配额
    // ============================================
    if (
      protectedWitchKillerHolderId &&
      action.targetId === protectedWitchKillerHolderId
    ) {
      takeActionFailed(action, "target_witch_killer_failed");
      Mutations.msg(
        G,
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "target_witch_killer_failed",
        ),
      );
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "target_witch_killer_failed",
      });
      // 配额计入
      if (attackType === "kill") processedKillCount++;
      continue;
    }

    // ============================================
    // 配额检查（仅对 kill magic）
    // 配额限制的是"尝试发动攻击"的数量，不是"成功执行"的数量
    // 注意：配额已经在 witch_killer 成功后计入
    // ============================================
    if (attackType === "kill") {
      if (processedKillCount >= maxKill) {
        // 超出配额
        takeActionFailed(action, "quota_exceeded");
        Mutations.msg(
          G,
          TMessageBuilder.createAttackExcessNotification(
            action.playerId,
            action.card.type,
            "quota_exceeded",
          ),
        );
        continue;
      }
      // 配额增加（无论是否成功执行）
      processedKillCount++;
    }

    // 检查目标是否已死亡（被其他 kill 杀死）
    if (deadPlayers.has(action.targetId)) {
      takeActionFailed(action, "target_already_dead");
      Mutations.msg(
        G,
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "target_already_dead",
        ),
      );
      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "target_already_dead",
      });
      continue;
    }

    // 检查目标是否有结界保护
    if (barrierPlayers.has(action.targetId)) {
      takeActionFailed(action, "barrier_protected");
      Mutations.msg(
        G,
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "fail",
          "barrier_protected",
        ),
      );
      Mutations.msg(
        G,
        TMessageBuilder.createBarrierApplied(action.targetId, action.playerId),
      );

      Mutations.addRevealedInfo(G, action.playerId, "attack_failed", {
        targetId: action.targetId,
        reason: "barrier_protected",
      });
      Mutations.addRevealedInfo(G, action.targetId, "barrier", {
        attackerId: action.playerId,
        cardType: action.card.type,
      });

      targetSecret.hasBarrier = false;
      barrierPlayers.delete(action.targetId);
      continue;
    }

    // 记录目标是否持有 witch_killer（killPlayer 会修改此状态）
    const targetHadWitchKiller = targetSecret.witchKillerHolder;

    // 执行击杀
    const cause: DeathCause = Refinements.isWitchKillerCard(action.card)
      ? "witch_killer"
      : "kill_magic";

    const killResult = Mutations.killPlayer(
      G as BGGameState,
      action.targetId,
      cause,
      action.playerId,
      random,
    );

    if (killResult) {
      result.attackResult!.executedActions.add(action.id);
      deadPlayers.add(action.targetId);

      // 标记行动为已执行
      action.executed = true;

      // 如果是 witch_killer 成功击杀，记录到 killedByWitchKiller 并保护持有者
      if (Refinements.isWitchKillerCard(action.card)) {
        result.attackResult!.killedByWitchKiller.add(action.targetId);
        protectedWitchKillerHolderId = action.playerId;
      }

      // 添加攻击成功消息
      Mutations.msg(
        G,
        TMessageBuilder.createAttackResult(
          action.playerId,
          action.targetId,
          action.card.type,
          "success",
        ),
      );

      // 添加死亡消息
      Mutations.msg(
        G,
        TMessageBuilder.createDeadResponse(targetPlayer.id, actorPlayer.id),
      );

      if (Refinements.isKillMagicCard(action.card)) {
        // kill 击杀成功
        actorSecret.consecutiveNoKillRounds = 0;
        actorSecret.isWitch = true;
        Mutations.msg(G, TMessageBuilder.createTransformWitch(action.playerId));
        Mutations.addRevealedInfo(G, action.playerId, "witch_transform", {
          reason: "kill_success",
        });

        // 规则 6.2 情境四：击杀 witch_killer 持有者时，强制获得 witch_killer
        // （实际转移已在 killPlayer 内完成，此处添加通知）
        if (targetHadWitchKiller) {
          Mutations.msg(
            G,
            TMessageBuilder.createPrivateMessageResponse(
              action.playerId,
              `你击杀了【魔女杀手】持有者，取得了【魔女杀手】`,
            ),
          );
          Mutations.addRevealedInfo(
            G,
            action.playerId,
            "witch_killer_obtained",
            {
              fromPlayerId: action.targetId,
              reason: "kill_holder",
            },
          );
        }
      } else if (Refinements.isWitchKillerCard(action.card)) {
        // witch_killer 击杀成功
        actorSecret.consecutiveNoKillRounds = 0;
      }

      // 分配遗落卡牌（统一推迟到 Phase 5 之后处理）
      // 注意：这里不直接调用分配函数，只记录需要分配的信息

      if (Refinements.isWitchKillerCard(action.card)) {
        // witch_killer 击杀：杀手无法取得卡牌
        // 设置延迟分配状态
        result.pendingDistributions = result.pendingDistributions ?? [];
        result.pendingDistributions!.push({
          type: "skipKiller",
          victimId: action.targetId,
          cards: killResult.droppedCards,
          killerId: action.playerId,
        });
      } else if (Refinements.isKillMagicCard(action.card)) {
        // kill 击杀：杀手有 cardSelection 阶段
        // 设置 cardSelection 状态，触发 cardSelection phase
        (result.stateUpdates.cardSelection ||= {})[action.playerId] = {
          selectingPlayerId: action.playerId,
          availableCards: killResult.droppedCards,
          victimId: action.targetId,
          deadline: Date.now() + G.config.cardSelectionDuration * 1000,
        };

        // 同时设置延迟分配（cardSelection 完成后执行）
        result.pendingDistributions = result.pendingDistributions ?? [];
        result.pendingDistributions.push({
          type: "killerSelect",
          victimId: action.targetId,
          cards: killResult.droppedCards,
          killerId: action.playerId,
        });

        // 发送选择消息
        Mutations.msg(
          G,
          TMessageBuilder.createPrivateMessageResponse(
            action.playerId,
            `请选择一张卡牌（${killResult.droppedCards.length}张可用）`,
          ),
        );
      }
    } else {
      // 击杀失败
      takeActionFailed(action, "execution_failed");
    }
  }

  // 更新 deadPlayers
  result.deadPlayers = deadPlayers;

  return result;
}
