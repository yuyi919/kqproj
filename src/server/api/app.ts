import { Hono } from "hono";
import { auth } from "./routes/auth";
import { data } from "./routes/data";
import { live } from "./routes/live";
import { supabaseMiddleware, type ApiVariables } from "./middleware/supabase";

export const app = /*#__PURE__*/ new Hono<{ Variables: ApiVariables }>()
  .basePath("/api")
  .use("*", supabaseMiddleware)
  .route("/auth", auth)
  .route("/data", data)
  .route("/live", live);

export type AppType = typeof app;
