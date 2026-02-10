"use client";

/**
 * 魔女审判游戏引擎 - 阶段显示组件 (Ant Design 版本)
 */

import React, { useState, useEffect, useRef } from "react";
import { Space, Typography, Statistic, theme, Button } from "antd";
import type { GamePhase } from "../types";
import { getPhaseName } from "../utils";
import { PhaseBadge, getPhaseConfig } from "./ui/PhaseBadge";

const { Text } = Typography;

interface PhaseDisplayProps {
  phase: GamePhase;
  round: number;
  phaseEndTime: number;
  onTimeUp?: () => void;
}

export function PhaseDisplay({
  phase,
  round,
  phaseEndTime,
  onTimeUp,
}: PhaseDisplayProps): React.ReactElement {
  const { token } = theme.useToken();
  const [remainingTime, setRemainingTime] = useState<number>(() =>
    normalizeTimes(phaseEndTime),
  );

  const handleTimeUp = useRef(onTimeUp);

  useEffect(() => {
    setRemainingTime(normalizeTimes(phaseEndTime));
    const timer = setInterval(() => {
      const remaining = normalizeTimes(phaseEndTime);
      setRemainingTime(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        handleTimeUp.current?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [phaseEndTime]);

  const showTimer = remainingTime > 0 && phase !== "ended"; // && phase !== "resolution";

  return (
    <Space size="middle" align="center">
      <PhaseBadge phase={phase} size="medium" />
      <Space orientation="vertical" size={0}>
        <Text strong style={{ fontSize: 18 }}>
          {getPhaseName(phase)} - 第 {round} 天
          <Button onClick={() => handleTimeUp.current?.()}>强制结束</Button>
        </Text>
        {showTimer && (
          <Statistic
            value={remainingTime}
            formatter={(value) => {
              const secs = Number(value);
              const mins = Math.floor(secs / 60);
              const remainingSecs = secs % 60;
              return `剩余时间: ${mins
                .toString()
                .padStart(2, "0")}:${remainingSecs
                .toString()
                .padStart(2, "0")}`;
            }}
            styles={{
              content: {
                fontSize: 14,
                color:
                  remainingTime < 30
                    ? token.colorError
                    : token.colorTextSecondary,
              },
            }}
          />
        )}
      </Space>
    </Space>
  );
}

function normalizeTimes(phaseEndTime: number): number {
  return Math.max(0, Math.ceil((phaseEndTime - Date.now()) / 1000));
}
