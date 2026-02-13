"use client";

import type {
  AuthStatusPayload,
  ClientToServerEvents,
  MessageReceivedPayload,
  RoomEventPayload,
  ServerToClientEvents,
} from "@interfaces/socket";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageReceivedPayload | null>(
    null,
  );
  const [logs, setLogs] = useState<
    { type: string; payload: any; timestamp: number }[]
  >([]);

  const addLog = useCallback((type: string, payload: any) => {
    setLogs((prev) =>
      [{ type, payload, timestamp: Date.now() }, ...prev].slice(0, 50),
    );
  }, []);

  useEffect(() => {
    let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
      null;

    // 首先调用一次 API 路由以确保 Socket 服务端已初始化
    fetch("/api/socket", { cache: "no-store" }).finally(() => {
      socket = io({
        path: "/socketio",
        addTrailingSlash: false,
        transports: ["polling", "websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsConnected(true);
        addLog("system", "Connected to socket server");

        // 监听传输协议升级 (polling -> websocket)
        socket?.io.engine.on("upgrade", (transport) => {
          addLog("transport", transport.name);
        });
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        setUser(null);
        addLog("system", "Disconnected from socket server");
      });

      socket.on("auth:status", (status: AuthStatusPayload) => {
        if (status.authenticated && status.user) {
          setUser(status.user);
          addLog("auth:status", {
            authenticated: true,
            userEmail: status.user.email,
          });
        } else {
          setUser(null);
          addLog("auth:status", { authenticated: false });
        }
      });

      socket.on("message:received", (data: MessageReceivedPayload) => {
        setLastMessage(data);
        addLog("message:received", data);
      });

      socket.on("room:event", (data: RoomEventPayload) => {
        addLog("room:event", data);
      });

      // @ts-expect-error - Socket.io client might have internal error event
      socket.on("error", (err: any) => {
        addLog("error", err);
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [addLog]);

  const joinRoom = useCallback(
    (room: string) => {
      if (socketRef.current) {
        socketRef.current.emit("room:join", room);
        addLog("emit:room:join", { room });
      }
    },
    [addLog],
  );

  const sendMessage = useCallback(
    (room: string, message: string) => {
      if (socketRef.current) {
        socketRef.current.emit("message:send", { room, message });
        addLog("emit:message:send", { room, message });
      }
    },
    [addLog],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isConnected,
    user,
    lastMessage,
    logs,
    joinRoom,
    sendMessage,
    clearLogs,
  };
};
