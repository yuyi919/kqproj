"use client";

/**
 * 魔女审判游戏引擎 - 投票面板组件 (Ant Design 版本)
 *
 * 优化：
 * - 添加"过滤不可选择目标"开关
 * - 不可选目标显示原因标签
 */

import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Radio,
  Space,
  Typography,
  Alert,
  Empty,
  Divider,
  Tag,
  Switch,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  BlockOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { PublicPlayerInfo } from "../types";
import { VoteResults } from "./ui/VoteResults";

const { Title, Text } = Typography;

interface VotingPanelProps {
  players: PublicPlayerInfo[];
  currentPlayerId: string | null;
  hasVoted: boolean;
  voteCounts: Record<string, number>;
  onVote: (targetId: string) => void;
  onPass: () => void;
  /** 是否启用过滤不可选目标，默认 true */
  filterDisabledTargets?: boolean;
}

/**
 * 玩家可选性状态
 */
type PlayerVoteability =
  | {
      player: PublicPlayerInfo;
      isSelectable: true;
    }
  | {
      player: PublicPlayerInfo;
      isSelectable: false;
      reason: "self" | "dead" | "imprisoned" | "other";
      reasonText: string;
    };

export function VotingPanel({
  players,
  currentPlayerId,
  hasVoted,
  voteCounts,
  onVote,
  onPass,
  filterDisabledTargets = true,
}: VotingPanelProps): React.ReactElement {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [filterDisabled, setFilterDisabled] = useState(filterDisabledTargets);

  // 计算每个玩家的可选性状态
  const playerVoteabilities = useMemo((): PlayerVoteability[] => {
    return players.map((player) => {
      // 检查是否为自己
      if (player.id === currentPlayerId) {
        return {
          player,
          isSelectable: false,
          reason: "self",
          reasonText: "不能投票给自己",
        };
      }

      // 检查是否存活（公开状态只有 alive/dead）
      if (player.status !== "alive") {
        return {
          player,
          isSelectable: false,
          reason: "dead",
          reasonText: "该玩家已死亡",
        };
      }

      // 可投票
      return {
        player,
        isSelectable: true,
      };
    });
  }, [players, currentPlayerId]);

  // 根据过滤开关决定显示哪些玩家
  const displayPlayers = useMemo(() => {
    if (filterDisabled) {
      return playerVoteabilities.filter((p) => p.isSelectable);
    }
    return playerVoteabilities;
  }, [playerVoteabilities, filterDisabled]);

  const handleVote = () => {
    if (selectedTarget) {
      onVote(selectedTarget);
      setSelectedTarget(null);
    }
  };

  const totalVotes = Object.values(voteCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (hasVoted) {
    return (
      <Card>
        <Space orientation="vertical" size="large" style={{ width: "100%" }}>
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
      classNames={{
        root: "size-full flex flex-col",
        body: "size-full overflow-hidden",
      }}
      title={
        <Space>
          <TeamOutlined />
          <span>投票阶段</span>
        </Space>
      }
      extra={
        <Space size="small">
          <Text type="secondary" style={{ fontSize: 12 }}>
            显示:
          </Text>
          <Switch
            size="small"
            checked={filterDisabled}
            onChange={setFilterDisabled}
            checkedChildren="仅可投票"
            unCheckedChildren="显示全部"
          />
        </Space>
      }
    >
      <Space
        orientation="vertical"
        size="small"
        classNames={{
          root: "size-full overflow-hidden",
          item: "overflow-hidden nth-[2]:h-full nth-[2]:flex nth-[2]:flex-col nth-[2]:flex-1",
        }}
      >
        <Alert
          title="投票说明"
          description={
            <Space direction="vertical" size={4}>
              <span>选择一名存活玩家监禁，被监禁的玩家夜间无法使用手牌。</span>
              {!filterDisabled && (
                <Text type="warning" style={{ fontSize: 12 }}>
                  <ExclamationCircleOutlined /> 灰色标签表示不可投票，点击查看原因
                </Text>
              )}
            </Space>
          }
          type="info"
          showIcon
        />

        {displayPlayers.length > 0 && (
          <div className="h-full">
            <Radio.Group
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="size-full overflow-auto"
            >
              <Space orientation="vertical" style={{ width: "100%" }}>
                {playerVoteabilities.map((voteability) => {
                  const { player, isSelectable } = voteability;
                  // 如果启用过滤且当前玩家不可选，则跳过
                  if (filterDisabled && !isSelectable) {
                    return null;
                  }

                  const isSelected = selectedTarget === player.id;
                  const hasVotes = voteCounts[player.id] > 0;

                  // 提取不可选原因（如果存在）
                  const unreason = !isSelectable ? (voteability as any).reason : undefined;
                  const reasonText = !isSelectable ? (voteability as any).reasonText : undefined;

                  return (
                    <Tooltip
                      key={player.id}
                      title={!isSelectable ? reasonText : undefined}
                      placement="right"
                    >
                      <Radio.Button
                        value={player.id}
                        disabled={!isSelectable}
                        style={{
                          width: "100%",
                          height: "auto",
                          padding: "12px 16px",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          opacity: isSelectable ? 1 : 0.5,
                          backgroundColor: isSelectable
                            ? isSelected
                              ? "var(--ant-color-primary-bg)"
                              : undefined
                            : undefined,
                        }}
                      >
                        <Space>
                          <UserOutlined />
                          <span>{player.seatNumber}号玩家</span>
                          {player.id === currentPlayerId && (
                            <Tag color="blue" style={{ fontSize: 10 }}>
                              自己
                            </Tag>
                          )}
                          {!isSelectable && unreason && (
                            <Tag
                              icon={<BlockOutlined />}
                              color="default"
                              style={{ fontSize: 10 }}
                            >
                              {reasonText}
                            </Tag>
                          )}
                        </Space>
                        {hasVotes && (
                          <Tag color="processing">
                            {voteCounts[player.id]}票
                          </Tag>
                        )}
                      </Radio.Button>
                    </Tooltip>
                  );
                })}
              </Space>
            </Radio.Group>
          </div>
        )}

        {displayPlayers.length === 0 && (
          <Empty description="没有可投票的玩家" />
        )}

        <Divider />

        <Space className="w-full justify-between">
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

        {totalVotes > 0 && (
          <VoteResults players={players} voteCounts={voteCounts} />
        )}
      </Space>
    </Card>
  );
}
