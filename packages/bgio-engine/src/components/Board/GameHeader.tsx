"use client";

/**
 * 魔女审判游戏引擎 - 游戏头部组件
 *
 * 显示游戏标题、当前阶段、存活人数、回合数
 */

import React from "react";
import { Layout, Space, Typography, Tag, theme } from "antd";
import { TeamOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useGameContext } from "../../contexts/GameContext";
import { getPhaseName, getPhaseColor } from "../../utils";

const { Header } = Layout;
const { Title, Text } = Typography;

export function GameHeader(): React.ReactElement {
  const { token } = theme.useToken();
  const { currentPhase, currentRound, alivePlayers, players } =
    useGameContext();

  return (
    <Header
      style={{
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 36,
      }}
    >
      <Space>
        <Title level={5} style={{ margin: 0, fontSize: 16 }}>
          魔女审判
        </Title>
        <Tag color={getPhaseColor(currentPhase)} icon={<ClockCircleOutlined />}>
          {getPhaseName(currentPhase)}
        </Tag>
      </Space>
      <Space size={16}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          <TeamOutlined /> {alivePlayers.length}/{players.length} 存活
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          第 {currentRound} 天
        </Text>
      </Space>
    </Header>
  );
}
