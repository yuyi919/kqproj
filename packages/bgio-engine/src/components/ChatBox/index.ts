"use client";

/**
 * ChatBox 组件模块
 * 古早匿名版风格聊天组件
 */

// 主组件
export { ChatBox } from "./ChatBox";

// 子组件
export { ChatHeader } from "./ChatHeader";
export { MessageInput } from "./MessageInput";
export { MessageItem } from "./MessageItem";
export { MessageList } from "./MessageList";

// 类型
export type {
  ChatBoxProps,
  ChatHeaderProps,
  MessageInputProps,
  MessageItemProps,
  MessageListProps,
  TMessage,
} from "./types";
