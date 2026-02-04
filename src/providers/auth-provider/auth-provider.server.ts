import type { AuthProvider, CheckResponse } from "@refinedev/core";
import { createSupabaseServerClient } from "@utils/supabase/server";
import { createPublicAuthProvider } from "./public";

export const authProviderServer = {
  getIdentity: async () => {
    const client = await createSupabaseServerClient();
    return createPublicAuthProvider(client).getIdentity?.();
  },
  logout: async () => {
    const client = await createSupabaseServerClient();
    return createPublicAuthProvider(client).logout?.();
  },
  check: async (): Promise<CheckResponse> => {
    const client = await createSupabaseServerClient();
    return createPublicAuthProvider(client).check();
  },
} satisfies Required<Pick<AuthProvider, "check" | "getIdentity" | "logout">>;
