---
name: witch-trial-self-improving
description: Quick start for Witch Trial self-improving operations
author: Claude Code
version: 1.0.0
tags: [witch-trial, self-improving, quick-start]
---

# Witch Trial Self-Improving

Quick start for documentation improvement.

## Commands

```powershell
# Index new document
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts index \
  --file=docs/refactoring/JOURNAL.md \
  --title="Refactoring Journal"

# Capture guidance
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts capture \
  --guidance="Important guidance" \
  --context="During discussion"

# Sync indexes
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts sync
```

## Script Location

`extensions/self-improving/scripts/improve.ts` - Self-improving script

## Related

- `/witch-trial` - Core skill
- `/witch-trial-translation` - Translation skill
