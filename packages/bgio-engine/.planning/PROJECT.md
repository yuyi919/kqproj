# bgio-engine 质量改进项目

## What This Is

对 Witch Trial 桌游引擎进行全面的代码质量改进，包括完成 Effect-TS 服务层迁移、修复类型安全问题、提升测试覆盖率，并清理技术债务。

## Core Value

建立稳定、可维护、可测试的游戏引擎架构，为后续功能开发奠定坚实基础。

## Requirements

### Validated

- ✓ 游戏核心机制（投票、夜间行动、阶段转换）— 已实现
- ✓ 消息系统（TMessage 标签联合类型）— 已实现
- ✓ React UI 组件（Board、PlayerList、ChatBox 等）— 已实现
- ✓ 基础测试框架（Bun test + 测试工具）— 已实现

### Active

- [ ] 完成 Effect-TS 服务层迁移 — 统一错误处理和依赖注入
- [ ] 修复类型安全问题（移除 any 类型）— 提升类型安全
- [ ] 清理技术债务（移除 console.log、混合错误模式）— 提升代码质量
- [ ] 提升测试覆盖率至 80%+ — 确保核心逻辑稳定
- [ ] 添加单元测试和集成测试 — 覆盖关键路径

### Out of Scope

- 新功能开发 — 聚焦代码质量改进
- AI 对手实现 — 后续迭代
- 性能优化 — 质量改进完成后处理

## Context

**现有架构：**
- 混合 DDD + CQRS + Effect-TS 架构
- 6 层结构：Types → Domain (CQRS) → Effect → Game → Components → Hooks
- boardgame.io 用于多人游戏状态管理
- 存在两套并行系统：遗留 domain 层 + 新兴 Effect-TS 服务层

**已识别问题（来自代码库分析）：**
1. Effect-TS 集成不完整 — 新服务层部分实现但未完全集成
2. 混合错误处理模式 — 同时使用 GameLogicError 和 Effect-TS Data.TaggedError
3. 类型安全问题 — 多处使用 any 类型
4. 生产环境 console.log — 影响性能
5. 测试覆盖不足 — 关键路径缺少测试

## Constraints

- **技术栈**: 保持现有 TypeScript + boardgame.io + Effect-TS 技术栈
- **兼容性**: 保持与现有游戏的向后兼容
- **测试**: 使用 Bun test 作为测试运行器

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 采用 Effect-TS | 更好的依赖注入和错误处理 | — Pending |
| 使用 Bun test | 轻量级测试运行器，已集成在项目中 | — Pending |

---
*Last updated: 2026-02-17 after initialization*
