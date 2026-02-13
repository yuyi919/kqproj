import GameLayout from "@components/layout/GameLayout";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  return <GameLayout>{children}</GameLayout>;
}
