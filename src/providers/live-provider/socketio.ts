import type { LiveProvider, LiveEvent, CrudFilter } from "@refinedev/core";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ResourceEventPayload,
} from "@interfaces/socket";
import { rpc } from "@utils/api/rpc";
import { dataProvider } from "@providers/data-provider";

type Sub = Socket<ServerToClientEvents, ClientToServerEvents>;

export const socketioProvider = (url?: string): LiveProvider => {
  let socket: Sub | null = null;
  const getSocket = () => {
    if (!socket) {
      // 确保服务端已初始化
      fetch("/api/socket");
      socket = io(url || window.location.origin, {
        withCredentials: true,
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
      if (
        params?.subscriptionType === "useList" ||
        params?.subscriptionType === "useMany"
      )
        params = {
          ...params,
          // 移除增量订阅的逻辑
          filters: params?.filters?.filter(
            (filter) =>
              !(
                (filter.operator === "gt" ||
                  filter.operator === "gte" ||
                  filter.operator === "lte" ||
                  filter.operator === "lt") &&
                filter.field === "created_at"
              ),
          ),
        };
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
      return {
        unsubscribe() {
          s.off("resource-event", handleEvent);
          s.emit("unsubscribe", { resource, params });
        },
      };
    },

    unsubscribe: async (subscription: { unsubscribe(): Promise<void> }) => {
      await subscription.unsubscribe();
    },

    publish: (event: LiveEvent) => {
      const s = getSocket();
      console.log("publish", event);
      s.emit("publish", {
        channel: event.channel,
        type: event.type,
        payload: event.payload,
        timestamp: event.date.getTime(),
        params: {
          filters: (event.meta?.filters as CrudFilter[]).filter(
            (filter: CrudFilter) =>
              !(
                (filter.operator === "gt" ||
                  filter.operator === "gte" ||
                  filter.operator === "lte" ||
                  filter.operator === "lt") &&
                filter.field === "created_at"
              ),
          ),
        },
      });
    },
  };
};
