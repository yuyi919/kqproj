import { Hono } from "hono";
import { type ApiVariables, supabaseMiddleware } from "./middleware/supabase";
import { auth } from "./routes/auth";
import { data } from "./routes/data";
import game from "./routes/game";
import { live } from "./routes/live";
import users from "./routes/users";

export const app = /*#__PURE__*/ new Hono<{ Variables: ApiVariables }>()
  .basePath("/api")
  .use("*", supabaseMiddleware)
  .route("/auth", auth)
  .route("/data", data)
  .route("/users", users)
  .route("/game", game)
  .route("/live", live);

export type AppType = typeof app;
