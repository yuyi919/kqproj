import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { Layout as AntdLayout, Flex } from "antd";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  // const data = await getData();

  // if (!data.authenticated) {
  //   return redirect(data?.redirectTo || "/login");
  // }

  return (
    <AntdLayout style={{ height: "100vh" }}>
      <Flex vertical style={{ height: "100%" }}>
        {children}
      </Flex>
    </AntdLayout>
  );
}

async function getData() {
  const { authenticated, redirectTo } = await authProviderServer.check();

  return {
    authenticated,
    redirectTo,
  };
}
