---
name: witch-trial-development
description: Core skill for development operations - adding moves, cards, phases
author: Claude Code
version: 1.0.0
tags: [witch-trial, development, core, game-engine, boardgame-io]
---

# Witch Trial Development (Core)

Core skill for development operations in the Witch Trial board game project.

## When to Use

| Task Category | Examples |
|--------------|----------|
| **New Features** | Adding new card types, new moves, new game phases |
| **Game Logic** | Modifying rules, changing win conditions |
| **State Management** | Adding new state properties, computed selectors |
| **UI Components** | Creating new game UI |

**Do NOT use this skill** for:
- Routine maintenance (use maintenance skill)
- Database migrations
- Build/deployment issues

## Commands

```powershell
# Create new move
bun .claude/skills/witch-trial/scripts/cli.ts dev new:move trade

# Create new test
bun .claude/skills/witch-trial/scripts/cli.ts dev new:test vote
```

## Scripts

Scripts are located at:
- `scripts/develop.ts` - Development helper script

## Related

- `/witch-trial` - Core skill
- `/witch-trial-maintenance` - Maintenance skill
- `/witch-trial-self-improving` - Self-improving skill
- `/witch-trial-translation` - Translation skill
