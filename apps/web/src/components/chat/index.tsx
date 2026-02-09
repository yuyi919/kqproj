"use client";
import {
  AlertOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Bubble, BubbleItemType } from "@ant-design/x";
import { ChatInput } from "@components/chat/input";
import { last } from "es-toolkit";
import { IUser, UserMeta } from "@interfaces/user";
import {
  CrudFilter,
  useCreate,
  useKeys,
  useList,
  useOne,
  useShow,
  type GetListResponse,
} from "@refinedev/core";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Skeleton, Spin, Splitter } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@hooks/use-user";

export type Group = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  members: {
    user_id: string;
    meta: UserMeta;
  }[];
};

export type IMessage = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Message = IMessage & {
  status?: "pending" | "success" | "error";
};

// Get user display name
const getUserDisplayName = (user?: UserMeta) => {
  if (user?.username) {
    return user.username;
  }
  if (user?.email) {
    return user.email.split("@")[0];
  }
  return "未知用户";
};

// Get user initials for avatar
const getUserInitials = (user?: UserMeta) => {
  const displayName = getUserDisplayName(user);
  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
// const c = supabaseBrowserClient
//   .channel("public:"+Math.random().toString(36).substring(2))
//   .on(
//     "postgres_changes",
//     {
//       event: "*",
//       schema: "public",
//       table: "messages",
//       filter: `group_id=eq.f35b84d5-9a5d-4be0-a7c3-41cdf4db1cd8`,
//     },
//     (payload) => {
//       console.log("postgres_changes", payload);
//       supabaseBrowserClient.removeChannel(c)
//     },
//   )
//   .subscribe(console.log);
export const ChatWindow = ({
  id = "",
  initialData: initialMessages,
  group: initialGroup,
}: {
  id: string;
  initialData: IMessage[];
  group?: Group;
}) => {
  const { keys } = useKeys();
  const queryClient = useQueryClient();
  // Get current user identity
  const identity = useAuthUser();
  const [baseMessages, setBaseMessages] = useState(initialMessages);
  const lastUpdated = useRef<string | undefined>(
    last(initialMessages)?.created_at,
  );
  const selfMessages = useRef<Record<string, Message>>({});

  const params: Parameters<typeof useList<IMessage>>[0] = {
    resource: "messages",
    filters: [
      {
        field: "group_id",
        operator: "eq",
        value: id,
      },
      lastUpdated.current
        ? {
            field: "created_at",
            operator: "gt",
            value: lastUpdated.current,
          }
        : null,
    ].filter(Boolean) as CrudFilter[],
    sorters: [
      {
        field: "created_at",
        order: "asc",
      },
    ],
    pagination: {
      mode: "off",
    },
  };

  const queryKeys = useMemo(
    () =>
      keys()
        .data()
        .resource(params.resource)
        .action("list")
        .params({
          ...params.meta,
          filters: params.filters,
        })
        .get(),
    [],
  );

  const { result: group, query } = useShow<Group>({
    queryOptions: initialGroup ? { initialData: { data: initialGroup } } : {},
    resource: "groups",
    id,
    meta: {
      select: "*, members:group_members(user_id,meta:users(*))",
    },
  });

  const userMetas = useMemo(
    () =>
      (group?.members || []).reduce(
        (acc, cur) => ({ ...acc, [cur.user_id]: cur.meta }),
        {} as Record<string, UserMeta>,
      ),
    [group],
  );

  const {
    result: { data: incrMessages },
    query: query$,
  } = useList<IMessage>({
    ...params,
    liveMode: "manual",
    onLiveEvent: (event) => {
      console.log("[Chat] Live Event:", event.type, event.payload);
      const { type, payload } = event;

      if (!!payload.ids?.every((id) => selfMessages.current[id])) {
        // 如果所有 ID 都在 selfMessages 中，说明是本地生成的消息，无需处理
        return;
      }

      if (type === "created" || type === "updated" || type === "deleted") {
        const eventPayload = payload as { ids?: string[]; data?: Message };
        const msg = eventPayload.data || (payload as Message);

        // 如果是 updated 事件且只有 ids 没有 data，或者 data 不完整，则无法进行增量更新
        // 尝试从客户端获取完整数据
        if (type === "updated" && (!msg || !msg.content)) {
          const updateId = msg?.id || eventPayload.ids?.[0];
          if (updateId) {
            // 这里我们不能直接使用 hook，因为我们在回调中。
            // 我们可以直接触发列表刷新，或者尝试手动 fetch
            // 考虑到 Refine 架构，最安全的方式是 refetch 列表
            // 或者我们可以手动调用 dataProvider.getOne 如果我们有 dataProvider 实例
            // 但在这个组件中获取 dataProvider 比较复杂
            // 所以这里回退到 refetch
            query$.refetch();
          }
          return;
        }

        // 如果是删除事件，可能只有 ids
        const deleteId =
          msg?.id || (eventPayload.ids && eventPayload.ids[0]) || "";

        // 对于 deleted 事件，我们只需要 ID 即可
        if (type === "deleted" && deleteId) {
          queryClient.setQueriesData<GetListResponse<Message>>(
            { queryKey: queryKeys },
            (oldData) => {
              if (!oldData) return oldData;
              const currentData = [...oldData.data];
              return {
                ...oldData,
                data: currentData.filter((m) => m.id !== deleteId),
                total: Math.max(0, (oldData.total ?? 1) - 1),
              };
            },
          );
          return;
        }

        // 对于 created 和 updated，我们需要完整的 msg 对象
        if (!msg || !msg.id) {
          query$.refetch();
          return;
        }

        // 校验是否属于当前群组 (注意：如果 msg 中没有 group_id，可能无法过滤，此时可能需要 refetch)
        if (msg.group_id && msg.group_id !== id) return;

        // 使用 setQueriesData 进行模糊匹配更新，确保所有相关的消息列表都能实时同步
        queryClient.setQueriesData<GetListResponse<Message>>(
          { queryKey: queryKeys },
          (oldData) => {
            if (!oldData) return oldData;

            const currentData = [...oldData.data];

            switch (type) {
              case "created": {
                // 去重校验：如果已存在（可能是乐观更新已转正或重复推送），则跳过
                if (currentData.find((m) => m.id === msg.id)) return oldData;

                // 移除具有相同内容的 pending 消息（如果有的话，作为一种简单的对照更新逻辑）
                const filteredData = currentData.filter(
                  (m) =>
                    !(
                      m.status === "pending" &&
                      m.content === msg.content &&
                      m.user_id === msg.user_id
                    ),
                );

                return {
                  ...oldData,
                  data: [...filteredData, { ...msg, status: "success" }],
                  total: (oldData.total ?? 0) + 1,
                };
              }
              case "updated": {
                return {
                  ...oldData,
                  data: currentData.map((m) =>
                    m.id === msg.id ? { ...m, ...msg, status: "success" } : m,
                  ),
                };
              }
              default:
                return oldData;
            }
          },
        );
      }
    },
  });

  const incrMessagesRef = useRef<Message[]>(incrMessages);
  incrMessagesRef.current = incrMessages;

  useEffect(() => {
    const incrMessages = incrMessagesRef.current;
    const lastMsg = last(incrMessages)!;
    if (incrMessages.length > 20 && lastMsg.status !== "pending") {
      lastUpdated.current = lastMsg.created_at;
      setBaseMessages((prev) => [...prev, ...incrMessages]);
      queryClient.setQueriesData<GetListResponse<Message>>(
        { queryKey: queryKeys },
        (data) => ({ total: 0, data: [] }),
      );
    }
  }, [incrMessages]);

  const displayMessages = baseMessages.concat(
    incrMessagesRef.current,
  ) as Message[];

  // console.log(messages, loading);
  // Create message mutation
  const { mutateAsync: createMessage, mutation } = useCreate<Message>({
    successNotification: false,
    resource: "messages",
    meta: { filters: params.filters },
  });

  const handleSendMessage = async (content: string) => {
    if (!identity?.id) return;

    const tempId = `pending-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      group_id: id,
      user_id: identity.id,
      content: content,
      created_at: new Date().toISOString(),
      status: "pending",
    };

    // 1. 乐观更新：立即插入消息到缓存
    queryClient.setQueriesData<GetListResponse<Message>>(
      { queryKey: queryKeys },
      (oldData) => {
        if (!oldData) return oldData;
        return {
          total: 1,
          data: [...oldData.data, optimisticMessage],
        };
      },
    );

    try {
      // 2. 执行实际创建
      const result = await createMessage({
        values: {
          group_id: id,
          user_id: identity.id,
          content: content,
        } as Message,
      });

      // 3. 对照更新：用真实数据替换临时消息
      const realMessage = result.data;
      selfMessages.current[realMessage.id] = realMessage;

      queryClient.setQueriesData<GetListResponse<Message>>(
        { queryKey: queryKeys },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((m) =>
              m.id === tempId ? { ...realMessage, status: "success" } : m,
            ),
          };
        },
      );
    } catch (error) {
      console.error("[Chat] Failed to send message:", error);
      // 4. 失败处理：更新消息状态为错误
      queryClient.setQueriesData<GetListResponse<Message>>(
        { queryKey: queryKeys },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((m) =>
              m.id === tempId ? { ...m, status: "error" } : m,
            ),
          };
        },
      );
    }
  };

  const commonBubbleItemType: Partial<BubbleItemType> =
    useMemo((): Partial<BubbleItemType> => {
      return {
        header(msg: Message, info) {
          return getUserDisplayName(userMetas[msg.user_id]);
        },
        contentRender(msg: Message, info) {
          return msg.content;
        },
        footer(msg: Message, info) {
          return msg.status === "pending" ? (
            <Spin size="small" />
          ) : msg.status === "error" ? (
            <AlertOutlined style={{ color: "red" }} />
          ) : msg.status === "success" ? (
            <CheckCircleFilled style={{ color: "green" }} />
          ) : null;
        },
        avatar(msg: Message, info) {
          return (
            <Avatar src={userMetas[msg.user_id]?.avatar_url}>
              {getUserInitials(userMetas[msg.user_id])}
            </Avatar>
          );
        },
      };
    }, []);
  const list = // loading ? (
    (
      //   <>
      //     {[1, 2].map((i) => (
      //       <Skeleton key={i} title active paragraph />
      //     ))}
      //   </>
      // ) :
      <Bubble.List
        styles={{
          root: {
            height: "100%",
            // maxHeight: 400
          },
          scroll: {
            height: "100%",
            // maxHeight: 400
          },
        }}
        autoScroll
        items={displayMessages.map(
          (message): BubbleItemType => ({
            id: message.id + "",
            key: message.id + "",
            ...commonBubbleItemType,
            content: message,
            role: message.user_id,
            placement: identity?.id === message.user_id ? "end" : "start",
            status:
              message.status === "pending"
                ? "loading"
                : message.status === "error"
                  ? "error"
                  : "success",
            typing: message.status === "pending",
            loading: false, // message.status === "pending",
          }),
        )}
      ></Bubble.List>
    );
  return (
    <Splitter
      vertical
      style={{
        // height: "100%",
        // flex: 1,
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Splitter.Panel>{list}</Splitter.Panel>
      <Splitter.Panel min={150} max={400} defaultSize={250}>
        <ChatInput
          isPending={mutation.isPending}
          onInput={({ value: message }) => handleSendMessage(message)}
        />
      </Splitter.Panel>
    </Splitter>
  );
};
