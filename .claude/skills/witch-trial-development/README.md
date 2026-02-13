---
name: witch-trial-development
description: Quick start guide for the Witch Trial development skill
author: Claude Code
version: 1.0.0
tags: [development, quick-start]
---

# Witch Trial Development Skill

Quick start guide for developing the Witch Trial board game engine.

## Quick Start

```bash
# Run a single test file
bun test packages/bgio-engine/src/__tests__/game.test.ts

# Full verification
bun scripts/maintenance.ts check
```

## Skill Contents

| File | Purpose |
|------|---------|
| `SKILL.md` | Complete development guide |

## Invoke This Skill

When you need to:

- Add a new move or card
- Modify game rules
- Create new UI components
- Extend the message system

Claude Code will read `SKILL.md` and understand the development patterns.

## Development Patterns

### DDD + CQRS

```
Commands (Moves) ──modify──▶ Game State
Queries (Selectors) ◀──compute── Game State
```

### State Layers

```
Public State (all players see)
  └── Private State (per-player filtered)
        └── Messages (visibility rules)
```

### Phase Flow

```
morning → day → NIGHT → DEEP_NIGHT → resolution → (repeat)
```

## Common Tasks

| Task | Pattern |
|------|---------|
| Add move | Define in `moves.ts`, register in `phases.ts` |
| Add phase | Enum → phase config → flow integration |
| Add card | Type → definition → resolution |
| Add message | Interface → builder → filter |
| Add selector | Add to `Selectors` object |

## File Locations

```
packages/bgio-engine/src/
├── game/
│   ├── moves.ts       # Move functions
│   ├── phases.ts      # Phase configurations
│   └── resolution.ts   # Action resolution
├── types/
│   └── core.ts        # GamePhase enum, types
├── utils.ts           # Selectors, TMessageBuilder
└── __tests__/         # Test files
```

## Related

- **Maintenance** - `/witch-trial-maintenance`
- **CLAUDE.md** - `packages/bgio-engine/CLAUDE.md`
- **Rules** - `docs/rule.md`
