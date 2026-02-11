"use client";

/**
 * ChatBox 组件类型定义
 */

import type { PublicPlayerInfo, TMessage } from "../../types";

/**
 * 使用新的 TMessage 类型
 */
export type { TMessage } from "../../types";

/**
 * ChatBox 组件属性
 */
export interface ChatBoxProps {
  /** 消息列表 */
  messages: TMessage[];
  /** 当前玩家ID */
  currentPlayerId: string | null;
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
  /** 输入框占位符 */
  placeholder?: string;
  /** 玩家信息映射 */
  players: Record<string, PublicPlayerInfo>;
}

/**
 * 聊天头部组件属性
 */
export interface ChatHeaderProps {
  /** 消息数量 */
  messageCount: number;
}

/**
 * 单条消息组件属性
 */
export interface MessageItemProps {
  /** 消息数据 */
  message: TMessage;
  /** 当前玩家ID */
  currentPlayerId: string | null;
  /** 玩家信息映射 */
  players: Record<string, PublicPlayerInfo>;
}

/**
 * 消息列表组件属性
 */
export interface MessageListProps {
  /** 消息列表 */
  messages: TMessage[];
  /** 当前玩家ID */
  currentPlayerId: string | null;
  /** 玩家信息映射 */
  players: Record<string, PublicPlayerInfo>;
}

/**
 * 消息输入组件属性
 */
export interface MessageInputProps {
  /** 输入框占位符 */
  placeholder?: string;
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
}
