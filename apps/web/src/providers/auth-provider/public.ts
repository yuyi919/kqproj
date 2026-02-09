import type { SupabaseClient } from "@utils/supabase/client";
import { SupabaseHost } from "@utils/supabase/host";
import type { AuthProvider, CheckResponse } from "@refinedev/core";
import type { IUser, UserMeta } from "@interfaces/user";

export function createPublicAuthProvider(client: SupabaseClient) {
  const host = new SupabaseHost(client);
  return {
    login: async ({ email, password, providerName }) => {
      if (providerName) {
        const { data, error } = await client.auth.signInWithOAuth({
          provider: providerName,
        });

        if (error) {
          return {
            success: false,
            error,
          };
        }

        if (data?.url) {
          return {
            success: true,
            redirectTo: "/",
          };
        }
      }
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data?.session) {
        await client.auth.setSession(data.session);

        return {
          success: true,
        };
      }

      // for third-party login
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid username or password",
        },
      };
    },
    logout: async () => {
      const { error } = await client.auth.signOut();

      if (error) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },
    register: async ({ email, password }) => {
      try {
        const { data, error } = await client.auth.signUp({
          email,
          password,
        });
        console.log("register", data, error);
        if (error) {
          return {
            success: false,
            error,
          };
        }

        if (data) {
          return {
            success: true,
            redirectTo: "/",
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: {
          message: "Register failed",
          name: "Invalid email or password",
        },
      };
    },
    check: async (): Promise<CheckResponse> => {
      const { authenticated, error } = await host.check();

      if (error) {
        return {
          authenticated: false,
          redirectTo: "/login",
          logout: true,
        };
      }

      if (authenticated) {
        return {
          authenticated: true,
        };
      }

      return {
        authenticated: false,
        redirectTo: "/login",
      };
    },
    getPermissions: async () => {
      const { user } = await host.getUser();

      if (user) {
        return user.role;
      }

      return null;
    },
    getIdentity: async (): Promise<IUser | null> => {
      return host.getIdentity();
    },
    onError: async (error) => {
      if (error?.code === "PGRST301" || error?.code === 401) {
        return {
          logout: true,
        };
      }

      return { error };
    },
    forgotPassword: async ({ email }) => {
      try {
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
          return {
            success: false,
            error,
          };
        }

        if (data) {
          return {
            success: true,
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: {
          message: "Forgot password failed",
          name: "Invalid email",
        },
      };
    },
    updatePassword: async ({ password }) => {
      try {
        const { data, error } = await client.auth.updateUser({
          password,
        });

        if (error) {
          return {
            success: false,
            error,
          };
        }

        if (data) {
          return {
            success: true,
            redirectTo: "/",
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: {
          message: "Update password failed",
          name: "Invalid password",
        },
      };
    },
  } satisfies AuthProvider;
}
