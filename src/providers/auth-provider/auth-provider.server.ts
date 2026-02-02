import type { AuthProvider, CheckResponse } from "@refinedev/core";
import { createSupabaseServerClient } from "@utils/supabase/server";
import { createPublicAuthProvider } from "./public";

export const authProviderServer = {
  getIdentity: async () => {
    return createPublicAuthProvider(
      await createSupabaseServerClient()
    ).getIdentity?.();
  },
  logout: async () => {
    return createPublicAuthProvider(
      await createSupabaseServerClient()
    ).logout?.();
  },
  check: async (): Promise<CheckResponse> => {
    const client = await createSupabaseServerClient();
    const { data, error } = await client.auth.getUser();
    const { user } = data;

    if (error) {
      return {
        authenticated: false,
        logout: true,
        error: error as Error,
        redirectTo: "/login",
      } satisfies {
        error: Error | null;
        authenticated: boolean;
        logout?: boolean;
        redirectTo?: string;
      };
    }

    if (user) {
      return {
        logout: false,
        authenticated: true,
      } satisfies CheckResponse
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    } satisfies CheckResponse
  },
} satisfies Required<Pick<AuthProvider, "check" | "getIdentity" | "logout">>;
