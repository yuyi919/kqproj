import { AntdRegistry } from "@ant-design/nextjs-registry";
import { RefineKbarProvider } from "@refinedev/kbar";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import React, { Suspense } from "react";
// import "@refinedev/antd/dist/reset.css";
import "./globals.css";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { ServerAuthProvider } from "@contexts/server-auth";
import { IUser } from "@interfaces/user";
import { authProviderServer } from "@providers/auth-provider/auth-provider.server";
import { RefineProvider } from "@/components/RefineProvider";

export const metadata: Metadata = {
  title: "魔女审判",
  description: "魔女审判",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  const identity = (await authProviderServer.getIdentity()) as
    | IUser
    | undefined;

  // Get locale and messages for next-intl
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <Suspense>
          <AntdRegistry>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <RefineKbarProvider>
                <ColorModeContextProvider defaultMode={defaultMode}>
                  <ServerAuthProvider initialUser={identity}>
                    <RefineProvider>{children}</RefineProvider>
                  </ServerAuthProvider>
                </ColorModeContextProvider>
              </RefineKbarProvider>
            </NextIntlClientProvider>
          </AntdRegistry>
        </Suspense>
      </body>
    </html>
  );
}
