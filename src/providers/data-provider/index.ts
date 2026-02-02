"use client";

import { dataProvider as dataProviderSupabase, liveProvider as liveProviderSupabase } from "@refinedev/supabase";
import { supabaseBrowserClient } from "@utils/supabase/client";

export const dataProvider = dataProviderSupabase(supabaseBrowserClient);
export const liveProvider = liveProviderSupabase(supabaseBrowserClient)