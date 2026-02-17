# Phase 4: 测试覆盖 - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

为游戏引擎添加关键路径测试，提升测试覆盖率至 80%+。覆盖范围包括夜间解析集成测试、Effect-TS 服务测试、消息可见性测试和 Selectors 选择器测试。新增测试并重构现有测试，确保代码质量。

</domain>

<decisions>
## Implementation Decisions

### 覆盖率目标
- 目标指标：分支覆盖率 80%+
- 关键路径优先，覆盖率逐步提升
- 生成 HTML 覆盖率报告供查看
- 覆盖率未达标时仅警告，不阻断合并

### 遗留测试处理
- 处理方式：重构优化现有测试
- Flaky tests：分析根本原因，标记并跳过，待后续修复
- 重构优先级：优先核心模块测试（game.test.ts、resolution/phase2-attack.test.ts）
- 命名风格：统一 BDD 风格（describe/it，"should..."）
- 目录结构：集成测试放 `__tests__/integration/`，单元测试与被测代码同目录（`.test.ts` 后缀）
- 风格一致：新测试遵循新标准，重构逐步跟进
- 测试框架：继续使用 `bun:test`
- 初始化：提取到共享的 `beforeEach/afterEach` 辅助函数
- 重复逻辑：提取到 `src/__tests__/helpers.ts` 辅助函数文件
- 类型问题：主逻辑类型优先，辅助类型可放宽
- 导出标记：标记为内部使用（internal/仅供测试）

### 测试数据策略
- 数据创建：工厂函数动态生成
- 工厂位置：`src/__tests__/helpers.ts`
- 边界值：提供专门的边界测试工厂（如 `makeMaxPlayersGameState()`）
- 命名规范：`make` 前缀（如 `makeGameState()`、`makePlayer()`）

### 测试组织结构
- 文件组织：按被测代码位置（同目录，如 `src/game/resolution.ts` → `src/game/resolution.test.ts`）
- 命名规范：`.test.ts` 后缀
- 集成测试：单独放 `__tests__/integration/`
- Effect-TS 服务测试：分散在各 Effect 源文件同级目录（如 `src/effect/services/attackResolutionService.test.ts`）

### Claude's Discretion
- 具体工厂函数的参数设计
- HTML 报告的样式和详细程度
- 重构的具体顺序和粒度

</decisions>

<specifics>
## Specific Ideas

- 参考已有 `src/effect/test-helpers.ts` 的模式，但要标记为内部使用
- 核心模块测试（夜间解析、Effect 服务）优先级最高
- 边界测试工厂用于测试极端场景（空数组、最大玩家数、特殊卡牌组合）

</specifics>

<deferred>
## Deferred Ideas

- 迁移到 Vitest 测试框架（当前继续使用 bun:test）
- CI/CD 集成覆盖率检查
- 覆盖率阻断合并配置
- IDE 覆盖率插件集成

</deferred>

---

*Phase: 04-test-coverage*
*Context gathered: 2026-02-17*
