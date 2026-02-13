"use client";

/**
 * 消息列表组件
 * 自动滚动到底部，显示所有消息
 */

import { Empty, theme } from "antd";
import type React from "react";
import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import type { MessageListProps } from "./types";

export function MessageList({
  messages,
  currentPlayerId,
  players,
}: MessageListProps): React.ReactElement {
  const { token } = theme.useToken();
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={listRef}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 12px",
        backgroundColor: "#fafafa",
        fontFamily:
          "monospace, 'Courier New', Consolas, 'Microsoft YaHei Mono', sans-serif",
        fontSize: 13,
        lineHeight: 1.6,
        height: "100%",
      }}
    >
      {messages.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无消息"
          className="mt-10"
        />
      ) : (
        <div className="flex flex-col">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentPlayerId={currentPlayerId}
              players={players}
            />
          ))}
        </div>
      )}
    </div>
  );
}
