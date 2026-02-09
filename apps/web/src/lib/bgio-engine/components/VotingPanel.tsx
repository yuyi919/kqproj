'use client';

/**
 * 魔女审判游戏引擎 - 投票面板组件 (Ant Design 版本)
 */

import React, { useState } from 'react';
import { Card, Button, Radio, Space, Typography, Alert, Empty, Divider, Tag } from 'antd';
import {
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
} from '@ant-design/icons';
import type { PublicPlayerInfo } from '../types';
import { VoteResults } from './ui/VoteResults';

const { Title, Text } = Typography;

interface VotingPanelProps {
  players: PublicPlayerInfo[];
  currentPlayerId: string | null;
  hasVoted: boolean;
  voteCounts: Record<string, number>;
  onVote: (targetId: string) => void;
  onPass: () => void;
}

export function VotingPanel({
  players,
  currentPlayerId,
  hasVoted,
  voteCounts,
  onVote,
  onPass,
}: VotingPanelProps): React.ReactElement {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // 过滤出存活的玩家（不包括自己）
  const voteablePlayers = players.filter(
    (p) =>
      p.id !== currentPlayerId &&
      p.status === 'alive'
  );

  const handleVote = () => {
    if (selectedTarget) {
      onVote(selectedTarget);
      setSelectedTarget(null);
    }
  };

  const totalVotes = Object.values(voteCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (hasVoted) {
    return (
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            title="投票完成"
            description="你已投票，等待其他玩家投票..."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
          <VoteResults players={players} voteCounts={voteCounts} />
        </Space>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <TeamOutlined />
          <span>投票阶段</span>
        </Space>
      }
    >
      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          title="投票说明"
          description="选择一名玩家监禁，被监禁的玩家夜间无法使用手牌。"
          type="info"
          showIcon
        />

        <Radio.Group
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            {voteablePlayers.map((player) => (
              <Radio.Button
                key={player.id}
                value={player.id}
                style={{
                  width: '100%',
                  height: 'auto',
                  padding: '12px 16px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Space>
                  <UserOutlined />
                  <span>{player.seatNumber}号玩家</span>
                </Space>
                {voteCounts[player.id] > 0 && (
                  <Tag color="processing">{voteCounts[player.id]}票</Tag>
                )}
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>

        {voteablePlayers.length === 0 && (
          <Empty description="没有可投票的玩家" />
        )}

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleVote}
            disabled={!selectedTarget}
            icon={<LockOutlined />}
          >
            投票监禁
          </Button>
          <Button size="large" onClick={onPass}>
            弃权
          </Button>
        </Space>

        {totalVotes > 0 && <VoteResults players={players} voteCounts={voteCounts} />}
      </Space>
    </Card>
  );
}
