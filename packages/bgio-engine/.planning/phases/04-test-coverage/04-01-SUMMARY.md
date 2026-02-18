---
phase: 04-test-coverage
plan: 01
subsystem: effect-services
status: completed
completed_date: 2026-02-17
duration_minutes: 12
tags: [testing, effect-ts, card-service, priority-service]
dependency_graph:
  requires: []
  provides: ["04-02", "04-03", "04-04", "04-05"]
  affects: ["src/effect/services/cardService.ts", "src/effect/services/priorityService.ts"]
tech_stack:
  added: []
  patterns:
    - "BDD-style test naming (describe/it, should...)"
    - "Factory functions with make prefix"
    - "Effect-TS Layer pattern for dependency injection"
key_files:
  created:
    - "src/__tests__/helpers.ts"
    - "src/effect/services/cardService.test.ts"
    - "src/effect/services/priorityService.test.ts"
  modified: []
decisions:
  - "Use makeBaseLayer() for stateless services (CardService, PriorityService)"
  - "Use makeLayerWithState() for stateful services"
  - "Test coverage target: 80%+ (achieved 100% for both services)"
---

# Phase 04 Plan 01: CardService & PriorityService 测试覆盖

## Summary

为 Effect-TS 服务层中覆盖率较低的 CardService 和 PriorityService 添加单元测试，并创建通用的测试工厂函数。

## One-Liner

CardService 和 PriorityService 测试覆盖率达到 100%，创建可复用的测试工厂函数 helpers.ts

## Tasks Completed

### Task 1: 创建通用测试工厂函数 (src/__tests__/helpers.ts)

**工厂函数列表:**

1. `makeGameState(overrides?)` - 创建基础游戏状态
   - 使用 SEVEN_PLAYER_CONFIG 作为默认配置
   - 接受 overrides 参数覆盖特定字段
   - 返回完整的 BGGameState

2. `makePlayer(id, overrides?)` - 创建玩家对象
   - 创建 public 状态 (status, name 等)
   - 创建 secret 状态 (hand, isWitch 等)

3. `makeCard(type, id?)` - 创建卡牌对象
   - 支持所有卡牌类型: witch_killer, barrier, kill, detect, check
   - 提供便捷工厂: makeWitchKillerCard, makeBarrierCard, makeKillCard, makeDetectCard, makeCheckCard

4. `makeTestScenario(options)` - 创建完整测试场景
   - playerCount: 玩家数量
   - withWitchKiller: 是否包含魔女杀手持有者
   - withDeadPlayers: 死亡玩家列表
   - 返回配置好的游戏状态

5. `makeLayerWithState(state)` - 创建 Effect Layer
   - 包装 GameLayers + GameStateRef + GameRandom
   - 返回可直接用于 Effect.provide 的 Layer

6. `makeBaseLayer()` - 创建仅带基础服务的 Layer
   - 适用于 CardService、PriorityService 等无状态服务测试

**提交:** `e8d83d1`

### Task 2: CardService 单元测试 (src/effect/services/cardService.test.ts)

**测试覆盖:**

- **createCard**: 3 tests
  - 应成功创建各种类型的卡牌
  - 应验证卡牌属性 (id, type)
  - 应创建唯一的 card ids

- **getCardDefinition**: 3 tests
  - 应返回完整的卡牌定义
  - 应正确处理 witch_killer
  - 应正确处理 barrier

- **getCardDefinitionByType**: 1 test
  - 应返回不含 id 的定义

- **createDeck**: 4 tests
  - 应创建正确数量的卡牌
  - 应使用提供的 shuffle 函数
  - 应为所有卡牌创建唯一 id
  - 应创建正确分布的卡牌类型

- **getCardTypeName**: 2 tests
  - 应返回所有卡牌类型的正确名称
  - 应处理无效类型

- **getCardTypeDescription**: 1 test
  - 应返回非空描述

- **getCardIcon**: 2 tests
  - 应返回所有卡牌类型的正确图标
  - 应返回无效类型的默认图标

- **getAllCardTypes**: 1 test
  - 应返回所有 5 种卡牌类型

- **isAttackCard**: 5 tests
  - witch_killer 和 kill 返回 true
  - barrier、detect、check 返回 false

- **isDefenseCard**: 2 tests
  - barrier 返回 true
  - 攻击卡牌返回 false

- **isIntelligenceCard**: 4 tests
  - detect 和 check 返回 true
  - 其他卡牌返回 false

**覆盖率:** 100% (12/12 方法)

**提交:** `ecab0fe`

### Task 3: PriorityService 单元测试 (src/effect/services/priorityService.test.ts)

**测试覆盖:**

- **getAttackType**: 6 tests
  - witch_killer 返回 "witch_killer"
  - kill 返回 "kill"
  - barrier、detect、check 返回 null
  - null 卡牌返回 null

- **isAttackAction**: 6 tests
  - witch_killer 和 kill 行动返回 true
  - barrier、detect、check 行动返回 false
  - pass 行动 (null 卡牌) 返回 false

- **sortActionsByPriority**: 7 tests
  - witch_killer 排在 kill 之前
  - kill 排在 detect 之前
  - detect 排在 check 之前
  - barrier 排在 check 之前
  - 相同优先级按时间戳排序
  - 处理空数组
  - 处理单个行动
  - 相同优先级和时间戳保持稳定排序

- **sortAttackActions**: 4 tests
  - 过滤并排序攻击行动
  - 无攻击行动时返回空数组
  - 处理空数组
  - 排除 pass 行动

- **isWitchKillerUsed**: 5 tests
  - 行动包含 witch_killer 时返回 true
  - 行动不包含 witch_killer 时返回 false
  - 空行动返回 false
  - 所有行动卡牌为 null 时返回 false
  - 检测任意位置的 witch_killer

**覆盖率:** 100% (5/5 方法)

**提交:** `19de61b`

## Verification Results

### 测试执行

```bash
$ bun test src/effect/services/
 68 pass
 0 fail
 153 expect() calls
Ran 68 tests across 5 files
```

### 覆盖率报告

| 文件 | 覆盖率 | 状态 |
|------|--------|------|
| src/effect/services/cardService.ts | 100% | 达标 |
| src/effect/services/priorityService.ts | 100% | 达标 |
| src/domain/services/cardService.ts | 100% | 间接提升 |
| src/game/resolution/services/priority.ts | 100% | 间接提升 |

### 类型检查

- 新创建文件无 TypeScript 错误
- 预存在的类型错误在 phases.test.ts 和 message.test.ts 中，不在本计划范围内

## Deviations from Plan

无偏差 - 计划完全按预期执行。

## Key Decisions

1. **工厂函数命名**: 使用 `make` 前缀（如 `makeCard`、`makePlayer`），符合 04-CONTEXT.md 中的决策
2. **Layer 模式**: `makeBaseLayer()` 用于无状态服务，`makeLayerWithState()` 用于有状态服务
3. **测试组织**: 使用 BDD 风格命名（describe/it, should...）
4. **覆盖率目标**: 超过 80% 目标，达到 100%

## Follow-up Work

- 04-02: PlayerStateService 测试覆盖
- 04-03: MessageService 测试覆盖
- 04-04: AttackResolutionService 测试覆盖
- 04-05: Effect 错误处理测试

## Self-Check: PASSED

- [x] src/__tests__/helpers.ts 存在
- [x] src/effect/services/cardService.test.ts 存在
- [x] src/effect/services/priorityService.test.ts 存在
- [x] 所有测试通过 (68/68)
- [x] 覆盖率 >= 80% (实际 100%)
- [x] 提交已记录 (e8d83d1, ecab0fe, 19de61b)
