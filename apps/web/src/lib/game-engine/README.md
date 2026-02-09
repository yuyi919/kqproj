# 魔女审判游戏引擎 (Witch Trial Game Engine)

基于 TypeScript 实现的魔女审判（魔女生存/审判游戏）完整游戏逻辑引擎。

## 特性

- ✅ 完整的游戏规则实现（卡牌系统、魔女化、残骸化、监禁投票）
- ✅ 严格的阶段管理（晨间/日间/夜间/投票/结算）
- ✅ 攻击名额限制（魔女杀手优先，杀人魔法限3次）
- ✅ 手牌遗落分配系统
- ✅ 事件驱动架构
- ✅ **类型安全的状态查询**（区分公开/私有信息）
- ✅ **严格的信息隐藏**（手牌、结界、魔女化、死法均为保密信息）
- ✅ React Hook 集成

## 快速开始

### 基础用法

```typescript
import { GameEngine, createEngine, SEVEN_PLAYER_CONFIG } from './index';

// 创建游戏引擎
const engine = createEngine('room-123', {
  config: SEVEN_PLAYER_CONFIG,
  onPhaseChange: (phase, round) => {
    console.log(`Phase changed to ${phase}, round ${round}`);
  },
});

// 初始化游戏（7人局）
const playerIds = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace'];
engine.initialize(playerIds);

// 游戏会自动进入准备阶段，然后进入第一天的晨间
```

### 玩家行动

```typescript
// 获取玩家状态（类型安全）
const myState = engine.getPlayerState('alice');

// 使用卡牌
const killCard = myState.player.hand.find(c => c.type === CardType.KILL);
if (killCard) {
  engine.useCard({
    playerId: 'alice',
    cardId: 'card-id',  // 使用实际卡牌ID
    targetId: 'bob',
  });
}

// 投票
engine.vote({
  voterId: 'alice',
  targetId: 'bob',
});

// 放弃行动
engine.pass({ playerId: 'alice' });
```

### 阶段控制

游戏阶段顺序：**DAY(日间讨论) → VOTING(投票) → NIGHT(夜间行动) → RESOLUTION(结算)**

```typescript
// 推进到下一阶段
engine.advancePhase();

// 检查是否可以推进
if (engine.canAdvancePhase()) {
  engine.advancePhase();
}

// 为未行动的玩家自动弃权（时间到时）
engine.autoPass();

// 强制结算回合
engine.forceResolveTurn();
```

**重要**：玩家先投票决定监禁对象，然后进入夜间行动阶段。被监禁的玩家无法使用手牌，其他玩家可以根据投票结果来决定自己的行动策略。

## 信息隐藏机制

游戏引擎严格区分**公开信息**和**私有信息**，确保游戏策略性：

### 公开信息（所有玩家可见）

```typescript
interface PublicPlayerInfo {
  id: string;
  seatNumber: number;
  status: PlayerStatus;  // 存活/死亡/残骸化（魔女化显示为ALIVE）
}
```

- ✅ 座位号
- ✅ 是否存活/死亡/残骸化
- ❌ 魔女化状态（显示为存活）
- ❌ 手牌数量
- ❌ 是否有结界

### 私有信息（仅自己可见）

```typescript
interface PrivatePlayerInfo {
  // ...公开信息
  hand: PublicCardInfo[];      // 完整手牌
  isWitch: boolean;            // 是否魔女化
  witchKillerHolder: boolean;  // 是否持有魔女杀手
  hasBarrier: boolean;         // 是否有结界
  deathCause?: DeathCause;     // 死因（若已死亡）
  killerId?: string;           // 击杀者（若已死亡）
}
```

### 死法保密

玩家默认**无法知道**死者是如何死亡的：
- 被魔女杀手击杀？
- 被杀人魔法击杀？
- 残骸化死亡？

只有通过**检定魔法**查验尸体才能知道死因。

### 获取状态

```typescript
// 获取公开状态（发送给所有客户端）
const publicState = engine.getPublicState();

// 获取特定玩家的视角状态（仅发送给该玩家）
const playerState = engine.getPlayerState('alice');
// playerState.player 包含完整私有信息
// playerState.players 包含所有玩家的公开信息
```

### 在 React 中使用

```typescript
import { useGame } from './hooks/useGame';

function GameRoom({ roomId, playerId }: { roomId: string; playerId: string }) {
  const game = useGame({
    roomId,
    playerId,
    onPhaseChange: (phase, round) => {
      // 处理阶段变更
    },
    onEvent: (event) => {
      // 处理游戏事件
    },
  });

  if (!game.isInitialized) {
    return <div>等待游戏开始...</div>;
  }

  return (
    <div>
      <h1>第 {game.currentRound} 天 - {game.currentPhase}</h1>
      
      {game.currentPhase === 'night' && (
        <NightPhase 
          playerState={game.getPlayerState()}
          onUseCard={game.useCard}
          onPass={game.pass}
        />
      )}
      
      {game.currentPhase === 'voting' && (
        <VotingPhase 
          onVote={game.vote}
        />
      )}
    </div>
  );
}
```

## 游戏规则

### 卡牌类型

| 卡牌 | 数量 | 消耗 | 优先级 | 效果 |
|------|------|------|--------|------|
| 魔女杀手 | 1 | 否 | 100 | 对目标发动攻击（最高优先级），持有者魔女化 |
| 探知魔法 | 若干 | 是 | 90 | 探知目标手牌总数并随机获悉其中一张 |
| 杀人魔法 | 若干 | 是 | 80 | 对目标发动攻击，成功击杀后魔女化 |
| 结界魔法 | 约人数×2 | 是 | 50 | 保护自身当夜免受攻击 |
| 检定魔法 | 若干 | 是 | 10 | 查验已死亡玩家的死因 |

### 攻击上限

- **魔女杀手不发动攻击**：当晚最多3个杀人魔法攻击名额
- **魔女杀手发动攻击**：当晚最多2个杀人魔法攻击名额

### 魔女化与残骸化

- **魔女化**：持有【魔女杀手】或使用【杀人魔法】成功击杀后获得
- **残骸化**：魔女化后连续2夜未击杀则残骸化死亡
- **魔女杀手转移**：
  - 残骸化死亡：随机分配给存活玩家
  - 被杀人魔法击杀：转移给击杀者

### 手牌遗落

死者手牌由击杀者/尸体第一发现者优先分配，其余随机分配给其他存活玩家。

## 模块结构

```
game-engine/
├── index.ts           # 引擎入口，导出 GameEngine 类
├── types/             # 类型定义
│   └── index.ts       # GamePhase, CardType, Player 等
├── cards/             # 卡牌系统
│   └── index.ts       # 创建、洗牌、手牌管理
├── player/            # 玩家系统
│   └── index.ts       # 状态、魔女化、死亡处理
├── state/             # 游戏状态
│   └── index.ts       # 状态管理、回合控制
├── phases/            # 阶段管理
│   └── index.ts       # 阶段转换逻辑
├── actions/           # 行动处理
│   └── index.ts       # 验证与处理玩家行动
├── resolution/        # 结算系统
│   └── index.ts       # 攻击、投票结算
├── utils/             # 工具函数
│   └── index.ts       # 卡牌名称、阶段名称等
├── hooks/             # React Hooks
│   └── useGame.ts     # useGame Hook
└── example.ts         # 使用示例
```

## API 文档

### GameEngine

#### 构造函数

```typescript
new GameEngine(roomId: string, options?: GameEngineOptions)

interface GameEngineOptions {
  config?: GameConfig;                    // 游戏配置
  onPhaseChange?: (phase: GamePhase, round: number) => void;
  onEvent?: (event: GameEvent) => void;
  onError?: (error: GameError) => void;
}
```

#### 方法

| 方法 | 说明 |
|------|------|
| `initialize(playerIds: string[]): GameState` | 初始化游戏 |
| `useCard(params: UseCardParams): PlayerAction` | 使用卡牌 |
| `vote(params: VoteParams): Vote` | 投票 |
| `pass(params: PassParams): PlayerAction` | 放弃行动 |
| `advancePhase(): PhaseResult` | 推进到下一阶段 |
| `canAdvancePhase(): boolean` | 检查是否可以推进 |
| `autoPass(): PlayerAction[]` | 自动弃权 |
| `getState(): GameState` | 获取完整状态（仅服务端使用） |
| `getPublicState(): PublicGameState` | 获取公开状态（类型安全） |
| `getPlayerState(playerId: string): PlayerViewState` | 获取特定玩家视角状态 |

### 配置

```typescript
// 七人局推荐配置
const SEVEN_PLAYER_CONFIG: GameConfig = {
  maxPlayers: 7,
  maxRounds: 7,
  dayDuration: 300,      // 5分钟
  nightDuration: 60,     // 1分钟
  votingDuration: 30,    // 30秒
  cardPool: {
    witch_killer: 1,
    barrier: 15,
    detect: 5,
    check: 4,
    kill: 3,
  },
};
```

## 事件系统

游戏引擎通过事件通知外部状态变化：

```typescript
engine.on('phase_change', ({ phase, round }) => {
  console.log(`进入${phase}，第${round}天`);
});

engine.on('action', ({ type, result }) => {
  console.log(`玩家行动: ${type}`, result);
});

engine.on('game_end', (result) => {
  console.log('游戏结束', result);
});
```

### 内置事件类型

| 事件 | 说明 |
|------|------|
| `phase_change` | 阶段变更 |
| `action` | 玩家行动 |
| `vote` | 投票 |
| `game_end` | 游戏结束 |
| `initialized` | 游戏初始化完成 |
| `turn_resolved` | 回合结算完成 |

## 错误处理

游戏引擎使用自定义错误类型：

```typescript
import { GameError, GameErrorCode } from './types';

try {
  engine.useCard({ playerId, cardId, targetId });
} catch (error) {
  if (error instanceof GameError) {
    switch (error.code) {
      case GameErrorCode.INVALID_PHASE:
        console.log('当前阶段无法使用该卡牌');
        break;
      case GameErrorCode.CARD_NOT_FOUND:
        console.log('手牌中没有这张卡');
        break;
      case GameErrorCode.ATTACK_QUOTA_FULL:
        console.log('攻击名额已满');
        break;
    }
  }
}
```

## 测试

```typescript
// 运行示例游戏
import { runGameExample } from './example';
runGameExample();

// 快速开始测试
import { quickStart } from './example';
const engine = quickStart(7); // 7人局
```

## 示例代码

完整的示例代码位于 `examples/` 目录：

### 1. 命令行完整游戏示例

```typescript
import { runCompleteGameExample, demonstrateInfoHiding } from './examples';

// 运行完整的7人局游戏示例
runCompleteGameExample();

// 演示信息隐藏机制
// 展示GM视角 vs 玩家视角的信息差异
demonstrateInfoHiding();
```

### 2. React 游戏组件

```typescript
import { GameRoom } from './examples';

function App() {
  return (
    <GameRoom 
      roomId="room-001" 
      playerId="player-1" 
    />
  );
}
```

包含完整的游戏UI：
- 游戏大厅
- 玩家列表（隐藏敏感信息）
- 手牌管理
- 投票界面
- 夜间行动
- 晨间死亡公布

## 许可证

MIT
