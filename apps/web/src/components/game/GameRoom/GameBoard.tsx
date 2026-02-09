"use client";

import React from "react";
import { IGameRoom } from "@interfaces/game-room";

interface GameBoardProps {
  room: IGameRoom;
  userId?: string;
  onLeave: () => void;
  isLeaving: boolean;
}

export function GameBoard({ room }: GameBoardProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl">GAME STARTED! (Placeholder)</h1>
      <p>Room: {room.name}</p>
    </div>
  );
}
