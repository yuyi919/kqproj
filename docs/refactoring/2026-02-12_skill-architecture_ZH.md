# 技能架构重构（中文）

**Date:** 2026-02-12
**Category:** refactoring
**Description:** 统一技能结构 - 核心 + 扩展

---

## 摘要

将 witch-trial 技能架构从 4 个独立技能重构为统一的"核心 + 扩展"结构。新架构整合了 CLI 入口点，同时保持与现有技能调用的向后兼容。

**之前：**
```
.claude/skills/witch-trial/
├── maintenance/   #独立技能
├── development/   #独立技能
├── self-improving/#独立技能
└── translation/   #独立技能
```

**之后：**
```
.claude/skills/witch-trial/
├── SKILL.md
├── README.md
├── scripts/
│   ├── cli.ts         #统一CLI入口
│   └── shared/
├── core/              #核心技能
│   ├── maintenance/
│   ├── development/
│   └── documentation/
├── extensions/        #扩展技能
│   └── self-improving/
└── data/
    └── terminology.json
```

---

## 详情

### 问题陈述

原始技能结构有 4 个独立的技能实现，导致：
- 命令模式不一致
- 代码重复
- 难以维护

### 实施的解决方案

创建统一 CLI (`cli.ts`) 来路由到核心技能和扩展：
- **核心技能**：maintenance、development、documentation（必需操作）
- **扩展**：self-improving（可选功能）

### 关键技术变更

1. **统一 CLI 入口点**
   - 单一入口：`bun .claude/skills/witch-trial/scripts/cli.ts`
   - 基于参数模式的命令路由

2. **新日志命令**
   - 创建带日期前缀的独立日志文件：`YYYY-MM-DD_{title}.md`
   - 按主题自动分类（refactoring、patterns、guides）
   - 自动创建中英文双语版本
   - 在 CLAUDE.md 和 AGENTS.md 中自动索引

3. **术语映射**
   - 集中在 `data/terminology.json`
   - 支持中英文一致性

4. **自动双语创建**
   - 创建英文日志时自动创建中文版本
   - 无需用户每次提醒

---

## 关键决策

| 决策 | 理由 |
|------|------|
| 暂时保留旧技能 | 在删除前测试索引功能 |
| 日期前缀日志文件 | 比单文件追加更好的组织方式 |
| 自动双语创建 | 减少用户手动操作 |
| 自动索引 | 无需手动维护可发现性 |
| 核心 + 扩展拆分 | 分离必需与可选功能 |
| Bun 运行时 | 与现有项目工具一致 |

---

## 修改的文件

| 文件 | 变更 |
|------|------|
| `.claude/skills/witch-trial/scripts/cli.ts` | 创建统一 CLI |
| `.claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts` | 添加自动双语日志命令 |
| `.claude/skills/witch-trial/core/maintenance/` | 移至核心 |
| `.claude/skills/witch-trial/core/development/` | 移至核心 |
| `.claude/skills/witch-trial/data/terminology.json` | 添加术语映射 |

---

## 验证

### 测试的命令

```powershell
# 创建新日志（自动创建中英文版本）
bun scripts/improve.ts journal --title="Skill Architecture" --description="Unified skill structure"

# 同步所有索引
bun scripts/improve.ts sync
```

### 结果

- ✅ 自动创建英文和中文日志
- ✅ 日志文件使用正确命名格式
- ✅ 在 CLAUDE.md 和 AGENTS.md 中自动索引
- ✅ 无需用户手动触发翻译

---

## 经验教训

1. **文档结构很重要**：带日期前缀的文件比不断增长的单文件更容易导航
2. **自动化减少摩擦**：自动创建双语版本减轻用户负担
3. **自动索引**：开发者无需手动更新文档索引
4. **向后兼容**：保留旧技能可防止破坏性变更
5. **翻译技能已删除**：简单的字符串替换对实际翻译没有价值

---

## 相关变更

### 删除的翻译技能 (2026-02-13)

**原因**：简单的术语替换对实际翻译没有价值。

| 之前 | 之后 |
|------|------|
| `extensions/translation/` | 已删除 |

项目使用 `next-intl` 进行真正的国际化。简单的术语映射没有实际价值。

---

## 相关文档

- [GamePhase 重构日志](docs/refactoring/2026-02-13_gamephase-refactoring_ZH.md) - 之前的重构工作
- [CLAUDE.md](../../../../CLAUDE.md) - 项目说明（英文）
- [SKILL.md](SKILL.md) - 技能文档
