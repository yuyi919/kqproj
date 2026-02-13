---
name: witch-trial-maintenance
description: Specialized skill for maintaining the Witch Trial board game engine and web application
author: Claude Code
version: 1.0.0
tags: [maintenance, testing, build, database, prisma, verification]
---

# Witch Trial Maintenance Skill

A specialized skill for maintaining the Witch Trial board game engine and web application.

## When to Use

Use this skill when performing any of these tasks:

| Task Category | Examples |
|--------------|----------|
| **Code Quality** | Running tests, type checking, linting, building |
| **Database** | Migrations, schema changes, Prisma operations |
| **Game Engine** | Adding moves, modifying phases, updating rules |
| **Debugging** | Investigating test failures, type errors, runtime issues |
| **Verification** | Pre-commit checks, PR validation, release preparation |

**Do NOT use this skill** for:
- Implementing new game features (use `/witch-trial-development` skill instead)
- UI component development (use React patterns)
- API route creation (follow Hono patterns in CLAUDE.md)

## Project Context

### Tech Stack

```
┌─────────────────────────────────────────┐
│         Next.js 16 (apps/web)           │
├─────────────────────────────────────────┤
│  Refine + Ant Design  │  boardgame.io  │
├───────────────────────┼────────────────┤
│   Prisma ORM          │   Hono API     │
├───────────────────────┼────────────────┤
│   PostgreSQL          │   Zero Sync    │
└───────────────────────┴────────────────┘
```

### Key Entry Points

| Component | Path | Command |
|-----------|------|---------|
| Web App | `apps/web/` | `pnpm --filter @whole-ends-kneel/web dev` |
| Game Engine | `packages/bgio-engine/` | `bun test` |
| Database | `apps/web/prisma/` | `npx prisma migrate dev` |

## Standard Maintenance Workflow

### Before Any Change

```powershell
# 1. Verify current state
bun test packages/bgio-engine/src/__tests__/game.test.ts

# 2. Run type check
cd packages/bgio-engine; pnpm build

# 3. Check for issues in web app
cd apps/web; pnpm lint
```

### After Making Changes

```powershell
# 1. Build game engine (catches type errors)
cd packages/bgio-engine; pnpm build

# 2. Run all game engine tests
bun test packages/bgio-engine/src/

# 3. Verify web app still builds
cd apps/web; pnpm build
```

## Test-Driven Maintenance

### Running Tests

**Single test file (fastest for iteration):**
```powershell
bun test packages/bgio-engine/src/__tests__/game.test.ts
```

**All game engine tests:**
```powershell
bun test packages/bgio-engine/src/
```

**Web app tests:**
```powershell
pnpm --filter @whole-ends-kneel/web test
```

### Understanding Test Output

```
[Vote] p1 votes for p2          # Console log from move function
[Phase] Voting phase ended       # Phase transition log
VoteResult Participation: 66.7%  # Selector computation log

211 pass  ✅ All tests passed
0 fail
496 expect() calls  # Test coverage indicator
```

### Fixing Test Failures

**Step 1: Identify the failing test**
```powershell
bun test packages/bgio-engine/src/__tests__/game.test.ts --verbose
```

**Step 2: Check if it's a type error first**
```powershell
cd packages/bgio-engine; pnpm build
```

**Step 3: Common failure patterns:**

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `INVALID_MOVE` | Assertion failed | Check move precondition in `game/assertions.ts` |
| State not updated | Missing mutation | Add state change in move function |
| Type error | Enum/string mismatch | Use correct type (see Type System below) |
| Test timeout | Async operation | Ensure proper awaiting |

## Type System Conventions

### GamePhase Enum

Always use the enum, never string literals:

```typescript
// ✅ Correct
import { GamePhase } from "../types/core";
if (G.status === GamePhase.NIGHT) { ... }

// ❌ Wrong - string literals are error-prone
if (G.status === "night") { ... }
```

**Available phases:**
```typescript
GamePhase.MORNING      // 晨间阶段 - Death announcements
GamePhase.DAY          // 午间阶段 - Trading
GamePhase.NIGHT        // 夜间阶段 - Voting
GamePhase.DEEP_NIGHT   // 深夜阶段 - Card actions
GamePhase.RESOLUTION   // 结算阶段 - Action resolution
```

### Player Status Types

```typescript
// Private status (complete state)
type PlayerStatus = "alive" | "dead" | "witch" | "wreck"

// Public status (what others see)
type PublicPlayerStatus = "alive" | "dead"  // "witch" displays as "alive"
```

## Database Maintenance

### Before Schema Changes

```powershell
# 1. Pull latest schema
pnpm --filter @whole-ends-kneel/web db:pull

# 2. Generate client
pnpm --filter @whole-ends-kneel/web db:gen

# 3. Backup if needed (use Supabase dashboard)
```

### Creating Migrations

```powershell
cd apps/web
npx prisma migrate dev --name descriptive_migration_name

# After creating, verify:
npx prisma migrate status
```

### Common Prisma Tasks

| Task | Command | Notes |
|------|---------|-------|
| Generate types | `pnpm db:gen` | After schema or migration changes |
| Push schema | `pnpm db:push` | For development only, not production |
| Studio | `npx prisma studio` | GUI for inspecting data |
| Reset DB | `npx prisma migrate reset` | Drops and recreates, data loss! |

### Migration Best Practices

1. **One change at a time** - Each migration should do one thing
2. **Descriptive names** - `add_user_avatar_column` not `update1`
3. **Test migrations** - Run on a copy before production
4. **Document breaking changes** - Update `CLAUDE.md` and `AGENTS.md`

## Debugging Procedures

### Game State Issues

```typescript
// In move function, add console logs
console.log(`[Move] ${playerID} attempting action`);
console.log(`[State] Current phase: ${G.status}`);
console.log(`[Player] Alive: ${Selectors.isPlayerAlive(G, playerID)}`);
```

**Common log prefixes:**
```
[Vote]      - Voting phase actions
[Phase]     - Phase transitions
[Move]      - Move function execution
[State]     - State inspection
[Error]     - Error conditions
```

### Type Errors

1. **Build first** - `cd packages/bgio-engine; pnpm build`
2. **Check imports** - Enum needs value import, not just type
3. **Check Ctx types** - boardgame.io uses `string` for ctx.phase
4. **Verify exports** - Check `types/index.ts` for correct exports

### Test Failures

**Investigation workflow:**

```powershell
# 1. Run single failing test with verbose
bun test packages/bgio-engine/src/__tests__/game.test.ts -t "should imprison player"

# 2. Check if setup is correct
# Look at testUtils.ts for createTestState(), createMoveContext()

# 3. Verify test assumptions
# Compare with similar passing tests
```

## Pre-Commit Checklist

Before committing changes, verify:

- [ ] `pnpm build` passes (game engine)
- [ ] `bun test packages/bgio-engine/src/` passes
- [ ] No new lint warnings
- [ ] Database migrations are production-safe
- [ ] Documentation updated if needed
- [ ] Type definitions are correct

## Command Reference

### Game Engine (packages/bgio-engine)

| Command | Purpose |
|---------|---------|
| `bun test` | Run all tests |
| `bun test game.test.ts` | Single file |
| `pnpm build` | TypeScript compilation |
| `pnpm lint` | Code quality |

### Web App (apps/web)

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm db:gen` | Prisma client |
| `npx prisma migrate dev` | Migration |

### Database (from apps/web/)

| Command | Purpose |
|---------|---------|
| `npx prisma migrate dev` | Create migration |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma studio` | GUI viewer |
| `npx prisma migrate reset` | Reset (data loss!) |

## Related Documentation

- **CLAUDE.md** - Project-wide context and architecture
- **packages/bgio-engine/CLAUDE.md** - Game engine specifics
- **docs/rule.md** - Game rules and mechanics
- **docs/refactoring/JOURNAL.md** - Refactoring history
- **AGENTS.md** - Agent patterns and workflows

## File Patterns

### When Modifying

| Pattern | Location | Check |
|---------|----------|-------|
| Game moves | `game/moves.ts` | Tests pass |
| Phase config | `game/phases.ts` | Phase transitions work |
| Types | `types/core.ts` | Build passes |
| Assertions | `game/assertions.ts` | Tests pass |
| Test utilities | `__tests__/testUtils.ts` | All tests pass |

### When Adding

| New | Place in | Template |
|-----|----------|----------|
| Move function | `game/moves.ts` | See existing moves |
| Test file | `__tests__/NAME.test.ts` | Use testUtils.ts |
| Component | `components/` | Follow existing patterns |

## Troubleshooting

### "Module not found" after changes

```powershell
# Regenerate TypeScript
cd packages/bgio-engine; pnpm build

# If that fails, clear cache
rm -rf node_modules/.tsbuildinfo
pnpm build
```

### Tests pass but build fails

This means type errors exist. Fix types before proceeding:

```powershell
cd packages/bgio-engine; pnpm build
# Read errors carefully, they indicate type issues
```

### Prisma migration conflicts

```powershell
# Check migration status
cd apps/web; npx prisma migrate status

# If in development, reset is acceptable
npx prisma migrate reset
```

### Bun test hangs

```powershell
# Run with timeout
bun test --timeout 30000

# Or run single file
bun test packages/bgio-engine/src/__tests__/game.test.ts
```

---

*This skill is maintained by the project team. Update when project conventions change.*
