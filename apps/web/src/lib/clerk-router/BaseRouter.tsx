import React, { useMemo } from "react";
import { RouterContext, RouterContextType } from "./RouteContext";

export interface BaseRouterProps {
  children: React.ReactNode;
  basePath?: string;
  currentPath: string;
  navigate: (to: string) => void;
}

export function BaseRouter({
  children,
  basePath = "",
  currentPath,
  navigate,
}: BaseRouterProps) {
  // Simple query parsing
  const [pathWithoutQuery, queryString] = currentPath.split("?");
  
  const queryParams = useMemo(() => {
    return queryString 
      ? Object.fromEntries(new URLSearchParams(queryString))
      : {};
  }, [queryString]);

  const value: RouterContextType = useMemo(() => ({
    basePath,
    currentPath: pathWithoutQuery,
    navigate,
    queryParams,
    params: {},
  }), [basePath, pathWithoutQuery, navigate, queryParams]);

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}
