"use client";

import { dataProvider as dataProviderApi } from "./api";
import { liveProvider as liveProviderApi } from "../live-provider/api";
import { socketioProvider } from "@providers/live-provider/socketio";

// import { liveProvider as liveProviderSupabase } from "@refinedev/supabase";
// import { supabaseBrowserClient } from "@utils/supabase/client";

// export const dataProvider = dataProviderApi();
// export const liveProvider = liveProviderSupabase(supabaseBrowserClient)

export const dataProvider = /*#__PURE__*/ dataProviderApi();
// export const liveProvider = /*#__PURE__*/ //liveProviderApi()
export const liveProvider =
  /*#__PURE__*/
  socketioProvider(
    // `http://localhost:3001`,
  );
