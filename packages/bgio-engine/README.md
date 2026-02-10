# 魔女审判游戏引擎 - boardgame.io 版本

基于 [boardgame.io](https://boardgame.io/) 框架实现的魔女审判游戏引擎，复用原有游戏逻辑，提供更强大的多人联机支持。

## 特性

- ✅ **完整的游戏规则**：魔女化、残骸化、手牌遗落、攻击名额限制
- ✅ **信息隐藏**：通过 `playerView` 正确隐藏秘密信息
- ✅ **多人联机**：支持本地和在线多人游戏
- ✅ **React 集成**：提供完整的 React 组件和 Hooks
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **可复用逻辑**：复用原有引擎的核心游戏逻辑

## 安装

```bash
# boardgame.io 已作为依赖包含在项目中
pnpm add boardgame.io
```

## 快速开始

### 1. 基础用法（本地游戏）

```tsx
"use client";

import { Client } from "boardgame.io/react";
import { Local } from "boardgame.io/multiplayer";
import { WitchTrialGame, WitchTrialBoard } from "@whole-ends-kneel/bgio-engine";

const Game = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  numPlayers: 7,
  multiplayer: Local(),
});

export default function Page() {
  return <Game playerID="0" />;
}
```

### 2. 在线多人游戏

```tsx
"use client";

import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { WitchTrialGame, WitchTrialBoard } from "@whole-ends-kneel/bgio-engine";

const Game = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  multiplayer: SocketIO({ server: "localhost:8000" }),
});

export default function Page() {
  const [playerID, setPlayerID] = useState<string | null>(null);
  const [matchID, setMatchID] = useState("default");

  return <Game playerID={playerID} matchID={matchID} />;
}
```

### 3. 使用 Hook 自定义界面

```tsx
"use client";

import { useWitchTrial } from "@whole-ends-kneel/bgio-engine";

function CustomBoard(props) {
  const game = useWitchTrial(props);

  return (
    <div>
      <header>
        <h1>
          第 {game.round} 天 - {game.phase}
        </h1>
        {game.isWitch && <span>🧙‍♀️ 你是魔女</span>}
      </header>

      <main>
        {/* 玩家列表 */}
        <div className="players">
          {game.alivePlayers.map((p) => (
            <div key={p.id}>玩家 {p.seatNumber} 号</div>
          ))}
        </div>

        {/* 手牌 */}
        <div className="hand">
          {game.mySecrets?.hand.map((card) => (
            <button
              key={card.id}
              onClick={() => game.useCard(card.id, targetId)}
              disabled={!game.canUseCard(card)}
            >
              {card.name}
            </button>
          ))}
        </div>

        {/* 行动按钮 */}
        {!game.hasActed && <button onClick={() => game.pass()}>放弃</button>}
      </main>
    </div>
  );
}
```

## 核心概念

### 游戏状态 (G)

```typescript
interface BGGameState {
  id: string;
  roomId: string;
  status: GamePhase; // 当前阶段
  round: number; // 当前回合（第几天）
  players: Record<string, PublicPlayerInfo>; // 玩家公开状态
  secrets: Record<string, PrivatePlayerInfo>; // 秘密信息（只有对应玩家可见）
  deck: CardRef[]; // 牌堆
  discardPile: CardRef[]; // 弃牌堆
  currentActions: Record<string, PlayerAction>; // 当前行动
  currentVotes: Vote[]; // 当前投票
  deathLog: DeathRecord[]; // 死亡记录
  imprisonedId: string | null; // 被监禁玩家
  attackQuota: {
    witchKillerUsed: boolean;
    killMagicUsed: number;
  };
  config: GameConfig;
}
```

### 阶段流程

```
MORNING(晨间) → DAY(日间) → VOTING(投票) → NIGHT(夜间) → RESOLUTION(结算) → MORNING(下一回合)
```

### 移动函数 (Moves)

- `useCard({ cardId, targetId? })` - 使用卡牌
- `vote({ targetId })` - 投票
- `pass()` - 放弃行动
- `endDay()` - 结束日间阶段

### 信息隐藏

通过 `playerView` 函数过滤敏感信息：

```typescript
// 当前玩家只能看到自己的手牌
const mySecrets = G.secrets[playerID];

// 其他玩家的魔女化状态被隐藏（显示为存活）
const otherPlayer = G.players[otherId];
// otherPlayer.isWitch 对其他人总是 false
```

## 与原有引擎的区别

| 特性      | 原有引擎           | boardgame.io 版本   |
| --------- | ------------------ | ------------------- |
| 状态管理  | 自定义 Map         | JSON 可序列化对象   |
| 多人联机  | Socket.IO 手动实现 | boardgame.io 内置   |
| 状态同步  | 手动实现           | 自动处理            |
| 秘密信息  | 手动过滤           | playerView 自动过滤 |
| 阶段控制  | 手动推进           | 自动/事件驱动       |
| 时间限制  | 手动实现           | 可结合 events       |
| AI 支持   | 无                 | 内置 AI 框架        |
| undo/redo | 手动实现           | 内置支持            |

## 目录结构

```
src/
├── index.ts              # 主入口
├── types.ts              # 类型定义
├── utils.ts              # 工具函数
├── game/                 # Game 核心逻辑
│   ├── index.ts          # WitchTrialGame 定义
│   ├── phases.ts         # 阶段配置
│   ├── moves.ts          # 移动函数
│   ├── resolution.ts     # 夜间结算逻辑
│   └── assertions.ts     # 业务断言
├── components/           # UI 组件
│   ├── Board.tsx         # 主游戏面板
│   ├── ui/               # 基础 UI 元素
│   └── ...               # 其他面板
├── hooks/                # React Hooks
├── contexts/             # React Contexts
└── example.tsx           # 使用示例
```

## 复用的原有逻辑

以下模块从原有引擎复用：

- **类型定义**：`CardType`, `PlayerStatus`, `GamePhase`, `DeathCause` 等
- **工具函数**：`getCardTypeName`, `getPhaseName`, `getPlayerStatusName` 等
- **游戏逻辑**：卡牌效果、魔女化判定、残骸化检查、死亡处理等

适配的模块：

- **状态管理**：Map → 普通对象，适应 boardgame.io 的 JSON 序列化要求
- **秘密信息**：使用 `playerView` 实现信息隐藏
- **阶段控制**：使用 boardgame.io 的 phases 系统

## 高级用法

### 自定义游戏配置

```typescript
const Game = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  numPlayers: 7,
  setupData: {
    config: {
      maxPlayers: 7,
      maxRounds: 7,
      dayDuration: 300,
      nightDuration: 60,
      votingDuration: 30,
      cardPool: {
        witch_killer: 1,
        barrier: 15,
        detect: 5,
        check: 4,
        kill: 3,
      },
    },
  },
});
```

### 添加 AI

```typescript
import { AI } from "boardgame.io/ai";

const Game = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  ai: AI({
    enumerate: (G, ctx) => {
      // 返回 AI 可能的行动
      const moves = [];
      // ... 根据游戏状态生成可能的移动
      return moves;
    },
  }),
});
```

### 调试

```typescript
const Game = Client({
  game: WitchTrialGame,
  board: WitchTrialBoard,
  debug: true, // 启用调试面板
});
```

## 注意事项

1. **状态必须是纯对象**：不能使用 Map/Set/函数，boardgame.io 使用 Immer 进行状态更新
2. **秘密信息**：敏感信息必须存储在 `G.secrets[playerID]` 中，并通过 `playerView` 过滤
3. **随机数**：使用 `ctx.random` 而不是 `Math.random()`，确保可重放性
4. **客户端渲染**：boardgame.io Client 组件必须在客户端渲染（使用 'use client'）

## 相关链接

- [boardgame.io 文档](https://boardgame.io/documentation/)
- [原有引擎文档](../game-engine/README.md)
