---
phase: 04-test-coverage
plan: 03
subsystem: game-core
tags: [testing, unit-tests, assertions, phases]
dependency_graph:
  requires: []
  provides: [test-coverage-improvement]
  affects: [src/game/assertions.ts, src/game/phases.ts]
tech_stack:
  added: []
  patterns: [BDD-style testing, factory functions]
key_files:
  created:
    - src/game/assertions.test.ts
    - src/game/phases.test.ts
  modified: []
decisions: []
metrics:
  duration: 30min
  completed_at: 2026-02-17
---

# Phase 4 Plan 3: 游戏核心单元测试 Summary

## Overview

为游戏断言函数和相位配置添加全面的单元测试，确保核心游戏逻辑的正确性。

## What Was Built

### 1. Assertions 单元测试 (`src/game/assertions.test.ts`)

测试文件覆盖了所有断言函数：

| 函数 | 测试场景 | 状态 |
|------|----------|------|
| `assertPhase` | 单/多允许相位通过，不匹配时抛出错误 | ✅ |
| `assertNotEmpty` | null/undefined/空字符串/空白字符串验证 | ✅ |
| `assertPlayerAlive` | 存活/死亡/女巫/残骸状态，玩家不存在 | ✅ |
| `assertPlayerPublicAlive` | 公开视角存活判断 | ✅ |
| `assertCardInHand` | 卡牌存在/不存在，空手牌 | ✅ |
| `assertWitchKillerCardAllowed` | 持有者限制验证 | ✅ |
| `assertAttackQuotaAvailable` | 攻击名额验证 | ✅ |
| `assertValidMessage` | 内容验证，长度限制 | ✅ |

**覆盖率**: 100% functions, 100% lines

### 2. Phase 配置单元测试 (`src/game/phases.test.ts`)

测试文件覆盖了所有相位配置：

| 相位 | 测试内容 | 状态 |
|------|----------|------|
| LOBBY | 下一相位配置 | ✅ |
| SETUP | 下一相位配置 | ✅ |
| MORNING | onBegin钩子, endIf条件, 死亡公告 | ✅ |
| DAY | 可用moves, onBegin钩子, 交易状态重置 | ✅ |
| NIGHT | 投票moves, onBegin/onEnd钩子, 投票处理 | ✅ |
| DEEP_NIGHT | 卡牌moves, 攻击名额重置 | ✅ |
| RESOLUTION | onBegin钩子, 下一相位路由 | ✅ |
| CARD_SELECTION | moves, stages, onBegin/onEnd钩子 | ✅ |
| ENDED | 空配置验证 | ✅ |
| Phase Flow | 相位链验证 | ✅ |

**覆盖率**: 87.10% functions, 85.82% lines (目标: 70%)

## Test Results

```
✅ assertions.test.ts: 36 tests pass, 84 expect() calls
✅ phases.test.ts: 35 tests pass, 77 expect() calls
✅ Total: 71 tests pass, 161 expect() calls
```

## Coverage Summary

| 文件 | 函数覆盖率 | 行覆盖率 | 目标 | 状态 |
|------|-----------|---------|------|------|
| src/game/assertions.ts | 100% | 100% | 95% | ✅ 超额完成 |
| src/game/phases.ts | 87.10% | 85.82% | 70% | ✅ 超额完成 |

## Commits

1. `406d54c` - test(04-03): add phase configuration unit tests
2. `dffa6b9` - test(04-03): add assertAttackQuotaAvailable tests

## Technical Decisions

1. **测试风格**: 使用 BDD-style (describe/it) 命名，符合项目规范
2. **工厂函数**: 复用 `testUtils.ts` 中的 `createTestState`, `setupPlayer` 等辅助函数
3. **错误测试**: 使用 `expect(() => fn()).toThrow()` 模式验证错误抛出
4. **覆盖率优先**: 重点覆盖公共 API 和核心逻辑路径

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修复 daily trade reset 测试预期**
- **Found during**: Task 2 - DAY phase onBegin 测试
- **Issue**: 预期 `dailyTradeTracker` 被清空为 `{}`，实际行为是重置标志位
- **Fix**: 更新测试预期为验证标志位被重置为 `false`
- **Files modified**: `src/game/phases.test.ts`

### 无其他偏离

计划按预期执行，无其他偏离。

## Notes

- `assertions.test.ts` 已在之前的 commit (e8d83d1) 中创建，本次主要添加 `assertAttackQuotaAvailable` 测试以达到 100% 覆盖
- `phases.test.ts` 是新创建的测试文件，全面覆盖相位配置
- 部分相位钩子（如 MORNING 的死亡公告）依赖 MessageService，测试中主要验证不抛出异常

## Self-Check: PASSED

- [x] `src/game/assertions.test.ts` 存在且所有测试通过
- [x] `src/game/phases.test.ts` 存在且所有测试通过
- [x] assertions.ts 覆盖率 >= 95% (实际: 100%)
- [x] phases.ts 覆盖率 >= 70% (实际: ~87%)
- [x] TypeScript 编译无错误
- [x] 所有任务已提交
