"use client";

/**
 * ChatBox 组件模块
 * 古早匿名版风格聊天组件
 */

// 主组件
export { ChatBox } from "./ChatBox";

// 子组件
export { ChatHeader } from "./ChatHeader";
export { MessageList } from "./MessageList";
export { MessageItem } from "./MessageItem";
export { MessageInput } from "./MessageInput";

// 类型
export type {
  TMessage,
  ChatBoxProps,
  ChatHeaderProps,
  MessageItemProps,
  MessageListProps,
  MessageInputProps,
} from "./types";
