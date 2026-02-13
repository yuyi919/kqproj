---
name: witch-trial-self-improving
description: Meta-skill for continuous improvement of project documentation
author: Claude Code
version: 1.0.0
tags: [documentation, self-improving, journaling, patterns]
---

# Witch Trial Self-Improving Skill

A meta-skill for continuous improvement of project documentation.

## Purpose

This skill maintains and improves project documentation by:

| Capability | Description |
|-----------|-------------|
| **Incremental Updates** | Add user guidance to CLAUDE.md and AGENTS.md |
| **Journal Indexing** | Automatically index new journal documents |
| **Cross-Reference** | Keep documentation synchronized |
| **Pattern Capture** | Document emerging patterns and decisions |

**When to Use:**

- User provides guidance that should be preserved
- A new journal/document is created
- A pattern or convention emerges that should be documented
- Documentation needs synchronization across files

**When NOT to Use:**

- Routine code changes (use development/maintenance skills)
- Single-use temporary notes
- Personal notes not meant for the project

---

## Core Principles

### Principle 1: Incremental Improvement

Documentation should grow incrementally, not be rewritten:

```typescript
// ✅ Correct - add new section
## New Pattern
Description...

// ❌ Wrong - rewrite entire file
# Complete Rewrite
```

### Principle 2: Indexed Discovery

All documents should be discoverable from CLAUDE.md:

```
CLAUDE.md
├── Project Overview
├── Architecture
├── Patterns (indexed)
│   └── See: docs/patterns/*.md
├── Journals (indexed)
│   └── See: docs/refactoring/*.md
└── Resources
```

### Principle 3: Single Source of Truth

Each topic has one canonical location:

- **Project-wide patterns**: `CLAUDE.md` → links to `docs/patterns/`
- **Game engine patterns**: `packages/bgio-engine/CLAUDE.md` → links to `docs/engine/`
- **Journals**: `docs/refactoring/JOURNAL.md` → indexed in both CLAUDE.md files

---

## Index Structure

### CLAUDE.md Journal Index

**Location:** Add new entry under "## Related Documentation" or create "## Journals" section

```markdown
## Journals

| Document | Description | Date |
|----------|-------------|------|
| [JOURNAL.md](docs/refactoring/JOURNAL.md) | GamePhase enum refactoring | 2026-02-13 |
| [REFACTORING.md](docs/refactoring/) | Refactoring history | 2026-02-12 |
```

### AGENTS.md Journal Index

**Location:** Add under appropriate section

```markdown
### Refactoring Journals

- `docs/refactoring/JOURNAL.md` - Complete refactoring documentation
- `docs/refactoring/JOURNAL_ZH.md` - Chinese version
```

---

## Commands

### Updating Documentation

```powershell
# Update CLAUDE.md with user guidance
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts update --file CLAUDE.md --section "Game Phases" --content "New guidance..."

# Update AGENTS.md with user guidance
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts update --file AGENTS.md --section "New Section" --content "..."

# Index a new journal document
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts index --file docs/refactoring/JOURNAL.md --title "Refactoring Journal" --description "Complete refactoring documentation"

# Sync all indexes
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts sync
```

### Interactive Mode

```powershell
# Run in interactive mode
bun .claude/skills/witch-trial-self-improving/scripts/improve.ts interactive
```

---

## Usage Patterns

### Pattern 1: Capture User Guidance

When user provides important guidance:

```typescript
// User says: "不要在文档中使用(原 voting)这种描述"
// Don't use "(formerly X)" descriptions in documentation

// Action: Update documentation
await captureUserGuidance({
  type: "documentation-rule",
  guidance: "Don't use '(原 X)' patterns in documentation",
  context: "During GamePhase enum refactoring",
  files: ["CLAUDE.md", "packages/bgio-engine/CLAUDE.md"],
});
```

### Pattern 2: Document New Pattern

When a new pattern emerges:

```typescript
// A new pattern is discovered:
// - Enum needs value export, not just type export
// - boardgame.io Ctx.phase uses strings, not enums

// Action: Create pattern document and index it
await documentPattern({
  name: "Enum Export Pattern",
  description: "Enum values must be exported when used as runtime values",
  examples: [
    "// ✅ Correct",
    "import { GamePhase } from './types';",
    "",
    "// ❌ Wrong",
    "import type { GamePhase } from './types';",
  ],
  files: ["types/index.ts", "game/moves.ts"],
});
```

### Pattern 3: Index New Journal

When creating a new journal document:

```typescript
// Created: docs/refactoring/JOURNAL.md
// Created: docs/refactoring/JOURNAL_ZH.md

// Action: Update indexes
await indexJournal({
  journalFile: "docs/refactoring/JOURNAL.md",
  title: "GamePhase Refactoring Journal",
  description: "Complete documentation of GamePhase enum refactoring",
  date: "2026-02-13",
});
```

---

## File Organization

### Document Categories

| Category | Location | Indexed In |
|----------|----------|------------|
| Patterns | `docs/patterns/` | CLAUDE.md, AGENTS.md |
| Journals | `docs/refactoring/` | CLAUDE.md, AGENTS.md |
| Guides | `docs/guides/` | CLAUDE.md |
| API | `docs/api/` | packages/bgio-engine/CLAUDE.md |

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Journal | `JOURNAL.md` | `docs/refactoring/JOURNAL.md` |
| Pattern | `PATTERN-NAME.md` | `docs/patterns/ENUM-EXPORT.md` |
| Guide | `GUIDE-TOPIC.md` | `docs/guides/TESTING.md` |

---

## Workflow Examples

### Example 1: User Corrects Documentation

**User says:**
> "不要使用原来的描述，用夜间阶段代替投票阶段，深夜阶段代替夜间阶段"

**Action:**
```typescript
await updateDocumentation({
  file: "packages/bgio-engine/src/types/core.ts",
  pattern: /\*\* 投票阶段 \*\//,
  replacement: "/** 夜间阶段 **/",
  rationale: "User specified naming convention",
});

await updateDocumentation({
  file: "packages/bgio-engine/src/types/core.ts",
  pattern: /\*\* 卡牌行动阶段 \*\//,
  replacement: "/** 深夜阶段 **/",
  rationale: "Consistent with user's naming convention",
});
```

### Example 2: Documenting a Mistake

**Mistake made:** Used `import type` for enum

**Action:**
```typescript
await createJournalEntry({
  title: "Enum Import Mistake",
  date: "2026-02-13",
  content: `
## Mistake: Type-Only Import for Enum

### Problem
Used \`import type { GamePhase }\` which only imports the type, not the value.

### Error
\`This comparison appears to be unconditional because the types have no overlapping properties\`

### Solution
\`import { GamePhase } from './types/core';\`

### Files Affected
- game/moves.ts
- game/assertions.ts
  `,
});

await indexJournal({
  journalFile: "docs/refactoring/JOURNAL.md",
  // ... index the journal
});
```

### Example 3: Adding New Pattern

**Pattern discovered:** GamePhase enum usage

**Action:**
```typescript
await createPatternDocument({
  name: "GamePhase-Enum-Usage",
  title: "GamePhase Enum Usage Pattern",
  content: `
## When to Use GamePhase

Always use the enum instead of string literals:

\`\`\`typescript
// ✅ Correct
assertPhase(G, GamePhase.NIGHT);

// ❌ Wrong
assertPhase(G, "night");
\`\`\`
  `,
});

await updateCLAUDEIndex({
  section: "Game Engine Patterns",
  entry: {
    name: "GamePhase Enum",
    file: "docs/patterns/GAMEPHASE-ENUM.md",
    description: "How to use GamePhase enum correctly",
  },
});
```

---

## Scripts

### improve.ts

Main script for documentation improvement:

```powershell
# Update documentation
bun scripts/improve.ts update --file CLAUDE.md --section "Patterns" --content "..."

# Index a document
bun scripts/improve.ts index --file docs/refactoring/JOURNAL.md

# Sync all indexes
bun scripts/improve.ts sync

# Interactive mode
bun scripts/improve.ts interactive
```

---

## Checklist

Before committing documentation changes:

- [ ] New content is in the right location
- [ ] Index is updated in CLAUDE.md
- [ ] Index is updated in AGENTS.md (if applicable)
- [ ] Cross-references are valid
- [ ] Document follows project conventions
- [ ] Both English and Chinese versions (if applicable)

---

## Related Documentation

- **CLAUDE.md** - Main project instructions
- **AGENTS.md** - Agent workflows and patterns
- **packages/bgio-engine/CLAUDE.md** - Game engine specifics
- `docs/refactoring/JOURNAL.md` - Refactoring history
- `docs/refactoring/JOURNAL_ZH.md` - Chinese version

---

*Use this skill to continuously improve project documentation based on user guidance and emerging patterns.*
