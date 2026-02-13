---
name: witch-trial
description: Quick start guide for the Witch Trial board game project
author: Claude Code
version: 1.0.0
tags: [witch-trial, quick-start, core]
---

# Witch Trial Project

Quick start guide for the Witch Trial board game project.

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
│   ├── self-improving/
│   └── translation/
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

## Extension Skills

### Self-Improving (Documentation)

```powershell
# Index new journal
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts index \
  --file=docs/refactoring/JOURNAL.md \
  --title="Refactoring Journal"

# Capture user guidance
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts capture \
  --guidance="Use enum values" \
  --context="During refactoring"
```

### Translation

```powershell
# Sync documentation
bun .claude/skills/witch-trial/extensions/translation/scripts/translate.ts sync --bidirectional

# Translate document
bun .claude/skills/witch-trial/extensions/translation/scripts/translate.ts translate \
  --source=docs/refactoring/JOURNAL.md \
  --target=docs/refactoring/JOURNAL_ZH.md
```

## Documentation

- **[CLAUDE.md](../../../../CLAUDE.md)** - Project instructions
- **[Game Rules](../../../../docs/rule.md)** - Game rules
- **[Refactoring Journal](../../../../docs/refactoring/JOURNAL.md)** - Development notes

## Related Skills

- `/witch-trial-maintenance` - Maintenance skill
- `/witch-trial-development` - Development skill
- `/witch-trial-self-improving` - Self-improving skill
- `/witch-trial-translation` - Translation skill
