'use client';

/**
 * 魔女审判游戏引擎 - 阶段徽章组件
 * 
 * 根据游戏阶段显示对应的图标和颜色
 */

import React from 'react';
import { Badge, theme } from 'antd';
import {
  SunOutlined,
  MessageOutlined,
  CheckSquareOutlined,
  MoonOutlined,
  PayCircleOutlined,
  FlagOutlined,
  QuestionOutlined,
} from '@ant-design/icons';
import type { GamePhase } from '../../types';

export interface PhaseBadgeProps {
  phase: GamePhase;
  size?: 'small' | 'medium' | 'large';
}

export interface PhaseConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
}

/**
 * 获取阶段配置
 */
export function getPhaseConfig(
  phase: GamePhase,
  token: ReturnType<typeof theme.useToken>['token']
): PhaseConfig {
  switch (phase) {
    case 'morning':
      return {
        icon: <SunOutlined />,
        color: token.colorWarning,
        label: '晨间',
      };
    case 'day':
      return {
        icon: <MessageOutlined />,
        color: token.colorSuccess,
        label: '日间',
      };
    case 'voting':
      return {
        icon: <CheckSquareOutlined />,
        color: token.colorInfo,
        label: '投票',
      };
    case 'night':
      return {
        icon: <MoonOutlined />,
        color: token.colorPrimary,
        label: '夜间',
      };
    case 'resolution':
      return {
        icon: <PayCircleOutlined />,
        color: token.colorTextSecondary,
        label: '结算',
      };
    case 'ended':
      return {
        icon: <FlagOutlined />,
        color: token.colorError,
        label: '结束',
      };
    default:
      return {
        icon: <QuestionOutlined />,
        color: token.colorTextSecondary,
        label: '未知',
      };
  }
}

const sizeConfig = {
  small: { fontSize: 14, width: 28, height: 28, lineHeight: '28px' },
  medium: { fontSize: 20, width: 40, height: 40, lineHeight: '40px' },
  large: { fontSize: 28, width: 56, height: 56, lineHeight: '56px' },
};

/**
 * 阶段徽章组件
 */
export function PhaseBadge({
  phase,
  size = 'medium',
}: PhaseBadgeProps): React.ReactElement {
  const { token } = theme.useToken();
  const config = getPhaseConfig(phase, token);
  const sizeStyles = sizeConfig[size];

  return (
    <Badge
      count={config.icon}
      style={{
        backgroundColor: config.color,
        ...sizeStyles,
      }}
    />
  );
}
