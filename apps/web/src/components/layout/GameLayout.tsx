"use client";
import { Header } from "@components/header";
import { Layout } from "antd";

export default function GameLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <Layout className="h-screen">
      <Header sticky={false}></Header>
      <Layout.Content className="h-full overflow-auto">
        {/* <style >{gameStyles}</style> */}
        <style>{`.bgio-client { height: 100%; }`}</style>
        {/* <OnlineGame playerID="2" /> */}
        {/* {<NoSSR>
        <LocalGame playerID="2" />
      </NoSSR>} */}
        {children}
      </Layout.Content>
    </Layout>
  );
}
