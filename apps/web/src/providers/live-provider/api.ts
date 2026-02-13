import type { LiveEvent, LiveProvider } from "@refinedev/core";

export const liveProvider = (): LiveProvider => {
  return {
    subscribe: ({ channel, types, params, callback }) => {
      const resource = channel.replace("resources/", "");
      const queryParams = new URLSearchParams({
        resource,
        types: types.join(","),
        params: JSON.stringify(params || {}),
      });

      // 如果有初始的 last_id，可以带上。但通常订阅开始时还没有。
      const url = `/api/live/subscribe?${queryParams.toString()}`;

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          console.log("onmessage", event);
          const payload = JSON.parse(event.data);

          // 映射 Supabase 事件到 Refine 事件
          const liveTypes: Record<string, LiveEvent["type"]> = {
            INSERT: "created",
            UPDATE: "updated",
            DELETE: "deleted",
          };

          callback({
            channel,
            type: liveTypes[payload.eventType] || "updated",
            date: new Date(payload.commit_timestamp),
            payload: payload.new || payload.old,
          });
        } catch (error) {
          console.error("Failed to parse SSE message", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        // EventSource 会自动尝试重连
      };

      // 返回 eventSource 对象，供 unsubscribe 使用
      return eventSource;
    },

    unsubscribe: async (eventSource: EventSource) => {
      if (eventSource) {
        eventSource.close();
      }
    },

    // 允许手动发布事件 (如正在输入等)
    // publish: (event: LiveEvent) => {
    //   // 这里的实现取决于是否需要支持自定义事件发布
    //   // 对于聊天应用，发送消息通常走 dataProvider.create
    //   // 如果需要发布“正在输入”，可以通过一个特殊的 API 端点
    //   console.warn("Publish not implemented yet for SSE wrapper", event)
    // },
  };
};
