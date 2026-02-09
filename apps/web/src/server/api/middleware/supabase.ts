import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { type CookieOptions } from "@supabase/ssr";
import { SupabaseHost, createSupabaseClient } from "@utils/supabase";
import type { SupabaseClient } from "@utils/supabase/client";

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
      if (options.maxAge > 34560000) {
        options.maxAge = 34560000;
      }
      setCookie(c, name, value, options);
    },
    remove(name: string, options: CookieOptions) {
      setCookie(c, name, "", options);
    },
  });

  c.set("supabase", supabase);
  c.set("host", new SupabaseHost(supabase));
  await next();
});
