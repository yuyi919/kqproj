---
name: witch-trial-maintenance
description: Quick start guide for the Witch Trial maintenance skill
author: Claude Code
version: 1.0.0
tags: [maintenance, quick-start]
---

# Witch Trial Maintenance Skill

A specialized skill for maintaining the Witch Trial board game engine and web application.

## Quick Start

Use this skill when you need to:

```bash
# Check project status
bun .claude/skills/witch-trial-maintenance/scripts/maintenance.ts status

# Run specific test
bun .claude/skills/witch-trial-maintenance/scripts/maintenance.ts test game.test.ts

# Full verification
bun .claude/skills/witch-trial-maintenance/scripts/maintenance.ts check
```

## Skill Contents

| File | Purpose |
|------|---------|
| `SKILL.md` | Complete skill documentation |
| `scripts/maintenance.ts` | Common maintenance commands |

## Integration

This skill is automatically loaded by Claude Code. When you invoke it:

```bash
/skill witch-trial-maintenance
```

Claude Code will read `SKILL.md` and understand the project's maintenance conventions.

## Documentation Structure

1. **When to Use** - Task categories and exclusions
2. **Project Context** - Tech stack overview
3. **Standard Workflow** - Before/after change procedures
4. **Test-Driven Maintenance** - Running and debugging tests
5. **Type System** - GamePhase enum and status types
6. **Database** - Prisma operations
7. **Debugging** - Common issues and solutions
8. **Pre-Commit Checklist** - Verification steps
9. **Command Reference** - Quick lookup table
10. **Troubleshooting** - Common problems and fixes

## Design Principles

This skill follows Claude Code best practices:

1. **Purpose-Driven Scope** - Clear boundaries on what this skill handles
2. **Decision-Oriented** - When to use vs. when not to use
3. **Context-Rich** - Examples specific to this project
4. **Actionable** - Concrete commands and steps
5. **Cross-Referenced** - Links to existing documentation

## Maintenance Commands

```powershell
# Status overview
bun scripts/maintenance.ts status

# Run tests
bun scripts/maintenance.ts test game.test.ts

# Build check
bun scripts/maintenance.ts build

# Full verification
bun scripts/maintenance.ts check

# Prisma generation
bun scripts/maintenance.ts db:gen

# Lint all
bun scripts/maintenance.ts lint
```

## File Structure

```
.claude/skills/witch-trial-maintenance/
├── SKILL.md              # Main documentation
├── README.md             # This file
└── scripts/
    └── maintenance.ts    # Helper script
```

## Related

- [Project CLAUDE.md](../../../../CLAUDE.md)
- [Engine CLAUDE.md](../../../../packages/bgio-engine/CLAUDE.md)
- [Game Rules](../../../../docs/rule.md)
- [Refactoring Journal](../../../../docs/refactoring/JOURNAL.md)
