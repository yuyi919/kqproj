import React, { useEffect, useState } from "react";
import { BaseRouter } from "./BaseRouter";

export function HashRouter({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(() => 
    typeof window !== "undefined" 
      ? window.location.hash.slice(1) || "/" 
      : "/"
  );

  useEffect(() => {
    const onHashChange = () => {
      const newPath = window.location.hash.slice(1) || "/";
      setPath(newPath);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return (
    <BaseRouter currentPath={path} navigate={navigate}>
      {children}
    </BaseRouter>
  );
}
