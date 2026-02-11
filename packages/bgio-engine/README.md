# 魔女审判游戏引擎 - boardgame.io 版本

基于 [boardgame.io](https://boardgame.io/) 框架实现的魔女审判游戏引擎，复用原有游戏逻辑，提供更强大的多人联机支持。

## 特性

- ✅ **完整的游戏规则**：魔女化、残骸化、手牌遗落、攻击名额限制
- ✅ **信息隐藏**：通过 `playerView` 正确隐藏秘密信息
- ✅ **多人联机**：支持本地和在线多人游戏
- ✅ **React 集成**：提供完整的 React 组件和 Hooks
- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **可复用逻辑**：复用原有引擎的核心游戏逻辑
- ✅ **Tagged Union 消息系统**：类型安全的消息可见性控制

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
  chatMessages: TMessage[]; // 聊天消息（带可见性规则）
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
         ↓                                                                    ↑
    (游戏结束) ←─────────────────────────────────────────────────────────────┘
```

### 移动函数 (Moves)

- `useCard({ cardId, targetId? })` - 使用卡牌
- `vote({ targetId })` - 投票
- `pass()` - 放弃行动
- `endDay()` - 结束日间阶段
- `say({ content })` - 公开发言

## 消息系统 (TMessage)

### 设计原则

采用 **Tagged Union** 类型设计，每种消息类型自带可见性语义，通过 `kind` 字段区分：

```typescript
type TMessage =
  | AnnouncementMessage   // 公告（公开）
  | PublicActionMessage    // 公开行动（公开）
  | PrivateActionMessage    // 私密行动（仅行动者）
  | WitnessedActionMessage; // 见证行动（行动者+目标）
```

### 消息可见性规则

| Kind | 可见范围 | 说明 |
|------|----------|------|
| `announcement` | 所有玩家 | 系统公告、阶段转换、死亡列表 |
| `public_action` | 所有玩家 | 投票、弃权、公开发言 |
| `private_action` | 仅 actorId | 使用卡牌、攻击结果、魔女化、残骸化、结界、检定、探知结果 |
| `witnessed_action` | actorId + targetId | 卡牌分配（死亡遗落） |

### 使用 TMessageBuilder

```typescript
import { TMessageBuilder } from "./utils";

// ===== 1. 公告消息（所有人可见）=====
TMessageBuilder.createSystem("游戏开始");
TMessageBuilder.createPhaseTransition("day", "voting");
TMessageBuilder.createDeathList(["p2", "p3"]);
TMessageBuilder.createVoteSummary(votes, imprisonedId, isTie);

// ===== 2. 公开行动（所有人可见）=====
TMessageBuilder.createVote(actorId, targetId);  // 投票
TMessageBuilder.createPass(actorId);             // 弃权
TMessageBuilder.createSay(actorId, "content");    // 发言

// ===== 3. 私密行动（仅行动者可见）=====
TMessageBuilder.createUseCard(actorId, "detect", targetId);
TMessageBuilder.createAttackResult(actorId, targetId, "kill", "success");
TMessageBuilder.createTransformWitch(actorId);  // 魔女化
TMessageBuilder.createWreck(actorId);           // 残骸化
TMessageBuilder.createBarrierApplied(actorId, attackerId);  // 结界
TMessageBuilder.createCheckResult(actorId, targetId, true, "witch_killer");
TMessageBuilder.createDetectResult(actorId, targetId, 3, "detect");

// ===== 4. 见证行动（行动者+目标可见）=====
TMessageBuilder.createCardReceived(receiverId, victimId, cards);
```

### playerView 自动过滤

消息会根据 `kind` 自动过滤，无需手动管理可见性：

```typescript
const filterMessages = (messages: TMessage[], pid: string) => {
  if (pid === "0") return messages; // 调试模式：显示所有

  return messages.filter((msg) => {
    switch (msg.kind) {
      case "announcement":
      case "public_action":
        return true; // 公开消息
      case "private_action":
        return msg.actorId === pid; // 仅行动者可见
      case "witnessed_action":
        return msg.actorId === pid || msg.targetId === pid; // 行动者+目标可见
      default:
        return false;
    }
  });
};
```

### 添加新消息类型

1. 在 `types.ts` 定义新接口（设置 `kind`）
2. 在 `utils.ts` 添加 `TMessageBuilder` 方法
3. 更新 `filterMessages` 处理新 `kind`

## 信息隐藏

通过 `playerView` 函数过滤敏感信息：

```typescript
// 当前玩家只能看到自己的手牌
const mySecrets = G.secrets[playerID];

// 其他玩家的魔女化状态被隐藏（显示为存活）
const otherPlayer = G.players[otherId];
// otherPlayer.isWitch 对其他人总是 false
```

**调试模式**：玩家 ID 为 `"0"` 时可见所有秘密信息。

## 与原有引擎的区别

| 特性 | 原有引擎 | boardgame.io 版本 |
| ---- | ------- | ----------------- |
| 状态管理 | 自定义 Map | JSON 可序列化对象 |
| 多人联机 | Socket.IO 手动实现 | boardgame.io 内置 |
| 状态同步 | 手动实现 | 自动处理 |
| 秘密信息 | 手动过滤 | playerView 自动过滤 |
| 阶段控制 | 手动推进 | 自动/事件驱动 |
| 时间限制 | 手动实现 | 可结合 events |
| AI 支持 | 无 | 内置 AI 框架 |
| undo/redo | 手动实现 | 内置支持 |
| 消息系统 | 单一接口 + visibleTo | Tagged Union 类型安全 |

## 目录结构

```
packages/bgio-engine/
├── CLAUDE.md              # Claude Code 指导文件
├── README.md              # 本文件
├── src/
│   ├── index.ts           # 主入口
│   ├── types.ts           # 类型定义（TMessage, BGGameState等）
│   ├── utils.ts           # Selectors + TMessageBuilder
│   ├── game/
│   │   ├── index.ts       # WitchTrialGame 定义
│   │   ├── phases.ts      # 阶段配置
│   │   ├── moves.ts       # 移动函数
│   │   ├── resolution.ts  # 夜间结算逻辑
│   │   └── assertions.ts  # 业务断言
│   ├── components/        # React UI 组件
│   ├── hooks/             # React Hooks
│   ├── contexts/          # React Contexts
│   └── __tests__/         # 测试文件
│       ├── game.test.ts       # 核心游戏逻辑测试
│       └── visibility.test.ts # 消息可见性测试
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
- **消息系统**：重构为 Tagged Union 类型

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

## 测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/__tests__/visibility.test.ts
```

测试覆盖：
- 核心游戏逻辑（初始化、投票、夜间行动）
- 消息可见性规则（公开、私密、见证）
- 边界条件（不存在的玩家、空消息等）

**测试状态**：85 tests passing ✅

## 注意事项

1. **状态必须是纯对象**：不能使用 Map/Set/函数，boardgame.io 使用 Immer 进行状态更新
2. **秘密信息**：敏感信息必须存储在 `G.secrets[playerID]` 中，并通过 `playerView` 过滤
3. **随机数**：使用 `ctx.random` 而不是 `Math.random()`，确保可重放性
4. **客户端渲染**：boardgame.io Client 组件必须在客户端渲染（使用 `"use client"`）
5. **消息类型**：使用 `TMessageBuilder` 创建消息，不要直接构造对象

## 相关链接

- [boardgame.io 文档](https://boardgame.io/documentation/)
- [原有引擎文档](./src/legacy-core/README.md)
- [CLAUDE.md](./CLAUDE.md)
