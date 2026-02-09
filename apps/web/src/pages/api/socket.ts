import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import { setupSocketIO } from "../../server/api/socket-io";

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const initializeSocketServer = (httpServer: HTTPServer): IOServer => {
  const io = new IOServer(httpServer, {
    path: "/socketio",
    addTrailingSlash: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["polling", "websocket"],
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  setupSocketIO(io);
  return io;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket,
) {
  // if (process.env.NODE_ENV !== "production") {
  //   // 在开发环境下，如果 io 已经存在，我们关闭它以允许重新初始化
  //   // 这样可以确保 setupSocketIO 中的逻辑变更能通过热更新生效
  //   if (res.socket.server.io) {
  //     console.log("Socket is re-initializing (HMR)")
  //     res.socket.server.io.removeAllListeners()
  //     res.socket.server.io = undefined
  //   }
  // }

  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    res.socket.server.io = initializeSocketServer(
      res.socket.server as unknown as HTTPServer,
    );
  }
  res.end();
}
