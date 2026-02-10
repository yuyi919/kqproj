"use client";

/**
 * 魔女审判游戏引擎 - 古早匿名版风格聊天组件
 *
 * 风格特点：
 * - 用户名和消息在同一行
 * - 简洁无装饰，类似 2ch/4chan 风格
 * - 等宽字体
 * - 允许折行
 *
 * 组件结构：
 * - ChatHeader: 聊天头部，显示标题和消息数量
 * - MessageList: 消息列表容器，自动滚动
 * - MessageItem: 单条消息渲染
 * - MessageInput: 消息输入框和发送按钮
 */

import React from "react";
import { Card } from "antd";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { ChatBoxProps } from "./types";

export function ChatBox({
  messages,
  currentPlayerId,
  onSendMessage,
  placeholder,
}: ChatBoxProps): React.ReactElement {
  return (
    <Card
      size="small"
      title={<ChatHeader messageCount={messages.length} />}
      className="h-full overflow-hidden flex flex-col"
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          height: "100%",
        },
      }}
    >
      {/* 消息列表 */}
      <MessageList messages={messages} currentPlayerId={currentPlayerId} />

      {/* 输入框 */}
      <MessageInput placeholder={placeholder} onSendMessage={onSendMessage} />
    </Card>
  );
}

// 导出子组件和类型
export { ChatHeader } from "./ChatHeader";
export { MessageList } from "./MessageList";
export { MessageItem } from "./MessageItem";
export { MessageInput } from "./MessageInput";
export type {
  ChatMessage,
  ChatBoxProps,
  ChatHeaderProps,
  MessageItemProps,
  MessageListProps,
  MessageInputProps,
} from "./types";
