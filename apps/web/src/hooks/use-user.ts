import { IUser } from "@interfaces/user";
import { useGetIdentity } from "@refinedev/core";
import { useServerAuth } from "@contexts/server-auth";
import { useMemo } from "react";

export function useAuthUser() {
  const initialUser = useServerAuth();
  // console.log("initialUser", initialUser);
  const { data: user } = useGetIdentity<IUser>(
    useMemo(
      () => ({
        queryOptions: {
          initialData: initialUser,
          enabled: !initialUser,
        },
      }),
      [initialUser],
    ),
  );
  return user;
}

export const useAuthIdentity = useGetIdentity<IUser>;
