"use client";

import type { AuthProvider } from "@refinedev/core";
import { createApiAuthProvider } from "./api";

export const authProviderClient: AuthProvider =
  /*#__PURE__*/ createApiAuthProvider();
