import { Server } from "socket.io";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "@utils/supabase/constants";
import { nanoid } from "nanoid";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  ResourceEventPayload,
  RoomEventPayload,
  MessageReceivedPayload,
} from "@interfaces/socket";
import type { SupabaseClient, SupabaseUser } from "@utils/supabase/client";

/**
 * Socket 存储的自定义数据
 */
interface SocketData {
  user?: SupabaseUser;
  supabase: SupabaseClient;
}

/**
 * 从 Socket 握手请求中解析 Cookie
 */
function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  decodeURIComponent(cookieHeader)
    .split(";")
    .forEach((cookie) => {
      const [name, ...rest] = cookie.split("=");
      const value = rest.join("=").trim();
      if (!name) return;
      cookies[name.trim()] = value;
    });
  return cookies;
}

/**
 * Socket.io 事件处理逻辑
 * @param io - Socket.io 服务端实例
 */
export const setupSocketIO = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >,
) => {
  // 身份验证中间件
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = parseCookies(cookieHeader);
      const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
        cookies: {
          get(name: string) {
            return cookies[name];
          },
          set(name: string, value: string, options: CookieOptions) {
            // Socket 连接过程中通常不需要设置 Cookie
          },
          remove(name: string, options: CookieOptions) {
            // Socket 连接过程中通常不需要移除 Cookie
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        socket.data.user = user;
        socket.data.supabase = supabase;
        console.log(`[Socket] Auth success: ${user.email} (${socket.id})`);
        socket.emit("auth:status", {
          authenticated: true,
          user: { id: user.id, email: user.email! },
        });
      } else {
        console.log(`[Socket] Anonymous connection: ${socket.id}`);
        socket.emit("auth:status", { authenticated: false });
      }
      next();
    } catch (err) {
      console.error("[Socket] Auth error:", err);
      next(); // 允许连接，但在处理器中检查身份
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(
      `[Socket] User connected: ${socket.id} (${user?.email || "anonymous"})`,
    );

    // --- Refine LiveProvider 支持 ---

    // 订阅资源
    socket.on("subscribe", (data) => {
      const room = `resource:${data.resource}`;
      console.log(
        `[Socket] User ${socket.id} subscribed to resource: ${data.resource}`,
      );
      socket.join(room);
    });

    // 取消订阅资源
    socket.on("unsubscribe", (data) => {
      const room = `resource:${data.resource}`;
      console.log(
        `[Socket] User ${socket.id} unsubscribed from resource: ${data.resource}`,
      );
      socket.leave(room);
    });

    // 发布自定义事件
    socket.on("publish", (data) => {
      const resource = data.channel.replace("resources/", "");
      const room = `resource:${resource}`;
      console.log(
        `[Socket] User ${socket.id} published to ${data.channel}: ${data.type}`,
      );

      // 广播给订阅了该资源的所有人
      const payload: ResourceEventPayload = {
        resource,
        type: data.type,
        payload: data.payload,
        socketId: socket.id,
        userId: user?.id || null,
        timestamp: Date.now(),
      };
      io.to(room).emit("resource-event", payload);
    });

    // --- 原有聊天逻辑 ---
    socket.on("room:join", (room) => {
      console.log(`[Socket] User ${socket.id} joined room: ${room}`);
      socket.join(room);
      const payload: RoomEventPayload = {
        type: "user_joined",
        socketId: socket.id,
        userId: user?.id || null,
        userEmail: user?.email,
        timestamp: Date.now(),
      };
      socket.to(room).emit("room:event", payload);
    });

    // 发送消息
    socket.on("message:send", async (data) => {
      console.log(
        `[Socket] Message from ${user?.email || socket.id} to ${data.room}: ${data.message}`,
      );

      const userId = user?.id || null;
      const userEmail = user?.email || "anonymous";

      // 获取更多用户信息 (可选)
      let userInfo = {};
      if (user && socket.data.supabase) {
        const { data: profile } = await socket.data.supabase
          .from("users")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) {
          userInfo = profile;
        }
      }

      // 广播给房间内的所有人（包括自己）
      const payload: MessageReceivedPayload = {
        id: nanoid(),
        socketId: socket.id,
        userId: userId,
        userEmail: userEmail,
        user: userInfo,
        text: data.message,
        timestamp: Date.now(),
      };
      io.to(data.room).emit("message:received", payload);
    });

    // 离开房间
    socket.on("room:leave", (room) => {
      console.log(`[Socket] User ${socket.id} left room: ${room}`);
      socket.leave(room);
      const payload: RoomEventPayload = {
        type: "user_left",
        socketId: socket.id,
        userId: user?.id || null,
        timestamp: Date.now(),
      };
      socket.to(room).emit("room:event", payload);
    });

    // 断开连接
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};
