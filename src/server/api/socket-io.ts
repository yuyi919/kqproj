import { Server } from "socket.io";
import {
  parseCookies,
  createSupabaseClient,
  SupabaseHost,
  serlizeFilter,
} from "@utils/supabase";
import { nanoid } from "nanoid";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  ResourceEventPayload,
  RoomEventPayload,
  MessageReceivedPayload,
  SubscribeParams,
} from "@interfaces/socket";
import type { SupabaseClient, SupabaseUser } from "@utils/supabase/client";
import { createAdapter } from "@socket.io/postgres-adapter";
import { Pool } from "pg";

/**
 * Socket 存储的自定义数据
 */
interface SocketData {
  user?: SupabaseUser;
  supabase: SupabaseClient;
  host: SupabaseHost;
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
  const pool = new Pool({
    host: "aws-1-ap-south-1.pooler.supabase.com",
    user: "postgres.qmvduqswpeqyrrnydcyo",
    database: "postgres",
    password: process.env.DB_PWD!,
    port: 5432,
  });

  pool.query(`
    CREATE TABLE IF NOT EXISTS public.socket_io_attachments (
        id          bigserial UNIQUE,
        created_at  timestamptz DEFAULT NOW(),
        payload     bytea
    );
  `);

  io.adapter(createAdapter(pool));

  const ns = io.of("/");
  // 身份验证中间件
  ns.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = /*#__PURE__*/ parseCookies(cookieHeader);
      const supabase = /*#__PURE__*/ createSupabaseClient({
        get(name: string) {
          return cookies[name];
        },
      });

      const host = new SupabaseHost(supabase);
      const { authenticated, user, error } = await host.check();

      if (user) {
        socket.data.user = user;
        socket.data.supabase = supabase;
        socket.data.host = host;
        console.log(`[Socket] Auth success: ${user.email} (${socket.id})`);
        socket.emit("auth:status", {
          authenticated,
          user: { id: user.id, email: user.email! },
        });
      } else {
        console.log(`[Socket] Anonymous connection: ${socket.id}`);
        socket.emit("auth:status", { authenticated });
      }
      next();
    } catch (err) {
      console.error("[Socket] Auth error:", err);
      next(); // 允许连接，但在处理器中检查身份
    }
  });

  const rooms: Record<string, SubscribeParams> = {};
  ns.adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
  });
  ns.adapter.on("delete-room", (room) => {
    console.log(`room ${room} was deleted`);
  });

  ns.adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
  });
  ns.adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has left room ${room}`);
  });
  ns.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(
      `[Socket] User connected: ${socket.id} (${user?.email || "anonymous"})`,
    );

    // --- Refine LiveProvider 支持 ---

    // 订阅资源
    socket.on("subscribe", (data) => {
      const room = `resource:${data.resource}:${serlizeFilter(data.params?.filters)}`;
      rooms[room] = data;
      console.log(
        `[Socket] User ${socket.id} subscribed to resource: ${data.resource} with filters: ${serlizeFilter(data.params?.filters)}`,
      );
      socket.join(room);
    });

    // 取消订阅资源
    socket.on("unsubscribe", (data) => {
      const room = `resource:${data.resource}:${serlizeFilter(data.params?.filters)}`;
      console.log(
        `[Socket] User ${socket.id} unsubscribed from resource: ${data.resource} with filters: ${serlizeFilter(data.params?.filters)}`,
      );
      socket.leave(room);
    });
    // 发布自定义事件
    socket.on("publish", (data) => {
      const resource = data.channel.replace("resources/", "");
      const room = `resource:${resource}:${serlizeFilter(data.params?.filters)}`;
      console.log(
        `[Socket] User ${socket.id} published to ${data.channel}: ${data.type} with filters: ${serlizeFilter(data.params?.filters)}`,
      );

      // 广播给订阅了该资源的所有人
      const payload: ResourceEventPayload = {
        resource,
        type: data.type,
        payload: data.payload,
        socketId: socket.id,
        userId: user?.id || null,
        timestamp: data.timestamp,
      };
      ns.to(room).emit("resource-event", payload);
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
      if (user && socket.data.host) {
        const { data: profile } = await socket.data.host.getProfile(user.id);
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
      ns.to(data.room).emit("message:received", payload);
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
