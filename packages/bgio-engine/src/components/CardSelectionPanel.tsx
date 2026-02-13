"use client";

/**
 * 魔女审判游戏引擎 - 卡牌选择面板
 *
 * 用于击杀后选择获得的遗落手牌
 */

import React, { useState } from "react";
import { Card, Button, Space, Typography, Alert, theme } from "antd";
import { GiftOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { CardRef } from "../types";
import { CardDisplay } from "./ui";

const { Text } = Typography;

export interface CardSelectionPanelProps {
  availableCards: CardRef[];
  victimSeatNumber: number | string;
  onSelectCard: (cardId: string) => void;
  onSkip: () => void;
}

export function CardSelectionPanel({
  availableCards,
  victimSeatNumber,
  onSelectCard,
  onSkip,
}: CardSelectionPanelProps): React.ReactElement {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { token } = theme.useToken();

  const handleConfirm = () => {
    if (selectedCardId) {
      onSelectCard(selectedCardId);
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <GiftOutlined />
          <span>选择遗落手牌</span>
        </Space>
      }
    >
      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%" }}
      >
        <Alert
          type="info"
          showIcon
          message={`玩家${victimSeatNumber} 的遗落手牌`}
          description="你可以选择一张卡牌加入手牌，或放弃选择"
        />

        {/* 卡牌列表 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {availableCards.map((cardRef) => (
            <div
              key={cardRef.id}
              onClick={() => setSelectedCardId(cardRef.id)}
              style={{
                cursor: "pointer",
                outline:
                  selectedCardId === cardRef.id
                    ? `2px solid ${token.colorPrimary}`
                    : "2px solid transparent",
                borderRadius: 8,
                transition: "outline 0.2s",
              }}
            >
              <CardDisplay cardRef={cardRef} size="large" />
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <Space>
          <Button
            type="primary"
            icon={<GiftOutlined />}
            disabled={!selectedCardId}
            onClick={handleConfirm}
          >
            选择此卡
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={onSkip}
          >
            放弃选择
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
