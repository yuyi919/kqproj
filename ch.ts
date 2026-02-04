import { setupSocketIO } from "@server/api/socket-io";
import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const io = new Server({
  addTrailingSlash: false,
});

const engine = new Engine({
  cors: {
    origin: ["*"],
    // allowedHeaders: ["my-header"],
    credentials: true,
  },
  path: "/api/socket",
});

io.bind(engine);

setupSocketIO(io);

export default {
  port: 3001,
  ...engine.handler(),
};
