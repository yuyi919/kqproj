"use client";

import type { AuthProvider } from "@refinedev/core";
import { supabaseBrowserClient } from "@utils/supabase/client";
import { createPublicAuthProvider } from "./public";

export const authProviderClient: AuthProvider = createPublicAuthProvider(
  supabaseBrowserClient
);
