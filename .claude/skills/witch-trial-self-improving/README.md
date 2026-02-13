---
name: witch-trial-self-improving
description: Quick start guide for the Witch Trial self-improving skill
author: Claude Code
version: 1.0.0
tags: [documentation, quick-start]
---

# Witch Trial Self-Improving Skill

A meta-skill for continuous improvement of project documentation.

## Quick Start

```bash
# Index the refactoring journal
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts index \
  --file docs/refactoring/JOURNAL.md \
  --title "GamePhase Refactoring Journal"

# Sync all indexes
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts sync

# Capture user guidance
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts capture \
  --guidance "Use enum values, not string literals" \
  --context "GamePhase enum refactoring" \
  --files "types/core.ts,game/moves.ts"
```

## Skill Contents

| File | Purpose |
|------|---------|
| `SKILL.md` | Complete skill documentation |
| `scripts/improve.ts` | Documentation improvement script |

## Invoke This Skill

Use this skill when:

- User provides guidance that should be preserved
- A new journal or pattern document is created
- Documentation needs to be synchronized
- A new pattern or convention emerges

Claude Code will read `SKILL.md` and understand the documentation improvement workflow.

## Core Capabilities

### 1. Incremental Updates

Add new content without rewriting:

```bash
bun scripts/improve.ts update \
  --file CLAUDE.md \
  --section "New Pattern" \
  --content "Pattern description..."
```

### 2. Journal Indexing

Automatically index new journals:

```bash
bun scripts/improve.ts index \
  --file docs/refactoring/JOURNAL.md \
  --title "Refactoring Journal"
```

### 3. Pattern Documents

Create new pattern documents:

```bash
bun scripts/improve.ts pattern \
  --name "Enum Export Pattern" \
  --content "Always export enum values, not just types..."
```

### 4. User Guidance Capture

Capture guidance from conversations:

```bash
bun scripts/improve.ts capture \
  --guidance "User's important guidance" \
  --context "During discussion about X"
```

## Document Organization

```
docs/
├── refactoring/
│   ├── JOURNAL.md       # Main journal
│   └── JOURNAL_ZH.md    # Chinese version
├── patterns/
│   └── ENUM-EXPORT.md   # Pattern documents
└── guides/
    └── TESTING.md       # Guide documents

CLAUDE.md                 # Main index
AGENTS.md                 # Agent workflow index
```

## Related

- **CLAUDE.md** - Main project instructions
- **AGENTS.md** - Agent workflows
- **Maintenance Skill** - `/witch-trial-maintenance`
- **Development Skill** - `/witch-trial-development`
