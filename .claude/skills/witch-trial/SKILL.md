---
name: witch-trial
description: Core skill for the Witch Trial board game project with shared resources and common patterns
author: Claude Code
version: 1.0.0
tags: [witch-trial, core, game-engine, boardgame-io]
---

# Witch Trial Core Skill

Core skill providing shared resources and common patterns for the Witch Trial board game project.

## Structure

```
.claude/skills/witch-trial/
├── SKILL.md           # Core skill documentation
├── README.md          # Quick start guide
├── scripts/           # Shared scripts
│   ├── cli.ts        # Unified CLI entry point
│   └── shared/       # Shared utilities
├── core/             # Core skills
│   ├── maintenance/  # Maintenance operations
│   ├── development/  # Feature development
│   └── documentation/# Documentation
├── extensions/       # Extension skills
│   └── self-improving/
└── data/             # Shared data
    └── terminology.json
```

## Quick Start

```powershell
# Run commands through unified CLI
bun .claude/skills/witch-trial/scripts/cli.ts --help

# Or use individual extension scripts
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts index --file=docs/refactoring/JOURNAL.md --title="Journal"
```

## Core Skills

| Skill | Purpose | Location |
|-------|---------|----------|
| Maintenance | Routine tasks (tests, build, DB) | `core/maintenance/` |
| Development | Feature development | `core/development/` |
| Documentation | Documentation patterns | `core/documentation/` |

## Extension Skills

| Skill | Purpose | Location |
|-------|---------|----------|
| Self-Improving | Documentation improvement | `extensions/self-improving/` |

## Shared Resources

### Terminology Map

Maintains consistent terminology across English and Chinese:

```json
{
  "Night": "夜间阶段",
  "Deep Night": "深夜阶段",
  "Morning": "晨间阶段",
  "Day": "午间阶段",
  "Move": "移动操作",
  "Phase": "阶段"
}
```

### Common Patterns

#### 1. Test-Driven Development

```typescript
// Test file pattern
describe("{Feature}", () => {
  describe("Happy Path", () => {
    it("should do expected thing", () => {
      // Arrange
      const state = createTestState();
      setupPlayers(state, ["p1", "p2", "p3"]);

      // Act
      const result = callMove(moveFunctions.featureName, context, arg);

      // Assert
      expect(result).toBeUndefined();
      expect(state.property).toBe(expectedValue);
    });
  });
});
```

#### 2. Phase-Based Assertion

```typescript
function assertPhase(G: GameState, phase: GamePhase) {
  if (G.phase !== phase) {
    throw new Error(`Expected phase ${phase}, got ${G.phase}`);
  }
}
```

#### 3. Incremental Documentation

```typescript
// Add section without rewriting
function addSection(file: string, section: string, content: string) {
  const existing = readFile(file);
  if (!existing.includes(`## ${section}`)) {
    const updated = existing + `\n## ${section}\n\n${content}`;
    writeFile(file, updated);
  }
}
```

## Commands Reference

### Core Commands

```powershell
# Maintenance
bun cli.ts maintenance check           # Full verification
bun cli.ts maintenance test <file>    # Run specific test
bun cli.ts maintenance build           # Type check

# Development
bun cli.ts dev new:move <name>        # Create move template
bun cli.ts dev new:test <name>        # Create test template

# Documentation
bun cli.ts docs update <file> <section> <content>
```

### Extension Commands

```powershell
# Self-Improving
bun cli.ts improve index --file=<path> --title=<title>
bun cli.ts improve capture --guidance=<text>
bun cli.ts improve sync
```

## Integration

This core skill integrates with:

- **[CLAUDE.md](../../../../CLAUDE.md)** - Project instructions
- **[packages/bgio-engine/CLAUDE.md](../../../../packages/bgio-engine/CLAUDE.md)** - Game engine patterns
- **[AGENTS.md](../../../../AGENTS.md)** - Agent workflows
- **[docs/rule.md](../../../../docs/rule.md)** - Game rules

## Related

- `/witch-trial-maintenance` - Maintenance skill
- `/witch-trial-development` - Development skill
- `/witch-trial-self-improving` - Self-improving skill
