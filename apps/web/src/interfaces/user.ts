export type IUser = {
  id: string;
  name: string;
  avatar: string | null;
  meta: UserMeta;
  access_token: string | null;
};
export type UserMeta = {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};
