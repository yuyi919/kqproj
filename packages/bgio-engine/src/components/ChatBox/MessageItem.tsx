"use client";

/**
 * 单条消息组件
 * 古早匿名版风格：时间戳 + 用户名 + 内容
 */

import React from "react";
import { theme } from "antd";
import type { MessageItemProps, ChatMessage } from "./types";

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
 * 获取显示名称
 */
function getDisplayName(msg: ChatMessage): string {
  if (msg.isSystem) return "【系统】";
  if (msg.playerName) return `【${msg.playerName}】`;
  return `【${msg.playerId.slice(0, 6)}】`;
}

/**
 * 判断是否为自己发送的消息
 */
function isSelf(msg: ChatMessage, currentPlayerId: string | null): boolean {
  return msg.playerId === currentPlayerId;
}

export function MessageItem({
  message,
  currentPlayerId,
}: MessageItemProps): React.ReactElement {
  const { token } = theme.useToken();

  // 系统消息特殊渲染
  if (message.isSystem) {
    return (
      <div
        style={{
          color: token.colorTextSecondary,
          fontSize: 12,
          padding: "2px 0",
        }}
      >
        --- {message.content} ---
      </div>
    );
  }

  const self = isSelf(message, currentPlayerId);

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
          color: self ? token.colorPrimary : "#2f7d32",
          fontWeight: self ? "bold" : "normal",
        }}
      >
        {getDisplayName(message)}
      </span>
      {/* 消息内容 */}
      <span style={{ color: token.colorText }}>{message.content}</span>
    </div>
  );
}
