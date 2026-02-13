# 游戏阶段重构日志

**日期：** 2026-02-13
**作者：** Claude Code
**项目：** 魔女审判桌游引擎

---

## 1. 执行摘要

本文档记录了游戏阶段命名系统的完整重构过程，从字符串字面量转换为 TypeScript `枚举`，以提高类型安全性和可维护性。

### 所做更改

| 原名称 | 新名称 | 枚举值 | 用途 |
|--------|--------|--------|------|
| `voting` | `GamePhase.NIGHT` | `"night"` | 投票阶段（监禁） |
| `night` | `GamePhase.DEEP_NIGHT` | `"deepNight"` | 卡牌行动阶段 |

### 最终状态

| 指标 | 结果 |
|------|------|
| TypeScript 构建 | ✅ 0 个错误 |
| 测试 | ✅ 211 通过，0 失败 |
| 修改文件数 | 15+ |
| 文档 | ✅ 已更新 |

---

## 2. 决策背景

### 原有问题

代码库中阶段命名不一致：
- 阶段名称以字符串字面量形式分散在多个文件中
- 容易引入拼写错误，且只能在运行时发现
- 难以重构或重命名
- `voting`（投票）和 `night`（卡牌行动）之间存在混淆

### 决策过程（2026-02-12）

转换为 TypeScript 枚举：
```typescript
export enum GamePhase {
  MORNING = "morning",
  DAY = "day",
  NIGHT = "night",          // 原 "voting"
  DEEP_NIGHT = "deepNight", // 原 "night"
  RESOLUTION = "resolution",
  CARD_SELECTION = "cardSelection",
}
```

---

## 3. 实施过程

### 第一阶段：核心类型定义

**文件：** `packages/bgio-engine/src/types/core.ts`

创建枚举并添加描述性注释（后按用户要求简化）：

```typescript
export enum GamePhase {
  LOBBY = "lobby",
  SETUP = "setup",
  MORNING = "morning",
  DAY = "day",
  NIGHT = "night",
  DEEP_NIGHT = "deepNight",
  CARD_SELECTION = "cardSelection",
  RESOLUTION = "resolution",
  ENDED = "ended",
}
```

**关键学习：** 当枚举在多种上下文（类型和值）中使用时，需要同时导出值和类型。

**文件：** `packages/bgio-engine/src/types/index.ts`
```typescript
// GamePhase 需要值导出（不仅是类型），因为它是枚举
export { GamePhase } from "./core";
```

---

### 第二阶段：游戏逻辑更新

**修改的文件：**
- `game/phases.ts`
- `game/index.ts`
- `game/moves.ts`
- `game/assertions.ts`
- `contexts/GameContext.tsx`
- `utils.ts`

**更新示例（moves.ts）：**
```typescript
// 修改前
assertPhase(G, "night");

// 修改后
import { GamePhase } from "../types/core";
assertPhase(G, GamePhase.NIGHT);
```

---

### 第三阶段：UI 组件更新

**修改的文件：**
- `components/Board/ActionPanel.tsx`
- `components/ChatBox/MessageItem.tsx`
- `components/ui/PhaseBadge.tsx`

---

### 第四阶段：测试文件完全重写

**全部 8 个测试文件都已更新：**
- `game.test.ts`
- `attack.test.ts`
- `cardSelection.test.ts`
- `trade.test.ts`
- `voting.test.ts`
- `resolution.test.ts`
- `visibility.test.ts`
- `utils.test.ts`
- `testUtils.ts`

**关键挑战：** boardgame.io 的 `Ctx.phase` 类型期望字符串字面量，而非枚举值。测试工具需要处理这种不匹配。

---

### 第五阶段：文档更新

**更新的文件：**
- `packages/bgio-engine/CLAUDE.md`
- `docs/rule.md`（已使用中文术语，无需更改）

---

## 4. 错误与反思

### 错误 1：枚举的类型导入

**问题：** 最初使用 `import type { GamePhase }`，这只导入类型，不导入值。

```typescript
// 错误
import type { GamePhase } from "../types/core";
assertPhase(G, GamePhase.NIGHT); // 编译错误！
```

**错误信息：**
```
This comparison appears to be unconditional because the types have no overlapping properties
```

**解决方案：** 使用值导入：
```typescript
import { GamePhase } from "../types/core";
```

**反思：** 枚举在 TypeScript 中既是类型也是值。当在运行时比较中使用时，需要完整导入。

---

### 错误 2：测试中走捷径

**问题：** 尝试使用类型断言而非完全替换为枚举。

**用户指令：**
> "不要怎么简单怎么来，我需要保障正确性的最佳方式"

**解决方案：** 完全重写所有测试文件，将每个字符串字面量替换为枚举引用。

---

### 错误 3：遗留旧注释

**问题：** 留下了类似 "(原 voting)" 的注释，这会误导未来的开发者。

**示例：**
```typescript
/** 夜间阶段（投票），原 voting */  // 令人困惑！
NIGHT = "night",
```

**解决方案：** 简化为纯功能描述：
```typescript
/** 夜间阶段 */
NIGHT = "night",
```

**反思：** 文档应该描述事物"是什么"，而不是"曾经是什么"。

---

## 5. 经验教训

### 枚举重构

1. **理解导出模式：** 枚举需要值导出，而不仅仅是类型导出
2. **检查外部类型：** 了解外部库（boardgame.io）如何使用你的类型
3. **完全替换：** 不要将字符串字面量与枚举混合使用
4. **文档卫生：** 移除旧引用，不要添加 "(原 X)"

### TypeScript 项目

1. **首先运行构建：** 类型错误通常隐藏在构建阶段
2. **构建后测试：** 即使有类型错误，运行时测试也可能通过
3. **类型安全很重要：** 枚举可防止因拼写错误导致的运行时错误

---

## 6. 改进的必要性

### 重构前

| 问题 | 影响 |
|------|------|
| 到处都是字符串字面量 | 拼写错误只能在运行时发现 |
| 分散的阶段名称 | 文件间使用不一致 |
| 难以重命名 | 害怕破坏某些功能 |
| 无 IDE 支持 | 阶段名称无自动完成 |

### 重构后

| 改进 | 好处 |
|------|------|
| 集中定义 | 单一事实来源 |
| 类型安全 | 编译时错误检测 |
| IDE 支持 | 自动完成和重构工具 |
| 面向未来 | 轻松添加新阶段 |

---

## 7. 修改文件摘要

### 核心类型
- `src/types/core.ts` - GamePhase 枚举定义
- `src/types/index.ts` - GamePhase 导出修复

### 游戏逻辑
- `game/phases.ts` - 阶段配置
- `game/index.ts` - 主游戏定义
- `game/moves.ts` - 行动函数
- `game/assertions.ts` - 断言辅助函数

### 集成
- `contexts/GameContext.tsx` - 游戏上下文
- `utils.ts` - 选择器和工具函数
- `ui/formatters.ts` - UI 格式化器

### UI 组件
- `components/Board/ActionPanel.tsx`
- `components/ChatBox/MessageItem.tsx`
- `components/ui/PhaseBadge.tsx`

### 测试（8 个文件）
- `__tests__/game.test.ts`
- `__tests__/attack.test.ts`
- `__tests__/cardSelection.test.ts`
- `__tests__/trade.test.ts`
- `__tests__/voting.test.ts`
- `__tests__/resolution.test.ts`
- `__tests__/visibility.test.ts`
- `__tests__/utils.test.ts`
- `__tests__/testUtils.ts`

### 文档
- `packages/bgio-engine/CLAUDE.md`
- `docs/refactoring/JOURNAL.md`（本文档）
- `docs/refactoring/JOURNAL_ZH.md`（中文版）

---

## 8. 验证清单

- [x] TypeScript 构建通过（0 个错误）
- [x] 所有测试通过（211 通过，0 失败）
- [x] 无类似 "(原 voting)" 的遗留注释
- [x] 文档已更新
- [x] 创建英文和中文版本

---

## 9. 未来建议

### 立即执行
1. **添加阶段名称映射：** 考虑为枚举添加 `displayName` 用于 UI 显示
2. **单元测试覆盖：** 为阶段转换添加特定测试

### 长期
1. **阶段验证：** 为有效的阶段序列添加运行时断言
2. **文档链接：** 从 CLAUDE.md 链接到本文档
3. **迁移指南：** 记录未来重构的迁移过程

---

## 10. 附录：阶段流程参考

```
lobby → setup → morning → day → NIGHT → DEEP_NIGHT → resolution → (repeat)
         ↓                                              ↑
    (游戏结束) ←─────────────────────────────────────┘
```

| 阶段 | 代码 | 时长配置 | 描述 |
|------|------|---------|------|
| MORNING | `GamePhase.MORNING` | - | 死亡公告、讨论 |
| DAY | `GamePhase.DAY` | `dayDuration` | 讨论、交易 |
| NIGHT | `GamePhase.NIGHT` | `votingDuration` | 投票决定监禁 |
| DEEP_NIGHT | `GamePhase.DEEP_NIGHT` | `nightDuration` | 卡牌行动 |
| RESOLUTION | `GamePhase.RESOLUTION` | - | 行动结算 |

---

*文档生成日期：2026-02-13*
*项目：魔女审判桌游引擎*
*作者：Claude Code*
