---
name: witch-trial-maintenance
description: Quick start for Witch Trial maintenance operations
author: Claude Code
version: 1.0.0
tags: [witch-trial, maintenance, quick-start]
---

# Witch Trial Maintenance

Quick start for maintenance operations.

## Commands

```powershell
# Check project status
bun .claude/skills/witch-trial/scripts/cli.ts maintenance status

# Run tests
bun .claude/skills/witch-trial/scripts/cli.ts maintenance test game.test.ts

# Full verification
bun .claude/skills/witch-trial/scripts/cli.ts check
```

## Script Location

`scripts/maintenance.ts` - Maintenance helper script

## Related

- `/witch-trial` - Core skill (unified CLI)
