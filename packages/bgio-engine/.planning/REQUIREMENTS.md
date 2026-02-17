# Requirements: bgio-engine 质量改进

**Defined:** 2026-02-17
**Core Value:** 建立稳定、可维护、可测试的游戏引擎架构，为后续功能开发奠定坚实基础。

## v1 Requirements

### Effect-TS 迁移

- [ ] **EFFECT-01**: 完成 AttackResolutionService 从旧服务层到 Effect-TS 的迁移
- [ ] **EFFECT-02**: 完成 MessageService 从旧服务层到 Effect-TS 的迁移
- [ ] **EFFECT-03**: 完成 PlayerStateService 从旧服务层到 Effect-TS 的迁移
- [ ] **EFFECT-04**: 统一错误处理模式，使用 Effect-TS Data.TaggedError
- [ ] **EFFECT-05**: 移除遗留的 domain 服务层代码

### 类型安全

- [ ] **TYPE-01**: 移除 src/ai/index.ts 中的 any 类型
- [ ] **TYPE-02**: 移除 src/effect/test-helpers.ts 中的 any 类型
- [ ] **TYPE-03**: 移除 src/game/index.ts 中的类型强制转换
- [ ] **TYPE-04**: 为所有测试辅助函数添加完整类型签名

### 技术债务

- [ ] **DEBT-01**: 移除 src/game/moves.ts 中的 console.log 语句
- [ ] **DEBT-02**: 移除 src/game/phases.ts 中的 console.log 语句
- [ ] **DEBT-03**: 移除调试模式下的 Player ID "0" 硬编码
- [ ] **DEBT-04**: 统一 GameLogicError 和 Effect-TS 错误处理

### 测试覆盖

- [ ] **TEST-01**: 为 src/game/resolution/ 添加夜间解析集成测试
- [ ] **TEST-02**: 为 src/effect/services/ 添加 Effect-TS 服务测试
- [ ] **TEST-03**: 为 src/types/message.ts 添加消息可见性测试
- [ ] **TEST-04**: 为 src/utils.ts (Selectors) 添加选择器测试
- [ ] **TEST-05**: 提升整体测试覆盖率至 80%+

## Out of Scope

| Feature | Reason |
|---------|--------|
| 新游戏功能开发 | 聚焦代码质量改进 |
| AI 对手实现 | 超出当前范围 |
| 性能优化 | 质量改进完成后处理 |
| 架构重构 | 保持现有架构稳定 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EFFECT-01 | Phase 1 | Pending |
| EFFECT-02 | Phase 1 | Pending |
| EFFECT-03 | Phase 1 | Pending |
| EFFECT-04 | Phase 1 | Pending |
| EFFECT-05 | Phase 1 | Pending |
| TYPE-01 | Phase 2 | Pending |
| TYPE-02 | Phase 2 | Pending |
| TYPE-03 | Phase 2 | Pending |
| TYPE-04 | Phase 2 | Pending |
| DEBT-01 | Phase 3 | Pending |
| DEBT-02 | Phase 3 | Pending |
| DEBT-03 | Phase 3 | Pending |
| DEBT-04 | Phase 3 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 after initial definition*
