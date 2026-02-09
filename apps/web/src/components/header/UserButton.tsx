"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@components/Avatar";
import { Typography } from "@components/ui/typography";
import { useApp } from "@hooks/use-app";
import { useAuthUser } from "@hooks/use-user";
import { useT } from "@i18n";
import { UserMeta } from "@interfaces/user";
import { useLogout } from "@refinedev/core";
import { runAsynchronouslyWithAlert } from "@utils/promises";
import { Skeleton } from "antd";
import { CircleUser, LogIn, LogOut, SunMoon, UserPlus } from "lucide-react";
import React, { Suspense } from "react";

function Item(props: {
  text: string;
  icon: React.ReactNode;
  onClick: () => void | Promise<void>;
}) {
  return (
    <DropdownMenuItem onClick={() => runAsynchronouslyWithAlert(props.onClick)}>
      <div className="flex gap-2 items-center">
        {props.icon}
        <Typography>{props.text}</Typography>
      </div>
    </DropdownMenuItem>
  );
}

type UserButtonProps = {
  showUserInfo?: boolean;
  colorModeToggle?: () => void | Promise<void>;
  extraItems?: {
    text: string;
    icon: React.ReactNode;
    onClick: () => void | Promise<void>;
  }[];
  mockUser?: {
    displayName?: string;
    primaryEmail?: string;
    profileImageUrl?: string;
  };
};

export function UserButton(props: UserButtonProps) {
  return (
    <Suspense
      fallback={
        <Skeleton className="h-[34px] w-[34px] rounded-full stack-scope" />
      }
    >
      <UserButtonInner {...props} />
    </Suspense>
  );
}

function UserButtonInner(props: UserButtonProps) {
  const userFromHook = useAuthUser();

  // Use mock user if provided, otherwise use real user
  const user = props.mockUser
    ? ({
        username: props.mockUser.displayName || "Mock User",
        email: props.mockUser.primaryEmail || "mock@example.com",
        avatar_url: props.mockUser.profileImageUrl,
      } as UserMeta)
    : userFromHook?.meta;
  return <UserButtonInnerInner {...props} user={user || null} />;
}

function UserButtonInnerInner(
  props: UserButtonProps & { user: UserMeta | null },
) {
  const t = useT();
  const user = props.user;
  const app = useApp();

  const iconProps = { size: 20, className: "h-4 w-4" };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none stack-scope rounded-lg hover:bg-muted/50 transition-colors hover:transition-none p-1.5">
        <div className="flex gap-2 items-center">
          <UserAvatar user={user} />
          {user && props.showUserInfo && (
            <div className="flex flex-col justify-center text-left min-w-0">
              <div className="max-w-40 truncate text-sm font-medium">
                {user.username}
              </div>
              <div className="max-w-40 truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="stack-scope">
        <DropdownMenuLabel>
          <div className="flex gap-2 items-center">
            <UserAvatar user={user} />
            <div>
              {user && (
                <Typography className="max-w-40 truncate">
                  {user.username}
                </Typography>
              )}
              {user && (
                <Typography
                  className="max-w-40 truncate"
                  variant="secondary"
                  type="label"
                >
                  {user.email}
                </Typography>
              )}
              {!user && <Typography>{t.path.pages.login.title()}</Typography>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user && (
          <Item
            text={t.path.pages.settings.profile.title()}
            onClick={async () => {
              if (props.mockUser) {
                console.log(
                  "Mock account settings - no navigation in demo mode",
                );
              } else {
                await app.redirectToAccountSettings();
              }
            }}
            icon={<CircleUser {...iconProps} />}
          />
        )}
        {!user && (
          <Item
            text={t.path.pages.login.title()}
            onClick={async () => {
              if (props.mockUser) {
                console.log("Mock sign in - no navigation in demo mode");
              } else {
                await app.redirectToSignIn();
              }
            }}
            icon={<LogIn {...iconProps} />}
          />
        )}
        {!user && (
          <Item
            text={t.path.buttons.logout()}
            onClick={async () => {
              if (props.mockUser) {
                console.log("Mock sign up - no navigation in demo mode");
              } else {
                await app.redirectToSignUp();
              }
            }}
            icon={<UserPlus {...iconProps} />}
          />
        )}
        {user &&
          props.extraItems &&
          props.extraItems.map((item, index) => <Item key={index} {...item} />)}
        {/* {props.colorModeToggle && (
          <Item
            text={t("buttons.toggleTheme", "切换主题")}
            onClick={props.colorModeToggle}
            icon={<SunMoon {...iconProps} />}
          />
        )} */}
        {user && (
          <SignOut
            mockUser={!!props.mockUser}
            icon={<LogOut {...iconProps} />}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const SignOut = ({ mockUser = false, icon = <></> }) => {
  const t = useT();
  const { mutate: logout } = useLogout();

  return (
    <Item
      text={t.path.buttons.logout()}
      onClick={async () => {
        if (mockUser) {
          console.log("Mock sign out - no action taken in demo mode");
        } else {
          logout();
        }
      }}
      icon={icon}
    />
  );
};
