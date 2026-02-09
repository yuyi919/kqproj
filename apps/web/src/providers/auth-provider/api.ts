import type { AuthProvider, CheckResponse } from "@refinedev/core";
import type { IUser } from "@interfaces/user";
import { rpc } from "@utils/api/rpc";

/**
 * 处理 Hono RPC 响应，解析 JSON 并处理 RFC 7807 错误
 * @param response - Hono RPC 返回的响应对象
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/problem+json")) {
    const problem = await response.json();
    throw Object.assign(new Error(problem.detail ?? "RequestError"), {
      name: problem.title ?? "RequestError",
      status: problem.status,
      detail: problem.detail,
      type: problem.type,
    });
  }
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * 创建基于 Hono RPC 的 AuthProvider
 */
export function createApiAuthProvider(): AuthProvider {
  return {
    login: async ({ email, password, providerName, redirectTo }) => {
      try {
        const res = await rpc.auth.login.$post({
          json: { email, password, providerName, redirectTo },
        });
        const data = await /*#__PURE__*/ handleResponse<{
          success: boolean;
          redirectTo?: string;
        }>(res);
        if (data?.redirectTo) {
          return { success: true, redirectTo: data.redirectTo };
        }
        return { success: data?.success ?? false };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    logout: async () => {
      try {
        const res = await rpc.auth.logout.$post();
        const data = await /*#__PURE__*/ handleResponse<{
          success: boolean;
          redirectTo?: string;
        }>(res);
        return { success: data.success, redirectTo: data.redirectTo };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    register: async ({ email, password }) => {
      try {
        const res = await rpc.auth.register.$post({
          json: { email, password },
        });
        const data = await /*#__PURE__*/ handleResponse<{
          success: boolean;
          redirectTo?: string;
        }>(res);
        return { success: data.success, redirectTo: data.redirectTo };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    check: async (): Promise<CheckResponse> => {
      try {
        const res = await rpc.auth.check.$get();
        const data = await /*#__PURE__*/ handleResponse<CheckResponse>(res);
        return data;
      } catch (error: any) {
        return {
          authenticated: false,
          logout: true,
          redirectTo: "/login",
          error,
        };
      }
    },
    getPermissions: async () => {
      try {
        const res = await rpc.auth.permissions.$get();
        const data = await /*#__PURE__*/ handleResponse<{
          role: string | null;
        }>(res);
        return data.role;
      } catch {
        return null;
      }
    },
    getIdentity: async (): Promise<IUser | null> => {
      try {
        const res = await rpc.auth.identity.$get();
        const data = await /*#__PURE__*/ handleResponse<IUser>(res);
        return data;
      } catch {
        return null;
      }
    },
    forgotPassword: async ({ email }) => {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : undefined;
      try {
        const res = await rpc.auth["forgot-password"].$post({
          json: {
            email,
            redirectTo: `${origin}/update-password`,
          },
        });
        const data = await /*#__PURE__*/ handleResponse<{ success: boolean }>(
          res,
        );
        return { success: data.success };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    updatePassword: async ({ password }) => {
      try {
        const res = await rpc.auth["update-password"].$post({
          json: { password },
        });
        const data = await /*#__PURE__*/ handleResponse<{
          success: boolean;
          redirectTo?: string;
        }>(res);
        return { success: data.success, redirectTo: data.redirectTo };
      } catch (error: any) {
        return { success: false, error };
      }
    },
    onError: async (error) => {
      if ((error as any)?.code === "PGRST301" || (error as any)?.code === 401) {
        return { logout: true };
      }
      return { error };
    },
  };
}
