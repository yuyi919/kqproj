"use client";

/**
 * 魔女审判游戏引擎 - 游戏主面板组件 (重构版)
 *
 * 使用 GameContext 避免 props 传递，组件拆分为更小的子组件：
 * - GameHeader: 顶部状态栏
 * - PlayerListSider: 左侧玩家列表
 * - MainContent: 主内容区（聊天、手牌）
 * - ActionPanel: 右侧操作面板（投票、夜间行动）
 * - GameOverScreen: 游戏结束界面
 */

import React from "react";
import { BoardProps as BGBoardProps } from "boardgame.io/react";
import { Layout, theme } from "antd";
import { GameProvider } from "../../contexts/GameContext";
import type { BGGameState } from "../../types";
import { GameHeader } from "./GameHeader";
import { PlayerListSider } from "./PlayerListSider";
import { MainContent } from "./MainContent";
import { GameOverScreen } from "./GameOverScreen";

// 扩展 BoardProps 类型以匹配 useWitchTrial hook
export interface ExtendedBoardProps extends BGBoardProps<BGGameState> {
  currentPlayerId?: string;
}

export type BoardProps = ExtendedBoardProps;

// 内部组件：游戏主体布局
function GameLayout(): React.ReactElement {
  const { token } = theme.useToken();

  return (
    <Layout style={{ height: "100%", background: token.colorBgLayout }}>
      <GameHeader />
      <Layout>
        <PlayerListSider />
        <MainContent />
      </Layout>
    </Layout>
  );
}

// 主 Board 组件
export function Board(props: BoardProps): React.ReactElement {
  const { ctx } = props;
  const isGameOver = ctx.gameover !== undefined;

  return (
    <GameProvider boardProps={props}>
      {isGameOver ? <GameOverScreen /> : <GameLayout />}
    </GameProvider>
  );
}

// 导出子组件供外部使用
export { GameHeader } from "./GameHeader";
export { PlayerListSider } from "./PlayerListSider";
export { MainContent } from "./MainContent";
export { ActionPanel } from "./ActionPanel";
export { GameOverScreen } from "./GameOverScreen";

// 默认导出
export default Board;
