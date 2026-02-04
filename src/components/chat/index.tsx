"use client";

import { Bubble } from "@ant-design/x";
import { ChatInput } from "@components/chat/input";
import { UserMeta } from "@interfaces/user";
import { useCreate, useGetIdentity, useList } from "@refinedev/core";
import { supabaseBrowserClient } from "@utils/supabase/client";
import { Avatar, Skeleton, Splitter } from "antd";

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

export type Message = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: UserMeta;
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
const getUserInitials = (message: Message) => {
  const displayName = getUserDisplayName(message.user);
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
  initialData,
  userId,
}: {
  id: string;
  userId?: string;
  initialData: Message[];
}) => {
  // Get current user identity
  const { data: identity = { id: userId } } = useGetIdentity<{ id: string }>();
  // const [backendData, setBackendData] = useState(initialData);

  const {
    result: { data: messages },
    query: c,
  } = useList<Message>({
    resource: "messages",
    queryOptions: {
      initialData: { data: initialData, total: initialData.length },
    },
    filters: [
      {
        field: "group_id",
        operator: "eq",
        value: id,
      },
    ],
    sorters: [
      {
        field: "created_at",
        order: "asc",
      },
    ],
    pagination: {
      mode: "off", // Load last 100 messages
    },
    meta: {
      select: "*, user:users(id, username, email, avatar_url)",
    },
    liveMode: "manual",
    onLiveEvent: (event) => {
      console.log('[Chat]', event);
      c.refetch();
    },
  });

  // console.log(messages, loading);
  // Create message mutation
  const { mutate: createMessage, mutation } = useCreate<Message>({
    successNotification: false,
    resource: "messages",
  });

  const displayMessages = messages;
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
        items={displayMessages.map((message) => ({
          id: message.id + "",
          key: message.id + "",
          content: message.content,
          role: message.user_id,
          placement: identity?.id === message.user_id ? "end" : "start",
          header: getUserDisplayName(message.user),
          status: "success",
          avatar: (
            <Avatar src={message.user?.avatar_url}>
              {getUserInitials(message)}
            </Avatar>
          ),
        }))}
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
          onInput={({ value: message }) => {
            if (identity)
              return new Promise((resolve, reject) =>
                createMessage(
                  {
                    values: {
                      group_id: id,
                      user_id: identity.id,
                      content: message,
                    },
                  },
                  {
                    // onSuccess: resolve,
                    onError: reject,
                    onSettled: resolve,
                  },
                ),
              );
          }}
        />
      </Splitter.Panel>
    </Splitter>
  );
};
