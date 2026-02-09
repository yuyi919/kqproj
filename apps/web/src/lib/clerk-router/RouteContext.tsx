import React, { createContext, useContext } from "react";

export interface RouterContextType {
  basePath: string;
  currentPath: string;
  navigate: (to: string) => void;
  queryParams: Record<string, string>;
  params: Record<string, string>;
}

export const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a Router provider");
  }
  return context;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const { params } = useRouter();
  return params as T;
}
