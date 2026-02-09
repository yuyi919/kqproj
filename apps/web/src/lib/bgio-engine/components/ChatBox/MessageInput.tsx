"use client";

/**
 * 消息输入组件
 * 包含输入框和发送按钮
 */

import React, { useState } from "react";
import { Input, Button, theme } from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { MessageInputProps } from "./types";

export function MessageInput({
  placeholder = "输入消息...",
  onSendMessage,
}: MessageInputProps): React.ReactElement {
  const { token } = theme.useToken();
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: "8px 12px",
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        backgroundColor: token.colorBgContainer,
        display: "flex",
        gap: 8,
      }}
    >
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ 
          fontFamily: "monospace, 'Courier New', Consolas, sans-serif",
          fontSize: 13,
        }}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={!inputValue.trim()}
      >
        发送
      </Button>
    </div>
  );
}
