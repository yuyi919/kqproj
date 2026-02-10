# 魔女审判游戏引擎 - 示例代码

本目录包含完整的游戏引擎使用示例。

## 示例列表

### 1. 命令行完整游戏示例 (`example.ts`)

展示一个完整的 7 人局游戏流程，包括：

```typescript
import { runCompleteGameExample, demonstrateInfoHiding } from "./examples";

// 运行完整游戏示例
runCompleteGameExample();

// 演示信息隐藏机制
demonstrateInfoHiding();
```

**特点：**

- 真实的游戏流程（日间 → 投票 → 夜间 → 结算）
- 信息隐藏机制展示（GM 视角 vs 玩家视角）
- 魔女化转变过程
- 残骸化判定
- 检定魔法揭示死法
- 手牌遗落分配

### 2. React 游戏组件 (`ReactGameExample.tsx`)

完整的 React 游戏界面组件，包含：

```typescript
import { GameRoom } from "./examples";

function App() {
  return <GameRoom roomId="room-001" playerId="player-1" />;
}
```

**功能：**

- 🎮 游戏大厅和初始化
- 👥 玩家列表（隐藏敏感信息）
- 🎴 手牌管理（仅自己可见）
- ☀️ 日间讨论界面
- 🗳️ 投票界面
- 🌙 夜间行动界面（含监禁提示）
- 🌅 晨间死亡公布
- 🧙 魔女化警告提示
- 📜 游戏日志

**信息隐藏实现：**

| 信息       | 可见性             |
| ---------- | ------------------ |
| 手牌内容   | 仅自己可见         |
| 手牌数量   | 隐藏               |
| 结界状态   | 仅自己可见         |
| 魔女化状态 | 隐藏（显示为存活） |
| 死法       | 需要通过检定魔法   |

## 快速开始

### 命令行测试

```bash
# 运行示例
npx ts-node src/lib/game-engine/example.ts
```

### React 集成

```typescript
"use client";

import { useGame } from "@/lib/game-engine/hooks/useGame";
import { GamePhase, CardType } from "@/lib/game-engine";

function MyGameComponent() {
  const game = useGame({
    roomId: "my-room",
    playerId: "player-1",
    onPhaseChange: (phase, round) => {
      console.log(`第${round}天 - ${phase}`);
    },
  });

  // 初始化游戏
  const startGame = () => {
    game.initialize(["p1", "p2", "p3", "p4", "p5", "p6", "p7"]);
  };

  // 使用卡牌
  const useKillCard = (targetId: string) => {
    const playerState = game.getPlayerState();
    const killCard = playerState?.player.hand.find(
      (c) => c.type === CardType.KILL,
    );
    if (killCard) {
      game.useCard(killCard.id, targetId);
    }
  };

  // 投票
  const vote = (targetId: string) => {
    game.vote(targetId);
  };

  return (
    <div>
      <h1>第 {game.currentRound} 天</h1>
      <p>阶段: {game.currentPhase}</p>
      {/* 更多UI... */}
    </div>
  );
}
```

## 关键概念

### 1. 阶段顺序

```
MORNING(晨间) → DAY(日间) → VOTING(投票) → NIGHT(夜间) → RESOLUTION(结算)
```

**注意：** 投票在夜间之前，让玩家知道谁被监禁后再决定行动。

### 2. 状态类型

```typescript
// 公开状态（所有玩家可见）
const publicState = engine.getPublicState();
// publicState.players['p1'].status // 存活/死亡（魔女化显示为存活）

// 玩家视角状态（仅自己可见完整信息）
const playerState = engine.getPlayerState("p1");
// playerState.player.hand // 完整手牌
// playerState.player.isWitch // 是否魔女化（仅自己知道）
// playerState.players['p2'].status // 其他玩家的公开状态
```

### 3. 魔女化规则

```typescript
// 1. 获得魔女杀手或使用杀人魔法成功击杀后魔女化
// 2. 魔女化后必须每回合击杀，否则残骸化
// 3. 连续2晚未击杀 → 残骸化死亡
```

### 4. 攻击名额

```typescript
// 每晚最多3个攻击名额
// 魔女杀手使用 → 杀人魔法剩2个名额
// 魔女杀手未使用 → 杀人魔法有3个名额
```

### 5. 检定魔法

```typescript
// 玩家默认不知道死法
// 使用检定魔法查验尸体才能知道：
// - 是否被魔女杀手击杀
// - 是否被杀人魔法击杀
// - 是否残骸化死亡
```

## 运行测试

```bash
# 类型检查
npx tsc --noEmit

# 运行示例（需要Node.js）
npx tsx src/lib/game-engine/example.ts
```
