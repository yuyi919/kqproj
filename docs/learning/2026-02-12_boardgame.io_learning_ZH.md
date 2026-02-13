# boardgame.io 学习笔记（中文）

**Date:** 2026-02-13
**Category:** refactoring
**Description:** 基于 Witch Trial 项目的完整文档学习和实践笔记

---

## 摘要

boardgame.io 是一个用于创建回合制游戏的 JavaScript 引擎。其核心设计理念是将游戏逻辑（`Game`）与渲染（`Client`）分离，提供自动状态同步、多人游戏支持和可扩展的插件系统。

学习到的关键概念：
- 状态管理：`G`（游戏状态）vs `ctx`（框架元数据）
- 阶段系统用于控制游戏流程
- 移动函数用于玩家操作
- 使用安全 API 生成随机数
- 玩家视图用于信息隐藏
- React 集成模式

---

## 详情

### 1. 核心概念

#### 状态 (`G` vs `ctx`)

boardgame.io 将游戏状态分为两部分：

| 类型 | 说明 | 可写性 |
|------|------|--------|
| **`G`** | 自定义游戏状态（棋盘、手牌、生命值等） | ✅ 可写 |
| **`ctx`** | 框架元数据（只读） | ❌ 只读 |

**ctx 属性：**
```typescript
interface GameContext {
  turn: number;          // 当前回合号
  currentPlayer: string; // 当前玩家ID
  phase: string;         // 当前阶段名
  numPlayers: number;    // 总玩家数
  playOrder: string[];   // 玩家顺序数组
  playOrderPos: number;  // 在 playOrder 中的位置
}
```

#### 游戏定义结构

```typescript
const MyGame = {
  name: "my-game",
  minPlayers: 2,
  maxPlayers: 8,

  setup: ({ ctx, random }) => { /* 初始化状态 */ },

  moves: { /* 玩家操作 */ },

  phases: { /* 阶段配置 */ },

  playerView: ({ G, playerID }) => { /* 过滤可见状态 */ },

  endIf: ({ G, ctx }) => { /* 游戏结束条件 */ },

  plugins: [ /* 扩展 */ ],
};
```

### 2. 阶段系统

阶段允许在不同游戏规则间切换（如"出价阶段"、"游戏阶段"）：

```typescript
const phaseConfigs = {
  [GamePhase.MORNING]: {
    start: true,              // 是否为起始阶段
    moves: { say: moveFunctions.say },
    next: GamePhase.DAY,      // 下一阶段

    turn: {
      order: TurnOrder.RESET,
      activePlayers: ActivePlayers.ALL,
    },

    onBegin: ({ G, events }) => { /* 进入阶段 */ },
    onEnd: ({ G, events }) => { /* 离开阶段 */ },
    endIf: ({ G }) => { /* 结束条件 */ },
  },
};
```

**阶段钩子：**

| 钩子 | 调用时机 | 用途 |
|------|----------|------|
| `onBegin` | 进入阶段时 | 初始化、设置计时器 |
| `onEnd` | 离开阶段时 | 结算、清理 |
| `endIf` | 每次移动后 | 检查是否结束阶段 |

**回合顺序选项：**
```typescript
turn: {
  order: TurnOrder.DEFAULT,  // 轮流顺序 (0, 1, 2...)
  order: TurnOrder.RESET,    // 每回合重置

  // 自定义顺序
  order: {
    first: ({ ctx }) => 0,
    next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
  },

  activePlayers: ActivePlayers.ALL,  // 所有玩家
  activePlayers: ActivePlayers.ONE,  // 仅当前玩家
}
```

### 3. 移动函数

基本结构：
```typescript
const moveFunctions = {
  moveName: ({ G, ctx, playerID, events, random }, ...args) => {
    // G - 游戏状态（可修改）
    // ctx - 框架上下文（只读）
    // playerID - 执行移动的玩家
    // events - 事件 API
    // random - 随机 API
  },
};
```

**返回值：**
- `undefined` - 移动成功
- `"INVALID_MOVE"` - 移动无效（不更新状态）

**移动包装器模式（Witch Trial）：**
```typescript
import { wrapMove } from "./wrapMove";

const vote = wrapMove(({ G, playerID }: MoveContext, targetId: string) => {
  assertPhase(G, GamePhase.NIGHT);
  const player = assertPlayerAlive(G, playerID);

  // 查找或创建投票
  const existingVote = Selectors.findExistingVote(G, playerID);
  if (existingVote) {
    existingVote.targetId = targetId;
  } else {
    G.currentVotes.push({
      voterId: playerID,
      targetId,
      round: G.round,
      timestamp: Date.now(),
    });
  }

  Mutations.msg(G, TMessageBuilder.createVote(playerID, targetId));
});
```

### 4. 事件 API

从 `events` 可用的事件：
```typescript
events.endTurn();           // 结束当前回合
events.endPhase();          // 结束当前阶段
events.setPhase("phase");   // 跳转到指定阶段
events.setTurn("turn");     // 跳转到指定回合
events.setActivePlayers({ all: "stageName" });  // 设置活跃玩家
```

### 5. 随机数生成

通过 `random` 参数访问：
```typescript
setup: ({ ctx, random }) => {
  const shuffled = random.Shuffle(cards);
  const die = random.Die(6);    // 1-6
  const number = random.Number();  // 0-1
}
```

**Random API 方法：**

| 方法 | 说明 |
|------|------|
| `random.Die(sides)` | 1 到 sides 之间的整数 |
| `random.Roll(sides)` | 同 Die |
| `random.Number()` | 0 到 1 之间的随机小数 |
| `random.Shuffle(array)` | 原地洗牌 |
| `random.Shuffle(array, count)` | 洗牌并返回前 count 个元素 |

### 6. 玩家视图（信息隐藏）

```typescript
playerView: ({ G, playerID }) => {
  const pid = playerID || "";

  const publicState: BGGameState = {
    ...G,
    // 隐藏敏感信息
    players: Selectors.computePublicPlayers(G),
    secrets: {},
    deck: [],
    chatMessages: Selectors.filterMessagesForPlayer(G.chatMessages, pid),
  };

  // 调试模式：显示所有信息
  if (playerID === "0") {
    publicState.secrets = G.secrets;
  } else if (G.secrets[playerID]) {
    publicState.secrets[playerID] = G.secrets[playerID];
  }

  return publicState;
}
```

### 7. React 集成

**创建 Client：**
```typescript
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';

const App = Client({
  game: WitchTrialGame,
  board: GameBoard,
  multiplayer: SocketIO({ server: 'localhost:8000' }),
  debug: true,
});
```

**Board Props：**
```typescript
interface BoardProps {
  G: BGGameState;
  ctx: any;
  moves: Record<string, Function>;
  playerID: string;
}
```

### 8. CQRS 模式（Witch Trial 项目）

**命令（写入）：** `game/moves.ts`
```typescript
const moveFunctions = {
  useCard: wrapMove(({ G, playerID }, cardId, targetId) => {
    G.nightActions.push({ ... });
    Mutations.msg(G, TMessageBuilder.createUseCard(...));
  }),
};
```

**查询（读取）：** `domain/queries/index.ts`
```typescript
export const Selectors = {
  computeVoteResult: (G: BGGameState) => { ... },
  isPlayerAlive: (G: BGGameState, playerId: string) => boolean,
  getAlivePlayers: (G: BGGameState) => PublicPlayerInfo[],
};
```

### 9. 消息系统（TMessage）

**消息类型与可见性：**

| 类型 | 可见性 | 示例 |
|------|--------|------|
| `announcement` | 所有玩家 | 系统消息、阶段转换 |
| `public_action` | 所有玩家 | 投票、公开声明 |
| `private_action` | 仅执行者 | 卡牌使用、攻击 |
| `witnessed_action` | 执行者+目标 | 卡牌分配 |

**消息构建器：**
```typescript
const TMessageBuilder = {
  createVote: (actorId: string, targetId: string) => ({
    id: nanoid(),
    kind: 'public_action',
    actorId,
    targetId,
    timestamp: Date.now(),
  }),

  createPrivateAction: (actorId: string, action: string) => ({
    id: nanoid(),
    kind: 'private_action',
    actorId,
    action,
    timestamp: Date.now(),
  }),
};
```

### 10. 阶段计时器模式

```typescript
const Mutations = {
  setPhaseTimer: (G: BGGameState, seconds: number) => {
    G.phaseStartTime = Date.now();
    G.phaseEndTime = Date.now() + seconds * 1000;
  },
};

// 在 endIf 中使用：
endIf({ G }) {
  return G.status === GamePhase.MORNING && G.phaseEndTime <= Date.now();
}
```

---

## 关键决策

1. **使用 `wrapMove` 包装器** - 集中断言检查和日志记录
2. **实现 CQRS 模式** - 分离命令（移动）和查询（选择器）
3. **类型安全的游戏阶段** - 使用 `GamePhase` 枚举而非字符串字面量
4. **玩家视图过滤** - 基于玩家 ID 自动信息隐藏
5. **消息可见性系统** - TMessage 类型控制谁能看到什么

---

## 修改的文件

- `packages/bgio-engine/src/game/index.ts` - 主游戏定义
- `packages/bgio-engine/src/game/moves.ts` - 移动函数
- `packages/bgio-engine/src/game/phases.ts` - 阶段配置
- `packages/bgio-engine/src/utils.ts` - 选择器和工具
- `packages/bgio-engine/src/types.ts` - 类型定义

---

## 验证

1. **运行测试：**
   ```bash
   bun test packages/bgio-engine/src/__tests__/game.test.ts
   ```

2. **检查类型安全：**
   ```bash
   pnpm --filter @whole-ends-kneel/bgio-engine type-check
   ```

3. **测试游戏流程：**
   - 启动开发服务器
   - 创建游戏房间
   - 验证阶段转换
   - 测试所有移动函数

---

## 相关文档

- [boardgame.io 官方文档](https://boardgame.io/docs)
- [packages/bgio-engine/CLAUDE.md](../../packages/bgio-engine/CLAUDE.md)
- [Witch Trial 游戏规则](../../docs/rule.md)
