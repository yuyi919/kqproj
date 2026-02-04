import { setupSocketIO } from "@server/api/socket-io";
import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;
const io = new Server({
  path: "/socketio",
  addTrailingSlash: false,
});

const engine = new Engine({
  cors: {
    origin: ["http://localhost:3000"],
    // allowedHeaders: ["my-header"],
    credentials: true,
  },
  path: "/socketio",
});

io.bind(engine);
setupSocketIO(io);

export default {
  port: PORT,
  ...engine.handler(),
};
