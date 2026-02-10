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
import { Space, Card, Typography } from "antd";
import { VotingPanel } from "../VotingPanel";
import { NightActionPanel } from "../NightActionPanel";
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
    isWitchKillerAvailable,
    isCurrentPlayerWitchKillerHolder,
    killMagicQuota,
  } = useGameContext();

  return (
    <Space orientation="vertical" size={12} className="size-full">
      {/* 投票面板 */}
      {currentPhase === "voting" && currentPlayerId && (
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
      {currentPhase === "night" && currentPlayerId && playerSecrets && (
        <NightActionPanel
          hand={playerSecrets.hand}
          players={players}
          currentPlayerId={currentPlayerId}
          isWitch={playerSecrets.isWitch}
          hasBarrier={playerSecrets.hasBarrier}
          witchKillerAvailable={
            isWitchKillerAvailable && isCurrentPlayerWitchKillerHolder
          }
          killMagicAvailable={killMagicQuota}
          onUseCard={handleUseCard}
          onPass={handlePass}
        />
      )}

      {/* 等待提示 */}
      {(currentPhase === "morning" ||
        currentPhase === "day" ||
        currentPhase === "resolution") && (
        <Card size="small">
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
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
