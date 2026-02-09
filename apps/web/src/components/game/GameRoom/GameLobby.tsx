"use client";

import React from "react";
import { useCustomMutation } from "@refinedev/core";
import {
  Card,
  Button,
  Avatar,
  List,
  Tag,
  Typography,
  Space,
  message,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { IGameRoom, IGamePlayer } from "@interfaces/game-room";

const { Title, Text } = Typography;

interface GameLobbyProps {
  room: IGameRoom;
  userId?: string;
  onLeave: () => void;
  isLeaving: boolean;
}

export function GameLobby({ room, userId, onLeave, isLeaving }: GameLobbyProps) {
  const players = room.players || [];
  // Sort players by seat_number
  const sortedPlayers = [...players].sort(
    (a, b) => (a.seat_number || 0) - (b.seat_number || 0)
  );

  const isHost = room.host_id === userId;
  const currentPlayer = players.find((p) => p.user_id === userId);
  const isReady = currentPlayer?.status === "READY";

  // Mutations
  const { mutation: toggleReadyMutation } = useCustomMutation();
  const { mutate: toggleReady, isPending: isTogglingReady } =
    toggleReadyMutation;

  const { mutation: startGameMutation } = useCustomMutation();
  const { mutate: startGame, isPending: isStarting } = startGameMutation;

  // Handlers
  const handleReady = () => {
    toggleReady(
      {
        url: `/api/game/rooms/${room.id}/ready`,
        method: "post",
        values: { ready: !isReady },
      },
      {
        onSuccess: () => {
          // Optimistic update handled by liveMode
        },
      },
    );
  };

  const handleStart = () => {
    startGame(
      {
        url: `/api/game/rooms/${room.id}/start`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          message.success("Game started!");
        },
        onError: (error) => {
          message.error("Failed to start game: " + error.message);
        },
      },
    );
  };

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div>
            <Space align="center">
              <Title level={2} style={{ margin: 0 }}>
                {room.name}
              </Title>
              <Tag color={room.status === "WAITING" ? "green" : "red"}>
                {room.status}
              </Tag>
            </Space>
            <div className="mt-2 text-gray-500">
              Room ID: <Text code>{room.id}</Text>
              <Tooltip title="Copy Room ID">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(room.id);
                    message.success("Copied!");
                  }}
                />
              </Tooltip>
            </div>
          </div>
          <Space>
            {isHost && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStart}
                loading={isStarting}
                disabled={players.length < 2} // Min players check
              >
                Start Game
              </Button>
            )}
            <Button
              danger
              icon={<LogoutOutlined />}
              onClick={onLeave}
              loading={isLeaving}
            >
              Leave Room
            </Button>
          </Space>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>
              Players ({players.length}/{room.config?.maxPlayers || 7})
            </Title>
            {!isHost && (
              <Button
                type={isReady ? "default" : "primary"}
                icon={
                  isReady ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                }
                onClick={handleReady}
                loading={isTogglingReady}
                className={isReady ? "border-green-500 text-green-500" : ""}
              >
                {isReady ? "Ready" : "Cancel"}
              </Button>
            )}
          </div>

          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={sortedPlayers}
            renderItem={(player: IGamePlayer) => (
              <List.Item>
                <Card
                  size="small"
                  className={`text-center ${player.status === "READY" ? "border-green-400 bg-green-50" : ""}`}
                >
                  <div className="flex flex-col items-center py-4">
                    <Avatar
                      size={64}
                      src={player.user?.avatar_url}
                      icon={<UserOutlined />}
                      className="mb-3"
                    />
                    <Text strong className="text-lg mb-1">
                      {player.user?.username || "Unknown"}
                    </Text>
                    {player.user_id === room.host_id && (
                      <Tag color="gold" className="mb-2">
                        HOST
                      </Tag>
                    )}

                    {player.status === "READY" ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        READY
                      </Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} color="default">
                        WAITING
                      </Tag>
                    )}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      </Card>
    </div>
  );
}
