# Phase 1: Effect-TS 迁移 - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

完成 Effect-TS 服务层迁移，统一错误处理模式，保留遗留 domain 服务层代码作为兼容层。

目标服务：
- AttackResolutionService
- MessageService
- PlayerStateService

</domain>

<decisions>
## Implementation Decisions

### 错误处理统一
- 分层处理：Effect-TS 服务内部使用 TaggedError，边界转换后抛出 GameLogicError
- 边界转换：在 Effect-TS 层和游戏层之间进行错误转换
- 错误类型：具体错误类型（PlayerNotFound, CardNotFound, PhaseError 等）

### 向后兼容策略
- 双轨并存：新旧服务层共存，游戏层可选使用
- 配置驱动：通过配置决定使用哪个服务层
- 标记废弃：旧服务标记为 deprecated，后续移除
- 渐进切换：新增代码默认使用 Effect-TS，新服务稳定后全局切换

### 迁移策略
- 迁移顺序：按复杂度（简单到复杂）
- 起始服务：MessageService（最简单）
- 迁移粒度：服务级（整个服务迁移后一起测试）

### 测试策略
- 测试方法：自顶向下（先集成测试覆盖主要流程）
- 验证方式：新增集成测试验证服务交互
- 测试工具：使用现有工具（Bun test + 现有测试辅助函数）

</decisions>

<specifics>
## Specific Ideas

- 渐进切换：新代码使用 Effect-TS，逐步将旧代码迁移到新服务
- 边界转换：Effect-TS 内部使用 TaggedError，与游戏层交互时转换 GameLogicError

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-effect-ts*
*Context gathered: 2026-02-17*
