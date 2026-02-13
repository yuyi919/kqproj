"use client";

import { ClearOutlined, LoginOutlined, SendOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Divider,
  Input,
  List,
  Space,
  Tag,
  Typography,
} from "antd";
import React, { useState } from "react";
import { useSocket } from "@/hooks/use-socket";

const { Title, Text } = Typography;

export default function SocketDebugPage() {
  const { isConnected, user, logs, joinRoom, sendMessage, clearLogs } =
    useSocket();
  const [roomName, setRoomName] = useState("general");
  const [message, setMessage] = useState("");

  const handleJoin = () => {
    if (roomName) {
      joinRoom(roomName);
    }
  };

  const handleSend = () => {
    if (message && roomName) {
      sendMessage(roomName, message);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <Title level={2}>WebSocket 调试页面</Title>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}
      >
        {/* 控制面板 */}
        <Space orientation="vertical" style={{ width: "100%" }} size="large">
          <Card title="连接状态">
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Space>
                <Badge status={isConnected ? "success" : "error"} />
                <Text strong>{isConnected ? "已连接" : "未连接"}</Text>
              </Space>
              {isConnected && (
                <div style={{ marginTop: "8px" }}>
                  <Text type="secondary">当前身份: </Text>
                  <Tag color={user ? "blue" : "default"}>
                    {user ? user.email : "匿名用户"}
                  </Tag>
                </div>
              )}
            </Space>
          </Card>

          <Card title="房间控制">
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Input
                placeholder="房间名称"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                prefix={<LoginOutlined />}
              />
              <Button
                type="primary"
                onClick={handleJoin}
                block
                disabled={!isConnected}
              >
                加入房间
              </Button>
            </Space>
          </Card>

          <Card title="消息发送">
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Input.TextArea
                rows={4}
                placeholder="输入测试消息..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                block
                disabled={!isConnected || !message}
              >
                发送消息
              </Button>
            </Space>
          </Card>
        </Space>

        {/* 日志面板 */}
        <Card
          title="实时日志"
          extra={
            <Button icon={<ClearOutlined />} onClick={clearLogs} size="small">
              清空
            </Button>
          }
          style={{
            height: "600px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          bodyStyle={{ flex: 1, overflowY: "auto", padding: "12px" }}
        >
          <List
            dataSource={logs}
            renderItem={(log) => (
              <List.Item style={{ padding: "8px 0" }}>
                <div style={{ width: "100%" }}>
                  <Space style={{ marginBottom: "4px" }}>
                    <Tag
                      color={
                        log.type.startsWith("emit")
                          ? "blue"
                          : log.type === "system"
                            ? "orange"
                            : log.type === "error"
                              ? "red"
                              : "green"
                      }
                    >
                      {log.type}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </Space>
                  <pre
                    style={{
                      margin: 0,
                      padding: "8px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
}
