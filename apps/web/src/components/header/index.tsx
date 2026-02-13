"use client";

import { ColorModeContext } from "@contexts/color-mode";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { Layout as AntdLayout, Space, Switch, theme } from "antd";
import React, { useContext } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserButton } from "./UserButton";

const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { mode, setMode } = useContext(ColorModeContext);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "46px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <LanguageSwitcher />
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        <div className="flex ml-2">
          {/* {user?.name && <Text strong>{user.name}</Text>} */}
          <UserButton showUserInfo />
          {/* {user && (
            <UserButton showUserInfo />
            // <UserMiniProfile user={user}>
            //   <UserAvatar user={user.meta} />
            // </UserMiniProfile>
          )} */}
        </div>
      </Space>
    </AntdLayout.Header>
  );
};
