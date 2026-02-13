import { type CookieOptions } from "@supabase/ssr";
import { createSupabaseClient, SupabaseHost } from "@utils/supabase";
import type { SupabaseClient } from "@utils/supabase/client";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export type ApiVariables = {
  supabase: SupabaseClient;
  host: SupabaseHost;
};

export const supabaseMiddleware = /*#__PURE__*/ createMiddleware<{
  Variables: ApiVariables;
}>(async (c, next) => {
  const supabase = /*#__PURE__*/ createSupabaseClient({
    get(name: string) {
      return getCookie(c, name);
    },
    set(name: string, value: string, options: CookieOptions) {
      // console.log(options.maxAge = 34560000)
      if (options.maxAge! > 34560000) {
        options.maxAge = 34560000;
      }
      // TODO: 修复类型错误
      setCookie(c, name, value, options as any);
    },
    remove(name: string, options: CookieOptions) {
      // TODO: 修复类型错误
      setCookie(c, name, "", options as any);
    },
  });

  c.set("supabase", supabase);
  c.set("host", new SupabaseHost(supabase));
  await next();
});
