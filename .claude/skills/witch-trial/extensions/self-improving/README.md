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
# Create bilingual journal (auto-creates EN and ZH versions)
bun .claude/skills/witch-trial/scripts/cli.ts improve journal \
  --title="Feature Name" \
  --description="What this feature does"

# Index new document
bun .claude/skills/witch-trial/scripts/cli.ts improve index \
  --file=docs/refactoring/2026-02-13_feature-name.md \
  --title="Feature Name"

# Capture guidance
bun .claude/skills/witch-trial/scripts/cli.ts improve capture \
  --guidance="Important guidance" \
  --context="During discussion"

# Sync indexes
bun .claude/skills/witch-trial/scripts/cli.ts improve sync
```

## Script Location

`extensions/self-improving/scripts/improve.ts` - Self-improving script

## Related

- `/witch-trial` - Core skill (unified CLI)
