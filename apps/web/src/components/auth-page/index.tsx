"use client";
import { AuthPage as AuthPageBase, ThemedTitle } from "@refinedev/antd";
import type { AuthPageProps } from "@refinedev/core";

export const AuthPage = (props: AuthPageProps) => {
  return (
    <AuthPageBase
      {...props}
      formProps={{
        initialValues: {
          email: "info@refine.dev",
          password: "refine-supabase",
        },
      }}
      title={<ThemedTitle {...{ collapsed: false }}></ThemedTitle>}
      renderContent={(CardContent, PageTitle) => (
        <>
          {props.title}
          <br />
          {PageTitle}
          {CardContent}
        </>
      )}
    />
  );
};
