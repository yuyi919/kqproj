"use client";

/**
 * 魔女审判游戏引擎 - 夜间行动面板组件 (Ant Design 版本)
 *
 * 使用 CardRef 最小化存储，通过 getCardDefinition 获取完整信息
 */

import React, { useState } from "react";
import {
  Card,
  Select,
  Button,
  Space,
  Typography,
  Alert,
  Badge,
  Tag,
  Empty,
  Divider,
  theme,
} from "antd";
import {
  MoonOutlined,
  WarningOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { CardRef, PublicPlayerInfo } from "../types";
import { getCardDefinition } from "../utils";
import { getCardIcon } from "./ui/CardDisplay";

const { Title, Text, Paragraph } = Typography;

interface NightActionPanelProps {
  hand: CardRef[]; // 最小化存储
  players: PublicPlayerInfo[];
  currentPlayerId: string | null;
  isWitch: boolean;
  hasBarrier: boolean;
  witchKillerAvailable: boolean;
  killMagicAvailable: number;
  onUseCard: (cardId: string, targetId: string) => void;
  onPass: () => void;
}

export function NightActionPanel({
  hand,
  players,
  currentPlayerId,
  isWitch,
  hasBarrier,
  witchKillerAvailable,
  killMagicAvailable,
  onUseCard,
  onPass,
}: NightActionPanelProps): React.ReactElement {
  const { token } = theme.useToken();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // 过滤出可用的卡牌
  const usableCards = hand.filter((cardRef) => {
    // 魔女杀手持有者只能使用魔女杀手或放弃
    if (witchKillerAvailable && cardRef.type !== "witch_killer") {
      return false;
    }
    return true;
  });

  // 过滤出可选的目标（存活的玩家，不包括自己）
  const validTargets = players.filter(
    (p) => p.id !== currentPlayerId && p.status === "alive",
  );

  const selectedCardRef = usableCards.find((c) => c.id === selectedCardId);
  // 获取选中卡牌的完整信息
  const selectedCard = selectedCardRef
    ? getCardDefinition(selectedCardRef)
    : null;

  const handleUseCard = () => {
    if (selectedCardId) {
      // 结界不需要目标
      const targetId =
        selectedCard?.type === "barrier" ? "" : selectedTargetId || "";
      onUseCard(selectedCardId, targetId);
      setSelectedCardId(null);
      setSelectedTargetId(null);
    }
  };

  return (
    <Card
      title={
        <Space>
          <MoonOutlined />
          <span>夜间行动</span>
          {hasBarrier && <Tag color="success">受结界保护</Tag>}
        </Space>
      }
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {isWitch && (
          <Alert
            title="你是魔女"
            description="你已连续击杀，今晚必须再次击杀，否则将残骸化死亡！"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {witchKillerAvailable && (
          <Alert
            title="魔女杀手持有者"
            description="作为魔女杀手持有者，你只能使用魔女杀手攻击，或选择放弃行动。"
            type="info"
            showIcon
          />
        )}

        {killMagicAvailable === 0 && !witchKillerAvailable && (
          <Alert
            title="攻击名额已满"
            description="今晚的杀人魔法名额已被用完。"
            type="warning"
            showIcon
          />
        )}

        {/* 卡牌选择 */}
        <Card
          type="inner"
          title="选择要使用的卡牌"
          size="small"
          extra={
            usableCards.length > 0 && (
              <Badge count={usableCards.length} showZero />
            )
          }
        >
          {usableCards.length === 0 ? (
            <Empty description="没有可用的卡牌" />
          ) : (
            <Space orientation="vertical" style={{ width: "100%" }}>
              {usableCards.map((cardRef) => {
                // 获取卡牌的完整信息用于显示
                const card = getCardDefinition(cardRef);
                return (
                  <Button
                    key={cardRef.id}
                    type={selectedCardId === cardRef.id ? "primary" : "default"}
                    onClick={() => setSelectedCardId(cardRef.id)}
                    icon={getCardIcon(cardRef.type, token)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      height: "auto",
                      padding: "12px 16px",
                    }}
                  >
                    <Space orientation="vertical" size={0} align="start">
                      <Space>
                        <span style={{ fontWeight: 500 }}>{card.name}</span>
                        {cardRef.type === "kill" && (
                          <Badge
                            count={killMagicAvailable}
                            color={token.colorError}
                          />
                        )}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {card.description}
                      </Text>
                    </Space>
                  </Button>
                );
              })}
            </Space>
          )}
        </Card>

        {/* 目标选择 */}
        {selectedCard && selectedCard.type !== "barrier" && (
          <Card type="inner" title="选择目标" size="small">
            <Select
              style={{ width: "100%" }}
              placeholder="选择目标玩家"
              value={selectedTargetId}
              onChange={setSelectedTargetId}
              options={validTargets.map((p) => ({
                label: `${p.seatNumber}号玩家`,
                value: p.id,
              }))}
            />
          </Card>
        )}

        {/* 使用结界时不需要选择目标 */}
        {selectedCard && selectedCard.type === "barrier" && (
          <Alert
            title="使用结界魔法"
            description="结界魔法将保护你免受今晚的攻击，无需选择目标。"
            type="info"
            showIcon
          />
        )}

        <Divider />

        {/* 操作按钮 */}
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Button
            type="primary"
            size="large"
            onClick={handleUseCard}
            disabled={
              !selectedCard ||
              (selectedCard.type !== "barrier" && !selectedTargetId)
            }
            icon={<CheckOutlined />}
          >
            使用卡牌
          </Button>
          <Button size="large" onClick={onPass}>
            放弃行动
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
