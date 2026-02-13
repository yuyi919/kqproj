import React, { useState } from "react";
import { BaseRouter } from "./BaseRouter";

export function VirtualRouter({
  children,
  initialPath = "/",
}: {
  children: React.ReactNode;
  initialPath?: string;
}) {
  const [path, setPath] = useState(initialPath);
  return (
    <BaseRouter currentPath={path} navigate={setPath}>
      {children}
    </BaseRouter>
  );
}
