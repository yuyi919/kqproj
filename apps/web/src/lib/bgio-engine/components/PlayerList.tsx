'use client';

/**
 * 魔女审判游戏引擎 - 玩家列表组件 (Ant Design 版本)
 * 
 * 紧凑设计：减小头像、间距，使用更小的字体
 */

import React from 'react';
import { List, Card, Badge, Space, Typography, Tag, Tooltip, theme } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CrownOutlined,
  SafetyOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { PublicPlayerInfo, DeathRecord, PrivatePlayerInfo } from '../types';
import { getPlayerStatusName, getPlayerStatusColor } from '../utils';
import { PlayerStatusIcon } from './ui/PlayerStatusIcon';

const { Text } = Typography;

interface PlayerListProps {
  players: PublicPlayerInfo[];
  deathLog: DeathRecord[];
  currentPlayerId: string | null;
  imprisonedId: string | null;
  secrets: Record<string, PrivatePlayerInfo>;
}

export function PlayerList({
  players,
  deathLog,
  currentPlayerId,
  imprisonedId,
  secrets,
}: PlayerListProps): React.ReactElement {
  const { token } = theme.useToken();

  // 按座位号排序
  const sortedPlayers = [...players].sort(
    (a, b) => a.seatNumber - b.seatNumber
  );

  // 获取当前玩家的秘密信息
  const mySecrets = currentPlayerId ? secrets[currentPlayerId] : null;

  return (
    <Card
      size="small"
      title={
        <Space size={4}>
          <UserOutlined style={{ fontSize: 14 }} />
          <span style={{ fontSize: 14 }}>玩家</span>
          <Badge
            count={players.filter((p) => p.status === 'alive').length}
            showZero
            color={token.colorSuccess}
            style={{ fontSize: 10 }}
          />
        </Space>
      }
      styles={{ body: { padding: '8px 0' } }}
    >
      <List
        size="small"
        dataSource={sortedPlayers}
        renderItem={(player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const isImprisoned = player.id === imprisonedId;
          const playerSecrets = secrets[player.id];

          return (
            <List.Item
              style={{
                padding: '6px 12px',
                fontSize: 12,
                backgroundColor: isCurrentPlayer
                  ? token.colorPrimaryBg
                  : isImprisoned
                  ? token.colorWarningBg
                  : 'transparent',
                borderLeft: isCurrentPlayer
                  ? `2px solid ${token.colorPrimary}`
                  : 'none',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                width: '100%',
              }}>
                {/* 状态图标 */}
                <PlayerStatusIcon status={player.status} size={12} />
                
                {/* 座位号 */}
                <Text strong style={{ fontSize: 12, minWidth: 36 }}>
                  {player.seatNumber}号
                </Text>

                {/* 标识标签 */}
                <Space size={2}>
                  {isCurrentPlayer && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>我</Tag>}
                  
                  {isImprisoned && (
                    <Tooltip title="被监禁">
                      <LockOutlined style={{ color: token.colorError, fontSize: 12 }} />
                    </Tooltip>
                  )}
                  
                  {/* 只显示自己的魔女状态和结界 */}
                  {isCurrentPlayer && playerSecrets?.isWitch && (
                    <Tooltip title="魔女">
                      <CrownOutlined style={{ color: token.colorWarning, fontSize: 12 }} />
                    </Tooltip>
                  )}
                  {isCurrentPlayer && playerSecrets?.hasBarrier && (
                    <Tooltip title="结界保护">
                      <SafetyOutlined style={{ color: token.colorSuccess, fontSize: 12 }} />
                    </Tooltip>
                  )}
                  {isCurrentPlayer && playerSecrets?.witchKillerHolder && (
                    <Tooltip title="持魔女杀手">
                      <Tag color="gold" style={{ fontSize: 9, padding: '0 3px', lineHeight: '14px', margin: 0 }}>杀</Tag>
                    </Tooltip>
                  )}
                </Space>

                {/* 状态名称 - 紧凑显示 */}
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 11, 
                    marginLeft: 'auto',
                    color: getPlayerStatusColor(player.status)
                  }}
                >
                  {getPlayerStatusName(player.status)}
                </Text>

                {/* 手牌数量 - 只显示当前玩家 */}
                {isCurrentPlayer && (
                  <Tooltip title="手牌数量">
                    <Space size={2} style={{ marginLeft: 4 }}>
                      <InboxOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                      <Text style={{ fontSize: 11 }}>{mySecrets?.hand.length ?? 0}</Text>
                    </Space>
                  </Tooltip>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
