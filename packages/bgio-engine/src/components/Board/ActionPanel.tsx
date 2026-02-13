"use client";

/**
 * 魔女审判游戏引擎 - 操作面板组件
 *
 * 根据当前阶段显示不同的操作界面：
 * - voting: 投票面板
 * - night: 夜间行动面板
 * - 其他: 等待提示
 */

import React from "react";
import { Space, Card, Typography, Alert } from "antd";
import { FrownOutlined } from "@ant-design/icons";
import { VotingPanel } from "../VotingPanel";
import { NightActionPanel } from "../NightActionPanel";
import { CardSelectionPanel } from "../CardSelectionPanel";
import { useGameContext } from "../../contexts/GameContext";

const { Text } = Typography;

export function ActionPanel(): React.ReactElement {
  const {
    currentPhase,
    players,
    currentPlayerId,
    playerSecrets,
    voteCounts,
    handleVote,
    handlePass,
    handleUseCard,
    hasPlayerVoted,
    isCurrentPlayerWitchKillerHolder,
    killMagicQuota,
    isImprisoned,
    currentCardSelection,
    handleSelectCard,
    handleSkipCardSelection,
    isPlayerAlive,
  } = useGameContext();

  return (
    <Space
      orientation="vertical"
      size={12}
      className="size-full"
      classNames={{ item: "size-full" }}
    >
      {/* 已死亡提示 */}
      {!isPlayerAlive && currentPlayerId && (
        <Card size="small">
          <Alert
            type="error"
            icon={<FrownOutlined />}
            title="你已死亡"
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  你已在这场游戏中被击杀
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  死亡玩家可以继续旁观游戏进程，但不能执行任何行动
                </Text>
              </Space>
            }
            showIcon
          />
        </Card>
      )}

      {/* 投票面板 */}
      {isPlayerAlive && currentPhase === "night" && currentPlayerId && (
        <VotingPanel
          players={players}
          currentPlayerId={currentPlayerId}
          hasVoted={hasPlayerVoted}
          voteCounts={voteCounts}
          onVote={handleVote}
          onPass={handlePass}
        />
      )}

      {/* 夜间行动面板 */}
      {isPlayerAlive &&
        currentPhase === "deepNight" &&
        currentPlayerId &&
        playerSecrets && (
          <NightActionPanel
            hand={playerSecrets.hand}
            players={players}
            currentPlayerId={currentPlayerId}
            isWitch={playerSecrets.isWitch}
            hasBarrier={playerSecrets.hasBarrier}
            consecutiveNoKillRounds={playerSecrets.consecutiveNoKillRounds}
            witchKillerAvailable={isCurrentPlayerWitchKillerHolder}
            isImprisoned={isImprisoned}
            killMagicAvailable={killMagicQuota}
            onUseCard={handleUseCard}
            onPass={handlePass}
          />
        )}

      {/* 卡牌选择面板 */}
      {isPlayerAlive &&
        currentPhase === "cardSelection" &&
        currentPlayerId &&
        currentCardSelection && (
          <CardSelectionPanel
            availableCards={currentCardSelection.availableCards}
            victimSeatNumber={
              players.find((p) => p.id === currentCardSelection.victimId)
                ?.seatNumber ?? currentCardSelection.victimId
            }
            onSelectCard={handleSelectCard}
            onSkip={handleSkipCardSelection}
          />
        )}

      {/* 等待提示 */}
      {isPlayerAlive &&
        (currentPhase === "morning" ||
          currentPhase === "day" ||
          currentPhase === "resolution") && (
          <Card size="small">
            <Space
              orientation="vertical"
              size="small"
              style={{ width: "100%" }}
            >
              {currentPhase === "morning" && (
                <>
                  <Text strong>晨间阶段</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    查看昨晚死亡情况
                  </Text>
                </>
              )}
              {currentPhase === "day" && (
                <>
                  <Text strong>日间阶段</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    自由讨论，制定策略
                  </Text>
                </>
              )}
              {currentPhase === "resolution" && (
                <>
                  <Text strong>结算阶段</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    正在处理行动结果...
                  </Text>
                </>
              )}
            </Space>
          </Card>
        )}
    </Space>
  );
}
