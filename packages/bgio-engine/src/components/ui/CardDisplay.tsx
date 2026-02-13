"use client";

/**
 * 魔女审判游戏引擎 - 卡牌展示组件
 *
 * 通用卡牌展示，用于显示单张卡牌的详细信息
 */

import {
  ExperimentOutlined,
  FireOutlined,
  SafetyOutlined,
  SearchOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Tag, Typography, theme } from "antd";
import type React from "react";
import type { CardRef, CardType } from "../../types";
import { getCardDefinition } from "../../utils";

const { Text } = Typography;

export interface CardDisplayProps {
  cardRef: CardRef;
  size?: "small" | "medium" | "large";
  showDescription?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 获取卡牌图标
 */
export function getCardIcon(
  type: CardType,
  token: ReturnType<typeof theme.useToken>["token"],
  size: number = 16,
): React.ReactNode {
  const iconStyle = { fontSize: size };
  switch (type) {
    case "witch_killer":
      return <StarFilled style={{ ...iconStyle, color: token.colorWarning }} />;
    case "barrier":
      return (
        <SafetyOutlined style={{ ...iconStyle, color: token.colorSuccess }} />
      );
    case "kill":
      return <FireOutlined style={{ ...iconStyle, color: token.colorError }} />;
    case "detect":
      return (
        <SearchOutlined style={{ ...iconStyle, color: token.colorInfo }} />
      );
    case "check":
      return (
        <ExperimentOutlined
          style={{ ...iconStyle, color: token.colorTextSecondary }}
        />
      );
    default:
      return null;
  }
}

/**
 * 获取卡牌背景色
 */
export function getCardBgColor(
  type: CardType,
  token: ReturnType<typeof theme.useToken>["token"],
): string {
  switch (type) {
    case "witch_killer":
      return token.colorWarningBg;
    case "barrier":
      return token.colorSuccessBg;
    case "kill":
      return token.colorErrorBg;
    case "detect":
      return token.colorInfoBg;
    case "check":
      return token.colorBgContainerDisabled;
    default:
      return token.colorBgContainer;
  }
}

/**
 * 获取卡牌边框色
 */
export function getCardBorderColor(
  type: CardType,
  token: ReturnType<typeof theme.useToken>["token"],
): string {
  switch (type) {
    case "witch_killer":
      return token.colorWarning;
    case "barrier":
      return token.colorSuccess;
    case "kill":
      return token.colorError;
    case "detect":
      return token.colorInfo;
    case "check":
      return token.colorBorder;
    default:
      return token.colorBorder;
  }
}

const sizeConfig = {
  small: {
    minWidth: 80,
    maxWidth: 100,
    padding: "6px 8px",
    borderRadius: 4,
    iconSize: 14,
    titleSize: 11,
    descSize: 9,
    descHeight: 22,
    tagSize: { fontSize: 8, padding: "0 3px", lineHeight: "12px" } as const,
  },
  medium: {
    minWidth: 100,
    maxWidth: 120,
    padding: "8px 10px",
    borderRadius: 6,
    iconSize: 16,
    titleSize: 12,
    descSize: 10,
    descHeight: 26,
    tagSize: { fontSize: 9, padding: "0 4px", lineHeight: "14px" } as const,
  },
  large: {
    minWidth: 140,
    maxWidth: 180,
    padding: "12px 16px",
    borderRadius: 8,
    iconSize: 20,
    titleSize: 14,
    descSize: 12,
    descHeight: 36,
    tagSize: { fontSize: 10, padding: "0 6px", lineHeight: "16px" } as const,
  },
};

export function CardDisplay({
  cardRef,
  size = "medium",
  showDescription = true,
  className,
  style,
}: CardDisplayProps): React.ReactElement {
  const { token } = theme.useToken();
  const card = getCardDefinition(cardRef);
  const isWitchKiller = card.type === "witch_killer";
  const config = sizeConfig[size];

  return (
    <div
      className={className}
      style={{
        minWidth: config.minWidth,
        maxWidth: config.maxWidth,
        padding: config.padding,
        borderRadius: config.borderRadius,
        border: `1px solid ${getCardBorderColor(card.type, token)}`,
        backgroundColor: getCardBgColor(card.type, token),
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flexShrink: 0,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {getCardIcon(card.type, token, config.iconSize)}
        <Text strong style={{ fontSize: config.titleSize, lineHeight: 1.2 }}>
          {card.name}
        </Text>
      </div>

      {showDescription && (
        <Text
          type="secondary"
          style={{
            fontSize: config.descSize,
            lineHeight: 1.3,
            height: config.descHeight,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {card.description}
        </Text>
      )}

      <div style={{ marginTop: "auto" }}>
        {isWitchKiller ? (
          <Tag color="gold" style={{ ...config.tagSize, margin: 0 }}>
            唯一
          </Tag>
        ) : card.consumable ? (
          <Tag style={{ ...config.tagSize, margin: 0 }}>消耗</Tag>
        ) : null}
      </div>
    </div>
  );
}
