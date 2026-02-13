---
name: witch-trial-self-improving
description: Extension skill for documentation improvement - guidance capture, journal indexing
author: Claude Code
version: 1.0.0
tags: [witch-trial, self-improving, extension, documentation, journaling]
---

# Witch Trial Self-Improving (Extension)

Extension skill for continuous improvement of project documentation.

## Purpose

- Capture user guidance and add to journals
- Index new journal/pattern documents
- Keep CLAUDE.md and AGENTS.md synchronized

## Commands

```powershell
# Index new document
bun .claude/skills/witch-trial/scripts/cli.ts improve index \
  --file=docs/refactoring/JOURNAL.md \
  --title="Refactoring Journal"

# Capture guidance
bun .claude/skills/witch-trial/scripts/cli.ts improve capture \
  --guidance="Use enum values" \
  --context="During refactoring"

# Sync indexes
bun .claude/skills/witch-trial/scripts/cli.ts improve sync
```

## Scripts

Scripts are located at:
- `extensions/self-improving/scripts/improve.ts` - Self-improving script

## Related

- `/witch-trial` - Core skill
- `/witch-trial-documentation` - Documentation core skill
- `/witch-trial-translation` - Translation skill
