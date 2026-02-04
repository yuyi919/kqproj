import { createMiddleware } from "hono/factory"
import { getCookie, setCookie } from "hono/cookie"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { SUPABASE_KEY, SUPABASE_URL } from "@utils/supabase/constants"
import type { SupabaseClient } from "@utils/supabase/client"

export type ApiVariables = {
  supabase: SupabaseClient
}

export const supabaseMiddleware = /*#__PURE__*/ createMiddleware<{ Variables: ApiVariables }>(
  async (c, next) => {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        get(name: string) {
          return getCookie(c, name)
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(options.maxAge = 34560000)
          setCookie(c, name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          setCookie(c, name, "", options)
        },
      },
    }) as unknown as SupabaseClient

    c.set("supabase", supabase)
    await next()
  },
)
