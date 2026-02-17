# Phase 3: 技术债务 - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

标准化日志记录，统一错误处理。

目标：
- src/game/moves.ts 使用日志服务
- src/game/phases.ts 使用日志服务
- 移除调试模式 Player ID "0" 硬编码
- 统一错误处理

</domain>

<decisions>
## Implementation Decisions

### 日志框架
- 使用 Effect-TS Context 实现日志服务
- 创建日志服务类封装日志功能
- 在 moves.ts 和 phases.ts 中使用日志服务替代 console.log

### 调试代码
- 使用配置开关控制调试模式
- 创建游戏配置对象管理调试设置

### 错误处理
- 统一使用 GameLogicError（由你决定）

</decisions>

<specifics>
## Specific Ideas

- Effect-TS Context 日志服务
- 配置开关控制调试模式

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---
*Phase: 03-tech-debt*
*Context gathered: 2026-02-17*
