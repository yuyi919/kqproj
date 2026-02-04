import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { ApiVariables } from "../middleware/supabase";

export const auth = /*#__PURE__*/ new Hono<{ Variables: ApiVariables }>()
  .post(
    "/login",
    zValidator(
      "json",
      z
        .object({
          email: z.email().optional(),
          password: z.string().min(6).optional(),
          providerName: z.string().optional(),
          redirectTo: z.url().optional(),
        })
        .refine(
          (v) => !!v.providerName || (!!v.email && !!v.password),
          "providerName 或 email+password 必须其一",
        ),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const input = c.req.valid("json");
      if (input.providerName) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: input.providerName as any,
          options: input.redirectTo
            ? { redirectTo: input.redirectTo }
            : undefined,
        });
        if (error) {
          return c.json(
            {
              type: "OAuthError",
              title: "OAuth sign-in failed",
              status: 500,
              detail: error.message,
              instance: c.req.path,
            },
            500,
            { "content-type": "application/problem+json" },
          );
        }
        return c.json({ success: true, redirectTo: data?.url ?? "/" });
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email!,
        password: input.password!,
      });
      if (error) {
        return c.json(
          {
            type: "LoginError",
            title: "Invalid credentials",
            status: 401,
            detail: error.message,
            instance: c.req.path,
          },
          401,
          { "content-type": "application/problem+json" },
        );
      }
      return c.json({ success: !!data, redirectTo: "/" });
    },
  )
  .post("/logout", async (c) => {
    const supabase = c.var.supabase;
    const { error } = await supabase.auth.signOut();
    if (error) {
      return c.json(
        {
          type: "LogoutError",
          title: "Sign out failed",
          status: 500,
          detail: error.message,
          instance: c.req.path,
        },
        500,
        { "content-type": "application/problem+json" },
      );
    }
    return c.json({ success: true, redirectTo: "/login" });
  })
  .post(
    "/register",
    zValidator(
      "json",
      z.object({
        email: z.email(),
        password: z.string().min(6),
      }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const input = c.req.valid("json");
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });
      if (error) {
        return c.json(
          {
            type: "RegisterError",
            title: "Registration failed",
            status: 400,
            detail: error.message,
            instance: c.req.path,
          },
          400,
          { "content-type": "application/problem+json" },
        );
      }
      return c.json({ success: !!data, redirectTo: "/" });
    },
  )
  .get("/check", async (c) => {
    const supabase = c.var.supabase;
    const { data, error } = await supabase.auth.getUser();
    const { user } = data;
    if (error) {
      return c.json({
        authenticated: false,
        redirectTo: "/login",
        logout: true,
        error,
      });
    }
    if (user) {
      return c.json({ authenticated: true });
    }
    return c.json({
      authenticated: false,
      redirectTo: "/login",
    });
  })
  .get("/permissions", async (c) => {
    const supabase = c.var.supabase;
    const { data } = await supabase.auth.getUser();
    return c.json({ role: data?.user?.role ?? null });
  })
  .get("/identity", async (c) => {
    const supabase = c.var.supabase;
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      return c.json(
        {
          type: "Unauthorized",
          title: "No active user",
          status: 401,
          instance: c.req.path,
        },
        401,
        { "content-type": "application/problem+json" },
      );
    }
    const metaRes = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (metaRes.error || !metaRes.data) {
      return c.json(
        {
          type: "NotFound",
          title: "User meta not found",
          status: 404,
          instance: c.req.path,
        },
        404,
        { "content-type": "application/problem+json" },
      );
    }
    const meta = metaRes.data as any;
    return c.json({
      ...user,
      name: meta.username ?? user.email!,
      avatar: meta.avatar_url || null,
      meta,
    });
  })
  .post(
    "/forgot-password",
    zValidator(
      "json",
      z.object({
        email: z.email(),
        redirectTo: z.url().optional(),
      }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const input = c.req.valid("json");
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        input.email,
        {
          redirectTo: input.redirectTo,
        },
      );
      if (error) {
        return c.json(
          {
            type: "ForgotPasswordError",
            title: "Reset failed",
            status: 400,
            detail: error.message,
            instance: c.req.path,
          },
          400,
          { "content-type": "application/problem+json" },
        );
      }
      return c.json({ success: !!data });
    },
  )
  .post(
    "/update-password",
    zValidator(
      "json",
      z.object({
        password: z.string().min(6),
      }),
    ),
    async (c) => {
      const supabase = c.var.supabase;
      const input = c.req.valid("json");
      const { data, error } = await supabase.auth.updateUser({
        password: input.password,
      });
      if (error) {
        return c.json(
          {
            type: "UpdatePasswordError",
            title: "Update failed",
            status: 400,
            detail: error.message,
            instance: c.req.path,
          },
          400,
          { "content-type": "application/problem+json" },
        );
      }
      return c.json({ success: !!data, redirectTo: "/" });
    },
  );
