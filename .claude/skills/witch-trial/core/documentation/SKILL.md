---
name: witch-trial-documentation
description: Core skill for documentation patterns - CLAUDE.md, AGENTS.md, journals
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
│   ├── JOURNAL.md       # Main refactoring journal
│   └── JOURNAL_ZH.md    # Chinese version
├── patterns/
│   └── *.md             # Pattern documents
└── guides/
    └── *.md             # Guide documents
```

## Key Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions |
| `CLAUDE_ZH.md` | Chinese version |
| `AGENTS.md` | Agent workflows |
| `docs/rule.md` | Game rules |

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

- `/witch-trial` - Core skill
- `/witch-trial-self-improving` - Extension skill
- `/witch-trial-translation` - Extension skill
