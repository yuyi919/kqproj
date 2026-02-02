"use client";

import { UserAvatar } from "@components/Avatar";
import { ColorModeContext } from "@contexts/color-mode";
import type { IUser } from "@interfaces/user";
import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import { Layout as AntdLayout, Space, Switch, theme, Typography } from "antd";
import React, { useContext } from "react";

const { Text } = Typography;
const { useToken } = theme;

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />
        {(user?.name || user?.avatar) && (
          <Space style={{ marginLeft: "8px" }} size="middle">
            {user?.name && <Text strong>{user.name}</Text>}
            {user && <UserAvatar user={user.meta} />}
          </Space>
        )}
      </Space>
    </AntdLayout.Header>
  );
};
