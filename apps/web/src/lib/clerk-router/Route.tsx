import React, { useContext, useMemo } from "react";
import { RouterContext } from "./RouteContext";
import { matchPath } from "./pathToRegexp";

export interface RouteProps {
  path?: string;
  index?: boolean;
  children?: React.ReactNode;
  component?: React.ComponentType<any>;
}

export function Route({ path, index, children, component: Component }: RouteProps) {
  const context = useContext(RouterContext);
  
  const match = useMemo(() => {
    if (!context) return null;
    const { currentPath } = context;
    const pattern = index ? "/" : (path || "*");
    return matchPath(currentPath, pattern);
  }, [context, path, index]);

  if (!context || !match) return null;

  // Nested context with new params
  const nextContext = {
    ...context,
    params: { ...context.params, ...match.params },
  };

  return (
    <RouterContext.Provider value={nextContext}>
      {Component ? <Component /> : children}
    </RouterContext.Provider>
  );
}
