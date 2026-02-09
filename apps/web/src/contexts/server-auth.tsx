"use client";

import React, { createContext, useContext } from "react";
import { IUser } from "@interfaces/user";

const ServerAuthContext = createContext<IUser | undefined>(undefined);

export function ServerAuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: IUser | undefined;
}) {
  return (
    <ServerAuthContext.Provider value={initialUser}>
      {children}
    </ServerAuthContext.Provider>
  );
}

export function useServerAuth() {
  return useContext(ServerAuthContext);
}
