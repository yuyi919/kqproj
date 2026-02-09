# BGIO Engine 单元测试

## 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/lib/bgio-engine/__tests__/utils.test.ts
bun test src/lib/bgio-engine/__tests__/game.test.ts

# 监视模式
bun test --watch
```

## 测试覆盖

### utils.test.ts (31 个测试)

#### Selectors 测试
- `getAlivePlayers` - 存活玩家列表获取
- `isPlayerAlive` - 存活状态判断
- `isPlayerWitch` - 魔女化状态判断
- `getPlayerHandCount` - 手牌数量计算
- `isWitchKillerHolder` - 魔女杀手持有者检查
- `computeVoteCounts` - 投票统计计算
- `hasPlayerVoted` - 投票状态检查
- `computeRemainingAttackQuota` - 攻击名额计算
- `isGameOver` - 游戏结束判断

#### Mutations 测试
- `addCardToHand` - 添加卡牌到手牌
- `addRevealedInfo` - 添加揭示信息
- `killPlayer` - 击杀玩家逻辑（含魔女杀手转移）

#### 工具函数测试
- `createCard` - 创建卡牌
- `createDeck` - 创建牌堆（使用 shuffle）
- `getCardDefinition` - 获取卡牌定义
- `getCardDefinitionByType` - 按类型获取定义
- `getCardTypeName` - 卡牌名称
- `getPhaseName` - 阶段名称

### game.test.ts (18 个测试)

#### Setup 测试
- 游戏状态初始化
- 手牌分配
- 魔女杀手持有者识别

#### 投票阶段测试
- 投票记录
- 更新投票
- 死亡玩家限制
- 投票结果计算
- 平票处理

#### 夜间阶段测试
- 结界魔法使用
- 魔女杀手持有者限制
- 监禁限制
- 死亡玩家限制
- 杀人魔法使用与魔女化

#### 游戏结束条件测试
- 单人生存结束
- 最大回合数结束
- 无获胜者情况

#### Player View 测试
- 秘密信息过滤
- 牌堆隐藏

## 类型安全设计

### Game.ts 结构

```typescript
// 类型定义
interface MoveContext { G, ctx, playerID, events, random }
interface PhaseHookContext { G, ctx, events, random }

// Move 函数 - 类型安全
const voteMove: Move<BGGameState> = ({ G, playerID }, targetId) => { ... }
const useCardMove: Move<BGGameState> = ({ G, playerID }, cardId, targetId) => { ... }

// Phase 配置 - 类型安全
const votingPhase: PhaseConfig<BGGameState> = {
  moves: { vote: voteMove, pass: passVoteMove },
  onBegin: ({ G }) => { ... },
  onEnd: ({ G }) => { ... },
}

// 游戏定义
export const WitchTrialGame: Game<BGGameState> = {
  setup: (...) => BGGameState,
  phases: { morning, day, voting, night, resolution },
  playerView: (...) => PublicGameState,
  endIf: (...) => GameOverResult | undefined,
}
```

### 测试辅助函数

测试中使用类型断言 (`as any`) 来简化 mock 对象的创建，避免 boardgame.io 复杂的内部类型问题：

```typescript
// 创建 mock 上下文
const createMockCtx = (playerIds: string[]) => ({ ... }) as any;
const createMoveContext = (G, playerId, phase) => ({ ... }) as any;

// 调用 move 函数
const result = voteMove(createMoveContext(G, "p1", "voting"), "p2");
```

## 测试原则

1. **使用 Mock 随机函数** - 确保测试可重复
2. **隔离测试** - 每个测试独立运行
3. **边界条件** - 测试异常和边界情况
4. **行为验证** - 验证状态变化而非实现细节
5. **类型安全** - 生产代码有完整类型，测试代码用断言简化
