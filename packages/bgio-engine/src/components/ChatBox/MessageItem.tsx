"use client";

/**
 * 单条消息组件
 * 古早匿名版风格：时间戳 + 用户名 + 内容
 */

import React from "react";
import { theme } from "antd";
import type { MessageItemProps, TMessage } from "./types";

/**
 * 格式化时间戳为 HH:MM
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 获取玩家的显示名称
 */
function getPlayerName(
  playerId: string,
  players: Record<string, { seatNumber: number }>,
): string {
  const player = players[playerId];
  if (!player) return `玩家${playerId.slice(0, 6)}`;
  return `玩家${player.seatNumber}`;
}

/**
 * 将 TMessage 转换为可显示的文本内容
 */
function getMessageText(
  msg: TMessage,
  players: Record<string, { seatNumber: number }>,
): string {
  switch (msg.kind) {
    case "announcement":
      switch (msg.type) {
        case "system":
          return msg.content;
        case "phase_transition":
          return `阶段转换: ${msg.from} → ${msg.to}`;
        case "vote_summary":
          return `投票总结: 监禁=${msg.imprisonedId || "无"}, 平票=${msg.isTie}`;
        case "death_list":
          const names = msg.deathIds
            .map((id) => getPlayerName(id, players))
            .join(", ");
          return `死亡名单: ${names}`;
        default:
          return "未知公告";
      }

    case "public_action":
      switch (msg.type) {
        case "vote":
          const targetName = getPlayerName(msg.targetId, players);
          return `投票给 -> ${targetName}`;
        case "pass":
          return "弃权";
        case "say":
          return msg.content;
        default:
          return "未知行动";
      }

    case "private_action":
      switch (msg.type) {
        case "use_card":
          const cardNames: Record<string, string> = {
            witch_killer: "魔女杀手",
            barrier: "结界魔法",
            kill: "杀人魔法",
            detect: "探知魔法",
            check: "检定魔法",
          };
          const cardName = cardNames[msg.cardType] || msg.cardType;
          if (msg.targetId) {
            const targetName = getPlayerName(msg.targetId, players);
            return `使用 ${cardName} 针对 玩家${targetName}`;
          }
          return `使用 ${cardName}`;
        case "attack_result":
          const attackerName = getPlayerName(msg.actorId, players);
          const attackedTargetName = getPlayerName(msg.targetId, players);
          const attackCardName =
            msg.cardType === "witch_killer" ? "魔女杀手" : "杀人魔法";
          if (msg.result === "success") {
            return `${attackCardName}攻击成功！${attackerName} 击杀了 ${attackedTargetName}`;
          } else {
            const reasons: Record<string, string> = {
              barrier_protected: "目标有结界保护",
              target_already_dead: "目标已经死亡",
            };
            const reason = reasons[msg.failReason!] || "攻击失败";
            return `${attackCardName}攻击失败：${reason}`;
          }
        case "transform_witch":
          return "魔女化：使用杀人魔法成功";
        case "wreck":
          return "残骸化：连续两回合未击杀，已转化为残骸";
        case "barrier_applied":
          const barrierAttackerName = msg.attackerId
            ? getPlayerName(msg.attackerId, players)
            : "攻击者";
          return `结界保护：成功抵御 ${barrierAttackerName} 的攻击`;
        case "check_result":
          const checkTargetName = getPlayerName(msg.targetId, players);
          const causeNames: Record<string, string> = {
            witch_killer: "魔女杀手",
            kill_magic: "杀人魔法",
            wreck: "残骸化",
          };
          const causeName = causeNames[msg.deathCause] || "未知";
          const killerHint = msg.isWitchKiller ? "（持有魔女杀手）" : "";
          return `检定结果：玩家${checkTargetName}的死因是${killerHint} ${causeName}`;
        case "detect_result":
          const detectTargetName = getPlayerName(msg.targetId, players);
          const cardTypeNames: Record<string, string> = {
            witch_killer: "魔女杀手",
            barrier: "结界魔法",
            kill: "杀人魔法",
            detect: "探知魔法",
            check: "检定魔法",
          };
          let detectText = `探知：玩家${detectTargetName} 手牌数 ${msg.handCount} 张`;
          if (msg.seenCard) {
            const seenCardName = cardTypeNames[msg.seenCard] || msg.seenCard;
            detectText += `，随机看到一张 ${seenCardName}`;
          }
          return detectText;
        default:
          return "未知私密行动";
      }

    case "witnessed_action":
      if (msg.type === "card_received") {
        const receiverName = getPlayerName(msg.actorId, players);
        const victimName = getPlayerName(msg.targetId, players);
        const cardNames = msg.receivedCards
          .map((c) => {
            const cardTypeNames: Record<string, string> = {
              witch_killer: "魔女杀手",
              barrier: "结界魔法",
              kill: "杀人魔法",
              detect: "探知魔法",
              check: "检定魔法",
            };
            return cardTypeNames[c.type] || c.type;
          })
          .join(", ");
        return `获得遗落卡牌: ${cardNames}`;
      }
      return "未知见证行动";

    default:
      return "未知消息类型";
  }
}

/**
 * 判断消息是否来自当前玩家
 */
function isOwnMessage(msg: TMessage, currentPlayerId: string | null): boolean {
  switch (msg.kind) {
    case "announcement":
      return false; // 公告都是系统消息
    case "public_action":
      return msg.actorId === currentPlayerId;
    case "private_action":
      return msg.actorId === currentPlayerId;
    case "witnessed_action":
      return msg.actorId === currentPlayerId;
    default:
      return false;
  }
}

/**
 * 判断是否为系统公告
 */
function isSystemAnnouncement(msg: TMessage): boolean {
  return msg.kind === "announcement";
}

export function MessageItem({
  message,
  currentPlayerId,
  players, // 从 GameContext 获取
}: MessageItemProps): React.ReactElement {
  const { token } = theme.useToken();

  const isSystem = isSystemAnnouncement(message);
  const isOwn = isOwnMessage(message, currentPlayerId);
  const text = getMessageText(message, players);

  // 系统消息特殊渲染
  if (isSystem) {
    return (
      <div
        className="text-center text-xs"
        style={{
          color: token.colorTextSecondary,
        }}
      >
        --- {text} ---
      </div>
    );
  }

  // 获取显示名称
  let displayName: string;
  if (message.kind === "announcement") {
    displayName = "【系统】";
  } else if (message.kind === "public_action" && message.type === "say") {
    const player = players[message.actorId];
    displayName = player
      ? `【玩家${player.seatNumber}】`
      : `【${message.actorId.slice(0, 6)}】`;
  } else {
    const player = players[message.actorId];
    displayName = player
      ? `【玩家${player.seatNumber}】`
      : `【${message.actorId.slice(0, 6)}】`;
  }

  return (
    <div
      style={{
        padding: "2px 0",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {/* 时间戳 */}
      <span style={{ color: token.colorTextTertiary, fontSize: 11 }}>
        {formatTime(message.timestamp)}
      </span>{" "}
      {/* 用户名 */}
      <span
        style={{
          color: isOwn ? token.colorPrimary : "#2f7d32",
          fontWeight: isOwn ? "bold" : "normal",
        }}
      >
        {displayName}
      </span>
      {/* 消息内容 */}
      <span style={{ color: token.colorText }}>{text}</span>
    </div>
  );
}
