'use client';

/**
 * 魔女审判游戏引擎 - 玩家状态图标组件
 * 
 * 根据玩家状态显示对应的图标
 */

import React from 'react';
import { Badge, theme } from 'antd';
import {
  CrownOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { PlayerStatus } from '../../types';

export interface PlayerStatusIconProps {
  status: PlayerStatus;
  size?: number;
}

/**
 * 玩家状态图标组件
 */
export function PlayerStatusIcon({
  status,
  size = 12,
}: PlayerStatusIconProps): React.ReactElement {
  const { token } = theme.useToken();

  switch (status) {
    case 'alive':
      return <Badge status="success" />;
    case 'witch':
      return (
        <CrownOutlined
          style={{ color: token.colorWarning, fontSize: size }}
        />
      );
    case 'dead':
      return (
        <CloseCircleOutlined
          style={{ color: token.colorTextSecondary, fontSize: size }}
        />
      );
    case 'wreck':
      return (
        <CloseCircleOutlined
          style={{ color: token.colorError, fontSize: size }}
        />
      );
    default:
      return <Badge status="default" />;
  }
}

/**
 * 获取状态图标（纯函数版本，用于非 React 场景）
 */
export function getStatusIcon(
  status: PlayerStatus,
  token: ReturnType<typeof theme.useToken>['token'],
  size: number = 12
): React.ReactNode {
  switch (status) {
    case 'alive':
      return <Badge status="success" />;
    case 'witch':
      return (
        <CrownOutlined
          style={{ color: token.colorWarning, fontSize: size }}
        />
      );
    case 'dead':
      return (
        <CloseCircleOutlined
          style={{ color: token.colorTextSecondary, fontSize: size }}
        />
      );
    case 'wreck':
      return (
        <CloseCircleOutlined
          style={{ color: token.colorError, fontSize: size }}
        />
      );
    default:
      return <Badge status="default" />;
  }
}
