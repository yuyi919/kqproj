"use client";

/**
 * 魔女审判游戏引擎 - 投票结果展示组件
 *
 * 显示投票统计结果，票数最高的玩家标记为 👑
 */

import React from "react";
import { Card, List, Space, Typography, Tag } from "antd";
import type { PublicPlayerInfo } from "../../types";

const { Text } = Typography;

export interface VoteResultsProps {
  players: PublicPlayerInfo[];
  voteCounts: Record<string, number>;
}

/**
 * 投票结果展示组件
 */
export function VoteResults({
  players,
  voteCounts,
}: VoteResultsProps): React.ReactElement {
  const totalVotes = Object.values(voteCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const sortedResults = Object.entries(voteCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (totalVotes === 0) {
    return <></>;
  }

  return (
    <Card
      type="inner"
      title="当前票数统计"
      size="small"
      extra={<Tag color="blue">共 {totalVotes} 票</Tag>}
    >
      <List
        size="small"
        dataSource={sortedResults}
        renderItem={([playerId, count]) => {
          const player = players.find((p) => p.id === playerId);
          return (
            <List.Item>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text>
                  {player ? `${player.seatNumber}号玩家` : "未知玩家"}
                </Text>
                <Tag
                  color={count === sortedResults[0][1] ? "success" : "default"}
                >
                  {count} 票{count === sortedResults[0][1] && " 👑"}
                </Tag>
              </Space>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
