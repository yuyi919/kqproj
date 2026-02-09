'use client';

/**
 * 魔女审判游戏引擎 - 玩家手牌组件 (Ant Design 版本)
 * 
 * 紧凑设计：水平滚动卡片，减小间距
 */

import React from 'react';
import { Card, Badge, Space, Typography, Tag, Empty, theme } from 'antd';
import {
  CrownOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { CardRef } from '../types';
import { CardDisplay } from './ui/CardDisplay';

const { Text } = Typography;

interface PlayerHandProps {
  hand: CardRef[];
  isWitch: boolean;
  hasBarrier: boolean;
}

export function PlayerHand({
  hand,
  isWitch,
  hasBarrier,
}: PlayerHandProps): React.ReactElement {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      title={
        <Space size={4}>
          <span style={{ fontSize: 13 }}>手牌</span>
          <Badge count={hand.length} showZero color={token.colorPrimary} style={{ fontSize: 10 }} />
        </Space>
      }
      extra={
        <Space size={4}>
          {isWitch && (
            <Tag color="warning" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>
              <CrownOutlined style={{ fontSize: 10 }} /> 魔女
            </Tag>
          )}
          {hasBarrier && (
            <Tag color="success" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>
              <SafetyOutlined style={{ fontSize: 10 }} /> 结界
            </Tag>
          )}
        </Space>
      }
      styles={{ body: { padding: '8px' } }}
    >
      {hand.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无手牌"
          style={{ padding: 12 }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {hand.map((cardRef) => (
            <CardDisplay 
              key={cardRef.id} 
              cardRef={cardRef} 
              size="medium"
              showDescription
            />
          ))}
        </div>
      )}
    </Card>
  );
}
