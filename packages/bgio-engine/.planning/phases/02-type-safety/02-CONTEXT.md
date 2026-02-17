# Phase 2: 类型安全 - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

移除 any 类型，提升类型安全。为测试辅助函数添加完整类型签名。

目标：
- src/effect/test-helpers.ts 无 any 类型
- src/game/index.ts 无类型强制转换
- 所有测试辅助函数有完整类型签名

</domain>

<decisions>
## Implementation Decisions

### 类型签名完善
- 优先级：核心函数优先（只修复影响编译的核心函数）
- 函数类型签名：使用泛型保持灵活性
- 验证方式：使用 TypeScript 严格模式检查

</decisions>

<specifics>
## Specific Ideas

- 核心函数优先：修复影响编译的核心测试辅助函数
- 使用泛型：为通用函数添加泛型类型参数
- 严格模式：通过 TypeScript 严格模式验证

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-type-safety*
*Context gathered: 2026-02-17*
