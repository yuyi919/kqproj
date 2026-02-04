import type { LiveProvider, LiveEvent } from "@refinedev/core";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ResourceEventPayload,
} from "@interfaces/socket";

type Sub = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socketioProvider = (url?: string): LiveProvider => {
  let socket: Sub | null = null;

  const getSocket = () => {
    if (!socket) {
      // 确保服务端已初始化
      fetch("/api/socket");
      socket = io(url || window.location.origin, {
        path: "/socketio",
        addTrailingSlash: false,
        transports: ["polling", "websocket"],
      });
    }
    return socket;
  };

  return {
    subscribe: ({ channel, types, params, callback }) => {
      const s = getSocket();
      const resource = channel.replace("resources/", "");

      // 订阅特定资源的事件
      s.emit("subscribe", {
        resource,
        types: types as string[],
        params,
      });

      const handleEvent = (data: ResourceEventPayload) => {
        if (data.resource === resource) {
          const liveTypes: Record<string, LiveEvent["type"]> = {
            created: "created",
            updated: "updated",
            deleted: "deleted",
            INSERT: "created",
            UPDATE: "updated",
            DELETE: "deleted",
          };

          callback({
            channel,
            type: liveTypes[data.type] || (data.type as any),
            date: new Date(data.timestamp),
            payload: data.payload,
          });
        }
      };

      s.on("resource-event", handleEvent);

      // 返回用于取消订阅的数据
      return { socket: s, handleEvent, resource };
    },

    unsubscribe: async (subscription: {
      socket: Sub;
      handleEvent: (data: ResourceEventPayload) => void;
      resource: string;
    }) => {
      const { socket: s, handleEvent, resource } = subscription;
      if (s) {
        s.off("resource-event", handleEvent);
        s.emit("unsubscribe", { resource });
      }
    },

    publish: (event: LiveEvent) => {
      const s = getSocket();
      s.emit("publish", {
        channel: event.channel,
        type: event.type,
        payload: event.payload,
      });
    },
  };
};
