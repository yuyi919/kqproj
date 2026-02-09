import { PageHeader } from "@refinedev/antd";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      {/* <PageHeader title="test" /> */}
      {children}
    </>
  );
}
