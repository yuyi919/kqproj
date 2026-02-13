"use client";

/**
 * 魔女审判游戏引擎 - 主内容区组件
 *
 * 包含阶段显示、聊天区域、玩家手牌
 */

import { Alert, Col, Layout, Row, Space } from "antd";
import type React from "react";
import { useGameContext } from "../../contexts/GameContext";
import { getPhaseDescription, getPhaseName } from "../../utils";
import { ChatBox } from "../ChatBox";
import { PhaseDisplay } from "../PhaseDisplay";
import { PlayerHand } from "../PlayerHand";

const { Content } = Layout;

export function MainContent(): React.ReactElement {
  const {
    currentPhase,
    currentRound,
    G,
    currentPlayerId,
    chatMessages,
    handleSendMessage,
    handleEndPhase,
    currentPlayer,
    playerSecrets,
  } = useGameContext();

  return (
    <Content className="p-3 overflow-auto flex flex-col">
      {/* 顶部：阶段显示 */}
      {/* <PhaseDisplay
        phase={currentPhase}
        round={currentRound}
        phaseEndTime={G.phaseEndTime}
        onTimeUp={handleEndPhase}
      /> */}
      <Row gutter={6} className="h-full overflow-hidden">
        {/* 中部：三列布局 */}
        <Col xs={24} lg={14} className="h-full overflow-hidden">
          {/* 左侧主区域：聊天 */}
          <Space.Compact orientation="vertical" className="size-full">
            {/* 阶段提示 */}
            <Alert
              title={getPhaseName(currentPhase)}
              description={getPhaseDescription(currentPhase)}
              type="info"
              showIcon
              style={{ fontSize: 13 }}
              classNames={{ root: "p-3!" }}
            />

            {/* 聊天区域 - 核心位置 */}
            <ChatBox
              messages={
                G.chatMessages || chatMessages.map((msg) => msg.payload)
              }
              currentPlayerId={currentPlayerId}
              players={G.players}
              onSendMessage={handleSendMessage}
              placeholder={
                currentPhase === "day" ? "日间讨论..." : "输入消息..."
              }
            />

            {/* 手牌 - 紧凑水平展示 */}
            {currentPlayer && playerSecrets && currentPhase !== "setup" && (
              <PlayerHand
                hand={playerSecrets.hand}
                isWitch={playerSecrets.isWitch}
                hasBarrier={playerSecrets.hasBarrier}
              />
            )}
          </Space.Compact>
        </Col>

        <Col xs={24} lg={10} className="h-full overflow-hidden">
          {/* 右侧：操作面板 */}
          <ActionPanel />
        </Col>
      </Row>
    </Content>
  );
}

// 需要导入 ActionPanel，但由于它依赖 MainContent 的 layout
// 我们在 MainContent 中动态导入以避免循环依赖
import { ActionPanel } from "./ActionPanel";
