"use client";

import { IUser } from "@interfaces/user";
import React, { createContext, useContext } from "react";

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
