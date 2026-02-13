"use client";

/**
 * 魔女审判游戏引擎 - boardgame.io 使用示例 (Ant Design 版本)
 *
 * 展示如何使用 boardgame.io 版本的游戏引擎
 */

import {
  CodeOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  List,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { Local, SocketIO } from "boardgame.io/multiplayer";
import { Client } from "boardgame.io/react";
import type React from "react";
import { useState } from "react";
import { WitchTrialBoard, WitchTrialGame } from "./index";

const { Title, Paragraph, Text, Link } = Typography;
const { Panel } = Collapse;

// ==================== 游戏客户端配置 ====================

/**
 * 本地单人游戏（用于开发和测试）
 */
export const LocalGame = Client({
  game: { ...WitchTrialGame, seed: 0 },
  board: WitchTrialBoard,
  numPlayers: 7,
  // multiplayer: Local(),
});

/**
 * 本地多人游戏（同一浏览器的多个玩家）
 */
export const LocalMultiplayerGame = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  numPlayers: 7,
  multiplayer: Local(),
});

/**
 * 在线多人游戏（需要 boardgame.io 服务器）
 */
export const OnlineGame = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  numPlayers: 7,
  multiplayer: SocketIO({ server: "localhost:8000" }),
});

// ==================== 示例页面组件 ====================

/**
 * 使用示例：游戏演示页面
 */
export function GameExample(): React.ReactElement {
  const [activeTab, setActiveTab] = useState("local");

  const items = [
    {
      key: "local",
      label: (
        <span>
          <PlayCircleOutlined /> 本地游戏
        </span>
      ),
      children: (
        <Card
          title="本地单人游戏（7人局）"
          extra={<Tag color="blue">开发测试</Tag>}
          variant="borderless"
        >
          <Alert
            title="提示"
            description="本地游戏模式适合开发和测试，所有玩家在同一浏览器中运行。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <LocalGame playerID="0" matchID="local" />
        </Card>
      ),
    },
    {
      key: "multiplayer",
      label: (
        <span>
          <TeamOutlined /> 多人视角
        </span>
      ),
      children: <MultiplayerDemo />,
    },
    {
      key: "docs",
      label: (
        <span>
          <InfoCircleOutlined /> 使用文档
        </span>
      ),
      children: <UsageDocs />,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        {/* 页面标题 */}
        <div style={{ textAlign: "center" }}>
          <Title level={2}>
            <PlayCircleOutlined style={{ marginRight: 12 }} />
            魔女审判 - boardgame.io 版本
          </Title>
          <Paragraph type="secondary">
            基于 boardgame.io 框架的多人联机类狼人杀游戏引擎
          </Paragraph>
        </div>

        {/* 游戏特性 */}
        <Card variant="outlined">
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12} md={6}>
              <Card.Meta
                title="🎮 完整规则"
                description="魔女化、残骸化、手牌遗落、攻击名额限制"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card.Meta
                title="🔒 信息隐藏"
                description="通过 playerView 正确隐藏秘密信息"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card.Meta
                title="🌐 多人联机"
                description="支持本地和在线多人游戏"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card.Meta
                title="⚛️ React 集成"
                description="完整的 React 组件和 Hooks"
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* 标签页内容 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          destroyOnHidden
          type="card"
          size="large"
        />
      </Space>
    </div>
  );
}

/**
 * 多人游戏演示
 */
function MultiplayerDemo(): React.ReactElement {
  const playerIDs = ["0", "1", "2", "3", "4", "5", "6"];
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([
    "0",
    "1",
    "2",
  ]);

  return (
    <Card
      title="多人视角演示"
      extra={
        <Text type="secondary">
          <TeamOutlined /> 7人局
        </Text>
      }
      bordered={false}
    >
      <Alert
        title="演示模式"
        description="以下显示同一局游戏中不同玩家的视角。每个视角只能看到该玩家应有的信息。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 玩家选择 */}
      <Card
        size="small"
        title="选择要显示的玩家视角"
        style={{ marginBottom: 24 }}
      >
        <Space wrap>
          {playerIDs.map((id) => (
            <Button
              key={id}
              type={selectedPlayers.includes(id) ? "primary" : "default"}
              icon={<UserOutlined />}
              onClick={() => {
                if (selectedPlayers.includes(id)) {
                  setSelectedPlayers(selectedPlayers.filter((p) => p !== id));
                } else {
                  setSelectedPlayers([...selectedPlayers, id]);
                }
              }}
            >
              玩家 {id}
            </Button>
          ))}
        </Space>
      </Card>

      {/* 玩家视角网格 */}
      <Row gutter={[16, 16]}>
        {selectedPlayers.map((id) => (
          <Col key={id} xs={24} sm={12} lg={8}>
            <Card
              title={`玩家 ${id} 的视角`}
              size="small"
              extra={<Tag color="blue">P{id}</Tag>}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ height: 400, overflow: "auto" }}>
                <LocalMultiplayerGame playerID={id} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

/**
 * 使用文档
 */
function UsageDocs(): React.ReactElement {
  const codeStyle: React.CSSProperties = {
    background: "#f6f8fa",
    padding: 16,
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 14,
    overflow: "auto",
  };

  const examples = [
    {
      title: "基础用法（本地单人）",
      icon: <PlayCircleOutlined />,
      description: "最简单的使用方式，适合开发和测试",
      code: `import { LocalGame } from './example';

function App() {
  return <LocalGame playerID="0" />;
}`,
    },
    {
      title: "多人游戏（在线）",
      icon: <GlobalOutlined />,
      description: "需要启动 boardgame.io 服务器",
      code: `import { OnlineGame } from './example';

function App() {
  const [playerID, setPlayerID] = useState(null);
  const [matchID, setMatchID] = useState('default');
  
  // 需要启动 boardgame.io 服务器
  return <OnlineGame playerID={playerID} matchID={matchID} />;
}`,
    },
    {
      title: "自定义 Board",
      icon: <CodeOutlined />,
      description: "使用自定义的游戏面板",
      code: `import { Client } from 'boardgame.io/react';
import { WitchTrialGame } from './index';
import { MyCustomBoard } from './MyCustomBoard';

const Game = Client({
  game: WitchTrialGame,
  board: MyCustomBoard,
  numPlayers: 7,
});

export default Game;`,
    },
    {
      title: "使用 Hook",
      icon: <CodeOutlined />,
      description: "使用 useWitchTrial Hook 访问游戏状态",
      code: `import { useWitchTrial } from './index';

function MyBoard(props) {
  const game = useWitchTrial(props);
  
  return (
    <div>
      <p>当前阶段: {game.phase}</p>
      <p>你的手牌: {game.mySecrets?.hand.length}张</p>
      <Button onClick={() => game.pass()}>
        放弃
      </Button>
    </div>
  );
}`,
    },
  ];

  return (
    <Card title="使用文档" bordered={false}>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <Alert
          title="快速开始"
          description="以下是几种常见的使用方式，根据你的需求选择合适的示例。"
          type="info"
          showIcon
        />

        <Collapse defaultActiveKey={["0"]}>
          {examples.map((example, index) => (
            <Panel
              header={
                <Space>
                  {example.icon}
                  <Text strong>{example.title}</Text>
                </Space>
              }
              key={index.toString()}
            >
              <Paragraph>{example.description}</Paragraph>
              <pre style={codeStyle}>{example.code}</pre>
            </Panel>
          ))}
        </Collapse>

        <Divider />

        <Title level={4}>特性说明</Title>
        <List
          bordered
          dataSource={[
            "支持 4-9 人游戏（推荐 7 人局）",
            "完整的魔女化/残骸化机制",
            "信息隐藏：手牌、魔女化状态、结界等只对相关玩家可见",
            "自动补牌、手牌遗落分配",
            "投票监禁系统",
            "攻击名额限制（魔女杀手优先）",
          ]}
          renderItem={(item) => (
            <List.Item>
              <Text>✅ {item}</Text>
            </List.Item>
          )}
        />

        <Divider />

        <Title level={4}>相关链接</Title>
        <Space>
          <Link href="https://boardgame.io/documentation/" target="_blank">
            boardgame.io 文档
          </Link>
          <Divider orientation="vertical" />
          <Link href="#">原有引擎文档</Link>
        </Space>
      </Space>
    </Card>
  );
}

// ==================== 多人游戏示例（导出） ====================

/**
 * 多人游戏示例
 * 在同一页面显示多个玩家视角
 */
export function MultiplayerExample(): React.ReactElement {
  const playerIDs = ["0", "1", "2", "3", "4", "5", "6"];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            魔女审判 - 多人视角演示
          </Space>
        }
        extra={<Tag color="blue">7人局</Tag>}
      >
        <Alert
          title="演示说明"
          description="以下显示同一局游戏中不同玩家的视角。每个玩家只能看到自己的手牌和秘密信息。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]}>
          {playerIDs.map((id) => (
            <Col key={id} xs={24} sm={12} lg={8}>
              <Card
                title={`玩家 ${id}`}
                size="small"
                styles={{ body: { padding: 12 } }}
              >
                <div style={{ height: 400 }}>
                  <LocalMultiplayerGame playerID={id} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

// ==================== 导出说明 ====================

/**
 * 使用说明：
 *
 * 1. 基础用法（本地单人）：
 *    ```tsx
 *    import { LocalGame } from './example';
 *
 *    function App() {
 *      return <LocalGame playerID="0" />;
 *    }
 *    ```
 *
 * 2. 多人游戏（在线）：
 *    ```tsx
 *    import { OnlineGame } from './example';
 *
 *    function App() {
 *      // 需要启动 boardgame.io 服务器
 *      return <OnlineGame playerID={playerID} matchID={roomId} />;
 *    }
 *    ```
 *
 * 3. 自定义 Board：
 *    ```tsx
 *    import { Client } from 'boardgame.io/react';
 *    import { WitchTrialGame } from './index';
 *    import { MyCustomBoard } from './MyCustomBoard';
 *
 *    const Game = Client({
 *      game: WitchTrialGame,
 *      board: MyCustomBoard,
 *      numPlayers: 7,
 *    });
 *    ```
 *
 * 4. 使用 Hook：
 *    ```tsx
 *    import { useWitchTrial } from './index';
 *
 *    function MyBoard(props) {
 *      const game = useWitchTrial(props);
 *
 *      return (
 *        <div>
 *          <p>当前阶段: {game.phase}</p>
 *          <p>你的手牌: {game.mySecrets?.hand.length}张</p>
 *          <button onClick={() => game.pass()}>放弃</button>
 *        </div>
 *      );
 *    }
 *    ```
 *
 * 5. 自定义配置（通过 setupData）：
 *    ```tsx
 *    import { Client } from 'boardgame.io/react';
 *    import { WitchTrialGame } from './index';
 *
 *    const Game = Client({
 *      game: WitchTrialGame,
 *      board: MyBoard,
 *      numPlayers: 7,
 *    });
 *
 *    // 使用时传入配置
 *    function App() {
 *      return (
 *        <Game
 *          playerID="0"
 *          matchID="default"
 *        />
 *      );
 *    }
 *
 *    // 注意：boardgame.io 的 setupData 通过 match 创建时传入
 *    // 服务器端创建 match：
 *    // lobbyClient.createMatch('witch-trial', {
 *    //   numPlayers: 7,
 *    //   setupData: { config: { ... } }
 *    // });
 *    ```
 */
