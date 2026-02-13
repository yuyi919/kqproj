---
name: witch-trial-self-improving
description: This skill should be used when the user asks to "create journal", "create documentation", "add bilingual", "capture guidance", "sync indexes", or needs documentation improvement for the Witch Trial project. Provides bilingual journal creation, guidance capture, and index synchronization.
author: Claude Code
version: 1.0.0
tags: [witch-trial, self-improving, extension, documentation, journaling]
---

# Witch Trial Self-Improving (Extension)

Extension skill for continuous improvement of project documentation.

## When to Use Subagents

For complex documentation tasks, **proactively use subagents**:

- **Cross-repo pattern search** → Use `Explore` agent
- **Documentation planning** → Use `Plan` agent
- **Multi-file documentation updates** → Parallel `Task` calls

**Example workflow:**
```
1. Spawn Explore agent to find all related files
2. Use Task tool to update each file in parallel
3. Spawn Explore agent again to verify changes
```

## Purpose

- Create bilingual journal entries automatically
- Capture user guidance and add to journals
- Index new journal/pattern documents
- Keep CLAUDE.md and AGENTS.md synchronized

## Commands

```powershell
# Create bilingual journal (RECOMMENDED - auto-detects directory, creates both EN/ZH)
bun .claude/skills/witch-trial/scripts/cli.ts improve journal \
  --title="Feature Name" \
  --description="What this feature does"

# Create in specific directory
bun .claude/skills/witch-trial/scripts/cli.ts improve journal \
  --title="API Design" \
  --description="Pattern documentation" \
  --category="patterns"

# Index new document
bun .claude/skills/witch-trial/scripts/cli.ts improve index \
  --file=docs/refactoring/2026-02-13_feature-name.md \
  --title="Feature Name"

# Capture guidance
bun .claude/skills/witch-trial/scripts/cli.ts improve capture \
  --guidance="Use enum values" \
  --context="During refactoring"

# Sync indexes
bun .claude/skills/witch-trial/scripts/cli.ts improve sync
```

## Smart Directory Detection

The `journal` command automatically detects the best directory based on title/description:

| Keywords | Category |
|----------|----------|
| refactor, architecture, 重构, 架构 | `refactoring/` |
| pattern, design, 模式, 设计 | `patterns/` |
| guide, tutorial, 指南, 教程 | `guides/` |
| learn, study, 学习, 研究 | `learning/` |

If no keywords match, uses the most recently modified directory.

## File Naming Convention

| Type | Format | Example |
|------|--------|---------|
| English journal | `YYYY-MM-DD_{title}.md` | `2026-02-13_gamephase-refactoring.md` |
| Chinese version | `YYYY-MM-DD_{title}_ZH.md` | `2026-02-13_gamephase-refactoring_ZH.md` |
| Docs directory | `docs/{category}/` | `docs/refactoring/`, `docs/patterns/` |

**Important:** Date uses hyphens (`-`), underscore (`_`) only separates date/title/ZH.

## Scripts

Scripts are located at:
- `extensions/self-improving/scripts/improve.ts` - Self-improving script

## Related

- `/witch-trial` - Core skill
- `/witch-trial-documentation` - Documentation core skill
