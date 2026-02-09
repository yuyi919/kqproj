import GameLayout from "@components/layout/GameLayout";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  // const data = await getData();

  // if (!data.authenticated) {
  //   return redirect(data?.redirectTo || "/login");
  // }

  return <GameLayout>{children}</GameLayout>;
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
  };
}
