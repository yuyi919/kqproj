"use client";

/**
 * 魔女审判游戏引擎 - 玩家手牌组件 (Ant Design 版本)
 *
 * 紧凑设计：水平滚动卡片，减小间距
 */

import React from "react";
import {
  Card,
  Badge,
  Space,
  Typography,
  Tag,
  Empty,
  theme,
  Popover,
  Button,
} from "antd";
import { CrownOutlined, SafetyOutlined } from "@ant-design/icons";
import type { CardRef } from "../types";
import { CardDisplay } from "./ui/CardDisplay";

const { Text } = Typography;

interface PlayerHandProps {
  hand: CardRef[];
  isWitch: boolean;
  hasBarrier: boolean;
  /** 是否使用 Popover 模式（默认 true） */
  popoverMode?: boolean;
}

/**
 * 手牌内容组件（用于 Popover 的内容）
 */
function HandContent({ hand }: { hand: CardRef[] }) {
  const { token } = theme.useToken();

  if (hand.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无手牌"
        style={{ padding: 12 }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        maxWidth: 500,
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
  );
}

/**
 * 手牌触发器按钮
 */
function HandTrigger({
  count,
  isWitch,
  hasBarrier,
}: {
  count: number;
  isWitch: boolean;
  hasBarrier: boolean;
}) {
  const { token } = theme.useToken();

  return (
    <Space size={4}>
      <Badge
        count={count}
        showZero
        color={token.colorPrimary}
        style={{ fontSize: 10 }}
      >
        <Button size="small" icon={<SafetyOutlined />} style={{ fontSize: 12 }}>
          手牌
        </Button>
      </Badge>
      {isWitch && (
        <Tag
          color="warning"
          style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}
        >
          <CrownOutlined style={{ fontSize: 10 }} />
        </Tag>
      )}
      {hasBarrier && (
        <Tag
          color="success"
          style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}
        >
          <SafetyOutlined style={{ fontSize: 10 }} />
        </Tag>
      )}
    </Space>
  );
}

export function PlayerHand({
  hand,
  isWitch,
  hasBarrier,
  popoverMode = true,
}: PlayerHandProps): React.ReactElement {
  const handContent = <HandContent hand={hand} />;

  // Popover 模式：点击按钮弹出气泡卡片
  if (popoverMode) {
    return (
      <Card size="small" styles={{ body: { padding: "8px" } }}>
        <Popover
          content={handContent}
          title={
            <Space size={4}>
              <span style={{ fontSize: 13 }}>我的手牌</span>
              <Badge count={hand.length} showZero />
            </Space>
          }
          trigger="hover"
          placement="top"
          styles={{ root: { maxWidth: 550 } }}
        >
          {HandTrigger({
            count: hand.length,
            isWitch,
            hasBarrier,
          })}
          {/* <HandTrigger
            count={hand.length}
            isWitch={isWitch}
            hasBarrier={hasBarrier}
          /> */}
        </Popover>
      </Card>
    );
  }

  // 传统模式：直接展示（用于调试或其他场景）
  const { token } = theme.useToken();
  return (
    <Card
      size="small"
      title={
        <Space size={4}>
          <span style={{ fontSize: 13 }}>手牌</span>
          <Badge
            count={hand.length}
            showZero
            color={token.colorPrimary}
            style={{ fontSize: 10 }}
          />
        </Space>
      }
      extra={
        <Space size={4}>
          {isWitch && (
            <Tag
              color="warning"
              style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}
            >
              <CrownOutlined style={{ fontSize: 10 }} /> 魔女
            </Tag>
          )}
          {hasBarrier && (
            <Tag
              color="success"
              style={{ fontSize: 10, padding: "0 4px", lineHeight: "16px" }}
            >
              <SafetyOutlined style={{ fontSize: 10 }} /> 结界
            </Tag>
          )}
        </Space>
      }
      styles={{ body: { padding: "8px" } }}
    >
      <HandContent hand={hand} />
    </Card>
  );
}
