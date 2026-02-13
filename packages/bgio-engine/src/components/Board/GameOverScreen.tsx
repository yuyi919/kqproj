"use client";

/**
 * 魔女审判游戏引擎 - 游戏结束界面
 *
 * 显示获胜信息和重新开始按钮
 */

import { ReloadOutlined, TrophyOutlined } from "@ant-design/icons";
import { Button, Card, Layout, Space, Typography, theme } from "antd";
import type React from "react";
import { useGameContext } from "../../contexts/GameContext";

const { Content } = Layout;
const { Title, Text } = Typography;

export function GameOverScreen(): React.ReactElement {
  const { token } = theme.useToken();
  const { winner } = useGameContext();

  return (
    <Layout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Content
        style={{
          padding: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <TrophyOutlined
              style={{ fontSize: 64, color: token.colorWarning }}
            />
            <Title level={2}>
              {winner ? `玩家 ${winner} 获胜！` : "游戏结束"}
            </Title>
            <Text type="secondary">游戏已结束，存活到最后的玩家获胜</Text>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            >
              重新开始
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}
