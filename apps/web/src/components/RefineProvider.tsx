"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { RefineKbar } from "@refinedev/kbar";
import { useNotificationProvider } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import { dataProvider, liveProvider } from "@providers/data-provider";
import { useRefineI18nProvider } from "@providers/i18n-provider";

interface RefineProviderProps {
  children: React.ReactNode;
}

export function RefineProvider({ children }: RefineProviderProps) {
  const i18nProvider = useRefineI18nProvider();

  return (
    <Refine
      routerProvider={routerProvider}
      authProvider={authProviderClient}
      dataProvider={dataProvider}
      liveProvider={liveProvider}
      notificationProvider={useNotificationProvider}
      i18nProvider={i18nProvider}
      resources={[
        {
          name: "groups",
          list: "/blog-posts",
          create: "/blog-posts/create",
          edit: "/blog-posts/edit/:id",
          show: "/blog-posts/show/:id",
          meta: {
            canDelete: true,
          },
        },
        {
          name: "messages",
          list: "/room",
          show: "/room/:id",
          meta: {
            canDelete: false,
            label: "room",
          },
        },
        {
          name: "users",
          list: "/users",
          create: "/users/create",
          edit: "/users/edit/:id",
          show: "/users/show/:id",
          meta: {
            canDelete: true,
          },
        },
        {
          name: "categories",
          list: "/categories",
          create: "/categories/create",
          edit: "/categories/edit/:id",
          show: "/categories/show/:id",
          meta: {
            canDelete: true,
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        projectId: "pR79IU-yumvAC-RqQuUo",
        title: {
          text: "Killerqueen",
        },
      }}
    >
      {children}
      <RefineKbar />
    </Refine>
  );
}
