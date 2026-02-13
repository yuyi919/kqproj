import type { IUser, UserMeta } from "@interfaces/user";
import type { SupabaseClient } from "./client";

/**
 * SupabaseHost 类用于封装常用的 Supabase 操作，提供更高层级的抽象。
 */
export class SupabaseHost {
  constructor(public readonly client: SupabaseClient) {}

  /**
   * 获取当前经过身份验证的用户
   */
  async getUser() {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    return { user, error };
  }

  /**
   * 根据用户 ID 获取用户 Profile 信息
   * @param userId - 用户 ID
   */
  async getProfile(userId: string) {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    return { data: data as UserMeta | null, error };
  }

  /**
   * 获取完整的身份信息（包含 User 和 Profile）
   * 常用于 Refine 的 getIdentity 方法
   */
  async getIdentity(): Promise<IUser | null> {
    const {
      data: { session },
    } = await this.client.auth.getSession();
    // const user = session?.user;
    const { user, error } = await this.getUser();
    if (error || !user) return null;
    const { data: profile } = await this.getProfile(user.id);
    if (!profile) return null;
    return {
      ...user,
      access_token: session?.access_token || null,
      name: profile.username ?? user.email!,
      avatar: profile.avatar_url || null,
      meta: profile,
    } satisfies IUser;
  }

  /**
   * 检查用户是否已登录
   */
  async check() {
    const { user, error } = await this.getUser();
    return {
      authenticated: !!user && !error,
      user,
      error,
    };
  }
}
