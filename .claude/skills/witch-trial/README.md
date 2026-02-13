---
name: witch-trial
description: Quick start guide for the Witch Trial board game project
author: Claude Code
version: 1.0.0
tags: [witch-trial, quick-start, core]
---

# Witch Trial Project

Quick start guide for the Witch Trial board game project.

**Invoke skill:** `/witch-trial` or say "Witch Trial game..."

## Quick Start

```powershell
# Full verification
bun .claude/skills/witch-trial/scripts/cli.ts check

# Run tests
bun test packages/bgio-engine/src/__tests__/game.test.ts

# Start development server
pnpm dev
```

## Skill Structure

```
.claude/skills/witch-trial/
├── scripts/          # Unified CLI and shared utilities
├── core/             # Core skills
│   ├── maintenance/ # Tests, build, database
│   ├── development/ # Feature development
│   └── documentation/
├── extensions/       # Extension skills
│   └── self-improving/  # Documentation improvement
└── data/            # Shared terminology
```

## Core Skills

### Maintenance

```powershell
bun .claude/skills/witch-trial/scripts/cli.ts maintenance check
```

Use for:
- Running tests
- Type checking
- Build verification
- Database operations

### Development

```powershell
# Create new move
bun .claude/skills/witch-trial/scripts/cli.ts dev new:move trade

# Create test file
bun .claude/skills/witch-trial/scripts/cli.ts dev new:test vote
```

Use for:
- Adding new moves/cards
- Modifying game phases
- Creating UI components

## Project Agents

This project includes custom Claude Code agents:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `test-generator` | Generate unit tests | Writing tests for new features, adding regression tests |
| `fp-refactor-expert` | Code simplification & FP refactoring | Simplifying complex code, replacing custom utils with es-toolkit |

### Using Agents

```powershell
# Use test-generator for writing tests
# Say: "Use test-generator to write tests for this function"

# Use fp-refactor-expert for code simplification
# Say: "Use fp-refactor-expert to refactor this code"
```

### Natural Language Triggers

Just speak naturally and the agent will be invoked:

**test-generator:**
- "Write tests for this file"
- "Add unit tests for the new function"
- "I need test coverage for this module"
- "为这个函数写测试"

**fp-refactor-expert:**
- "Simplify this code"
- "Refactor this to use functional patterns"
- "This code is too complex"
- "Replace these utils with es-toolkit"
- "简化这段代码"

## Extension Skills

### Self-Improving (Documentation)

```powershell
# Create bilingual journal (auto-creates EN and ZH versions)
bun .claude/skills/witch-trial/scripts/cli.ts improve journal \
  --title="Feature Name" \
  --description="What this feature does"

# Index new journal
bun .claude/skills/witch-trial/scripts/cli.ts improve index \
  --file=docs/refactoring/2026-02-13_feature-name.md \
  --title="Feature Name"

# Capture user guidance
bun .claude/skills/witch-trial/scripts/cli.ts improve capture \
  --guidance="Use enum values" \
  --context="During refactoring"

# Sync all indexes
bun .claude/skills/witch-trial/scripts/cli.ts improve sync
```

Use for:
- Creating bilingual journal entries (auto-generated EN/ZH)
- Indexing new documentation
- Capturing user guidance
- Keeping CLAUDE.md and AGENTS.md synchronized

## Documentation

- **[CLAUDE.md](../../../../CLAUDE.md)** - Project instructions
- **[Game Rules](../../../../docs/rule.md)** - Game rules
- **[Refactoring Journal](../../../../docs/refactoring/2026-02-13_gamephase-refactoring.md)** - Development notes

## Related Skills

This is the unified skill. All operations are available via:

```powershell
bun .claude/skills/witch-trial/scripts/cli.ts <command> [options]
```

Commands: `maintenance`, `dev`, `docs`, `improve`

For detailed documentation, see **[SKILL.md](SKILL.md)**.

## Related Documents

- **[SKILL.md](SKILL.md)** - Core skill documentation
- **[CLAUDE.md](../../../../CLAUDE.md)** - Project instructions
