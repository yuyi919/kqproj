---
name: witch-trial-maintenance
description: Core skill for maintenance operations - tests, build, database, verification
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

- `/witch-trial` - Core skill
- `/witch-trial-development` - Development skill
- `/witch-trial-self-improving` - Self-improving skill
- `/witch-trial-translation` - Translation skill
