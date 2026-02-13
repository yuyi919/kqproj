---
name: witch-trial
description: This skill should be used when the user asks about "Witch Trial", "boardgame.io game", "game testing", "game development", "run tests", "build project", or needs to work with the Witch Trial board game project. Provides unified CLI, development patterns, maintenance workflows, and bilingual documentation.
author: Claude Code
version: 1.0.0
tags: [witch-trial, core, game-engine, boardgame-io]
---

# Witch Trial Core Skill

Core skill providing shared resources and common patterns for the Witch Trial board game project.

## When to Use This Skill

Use `/witch-trial` when:
- Working with the Witch Trial board game project
- Running tests, build, or maintenance tasks (`maintenance check`, `maintenance test`)
- Adding new game features (`dev new:move`, `dev new:test`)
- Creating bilingual documentation journals (`improve journal`)
- Managing database operations

## When to Use Subagents

For complex tasks, **proactively use subagents**:

- **Cross-module exploration** → Use `Explore` agent
- **Multi-step implementation** → Use `Plan` agent or parallel `Task` calls
- **Codebase-wide searches** → Use `Explore` agent with "very thorough"

**Trigger:** Task involves >3 files or requires planning → spawn subagent

## Structure

```
.claude/skills/witch-trial/
├── SKILL.md           # Core skill documentation
├── README.md          # Quick start guide
├── scripts/           # Shared scripts
│   ├── cli.ts        # Unified CLI entry point
│   └── shared/       # Shared utilities
├── core/             # Core skills
│   ├── maintenance/  # Maintenance operations
│   ├── development/  # Feature development
│   └── documentation/# Documentation
├── extensions/       # Extension skills
│   └── self-improving/
└── data/             # Shared data
    └── terminology.json
```

## Quick Start

```powershell
# Run commands through unified CLI
bun .claude/skills/witch-trial/scripts/cli.ts --help

# Create bilingual journal (auto-detects directory based on content)
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts journal \
  --title="Feature Name" \
  --description="What this feature does"
```

## Core Skills

| Skill | Purpose | Location |
|-------|---------|----------|
| Maintenance | Routine tasks (tests, build, DB) | `core/maintenance/` |
| Development | Feature development | `core/development/` |
| Documentation | Documentation patterns | `core/documentation/` |

## Extension Skills

| Skill | Purpose | Location |
|-------|---------|----------|
| Self-Improving | Documentation improvement | `extensions/self-improving/` |

## Project Agents

This project includes custom Claude Code agents in `.claude/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `test-generator` | Generate unit tests | Writing tests for new features, adding regression tests, improving coverage |
| `fp-refactor-expert` | Code simplification & FP refactoring | Simplifying complex code, replacing custom utils with es-toolkit, applying functional patterns |

### Using Agents

```
User: "Use test-generator to write tests for this function"
→ Spawn test-generator agent to create test coverage

User: "Use fp-refactor-expert to refactor this code"
→ Spawn fp-refactor-expert agent to analyze and simplify
```

### Natural Language Triggers

Agents can be triggered naturally through conversation. Here are examples:

**This skill (witch-trial):**
- "Run tests for the game"
- "Build the project"
- "Add a new card to the game"
- "Create a bilingual journal"
- "运行测试"
- "添加新功能"

**test-generator:**
- "Write tests for this file"
- "Add unit tests for the new function"
- "I need test coverage for this module"
- "Write some tests"
- "为这个函数写测试"

**fp-refactor-expert:**
- "Simplify this code"
- "Refactor this to use functional patterns"
- "This code is too complex, can you simplify it?"
- "Replace these utils with es-toolkit"
- "简化这段代码"

## Shared Resources

### Terminology Map

Maintains consistent terminology across English and Chinese:

```json
{
  "Night": "夜间阶段",
  "Deep Night": "深夜阶段",
  "Morning": "晨间阶段",
  "Day": "午间阶段",
  "Move": "移动操作",
  "Phase": "阶段"
}
```

### Common Patterns

#### 1. Test-Driven Development

```typescript
// Test file pattern
describe("{Feature}", () => {
  describe("Happy Path", () => {
    it("should do expected thing", () => {
      // Arrange
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3"]);

      // Act
      const result = callMove(moveFunctions.featureName, context, arg);

      // Assert
      expect(result).toBeUndefined();
      expect(state.property).toBe(expectedValue);
    });
  });
});
```

#### 2. Phase-Based Assertion

```typescript
function assertPhase(G: GameState, phase: GamePhase) {
  if (G.phase !== phase) {
    throw new Error(`Expected phase ${phase}, got ${G.phase}`);
  }
}
```

#### 3. Incremental Documentation

```typescript
// Add section without rewriting
function addSection(file: string, section: string, content: string) {
  const existing = readFile(file);
  if (!existing.includes(`## ${section}`)) {
    const updated = existing + `\n## ${section}\n\n${content}`;
    writeFile(file, updated);
  }
}
```

## Commands Reference

### Core Commands

```powershell
# Maintenance
bun cli.ts maintenance check           # Full verification
bun cli.ts maintenance test <file>    # Run specific test
bun cli.ts maintenance build           # Type check

# Development
bun cli.ts dev new:move <name>        # Create move template
bun cli.ts dev new:test <name>        # Create test template

# Documentation
bun cli.ts docs update <file> <section> <content>
```

### Extension Commands (Self-Improving)

```powershell
# Create bilingual journal (recommended)
# Auto-detects directory based on title/description keywords
# - refactoring: 重构、架构
# - patterns: 模式、设计
# - guides: 指南、教程
# - learning: 学习、研究
bun cli.ts improve journal --title="Feature Name" --description="What it does"

# Create in specific directory
bun cli.ts improve journal --title="API Design" --category="patterns"

# Sync all documentation indexes
bun cli.ts improve sync
```

### File Naming Convention

| Type | Format | Example |
|------|--------|---------|
| English journal | `YYYY-MM-DD_{title}.md` | `2026-02-13_gamephase-refactoring.md` |
| Chinese version | `YYYY-MM-DD_{title}_ZH.md` | `2026-02-13_gamephase-refactoring_ZH.md` |
| Docs directory | `docs/{category}/` | `docs/refactoring/`, `docs/patterns/` |

## Integration

This core skill integrates with:

- **[CLAUDE.md](../../../../CLAUDE.md)** - Project instructions
- **[packages/bgio-engine/CLAUDE.md](../../../../packages/bgio-engine/CLAUDE.md)** - Game engine patterns
- **[AGENTS.md](../../../../AGENTS.md)** - Agent workflows
- **[docs/rule.md](../../../../docs/rule.md)** - Game rules

## Quick Reference

### CLI Commands

```powershell
# Run unified CLI
bun .claude/skills/witch-trial/scripts/cli.ts <command>

# Available commands:
#   maintenance ...  - Test, build, database operations
#   dev ...          - Development operations
#   docs ...         - Documentation operations
#   improve ...      - Documentation improvement
```

### Slash Commands

- `/witch-trial` - Invoke this skill
