import type { AppType } from "@server/api/app";
import { hc, InferRequestType, InferResponseType } from "hono/client";

export type ApiAppType = AppType;

export const createRpcClient = /*#__PURE__*/ (base = "/") =>
  hc<ApiAppType>(base);

export const rpc = /*#__PURE__*/ createRpcClient().api;

export type { InferRequestType, InferResponseType };
