---
name: witch-trial-documentation
description: This skill should be used when the user asks about "documentation", "CLAUDE.md", "AGENTS.md", "journal", or needs documentation patterns for the Witch Trial project. Provides patterns for adding sections, indexing documents, and maintaining project docs.
author: Claude Code
version: 1.0.0
tags: [witch-trial, documentation, core, patterns, claude]
---

# Witch Trial Documentation (Core)

Core skill for documentation patterns in the Witch Trial board game project.

## Documentation Structure

```
docs/
├── refactoring/
│   ├── 2026-02-13_gamephase-refactoring.md
│   └── 2026-02-13_gamephase-refactoring_ZH.md
├── patterns/
│   └── *.md             # Pattern documents
├── guides/
│   └── *.md             # Guide documents
└── learning/
    └── *.md             # Learning notes
```

## Key Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions (English) |
| `AGENTS.md` | Agent workflows (Chinese) |
| `docs/rule.md` | Game rules |
| `docs/refactoring/*.md` | Refactoring journals |

## Patterns

### Adding New Section

```typescript
function addSection(file: string, section: string, content: string) {
  const existing = readFile(file);
  if (!existing.includes(`## ${section}`)) {
    writeFile(file, existing + `\n## ${section}\n\n${content}`);
  }
}
```

### Indexing Document

```typescript
function indexDocument(file: string, title: string) {
  const entry = `| [\`${title}\`](${file}) | Description | ${date} |`;
  // Add to CLAUDE.md Journals table
}
```

## Related

- `/witch-trial` - Core skill (all operations via unified CLI)
  - `bun .claude/skills/witch-trial/scripts/cli.ts docs ...`
- `/witch-trial/extensions/self-improving/` - Extension for bilingual journal creation
