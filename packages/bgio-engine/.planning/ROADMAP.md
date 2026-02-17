# Roadmap: bgio-engine 质量改进

## Overview

对 Witch Trial 桌游引擎进行全面的代码质量改进，从 Effect-TS 服务层迁移开始，依次完成类型安全修复、技术债务清理，最终达到 80%+ 测试覆盖率。四个阶段按依赖顺序执行，每阶段交付可验证的完整能力。

## Phases

- [x] **Phase 1: Effect-TS 迁移** - 完成服务层迁移，统一错误处理 (completed 2026-02-17)
- [x] **Phase 2: 类型安全** - 移除 any 类型，提升类型安全 (completed 2026-02-17)
- [x] **Phase 3: 技术债务** - 标准化日志记录，统一错误处理 (completed 2026-02-17)
- [ ] **Phase 4: 测试覆盖** - 提升测试覆盖率至 80%+

## Phase Details

### Phase 1: Effect-TS 迁移

**Goal**: 完成 Effect-TS 服务层迁移，统一错误处理模式，保留遗留 domain 服务层代码作为兼容层

**Depends on**: Nothing (first phase)

**Requirements**: EFFECT-01, EFFECT-02, EFFECT-03, EFFECT-04, EFFECT-05

**Success Criteria** (what must be TRUE):

1. AttackResolutionService 可通过 Effect-TS 层调用
2. MessageService 可通过 Effect-TS 层调用
3. PlayerStateService 可通过 Effect-TS 层调用
4. 统一使用 Effect-TS Data.TaggedError 处理错误
5. 保留遗留 domain 服务层代码作为兼容层（不删除）

**Plans**: 3 plans

- [x] 01-effect-ts-01-PLAN.md — Add boundary error conversion (EFFECT-04)
- [x] 01-effect-ts-02-PLAN.md — Verify integration tests for Effect-TS services
- [x] 01-effect-ts-03-PLAN.md — Verify backward compatibility (EFFECT-05)

---

### Phase 2: 类型安全

**Goal**: 移除 any 类型，为所有测试辅助函数添加完整类型签名

**Depends on**: Phase 1

**Requirements**: TYPE-02, TYPE-03, TYPE-04

**Success Criteria** (what must be TRUE):

1. src/effect/test-helpers.ts 无 any 类型
2. src/game/index.ts 无类型强制转换 (type casting)
3. 所有测试辅助函数有完整类型签名

**Plans**: 3 plans

- [ ] 02-type-safety-01-PLAN.md — Remove any types from test-helpers.ts (TYPE-02)
- [ ] 02-type-safety-02-PLAN.md — Add complete type signatures to testUtils.ts (TYPE-04)
- [ ] 02-type-safety-03-PLAN.md — Verify no type casting in game/index.ts (TYPE-03)

---

### Phase 3: 技术债务

**Goal**: 标准化日志记录，统一错误处理

**Depends on**: Phase 2

**Requirements**: DEBT-01, DEBT-02, DEBT-03, DEBT-04

**Success Criteria** (what must be TRUE):

1. src/game/moves.ts 使用标准日志框架替代 console.log
2. src/game/phases.ts 使用标准日志框架替代 console.log
3. 移除调试模式 Player ID "0" 硬编码（或使用环境变量控制）
4. 统一 GameLogicError 和 Effect-TS 错误处理

**Plans**: 4 plans

- [ ] 03-01-PLAN.md — 创建 Effect-TS 日志服务 (DEBT-01 前置)
- [ ] 03-02-PLAN.md — 替换 moves.ts 中的 console.log (DEBT-01)
- [ ] 03-03-PLAN.md — 替换 phases.ts 中的 console.log + 移除调试 ID 硬编码 (DEBT-02 + DEBT-03)
- [ ] 03-04-PLAN.md — 统一错误处理 (DEBT-04)

---

### Phase 4: 测试覆盖

**Goal**: 添加关键路径测试，提升整体测试覆盖率至 80%+

**Depends on**: Phase 3

**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05

**Success Criteria** (what must be TRUE):

1. src/game/resolution/ 夜间解析集成测试覆盖核心逻辑
2. src/effect/services/ Effect-TS 服务测试完成
3. src/types/message.ts 消息可见性测试完成
4. src/utils.ts Selectors 选择器测试完成
5. 整体测试覆盖率达到 80%+

**Plans**: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Effect-TS 迁移 | 3/3 | Complete    | 2026-02-17 |
| 2. 类型安全 | 3/3 | Complete    | 2026-02-17 |
| 3. 技术债务 | 4/4 | Complete    | 2026-02-17 |
| 4. 测试覆盖 | 0/5 | Not started | - |
