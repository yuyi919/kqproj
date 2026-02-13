---
name: witch-trial-maintenance
description: This skill should be used when the user asks to "run tests", "build project", "check types", "lint code", "database migration", or needs maintenance operations for the Witch Trial project. Provides test running, type checking, build verification, and database operations.
author: Claude Code
version: 1.0.0
tags: [witch-trial, maintenance, core, testing, build, database]
---

# Witch Trial Maintenance (Core)

Core skill for maintenance operations in the Witch Trial board game project.

## When to Use

| Task Category | Examples |
|--------------|----------|
| **Code Quality** | Running tests, type checking, linting, building |
| **Database** | Migrations, schema changes, Prisma operations |
| **Verification** | Pre-commit checks, PR validation, release preparation |
| **Debugging** | Investigating test failures, type errors |

**Do NOT use this skill** for:
- Implementing new game features (use development skill)
- UI component development
- API route creation

## Commands

```powershell
# Status overview
bun .claude/skills/witch-trial/scripts/cli.ts maintenance status

# Run tests
bun .claude/skills/witch-trial/scripts/cli.ts maintenance test

# Build check
bun .claude/skills/witch-trial/scripts/cli.ts maintenance build
```

## Scripts

Scripts are located at:
- `scripts/maintenance.ts` - Maintenance helper script

## Related

- `/witch-trial` - Core skill (all operations via unified CLI)
  - `bun .claude/skills/witch-trial/scripts/cli.ts maintenance ...`
