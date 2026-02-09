"use client";

/**
 * ChatBox 组件类型定义
 */

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string;
  /** 发送者玩家ID */
  playerId: string;
  /** 发送者玩家名称（可选） */
  playerName?: string;
  /** 消息内容 */
  content: string;
  /** 发送时间戳 */
  timestamp: number;
  /** 是否为系统消息 */
  isSystem?: boolean;
}

/**
 * ChatBox 组件属性
 */
export interface ChatBoxProps {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 当前玩家ID */
  currentPlayerId: string | null;
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
  /** 输入框占位符 */
  placeholder?: string;
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
  message: ChatMessage;
  /** 当前玩家ID */
  currentPlayerId: string | null;
}

/**
 * 消息列表组件属性
 */
export interface MessageListProps {
  /** 消息列表 */
  messages: ChatMessage[];
  /** 当前玩家ID */
  currentPlayerId: string | null;
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
