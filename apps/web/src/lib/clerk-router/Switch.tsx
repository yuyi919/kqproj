import React, { Children, isValidElement, useContext } from "react";
import { RouterContext } from "./RouteContext";
import { matchPath } from "./pathToRegexp";

export function Switch({ children }: { children: React.ReactNode }) {
  const context = useContext(RouterContext);
  
  if (!context) return null;
  const { currentPath } = context;

  let match: any = null;
  let element: React.ReactNode = null;

  Children.forEach(children, (child) => {
    if (match == null && isValidElement(child)) {
      const { path, index } = child.props as any;
      const pattern = index ? "/" : (path || "*");
      
      const potentialMatch = matchPath(currentPath, pattern);
      if (potentialMatch) {
        match = potentialMatch;
        element = child;
      }
    }
  });

  return match ? <>{element}</> : null;
}
