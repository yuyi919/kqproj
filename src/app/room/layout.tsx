import React from "react";
import { Grid, Layout as AntdLayout } from "antd";
import { ThemedLayout, PageHeader } from "@refinedev/antd";
import { Flex } from "antd";
import { Header } from "@components/header";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { redirect } from "next/navigation";

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
