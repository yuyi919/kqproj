"use client";

import React from "react";
import {
  useOne,
  useCustomMutation,
  useGo,
} from "@refinedev/core";
import {
  Button,
  Typography,
  Spin,
} from "antd";
import { NoSSR } from "@components/NoSSR";
import { IGameRoom } from "@interfaces/game-room";
import { useAuthUser } from "@hooks/use-user";
import { GameLobby } from "./GameLobby";
import { GameBoard } from "./GameBoard";

const { Title } = Typography;

interface GameRoomClientProps {
  roomId: string;
  initialRoomData?: IGameRoom;
}

export function GameRoomClient({
  roomId,
  initialRoomData,
}: GameRoomClientProps) {
  const go = useGo();
  const user = useAuthUser();

  // 1. Fetch Room Info
  const {
    data: roomData,
    isPending: isRoomLoading,
  } = useOne<IGameRoom>({
    resource: "game_rooms",
    id: roomId,
    liveMode: "auto",
    meta: {
      select: "*, players:game_players(*, user:users(username, avatar_url))",
    },
    queryOptions: {
      initialData: initialRoomData ? { data: initialRoomData } : undefined,
    },
  }).query;

  const room = roomData?.data;

  // Mutations
  const { mutation: leaveRoomMutation } = useCustomMutation();
  const { mutate: leaveRoom, isPending: isLeaving } = leaveRoomMutation;

  // Handlers
  const handleLeave = () => {
    leaveRoom(
      {
        url: `/api/game/rooms/${roomId}/leave`,
        method: "post",
        values: {},
      },
      {
        onSuccess: () => {
          go({ to: "/lobby", type: "push" });
        },
      },
    );
  };

  if (isRoomLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center mt-20">
        <Title level={3}>Room not found</Title>
        <Button onClick={() => go({ to: "/lobby", type: "push" })}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  return (
    <NoSSR>
      {(room.status === "WAITING" || room.status === "DESTROYED") ? (
        <GameLobby
          room={room}
          userId={user?.id}
          onLeave={handleLeave}
          isLeaving={isLeaving}
        />
      ) : (
        <GameBoard
          room={room}
          userId={user?.id}
          onLeave={handleLeave}
          isLeaving={isLeaving}
        />
      )}
    </NoSSR>
  );
}
