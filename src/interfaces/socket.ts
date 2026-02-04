/**
 * 基础身份字段
 */
export interface IdentityFields {
  socketId: string;
  userId: string | null;
}

/**
 * 资源事件负载 (LiveProvider)
 */
export interface ResourceEventPayload extends IdentityFields {
  resource: string;
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * 房间事件负载 (加入/离开)
 */
export interface RoomEventPayload extends IdentityFields {
  type: "user_joined" | "user_left";
  userEmail?: string;
  timestamp: number;
}

/**
 * 聊天消息负载
 */
export interface MessageReceivedPayload extends IdentityFields {
  id: string;
  userEmail: string;
  user: {
    username?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  text: string;
  timestamp: number;
}

/**
 * 身份认证状态负载
 */
export interface AuthStatusPayload {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * 服务端发送给客户端的事件
 */
export interface ServerToClientEvents {
  "resource-event": (data: ResourceEventPayload) => void;
  "room:event": (data: RoomEventPayload) => void;
  "message:received": (data: MessageReceivedPayload) => void;
  "auth:status": (data: AuthStatusPayload) => void;
}

/**
 * 客户端发送给服务端的事件
 */
export interface ClientToServerEvents {
  subscribe: (data: {
    resource: string;
    types?: string[];
    params?: any;
  }) => void;
  unsubscribe: (data: { resource: string }) => void;
  publish: (data: { channel: string; type: string; payload: any }) => void;
  "room:join": (room: string) => void;
  "room:leave": (room: string) => void;
  "message:send": (data: { room: string; message: string }) => void;
}

/**
 * 服务端内部事件 (Socket.io 预留)
 */
export interface InterServerEvents {
  ping: () => void;
}
