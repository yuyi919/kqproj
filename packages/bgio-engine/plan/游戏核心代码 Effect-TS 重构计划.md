# 游戏核心代码 Effect-TS 重构计划

## 背景与目标

### 问题背景

游戏核心代码 (`packages/bgio-engine/src/game/`) 存在以下问题：
- **phase2-attack.ts (355行)**: 嵌套深度6+层，评估与执行逻辑混合
- **moves.ts (553行)**: 9+个move函数，断言调用模式重复
- **类型安全不足**: 使用原始string类型，错误处理通过异常实现
- **测试困难**: 复杂状态转换难以单元测试

### 目标

1. **引入 Effect-TS** - 服务层架构、类型安全错误、Layer依赖注入
2. **分层架构** - 评估层（纯函数）+ 执行层（副作用）
3. **完整测试覆盖** - TDD模式，关键路径100%覆盖
4. **术语对齐** - 基于规则文档确保术语沟通正确

---

## 用户确认的约束

| 选择 | 选项 |
|------|------|
| 重构范围 | **中等范围** - phase2-attack.ts + moves.ts |
| 测试策略 | **测试先行 (TDD)** - 先写测试，再重构 |
| 技术选型 | **Effect-TS** - 强制使用 |
| 时间预算 | **3-5天** - 完整重构，包含全面测试 |

---

## 项目当前状态

### 已确认状态

| 项目 | 状态 |
|------|------|
| es-toolkit | ✅ 已安装 (v1.44.0) |
| effect | ✅ 已安装 (v3.19.16) |
| Bun test | ✅ 已配置 |
| DDD 架构 | ✅ 已存在 domain/services/ |
| 测试文件 | ✅ 已存在多个测试文件 |

### 现有目录结构

```
packages/bgio-engine/src/
├── domain/services/
│   ├── cardService.ts    # 卡牌服务（纯函数，可复用）
│   └── messageBuilder.ts # 消息构建器（纯函数，可复用）
├── game/
│   ├── assertions.ts     # 断言函数（需重构）
│   ├── moves.ts          # Move 函数（目标文件）
│   └── resolution/
│       ├── phase2-attack.ts  # 目标文件
│       └── ...
└── types/
    ├── core.ts           # 基础类型 (string union)
    └── ...
```

---

## 核心术语对照表（基于规则文档，与现有代码一致）

| 规则术语 | 代码类型 | Effect-TS 表示 |
|---------|---------|---------------|
| 魔女杀手 | CardType | `"witch_killer"` |
| 杀人魔法 | CardType | `"kill"` |
| 结界魔法 | CardType | `"barrier"` |
| 探知魔法 | CardType | `"detect"` |
| 检定魔法 | CardType | `"check"` |
| 魔女化 | ActionFailureReason | `"witch_transform"` |
| 残骸化死亡 | ActionFailureReason | `"wreck"` |
| 攻击上限超限 | ActionFailureReason | `"quota_exceeded"` |
| 目标有结界 | ActionFailureReason | `"barrier_protected"` |
| 攻击者已死亡 | ActionFailureReason | `"actor_dead"` |
| 玩家不存在 | ActionFailureReason | `"player_not_found"` |

---

## 第二轮专家会议纪要

### 1. fp-refactor-expert: 渐进式迁移策略

**推荐方案**：B) 先用 Branded Types 改善现有代码，再逐步迁移到 Effect-TS

| 迁移阶段 | 内容 | 风险 |
|---------|------|------|
| Phase 1 | Branded Types（无需新依赖） | 低 |
| Phase 2 | effect/DataStructures（Option, Either） | 中 |
| Phase 3 | Layer + Service（完整迁移） | 中 |

**可复用组件**：
- `domain/services/cardService.ts` - 纯工厂函数
- `domain/services/messageBuilder.ts` - 纯函数

**需重构组件**：
- `game/assertions.ts` - 改用 `Either<GameLogicError, T>`

**预期收益**：
| 文件 | 当前行数 | 预计重构后 | 减少比例 |
|------|----------|------------|----------|
| phase2-attack.ts | 355 | 180 | **49%** |
| moves.ts | 553 | 300 | **46%** |
| assertions.ts | 160 | 80 | **50%** |

---

### 2. domain-modeling-expert: 类型与错误建模

**Branded Types 建议**（选择性迁移）：
```typescript
// 推荐迁移
type PlayerId = Brand.Branded<string, "PlayerId">;
type CardId = Brand.Branded<string, "CardId">;

// 保持现状
type PlayerStatus = "alive" | "dead" | "witch" | "wreck";
type CardType = "witch_killer" | "barrier" | "kill" | "detect" | "check";
```

**TaggedError 设计**（使用 Data.TaggedError）：

**修改说明 (2026-02-14)**:
> 内部错误处理使用 `Data.TaggedError`，无需 Schema 校验开销

```typescript
import { Data } from "effect"

// 攻击结算错误 - 使用 Data.TaggedError
export class ActorDeadError extends Data.TaggedError("ActorDeadError")<{
  readonly actorId: string;
}> {}

export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  readonly current: number;
  readonly max: number;
  readonly cardType: string;
}> {}

export class BarrierProtectedError extends Data.TaggedError("BarrierProtectedError")<{
  readonly targetId: string;
  readonly attackerId: string;
}> {}

export class TargetAlreadyDeadError extends Data.TaggedError("TargetAlreadyDeadError")<{
  readonly targetId: string;
}> {}

export class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  readonly playerId: string;
}> {}

// 联合类型作为错误类型
export type AttackError =
  | ActorDeadError
  | QuotaExceededError
  | BarrierProtectedError
  | TargetAlreadyDeadError;
```

**Branded Types 设计**（使用 Brand.nominal）：

**修改说明 (2026-02-14)**:
> 内部 API 使用 `Brand.nominal()`，无运行时开销

```typescript
import { Brand } from "effect"

// 推荐：使用 Brand.nominal（无运行时开销）
export type PlayerId = Brand.Branded<string, "PlayerId">;
export const PlayerId = Brand.nominal<PlayerId>();

export type CardId = Brand.Branded<string, "CardId">;
export const CardId = Brand.nominal<CardId>();

// 工厂函数
export function makePlayerId(id: string): PlayerId {
  return PlayerId(id);
}

export function isPlayerId(id: unknown): id is PlayerId {
  return typeof id === "string";
}

// 保持现状
type PlayerStatus = "alive" | "dead" | "witch" | "wreck";
type CardType = "witch_killer" | "barrier" | "kill" | "detect" | "check";
```

**GamePhase 建议**：保持 Enum + ADT 模式匹配
```typescript
// 推荐：Enum + 模式匹配函数
export function match<A>(patterns: { [K in GamePhase["_tag"]]: ... }): (phase: GamePhase) => A
```

**Schema 建议**：使用 Effect-TS Schema（而非 Zod）

---

### 3. test-generator: 测试策略

**测试目录结构**（与源文件共存模式）：
```
packages/bgio-engine/src/
├── game/
│   ├── assertions.ts           # 源文件
│   └── assertions.test.ts      # 测试文件
├── effect/
│   ├── services/
│   │   ├── attackResolution.ts   # 源文件
│   │   └── attackResolution.test.ts  # 测试文件
│   └── layers/
│       ├── live.ts
│       └── test.ts
└── test-helpers.ts
```

> **原则**: 每个源文件对应 `.test.ts` 测试文件，保持代码与测试的关联性。

**Live/Test Layer 示例**：
```typescript
// 测试 Layer
export const AttackContextTest = Layer.succeed(
  AttackResolutionService,
  {
    resolveAttack: (context, attackerId, targetId, cardType) => {
      // 默认所有攻击成功
      return Effect.succeed({ success: true, consumed: true });
    },
  }
);

// 变体：配额耗尽
export const AttackContextExhaustedQuota = Layer.succeed(
  AttackResolutionService,
  {
    resolveAttack: (context, attackerId, targetId, cardType) => {
      if (context.killMagicUsed >= context.maxQuota) {
        return Effect.succeed({ success: false, failureReason: "quota_exceeded" });
      }
      return Effect.succeed({ success: true, consumed: true });
    },
  }
);
```

**Bun Test 集成工具**（Effect 3.x）：
```typescript
import { Effect, Layer, Exit } from "effect";
import { describe, it, expect } from "bun:test";

// 测试工具：运行 Effect 并返回 Exit
export async function runEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R>
): Promise<Exit.Exit<A, E>> {
  return Effect.exit(effect.pipe(Effect.provide(layer)));
}

// 测试工具：断言成功
export function expectSuccess<A, E>(exit: Exit.Exit<A, E>): A {
  if (Exit.isFailure(exit)) {
    throw new Error(`Effect failed: ${JSON.stringify(exit.cause)}`);
  }
  return exit.value;
}

// 测试工具：断言失败并返回错误
export function expectFailure<E, A>(exit: Exit.Exit<A, E>): E {
  if (Exit.isSuccess(exit)) {
    throw new Error(`Expected failure but got success`);
  }
  return exit.error;
}

// 测试工具：构建 Mock Layer
export function makeMockLayer<T, R>(
  tag: Context.Tag<T, R>,
  impl: T
): Layer.Layer<R> {
  return Layer.succeed(tag, impl);
}
```

**完整测试示例**：
```typescript
describe("AttackResolution", () => {
  const MockPlayerState = PlayerStateService.of({
    getPlayer: () => Effect.succeed({ id: "p1", status: "alive" }),
    isAlive: () => Effect.succeed(true),
  });

  it("should resolve witch_killer attack", async () => {
    const result = await runEffect(
      Effect.gen(function* () {
        const player = yield* PlayerStateService;
        return player;
      }),
      MockPlayerState
    );
    expect(result.id).toBe("p1");
  });
});
```

**调整后覆盖率目标**：
| 模块 | 原始目标 | 调整后目标 | 理由 |
|------|---------|-----------|------|
| AttackResolutionService | 100% | **100%** | 核心业务，错误成本高 |
| PlayerStateService | 95% | **90%** | 部分状态通过副作用完成 |
| CardService | 90% | **85%** | 工厂函数简单 |
| move 断言 | 85% | **80%** | 边界场景由集成测试覆盖 |
| 优先级计算 | - | **95%** | 新模块需全面覆盖 |
| moves.ts | - | **80%** | 重构后目标 |
| 集成测试 | - | **90%** | 关键路径端到端验证 |

**补充集成测试场景**：
| 序号 | 测试场景 | 验证点 |
|------|---------|--------|
| 11 | barrier 防御 witch_killer | barrier 优先级高于 witch_killer |
| 12 | witch_killer 转移 | 击杀持有者时卡片转移逻辑 |
| 13 | 配额计算 | barrier 使用是否消耗配额 |

---

### 4. game-engine-specialist: 游戏机制审核

**规则一致性审查**：✅ 当前代码覆盖完整

| 规则 | 状态 |
|------|------|
| 魔女杀手优先结算 | ✅ 一致 |
| 无 witch_killer 时 kill 配额 3 | ✅ 一致 |
| 有 witch_killer 时 kill 配额 2 | ✅ 一致 |
| 击杀触发魔女化 | ✅ 一致 |
| 连续两回合未击杀触发残骸化 | ✅ 一致 |

**边界情况清单**：
1. 循环击杀链 (Cyclical Kill Chain)
2. 配额计算时机（barrier 防御是否消耗配额）
3. barrier 与 witch_killer 优先级交互
4. 连续未击杀的计时器重置
5. 攻击无目标玩家

**moves.ts 拆分建议**：
| Move 函数 | 建议 |
|---------|------|
| vote, pass | ⬅️ 保持在一起 |
| useCard, passNight | 🔄 cardActions.ts |
| initiateTrade, respondTrade, cancelTrade | 🔄 trading/ |
| selectDroppedCard, skipCardSelection | 🔄 cardSelection/ |
| say | ⬅️ 保持原样 |

**集成测试 Top 11**：
1. witch_killer 优先级覆盖 kill
2. 无 witch_killer 时 kill 配额 3
3. 有 witch_killer 时 kill 配额 2
4. witch_killer 成功后持有者受保护
5. **barrier 防御 witch_killer** ← barrier 优先级最高
6. kill witch_killer 持有者获得 witch_killer
7. 击杀触发魔女化
8. 连续两回合未击杀触发残骸化
9. barrier 防御 kill
10. 循环击杀链
11. 配额耗尽时攻击失败

---

## 架构设计

### 目录结构

```
packages/bgio-engine/src/
├── effect/                    # Effect-TS 核心模块
│   ├── services/              # 服务层
│   │   ├── attackResolution.ts  # 攻击结算服务
│   │   ├── playerState.ts      # 玩家状态服务
│   │   └── priority.ts        # 优先级计算
│   ├── layers/                # Layer 配置
│   │   ├── gameLayers.ts      # 生产环境
│   │   └── testLayers.ts      # 测试环境
│   ├── errors/                # 错误类型
│   │   ├── attackErrors.ts    # 攻击错误
│   │   └── validationErrors.ts # 验证错误
│   ├── context/               # Context Tags
│   │   └── serviceTags.ts
│   ├── test-helpers.ts        # 测试工具
│   └── adapters/              # boardgame.io 适配器
│       └── bgioAdapter.ts
├── domain/                    # 现有 DDD 目录
│   └── services/              # 可复用服务
│       ├── cardService.ts     # 纯函数，直接迁移
│       └── messageBuilder.ts   # 纯函数，直接迁移
├── types/
│   ├── branded.ts             # Branded Types (新增)
│   └── core.ts                # 保持
└── game/
    ├── resolution/
    │   └── phase2-attack.ts   # 重构目标
    └── moves.ts               # 重构目标
```

### 分层架构

```
┌─────────────────────────────────────────────────┐
│              AttackResolutionService              │
│  ┌───────────────────────────────────────────┐ │
│  │  评估层 (纯函数，可测试)                   │ │
│  │  ├── evaluatePriority()                  │ │
│  │  ├── canActorAttack()                   │ │
│  │  ├── isTargetProtected()                 │ │
│  │  └── computeQuotaUsage()                 │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  执行层 (副作用，需要 Layer)               │ │
│  │  ├── killPlayer()                       │ │
│  │  ├── transferWitchKiller()               │ │
│  │  └── emitGameEvent()                     │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Layer 组合                          │
│                                               │
│  const GameLayer = Layer.mergeAll(               │
│    PlayerStateLive,                            │
│    CardServiceLive,                            │
│    MessageBuilderLive,                         │
│    PriorityLive                                │
│  )                                             │
└─────────────────────────────────────────────────┘
```

---

## Day 2: 服务层实现详细设计

### 2.1 文件组织结构

```
packages/bgio-engine/src/effect/
├── index.ts                    # 导出入口
├── errors.ts                   # [已完成] 错误类型
├── types/
│   └── branded.ts             # [已完成] 品牌类型
├── services/                   # [Day 2] 服务层
│   ├── index.ts              # 服务导出入口
│   ├── priorityService.ts    # 优先级计算服务
│   ├── playerStateService.ts # 玩家状态服务
│   ├── cardService.ts        # 卡牌服务
│   └── attackResolutionService.ts  # 攻击结算服务
├── contexts/
│   └── gameContext.ts        # 游戏上下文（用于访问 BGGameState）
└── layers/
    └── gameLayers.ts         # Layer 配置组合
```

### 2.2 服务接口设计

#### PriorityService (评估层)

```typescript
// effect/services/priorityService.ts
import { Effect, Context } from "effect";

export interface IPriorityService {
  getAttackType: (card: CardRef | null) => Effect.Effect<AttackType | null>;
  isAttackAction: (action: NightAction) => Effect.Effect<boolean>;
  sortActionsByPriority: (actions: NightAction[]) => Effect.Effect<NightAction[]>;
  sortAttackActions: (actions: NightAction[]) => Effect.Effect<NightAction[]>;
  isWitchKillerUsed: (actions: NightAction[]) => Effect.Effect<boolean>;
}

export const PriorityService = Context.GenericTag<IPriorityService>("PriorityService");

// 使用 Layer.effect 包装现有纯函数
export const PriorityServiceLayer = Layer.effect(
  PriorityService,
  Effect.gen(function* () {
    return {
      getAttackType: (card) => Effect.succeed(importedGetAttackType(card)),
      // ... 包装其他纯函数
    } satisfies IPriorityService;
  })
);
```

#### PlayerStateService (执行层)

```typescript
// effect/services/playerStateService.ts
import { Effect, Context } from "effect";

export interface IPlayerStateService {
  getPlayer: (state: BGGameState, playerId: string) => Effect.Effect<PublicPlayerInfo, PlayerNotFoundError>;
  getPlayerSecrets: (state: BGGameState, playerId: string) => Effect.Effect<PrivatePlayerInfo, PlayerNotFoundError>;
  isAlive: (state: BGGameState, playerId: string) => Effect.Effect<boolean, PlayerNotFoundError>;
  isImprisoned: (state: BGGameState, playerId: string) => Effect.Effect<boolean>;
  getAlivePlayers: (state: BGGameState) => Effect.Effect<PublicPlayerInfo[]>;
  getHand: (state: BGGameState, playerId: string) => Effect.Effect<CardRef[], PlayerNotFoundError>;
  isWitchKillerHolder: (state: BGGameState, playerId: string) => Effect.Effect<boolean>;
  getHandCount: (state: BGGameState, playerId: string) => Effect.Effect<number, PlayerNotFoundError>;
  hasBarrier: (state: BGGameState, playerId: string) => Effect.Effect<boolean>;
}

export const PlayerStateService = Context.GenericTag<IPlayerStateService>("PlayerStateService");
```

#### CardService (从 domain 迁移)

```typescript
// effect/services/cardService.ts
// 包装现有的 domain/services/cardService.ts 纯函数
export interface ICardService {
  createCard: (type: CardType) => Effect.Effect<CardRef>;
  getCardDefinition: (cardRef: CardRef) => Effect.Effect<Card>;
  getCardDefinitionByType: (type: CardType) => Effect.Effect<Omit<Card, "id">>;
  createDeck: (config: CardPoolConfig, shuffle: <T>(array: T[]) => T[]) => Effect.Effect<CardRef[]>;
  getCardTypeName: (type: CardType) => Effect.Effect<string>;
  getCardTypeDescription: (type: CardType) => Effect.Effect<string>;
  getCardIcon: (type: CardType) => Effect.Effect<string>;
  getAllCardTypes: () => Effect.Effect<CardType[]>;
  isAttackCard: (type: CardType) => Effect.Effect<boolean>;
  isDefenseCard: (type: CardType) => Effect.Effect<boolean>;
  isIntelligenceCard: (type: CardType) => Effect.Effect<boolean>;
}

export const CardService = Context.GenericTag<ICardService>("CardService");
```

#### AttackResolutionService (核心业务)

```typescript
// effect/services/attackResolutionService.ts
export interface AttackResolutionResult {
  readonly executedActions: Set<string>;
  readonly failedActions: Array<{ actionId: string; reason: string }>;
  readonly killedByWitchKiller: Set<string>;
  readonly deadPlayers: Set<string>;
}

export interface IAttackResolutionService {
  processAttackActions: (
    state: BGGameState,
    random: RandomAPI,
    barrierPlayers: Set<string>,
  ) => Effect.Effect<AttackResolutionResult, AttackError>;

  validateAttackAction: (...) => Effect.Effect<{ valid: boolean; reason?: ActionFailureReason }, AttackError>;
  executeAttackAction: (...) => Effect.Effect<{ success: boolean; killedPlayerId?: string }>;
}

export const AttackResolutionService = Context.GenericTag<IAttackResolutionService>("AttackResolutionService");
```

### 2.3 Layer 组合配置

```typescript
// effect/layers/gameLayers.ts
import { Layer } from "effect";

export const GameLayers = Layer.mergeAll(
  PriorityServiceLayer,
  PlayerStateServiceLayer,
  CardServiceLayer,
  AttackResolutionServiceLayer,
);

// 便捷上下文
export const GameContext = Context.merge(
  PriorityService,
  PlayerStateService,
  CardService,
  AttackResolutionService,
);
```

### 2.4 测试策略

```typescript
// 测试示例
describe("PriorityService", () => {
  it("should sort actions by priority", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PriorityService;
      const sorted = yield* service.sortAttackActions(actions);
      return sorted[0].card?.type === "witch_killer";
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(PriorityServiceLayer))
    );
    expect(result).toBe(true);
  });
});
```

### 2.5 实施顺序

1. **PriorityService** - 无依赖，最先实现
2. **PlayerStateService** - 无依赖
3. **CardService** - 无依赖
4. **AttackResolutionService** - 依赖前三者
5. **gameLayers.ts** - 组合配置
6. **单元测试** - 与实现并行

### 关键文件

| 文件 | 作用 |
|------|------|
| `game/resolution/services/priority.ts` | 纯函数优先级计算 |
| `domain/queries/index.ts` | Selectors 读取状态 |
| `domain/commands/index.ts` | Mutations 修改状态 |
| `game/resolution/phase2-attack.ts` | 待重构目标 |
| `types/state.ts` | BGGameState 类型 |

---

## Day 3: phase2-attack.ts 重构

### 3.1 目标

将 `phase2-attack.ts` (355行) 重构为使用 Effect-TS 服务，预期减少到 ~180 行。

### 3.2 约束

1. **不修改函数签名** - 保持 `processAttackActions(G, random, previousResult): PhaseResult` 兼容
2. **保持测试兼容** - 现有测试应继续工作
3. **不添加新依赖** - 只使用已安装的 effect

### 3.3 实施步骤

#### 步骤 3.1: 提取 AttackActionProcessor

创建 `effect/services/attackProcessors/attackActionProcessor.ts`:

```typescript
// 评估层：检查行动是否可以执行
export function evaluateAttackAction(
  action: NightAction,
  state: BGGameState,
  context: AttackEvaluationContext,
): AttackEvaluationResult;

// 执行层：执行攻击
export function executeAttackAction(
  action: NightAction,
  state: BGGameState,
  random: RandomAPI,
): AttackExecutionResult;
```

#### 步骤 3.2: 创建 FailureHandler

```typescript
// 统一的失败处理
export function handleAttackFailure(
  action: NightAction,
  reason: ActionFailureReason,
  G: BGGameState,
  result: PhaseResult,
): void;
```

#### 步骤 3.3: 重构 phase2-attack.ts

```typescript
// 使用 Effect.runSync 保持同步调用兼容
export function processAttackActions(...) {
  const result = Effect.runSync(
    Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      return yield* service.processAttackActions(G, random, previousResult);
    }).pipe(Effect.provide(GameLayers))
  );
  return result;
}
```

### 3.4 文件变更

| 操作 | 文件 |
|------|------|
| 新增 | `effect/services/attackProcessors/attackActionProcessor.ts` |
| 新增 | `effect/services/attackProcessors/failureHandler.ts` |
| 修改 | `game/resolution/phase2-attack.ts` |

### 3.5 验证

```bash
# 编译检查
pnpm --filter @whole-ends-kneel/bgio-engine build

# 运行测试
pnpm --filter @whole-ends-kneel/bgio-engine test
```

---

## 预期交付物

### 1. 新增文件

```
packages/bgio-engine/src/
├── effect/
│   ├── services/
│   │   ├── attackResolution.ts  # 攻击结算服务
│   │   ├── playerState.ts      # 玩家状态服务
│   │   ├── priority.ts         # 优先级计算
│   │   └── cardService.ts      # 卡牌服务（迁移）
│   ├── layers/
│   │   ├── gameLayers.ts       # 生产环境
│   │   └── testLayers.ts       # 测试环境
│   ├── errors/
│   │   ├── attackErrors.ts     # 攻击错误
│   │   └── validationErrors.ts # 验证错误
│   ├── context/
│   │   └── serviceTags.ts      # Context Tags
│   ├── test-helpers.ts         # 测试工具
│   └── adapters/
│       └── bgioAdapter.ts      # boardgame.io 适配器
└── types/
    └── branded.ts              # Branded Types
```

### 2. 重构文件

| 文件 | 变化 |
|------|------|
| `game/resolution/phase2-attack.ts` | 355行 → ~180行，使用 Effect-TS 服务 |
| `game/moves.ts` | 渐进式拆分，assertions.ts 迁移到 Either |
| `game/assertions.ts` | 迁移到 Effect 验证模式 |

### 3. 测试文件

| 文件 | 内容 |
|------|------|
| `effect/services/attackResolution.test.ts` | 攻击结算测试 |
| `effect/services/priority.test.ts` | 优先级测试 |
| `effect/layers/testLayers.test.ts` | Layer 配置测试 |
| `effect/adapters/bgioAdapter.test.ts` | 适配器测试 |

### 4. 文档

| 文件 | 变化 |
|------|------|
| `docs/refactoring/2026-02-13_effect-ts-refactoring.md` | 重构日志 |
| `docs/refactoring/MigrationGuide.md` | 迁移指南（新增） |
| `packages/bgio-engine/CLAUDE.md` | 添加 Effect-TS 使用指南 |

### 5. 迁移指南内容 (MigrationGuide.md)

```markdown
# Effect-TS 迁移指南 (Effect 3.x)

## 依赖安装

```bash
pnpm add effect@^3.19.16
```

## Branded Types 使用

**修改说明 (2026-02-14)**:
> 内部 API 优先使用 `Brand.nominal()`，无运行时开销

```typescript
import { Brand } from "effect"

// 使用 Brand.nominal()（无运行时开销）
export type PlayerId = Brand.Branded<string, "PlayerId">;
export const PlayerId = Brand.nominal<PlayerId>();

export type CardId = Brand.Branded<string, "CardId">;
export const CardId = Brand.nominal<CardId>();

// 工厂函数
export function makePlayerId(id: string): PlayerId {
  return PlayerId(id);
}

export function makeCardId(id: string): CardId {
  return CardId(id);
}

// 类型守卫
export function isPlayerId(id: unknown): id is PlayerId {
  return typeof id === "string";
}

export function isCardId(id: unknown): id is CardId {
  return typeof id === "string";
}
```

## Context Tag 服务定义 (Effect 3.x)

```typescript
import { Effect, Context, Layer } from "effect"

// 方式1：完整接口定义 + Tag 类（适合复杂服务）
interface IPlayerStateService {
  readonly getPlayer: (id: PlayerId) => Effect.Effect<Player, PlayerNotFoundError>;
  readonly isAlive: (id: PlayerId) => Effect.Effect<boolean, PlayerNotFoundError>;
  readonly killPlayer: (id: PlayerId, cause: DeathCause) => Effect.Effect<void>;
}

class PlayerStateService extends Context.Tag("PlayerStateService")<
  PlayerStateService,
  IPlayerStateService
>()() {
  // 默认实现
  static Live = Layer.succeed(PlayerStateService, {
    getPlayer: (id) => Effect.gen(function* () {
      const player = /* ... */;
      return player;
    }),
    isAlive: (id) => Effect.succeed(true),
    killPlayer: (id, cause) => Effect.sync(() => { /* ... */ })
  });
}
```

### 方式2：Effect.Service 简化模式（推荐）

**修改说明 (2026-02-15)**:
> 推荐使用 `Effect.Service` 简化服务定义，减少样板代码

```typescript
import { Effect, Layer } from "effect"

// 使用 Effect.Service 单一声明中定义接口和实现
class PlayerStateService extends Effect.Service<PlayerStateService>()(
  "PlayerStateService",
  {
    effect: Effect.gen(function* () {
      return {
        getPlayer: (id: PlayerId) => Effect.succeed({ id, status: "alive" } satisfies Player),
        isAlive: (id: PlayerId) => Effect.succeed(true),
        killPlayer: (id: PlayerId, cause: DeathCause) => Effect.succeed(undefined),
      } satisfies IPlayerStateService;
    }),
    // 可选依赖
    dependencies: [],
  }
) {}

// 使用服务
const program = Effect.gen(function* () {
  const service = yield* PlayerStateService;
  const player = yield* service.getPlayer(playerId);
  return player;
});
```

## 错误处理 (Data.TaggedError)

**修改说明 (2026-02-14)**:
> 使用 `Data.TaggedError` 替代 `Schema.TaggedError`，无 Schema 校验开销

```typescript
import { Data } from "effect"

// 定义错误类型
export class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  readonly playerId: string;
}> {}

export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  readonly current: number;
  readonly max: number;
}> {}

// 使用错误类型
export type PlayerServiceError = PlayerNotFoundError | QuotaExceededError;
```

## Layer 组合

```typescript
import { Layer } from "effect";

// 简单场景：使用 pipe
const AppLayer = ServiceBLive.pipe(Layer.provide(ServiceALive));

// 复杂场景：合并多个 Layer（推荐）
const GameLayer = Layer.mergeAll(
  PlayerStateServiceLive,
  CardServiceLive,
  PriorityServiceLive,
  MessageBuilderLive
);
```

## Effect 组合模式：pipe vs gen

**修改说明 (2026-02-15)**:
> 复杂逻辑使用 `Effect.gen`，简单转换使用 `pipe`

### 简单场景：使用 pipe（值转换）

```typescript
import { Effect, pipe } from "effect";

// 简单映射和转换
const program = pipe(
  Effect.succeed(5),
  Effect.map(n => n * 2),
  Effect.flatMap(n => n > 10 ? Effect.succeed(n) : Effect.fail(new Error("too small"))),
  Effect.tap(n => Effect.log(`Result: ${n}`))
);
```

### 复杂场景：使用 Effect.gen（推荐）

```typescript
// 复杂业务逻辑使用 Effect.gen
const program = Effect.gen(function* () {
  const player = yield* PlayerStateService.getPlayer(playerId);

  if (!player.isAlive) {
    return yield* Effect.fail(new ActorDeadError({ actorId: playerId }));
  }

  const target = yield* PlayerStateService.getPlayer(targetId);
  const canAttack = yield* canActorAttack(player, target);

  if (!canAttack) {
    return yield* Effect.fail(new QuotaExceededError({ current: 0, max: 3 }));
  }

  return yield* killPlayer(target, playerId);
});
```

### 原则

| 场景 | 推荐方式 | 理由 |
|------|---------|------|
| 简单转换（1-2步） | `pipe` | 声明式，point-free |
| 条件逻辑 | `Effect.gen` | 可读性更好 |
| 多步骤流程 | `Effect.gen` | 易于调试 |
| 循环/迭代 | `Effect.gen` | 更自然 |

## Bun Test 集成

### 方式1：手动 Mock Layer（简单场景）

```typescript
import { Effect, Layer, Exit } from "effect";
import { describe, it, expect } from "bun:test";

// Mock Layer
const MockPlayerStateService = Layer.succeed(
  PlayerStateService,
  {
    getPlayer: () => Effect.succeed({ id: "p1", status: "alive" }),
    isAlive: () => Effect.succeed(true),
    killPlayer: () => Effect.succeed(undefined),
  }
);

// 测试函数
async function runTest<A, E, R>(effect: Effect.Effect<A, E, R>) {
  const exit = await Effect.exit(effect.pipe(Effect.provide(MockPlayerStateService)));
  if (Exit.isSuccess(exit)) return exit.value;
  throw new Error(`Effect failed: ${JSON.stringify(exit.cause)}`);
}

// 使用示例
describe("PlayerState", () => {
  it("should get player", async () => {
    const result = await runTest(
      Effect.gen(function* () {
        const player = yield* PlayerStateService.getPlayer(makePlayerId("p1"));
        return player;
      })
    );
    expect(result.id).toBe("p1");
  });
});
```

### 方式2：TestContext（推荐，2026-02-15 新增）

**修改说明 (2026-02-15)**:
> 推荐使用 `TestContext` 进行更规范的测试

```typescript
import { Effect, TestContext } from "effect";
import { describe, it, expect } from "bun:test";

// 测试层配置
const TestLayer = Layer.succeed(PlayerStateService, {
  getPlayer: () => Effect.succeed({ id: "p1", status: "alive" }),
  isAlive: () => Effect.succeed(true),
  killPlayer: () => Effect.succeed(undefined),
});

describe("AttackResolution", () => {
  it("should resolve witch_killer attack", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PlayerStateService;
      return yield* service.getPlayer(makePlayerId("p1"));
    });

    const result = await TestContext.make().pipe(
      Effect.provide(TestLayer),
      TestContext.runPromise(program)
    );

    expect(result.id).toBe("p1");
  });
});
```
```

---

## 验收标准

### 代码质量

- [ ] 分层架构清晰：评估层（纯函数）+ 执行层（副作用）
- [ ] 所有 Effect 函数有类型化错误 (TaggedError)
- [ ] Layer 组合正确，无循环依赖
- [ ] 函数平均行数 < 50行，圈复杂度 < 10
- [ ] phase2-attack.ts <= 180行
- [ ] CI Pipeline 通过（全量 Bun test）

### 模式规范（2026-02-15 新增）

- [ ] 服务使用 `Effect.Service` 模式定义（推荐）或 `Context.Tag`（兼容）
- [ ] Layer 组合使用 `Layer.mergeAll`（3个以上）或 `pipe`（简单场景）
- [ ] 复杂逻辑统一使用 `Effect.gen` 模式
- [ ] 简单值转换可使用 `pipe` 模式

### 类型安全

- [ ] 使用 Branded Types (PlayerId, CardId)
- [ ] 错误使用 Data.TaggedError，无 `any` 逃逸
- [ ] 使用 Data/Brand 模块（无需 Schema）
- [ ] 编译通过 (`pnpm build`)

### 测试覆盖

| 模块 | 覆盖率目标 | 说明 |
|------|-----------|------|
| AttackResolutionService | **100%** | 核心逻辑 |
| PriorityService | **95%** | 优先级计算 |
| PlayerStateService | **90%** | 状态管理 |
| CardService | **85%** | 卡牌操作 |
| move 断言 | **80%** | 验证逻辑 |
| Layer 配置 | **100%** | 配置即逻辑 |

### 术语一致性

- [ ] 代码术语与规则文档一致
- [ ] 注释使用中文（符合项目语言）
- [ ] 复杂逻辑有规则引用文档

---

## 关键风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Effect 版本兼容性 | 低 | 已安装 ^3.19.16，使用最新 API |
| boardgame.io 集成 | 高 | 适配器模式，保持 API 兼容 |
| string ↔ Branded 转换 | 中 | 封装转换函数，禁用隐式转换 |
| fp-refactor-expert 工作负载 | 高 | 任务拆分，部分并行执行 |
| 测试执行时间 | 低 | 设置测试超时，分阶段运行 |

---

## 回滚计划

如果重构过程中发现问题，可按以下步骤回滚：

| 阶段 | 回滚操作 |
|------|----------|
| Day 1-2 | 删除 `effect/` 目录，恢复 package.json |
| Day 3 | 删除 Effect 服务使用，恢复原始 phase2-attack.ts |
| Day 4 | 保留新服务，但标记为 @deprecated，使用旧 API |

---

## 版本约束

```json
// packages/bgio-engine/package.json
{
  "dependencies": {
    "effect": "^3.19.16"
  }
}
```

### Effect 包版本策略

| 包名 | 版本 | 导入来源 | 用途 |
|------|------|----------|------|
| `effect` | ^3.19.16 | `import { ... } from "effect"` | 核心 (Effect, Layer, Context, Data, Brand) |

> **说明**: 使用 `Data` 模块处理错误，使用 `Brand` 模块处理品牌类型，**不使用 Schema 模块**。

---

## 依赖安装

```bash
# Day 1 第一步：安装最新版本 Effect 3.x
pnpm add effect@^3.19.16
```

---

## Effect 3.x API 参考

### Context.Tag 服务定义（类继承模式）

```typescript
// 方式1：接口 + Tag 类
interface IPlayerStateService {
  readonly getPlayer: (id: PlayerId) => Effect.Effect<Player, PlayerNotFoundError>;
}

class PlayerStateService extends Context.Tag("PlayerStateService")<
  PlayerStateService,
  IPlayerStateService
>()() {}
```

### Data.TaggedError 错误定义

**修改说明 (2026-02-14)**:
> 使用 `Data.TaggedError` 替代 `Schema.TaggedError`

```typescript
import { Data } from "effect";

export class PlayerNotFoundError extends Data.TaggedError("PlayerNotFoundError")<{
  readonly playerId: string;
}> {}
```

### Layer 组合

```typescript
// 合并多个 Layer
const LayerA = Layer.succeed(ServiceA, implementation);
const LayerB = Layer.effect(ServiceB, Effect.gen(...));

// 组合
const CombinedLayer = Layer.mergeAll(LayerA, LayerB);
// 或使用 provide 建立依赖链
const AppLayer = ServiceBLive.pipe(Layer.provide(ServiceALive));
```

### 运行 Effect

```typescript
import { Effect, Layer, Exit } from "effect";

// 使用 provide 运行
const program = Effect.gen(function* () {
  const player = yield* PlayerStateService;
  return player;
});

// 方式1: runPromiseExit 返回 Exit
Effect.runPromiseExit(program.pipe(Effect.provide(LiveLayer))).then(exit => {
  if (Exit.isSuccess(exit)) {
    console.log("Result:", exit.value);
  } else {
    console.log("Failed:", exit.cause);
  }
});

// 方式2: runPromise 只返回结果，错误抛出
Effect.runPromise(program.pipe(Effect.provide(LiveLayer)));
```

---

## 附录

### A. 术语一致性检查清单

- [ ] 代码术语与规则文档一致
- [ ] 注释使用中文（符合项目语言）
- [ ] 复杂逻辑有规则引用文档

### B. 每日签出清单

| Day | 签出项 |
|-----|---------|
| Day 1 | effect 安装成功，types/branded.ts 定义完成 |
| Day 2 | 所有服务接口定义完成，单元测试通过 |
| Day 3 | phase2-attack.ts 重构完成，集成测试通过 |
| Day 4 | moves.ts 拆分完成，断言迁移完成 |
| Day 5 | 全量测试通过，CI 通过 |

---

*计划生成时间: 2026-02-13*
*基于第二轮专家会议: fp-refactor-expert, domain-modeling-expert, test-generator, game-engine-specialist*
*Master-developer 评估评分: 7.5/10 (有条件批准)*

---

## 更新记录

### 2026-02-15: Effect-TS 模式规范优化

**修改原因**:
> 推广 Effect-TS 最佳实践，统一代码风格

**修改内容**:

| 方面 | 之前 | 现在 |
|------|------|------|
| 服务定义 | `Context.Tag` | `Effect.Service`（推荐） + `Context.Tag`（兼容） |
| 复杂逻辑 | 混用 pipe/gen | **`Effect.gen` 统一** |
| 测试工具 | 手动 Mock | `TestContext`（推荐） |

**新增内容**:
- `Effect.Service` 简化模式示例
- `Effect.gen` vs `pipe` 使用原则
- `TestContext` 测试模式
- 验收标准 - 模式规范章节

---

### 2026-02-14: 完全移除 Schema 模块

**修改原因**:
> Effect-TS 内部 API 不需要 Schema 校验，使用轻量级模块

**修改内容**:

| 之前 | 现在 |
|------|------|
| `Schema.TaggedError` | `Data.TaggedError` |
| `Schema.brand()` | `Brand.nominal()` |
| `Schema.String` | `string` |
| `Schema.Number` | `number` |
| `effect/schema/` 目录 | **移除** |

---

## 2026-02-15: 可变 Context 架构重构 (第三轮)

### 背景

用户提出更彻底的重构方案：
> "可以把发送消息设计为一个服务，然后将 processAttackActions 本身包装为 Effect，并将 BGGameState 包装为一个可变 Context。然后重构 PlayerStateService，将 killPlayer 也封装到这个服务中，同样使用 BGGameState 作为 Context。"

### 当前问题

1. **BGGameState 作为显式参数** - 服务方法签名中需要传递 `state: BGGameState`，不够优雅
2. **消息发送在外部处理** - phase2-attack.ts 中有大量 `Mutations.msg` 调用 (~60行 switch-case)
3. **killPlayer 在外部调用** - 击杀逻辑在 phase2-attack.ts 中调用 `Mutations.killPlayer`
4. **副作用未封装** - 服务层只做"评估"，执行仍在外层

### 目标

- 将 BGGameState 放入 Effect Context 中作为可变状态
- 创建 MessageService 封装所有消息发送
- 将 AttackResolutionService 包装为完整 Effect
- 让 PlayerStateService 直接操作 Context 中的状态

---

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    GameStateRef (可变 Context)               │
│  使用 Ref<BGGameState> 存储游戏状态，通过 yield* 访问        │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ MessageService  │ │ PlayerStateSvc  │ │ AttackResolution│
│                 │ │                 │ │    Service      │
│ - addMessage   │ │ - killPlayer   │ │ - processAttack │
│ - addRevealed  │ │ - isAlive      │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

### 1. GameStateRef - 可变 Context

```typescript
// effect/context/gameStateRef.ts
import { Effect, Ref } from "effect";

class GameStateRef extends Effect.Service<GameStateRef>()("GameStateRef", {
  effect: Effect.gen(function* () {
    const ref = yield* Ref.unsafeMake<BGGameState>(null as any);
    return {
      get: () => Ref.get(ref),
      set: (state: BGGameState) => Ref.set(ref, state),
      update: (f: (s: BGGameState) => BGGameState) => Ref.update(ref, f),
    };
  }),
}) {}
```

---

### 2. MessageService - 消息服务

```typescript
// effect/services/messageService.ts
class MessageService extends Effect.Service<MessageService>()("MessageService", {
  effect: Effect.gen(function* () {
    const gameState = yield* GameStateRef;
    return {
      // 基础方法
      addMessage: (msg: TMessage) => Effect.sync(() => {
        const state = gameState.get();
        state.messages.push(msg);
      }),

      // 攻击结算便捷方法
      handleAttackFailure: (action: NightAction, reason: ActionFailureReason) =>
        Effect.gen(function* () {
          // 根据 reason 构建消息并发送
        }),

      handleAttackSuccess: (action: NightAction) =>
        Effect.gen(function* () {
          // 构建成功消息
        }),
    } satisfies IMessageService;
  }),
  dependencies: [GameStateRef],
}) {}
```

---

### 3. PlayerStateService - 状态服务 (重构后)

```typescript
// effect/services/playerStateService.ts (重构后)
class PlayerStateService extends Effect.Service<PlayerStateService>()("PlayerStateService", {
  effect: Effect.gen(function* () {
    const gameState = yield* GameStateRef;
    const messageService = yield* MessageService;

    return {
      isAlive: (playerId: string) => Effect.gen(function* () {
        const state = gameState.get();
        return state.players[playerId]?.status === "alive";
      }),

      // killPlayer 封装为 Effect
      killPlayer: (playerId: string, cause: DeathCause, killerId?: string) =>
        Effect.gen(function* () {
          const state = gameState.get();
          const player = state.players[playerId];

          if (!player || player.status !== "alive") {
            return yield* Effect.fail(new PlayerNotAliveError({ playerId }));
          }

          // 修改状态
          yield* gameState.update((s) => {
            s.players[playerId].status = "dead";
            s.secrets[playerId].deathCause = cause;
            return s;
          });

          // 发送死亡消息
          yield* messageService.addRevealedInfo(playerId, "death", { cause });

          return { success: true };
        }),
    } satisfies IPlayerStateService;
  }),
  dependencies: [GameStateRef, MessageService],
}) {}
```

---

### 4. AttackResolutionService - 完整 Effect 化

```typescript
// effect/services/attackResolutionService.ts (重构后)
class AttackResolutionService extends Effect.Service<AttackResolutionService>()(
  "AttackResolutionService",
  {
    effect: Effect.gen(function* () {
      const gameState = yield* GameStateRef;
      const priorityService = yield* PriorityService;
      const playerStateService = yield* PlayerStateService;
      const messageService = yield* MessageService;

      return {
        processAttackActions: (barrierPlayers: Set<string>) =>
          Effect.gen(function* () {
            const state = gameState.get();
            const actions = yield* priorityService.sortAttackActions(state.nightActions);

            // 完整结算逻辑...
            // 所有修改通过 gameState.update()
            // 所有消息通过 messageService

            return finalResult;
          }),
      } satisfies IAttackResolutionService;
    }),
    dependencies: [GameStateRef, PriorityService, PlayerStateService, MessageService],
  }
) {}
```

---

### 5. 入口适配器 (phase2-attack.ts)

```typescript
// game/resolution/phase2-attack.ts (重构后 ~50行)
export function processAttackActions(
  G: BGGameState,
  random: RandomAPI,
  previousResult: Readonly<PhaseResult>,
): PhaseResult {
  // 创建可变 Ref
  const ref = Ref.unsafeMake(G);

  // 组合 Layer
  const layer = Layer.mergeAll(
    GameStateRefLayer(ref),
    MessageServiceLayer,
    PriorityServiceLayer,
    PlayerStateServiceLayer,
    AttackResolutionServiceLayer,
  );

  // 运行
  const result = Effect.runSync(
    Effect.gen(function* () {
      const service = yield* AttackResolutionService;
      return yield* service.processAttackActions(previousResult.barrierPlayers);
    }).pipe(Effect.provide(layer))
  );

  return result;
}
```

---

### 实施步骤

| 步骤 | 操作 | 文件 |
|------|------|------|
| 1 | 创建 GameStateRef | `effect/context/gameStateRef.ts` |
| 2 | 创建 MessageService | `effect/services/messageService.ts` |
| 3 | 重构 PlayerStateService | `effect/services/playerStateService.ts` |
| 4 | 重构 AttackResolutionService | `effect/services/attackResolutionService.ts` |
| 5 | 更新 GameLayers | `effect/layers/gameLayers.ts` |
| 6 | 重构 phase2-attack.ts | `game/resolution/phase2-attack.ts` |

---

### 预期收益

| 指标 | 当前 | 重构后 | 减少 |
|------|------|--------|------|
| phase2-attack.ts | 347 行 | **~50 行** | **86%** |
| switch-case 重复 | ~60 行 | **0** | **100%** |
| BGGameState 传递 | 显式参数 | **Context 注入** | - |

---

### 验证

```bash
# 编译检查
pnpm --filter @whole-ends-kneel/bgio-engine build

# 运行测试
pnpm --filter @whole-ends-kneel/bgio-engine test
```

---

### 风险与缓解

| 风险 | 等级 | 缓解 |
|------|------|------|
| Ref 线程安全 | 中 | boardgame.io 单线程模型，无需担心 |
| 现有测试兼容性 | 高 | 保留旧接口适配器 |
| Effect 运行时开销 | 低 | 仅在 phase 入口调用一次 |

---

*最后更新: 2026-02-15*
