"use client";

/**
 * 聊天头部组件
 * 显示标题和消息数量
 */

import { MessageOutlined } from "@ant-design/icons";
import { theme } from "antd";
import type React from "react";
import type { ChatHeaderProps } from "./types";

export function ChatHeader({
  messageCount,
}: ChatHeaderProps): React.ReactElement {
  const { token } = theme.useToken();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <MessageOutlined />
      <span>聊天</span>
      <span
        style={{
          fontSize: 11,
          color: token.colorTextSecondary,
          fontFamily: "monospace",
        }}
      >
        [{messageCount}]
      </span>
    </div>
  );
}
