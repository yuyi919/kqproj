"use client";

/**
 * 魔女审判游戏引擎 - 玩家列表侧边栏组件
 *
 * 左侧边栏，显示紧凑的玩家列表
 */

import { Layout, theme } from "antd";
import type React from "react";
import { useGameContext } from "../../contexts/GameContext";
import { PlayerList } from "../PlayerList";

const { Sider } = Layout;

export function PlayerListSider(): React.ReactElement {
  const { token } = theme.useToken();
  const { players, G, currentPlayerId } = useGameContext();

  return (
    <Sider
      width={180}
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        overflow: "auto",
      }}
    >
      <PlayerList
        players={players}
        deathLog={G.deathLog}
        currentPlayerId={currentPlayerId}
        imprisonedId={G.imprisonedId}
        secrets={G.secrets}
      />
    </Sider>
  );
}
