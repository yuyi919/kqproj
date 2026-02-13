# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Project Type:** Monorepo with a single Next.js application
**Primary App:** `apps/web` - A full-stack web application featuring a multiplayer "Witch Trial" board game
**Package Manager:** pnpm (workspace monorepo)
**Runtime:** Node.js 20+, Bun (for testing and WebSocket server)

## Architecture

### Tech Stack

- **Framework:** Next.js 16 with App Router
- **UI Framework:** Refine (admin/b2b framework) + Ant Design v6
- **Game Engine:** boardgame.io for real-time multiplayer game logic
- **Database:** PostgreSQL with Prisma ORM + ROCICORP Zero (real-time sync)
- **Authentication:** Supabase (with Clerk router integration for custom auth)
- **Real-time Communication:** Socket.IO with Postgres adapter
- **API:** Hono (lightweight web framework) for edge-compatible API routes
- **Internationalization:** next-intl (English + Chinese)
- **Styling:** Tailwind CSS v4 + Ant Design
- **State Management:** TanStack React Query (server state), Zustand (client state implied by dependencies)

## Custom Skills

This project includes custom Claude Code skills:

| Skill | Purpose |
|-------|---------|
| `/witch-trial` | Unified CLI + core skills + extensions |

**Recommended:** Use `/witch-trial` for all project operations via unified CLI.

### Skill Documentation

| Document | Description |
|----------|-------------|
| [`.claude/skills/witch-trial/SKILL.md`](.claude/skills/witch-trial/SKILL.md) | Core skill documentation |
| [`.claude/skills/witch-trial/scripts/cli.ts`](.claude/skills/witch-trial/scripts/cli.ts) | Unified CLI entry point |
| [`.claude/skills/witch-trial/core/maintenance/`](.claude/skills/witch-trial/core/maintenance/) | Maintenance operations |
| [`.claude/skills/witch-trial/core/development/`](.claude/skills/witch-trial/core/development/) | Feature development |
| [`.claude/skills/witch-trial/extensions/self-improving/`](.claude/skills/witch-trial/extensions/self-improving/) | Self-improving documentation |

**Usage:**
```powershell
# Create bilingual journal (auto-creates EN/ZH versions)
bun .claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts journal --title="Feature Name"
```

## Journals

Project journals and documentation:

| Document | Description | Date |
|----------|-------------|------|
| [`docs/refactoring/2026-02-13_gamephase-refactoring.md`](docs/refactoring/2026-02-13_gamephase-refactoring.md) | GamePhase Refactoring Journal | 2026-02-13 |
| [`docs/refactoring/2026-02-12_skill-architecture.md`](docs/refactoring/2026-02-12_skill-architecture.md) | Skill Architecture | 2026-02-12 |

**See also:** [AGENTS.md](AGENTS.md) for Chinese documentation.
- **Validation:** Zod

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                   │
│  apps/web/src/app/                                          │
│  ├── (auth)/       → Login, Register, Password Reset       │
│  ├── (protected)/  → Protected pages (blog, users, chat)   │
│  ├── api/          → Hono API routes (via Vercel adapter)  │
│  ├── game/         → Main game page                        │
│  ├── lobby/        → Game room lobby                       │
│  └── room/[id]/    → Individual game room                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Refine Core  │  │  boardgame.io   │  │  Socket.IO   │
│  + Ant Design │  │  Game Engine    │  │  (Real-time) │
└───────────────┘  └─────────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  Data Providers  │
                  │  (Refine patterns)│
                  └──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Prisma     │   │   Zero Sync  │   │  PostgreSQL  │
│  + Postgres  │   │  (Real-time) │   │   (Supabase) │
└──────────────┘   └──────────────┘   └──────────────┘
```

### Key Directories

- `apps/web/src/app/` - Next.js App Router pages and layouts
- `packages/bgio-engine/src/` - Boardgame.io game implementation (Witch Trial game)
- `apps/web/src/providers/` - Refine providers (auth, data, live, i18n)
- `apps/web/src/contexts/` - React contexts (color mode, server auth)
- `apps/web/src/components/` - Reusable UI components
- `apps/web/prisma/` - Database schema
- `apps/web/src/generated/` - Generated code (Prisma client, Zero types)
- `apps/web/src/hooks/` - Custom hooks (auth, socket, app)
- `apps/web/src/i18n/` - Internationalization (locales: en, zh-CN)

### Game Architecture (boardgame.io)

The core game logic is in `packages/bgio-engine/src/`:

- `game/` - Game definition, moves, phases, resolutions
- `components/` - React UI components for the game board
- `hooks/` - Custom hooks for game state management
- `contexts/` - React context for game state
- `utils.ts` - Selectors (computed state) and utility functions
- `types.ts` - TypeScript type definitions

Pattern: Uses boardgame.io's reducer pattern with explicit `moveFunctions`, `phaseConfigs`, and `resolveNightActions`.

## Development Commands

### Root Level (monorepo)

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all apps
pnpm start        # Start all apps in production mode
pnpm lint         # Lint all apps
pnpm test         # Run tests in all apps
```

### App-Specific (apps/web)

```bash
pnpm ---filter @whole-ends-kneel/web dev     # Start development server
pnpm --filter @whole-ends-kneel/web build    # Build for production
pnpm --filter @whole-ends-kneel/web start    # Start production server
pnpm --filter @whole-ends-kneel/web lint     # Run Biome
pnpm --filter @whole-ends-kneel/web test     # Run Bun test suite
pnpm --filter @whole-ends-kneel/web test:watch  # Watch mode
```

### Database Commands

```bash
pnpm --filter @whole-ends-kneel/web db:pull   # Pull schema from database
pnpm --filter @whole-ends-kneel/web db:gen    # Generate Prisma client
```

### WebSocket/Chat Server

The `bot.ts` file in `apps/web/` is a standalone Bun WebSocket server for the chat functionality. Run with:

```bash
cd apps/web && bun run bot.ts
```

Server runs on port 3000 by default (configurable via `PORT` env var).

## Configuration Files

- `pnpm-workspace.yaml` - Workspace configuration (apps/_, packages/_)
- `apps/web/next.config.mjs` - Next.js config with next-intl plugin, standalone output
- `apps/web/tsconfig.json` - TypeScript config with path aliases (`@/*`)
- Biome configuration (biome.json) - Linting and formatting
- `apps/web/.env` - Environment variables (NEVER commit sensitive data)
- `apps/web/prisma/schema.prisma` - Database schema with Zero generator

## Environment Variables

Located in `apps/web/.env`:

- `DATABASE_URL` - Pooled PostgreSQL connection (Supabase)
- `DIRECT_URL` - Direct connection for migrations
- `ZERO_UPSTREAM_DB` - Zero sync database URL
- `DB_PWD` - Database password (used in scripts)

Additional variables likely needed (check code):

- Supabase credentials (anon key, service role key, URL)
- Clerk/NextAuth secrets (JWT secret, Clerk keys)
- Socket.IO server configuration

## Testing

Testing uses **Bun's built-in test runner**.

Test files are co-located with source files using `__tests__/` pattern or `.test.ts` extension.

Examples:

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm --filter @whole-ends-kneel/web test

# Watch mode
pnpm --filter @whole-ends-kneel/web test:watch

# Run specific test file
bun test packages/bgio-engine/src/__tests__/game.test.ts
```

Test structure: Uses `describe`, `it`, `expect` from `bun:test`. Mock functions are used for game logic testing.

## Code Style

- TypeScript with `strict: true`
- Biome for linting and formatting
- Uses path aliases: `@/*` → `apps/web/src/*`
- Conventional Commit messages recommended (though not enforced yet)
- `.npmrc` sets `legacy-peer-dependencies=true` and `strict-peer-dependencies=false` (needed for dependency resolution)

## Database Schema

### Primary Models

- `users` - User accounts (with Supabase auth integration)
- `groups` - User groups/teams
- `group_members` - Many-to-many relationship between users and groups
- `messages` - Chat messages (linked to groups)
- `game_rooms` - Multiplayer game rooms
- `game_players` - Players in game rooms (with status)

Key Features:

- Row Level Security (RLS) enabled on some tables (check Prisma schema comments)
- UUIDs as primary keys (generated via `dbgenerated("gen_random_uuid()")`)
- Timestamps with `@db.Timestamptz(6)` (UTC)
- Enums: `GameRoomStatus` (WAITING, PLAYING, FINISHED, DESTROYED), `GamePlayerStatus` (JOINED, READY, LEFT)

Prisma generates:

- Client: `apps/web/src/generated/prisma/client.ts`
- Zero (real-time): `apps/web/src/generated/zero/schema.ts` (if generator configured)

## API Architecture

API routes are consolidated in `apps/web/src/app/api/[[...route]]/route.ts` using Hono.

The route handler uses the Hono Vercel adapter to handle all HTTP methods (GET, POST, PATCH, DELETE).

Data provider (`apps/web/src/providers/data-provider/api.ts`) implements Refine's `DataProvider` interface, calling the Hono API via `@utils/api/rpc` (auto-generated type-safe RPC client).

Pattern:

- Client-side uses Refine hooks (`useList`, `useCreate`, `useCustom`, etc.)
- Data provider wraps RPC calls to Hono API
- Hono API handles business logic and database operations via Prisma

## Authentication Flow

- Uses Supabase as the auth backend
- Server-side: `auth-provider.server.ts` wraps Supabase server client
- Client-side: `auth-provider.client.ts` wraps Supabase browser client
- `ServerAuthProvider` context passes authenticated user from server to client
- Access tokens stored in cookies (Supabase SSR helper)
- `public.ts` provides a Refine-compatible auth provider wrapper

## Real-time Features

Two real-time systems:

1. **Zero (ROCICORP)** - Database-level real-time sync (Prisma → client)
   - Used for live data updates in Refine tables
   - Configured via Prisma Zero generator

2. **Socket.IO** - Game state synchronization
   - Used for multiplayer game state updates
   - `live-provider/socketio.ts` implements Refine's LiveProvider
   - Game moves and state broadcast via Socket.IO rooms

## Internationalization (i18n)

- Uses `next-intl` with App Router
- Locales: English (`en`) and Chinese (`zh-CN`)
- Configuration in: `apps/web/src/i18n/`
- Message files: `apps/web/src/i18n/locales/*.ts`
- Type-safe approach with generated types (check `next.config.mjs` for plugin)

Script to check i18n completeness: `apps/web/scripts/check-i18n.ts` (found in `i18n-check-results.txt`)

## Games & Engine

The `bgio-engine` is a custom wrapper around boardgame.io for a "Witch Trial" game (social deduction game similar to Werewolf/Mafia).

Key Files:

- `packages/bgio-engine/src/game/index.ts` - Main game definition (`WitchTrialGame`)
- `packages/bgio-engine/src/types.ts` - Game state and types
- `packages/bgio-engine/src/utils.ts` - Selectors (derived state) and utilities
- `packages/bgio-engine/src/components/Board/` - Main game board UI
- `packages/bgio-engine/src/components/` - Player list, hand, voting, chat, etc.
- `packages/bgio-engine/src/hooks/useWitchTrial.ts` - Hook for game integration

Game Flow:

- Night phase → Day phase → Voting → Resolution
- Roles: Witch, Hunter, villagers, etc.
- Uses boardgame.io's turn-based multiplayer model with server authority

## Important Patterns & Conventions

### Refine Resources

Resources configured in `RefineProvider.tsx` map to pages:

- `groups` → displays at `/blog-posts` (note: name mismatch, but pages under `app/(protected)/blog-posts/`)
- `messages` → room listing at `/room`
- `users` → CRUD at `/users`
- `categories` → CRUD at `/categories`

### Next.js App Router

- Uses React Server Components by default
- `"use client"` directive for interactive components
- Layouts can be grouped: `(auth)`, `(protected)` for route groups
- Server actions not evident; uses API routes instead

### Path Aliases

- `@/*` → `apps/web/src/*` (configured in tsconfig.json)
- `@providers/*`, `@components/*`, `@hooks/*`, `@lib/*`, `@utils/*`, `@contexts/*`

### Socket.IO Integration

- Server: Custom integration via Hono API routes (check `providers/live-provider/api.ts` and `socketio.ts`)
- Client: Socket.IO client with access token auth
- WebSocket endpoint: `/api/socket.io` (standard Socket.IO path)

## Custom Skills Found

This repository contains custom Claude Code skills:

- `.agents/skills/antd-design/` - Ant Design specific guidance
- `.agents/skills/boardgame-io-docs/` - boardgame.io documentation
- `.agents/skills/es-toolkit-docs/` - ES Toolkit documentation
- `.claude/skills/` - Additional standard Claude Code skills

These skills provide context-aware assistance when working with those libraries.

## When to Use Subagents

**Proactively use the Task tool with subagents for complex tasks:**

| Task Characteristic | Recommended Agent |
|--------------------|-------------------|
| Multi-file search across modules | `Explore` |
| Architecture/planning required | `Plan` |
| Multi-step independent tasks | `General-purpose` (parallel calls) |
| Research/exploration > 3 queries | `Explore` (thoroughness: "very thorough") |

**Trigger conditions for subagent use:**

- Task involves >3 files across different packages/modules
- Requires exploring unfamiliar code areas
- Multiple independent searches needed
- Implementation planning needed before coding
- Codebase-wide refactoring analysis

**Example:**
```
User: "Search for all uses of GamePhase and update them"
→ Spawn Explore agent to find all usages first
→ Then make targeted edits
```

## Common Development Tasks

### Starting Development

```bash
# Install dependencies
pnpm install

# Start development server (runs on http://localhost:3000 by default)
pnpm dev
```

### Working on the Game Engine

- Game logic: `packages/bgio-engine/src/game/`
- Game UI: `packages/bgio-engine/src/components/`
- Tests: `packages/bgio-engine/src/__tests__/`

Run tests frequently when modifying game logic.

### Database Changes

1. Update `apps/web/prisma/schema.prisma`
2. Generate Prisma client: `pnpm --filter @whole-ends-kneel/web db:gen`
3. Create and apply migration: `npx prisma migrate dev --name <name>` (in apps/web dir)
4. Check generated types in `apps/web/src/generated/prisma/`

### Adding API Endpoints

- Extend Hono app in `apps/web/src/app/api/[[...route]]/route.ts` OR create new route segment
- Follow Hono's routing pattern: `app.get('/path', handler)` etc.
- If new resources needed, update Refine DataProvider in `providers/data-provider/api.ts`

### Adding i18n Strings

1. Add keys to `apps/web/src/i18n/locales/en.ts` and `zh-CN.ts`
2. Use `useTranslation()` hook or `t('key')` in components
3. Run `pnpm --filter @whole-ends-kneel/web exec tsx scripts/check-i18n.ts` to verify completeness

### Formatting & Linting

```bash
pnpm lint          # Runs Biome (root)
# Or per package:
cd packages/bgio-engine && bun run lint
```

### Debugging Socket.IO

- Ensure Socket.IO server is mounted (check `socketio.ts` and API routes)
- Browser devtools → Network → WS tab
- Server logs in terminal where API is running
- Chat server (`bot.ts`) is separate; used for general WebSocket examples, not the game

## Deployment Notes

- Next.js output: `standalone` (container-friendly)
- Vercel compatible (uses Vercel adapter for Hono)
- Build command: `pnpm build` (root) or `pnpm --filter @whole-ends-kneel/web build`
- Start command: `pnpm start` or `pnpm --filter @whole-ends-kneel/web start`

Environment required:

- PostgreSQL database (Supabase recommended)
- Supabase credentials for auth
- Zero sync configured (upstream DB)

## Gotchas & Important Notes

- **Auth Provider Split**: `auth-provider.server.ts` and `auth-provider.client.ts` - ensure correct client vs server usage
- **Zero Generator**: The Prisma schema has a `generator zero` but the actual Zero client may be in `@rocicorp/zero`. Generated files go to src/generated/zero/
- **Boardgame.io Client vs Server**: The game uses both client and server components. The main match is managed by boardgame.io server (likely via separate process or serverless?). Check `packages/bgio-engine/src/example.tsx` for integration pattern.
- **Socket.IO Transport**: The game may use Socket.IO for real-time moves. The `liveProvider` uses socketio for Refine live queries; game-specific socket may be separate.
- **TypeScript Strict Mode**: Enabled. Be mindful of `any` types (some exist in tests/mocks).
- **Monorepo**: Only one app currently (`web`). No internal packages yet.
- **Chinese Locale**: i18n includes Chinese (`zh-CN`). Keep both languages in sync when adding new strings.
- **Ant Design v6**: Using latest major version. Check `.claude/skills/antd-design/` for patterns.
- **Next.js 16**: React 19 support. `reactStrictMode: false` in next.config (may cause double renders in dev if true).

## Debugging Tips

1. **Game State Issues**: Check `packages/bgio-engine/src/utils.ts` Selectors for computed state. Game logic is pure functions in `game/` directory.
2. **Auth Errors**: Verify Supabase connection and cookie handling. Check `ServerAuthProvider` and auth provider implementations.
3. **API Errors**: Hono routes in `app/api/[[...route]]/route.ts`. Data provider uses RPC calls. Check network tab for request/response.
4. **Real-time Not Working**: Both Zero and Socket.IO need proper DB/WS setup. Check connections and subscriptions.
5. **i18n Missing Keys**: Fallback to English if key missing. Use `scripts/check-i18n.ts` to find untranslated keys.

## Agent Memory Management (claude-mem Plugin)

This project uses the **claude-mem** plugin for cross-session agent memory.

### Memory Storage

| Type | Location | Use For |
|------|----------|---------|
| **claude-mem database** | Plugin storage | Cross-session learnings, patterns, decisions |
| **CLAUDE.md** | Version controlled | Project-wide guidelines, architecture |
| **Agent prompts** | `.claude/agents/*.md` | Agent-specific instructions |

### Saving Memories

When you discover stable patterns or learnings:

```bash
# Search for existing memories first
mcp__plugin_claude-mem_mcp-search__search --query "testing patterns game"

# Save new memory
mcp__plugin_claude-mem_mcp-search__save_memory --text "..." --title "..."
```

### What to Save

- **DO save**: Patterns, conventions, decisions, troubleshooting insights
- **DON'T save**: Session-specific context, incomplete observations

### Reading Memories

Before starting work, search for relevant memories:

```
mcp__plugin_claude-mem_mcp-search__search --query "<task keywords>"
```

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Refine Docs](https://refine.dev/docs)
- [Ant Design v6](https://ant.design/docs/react/use-with-next)
- [boardgame.io](https://boardgame.io/docs)
- [Prisma](https://www.prisma.io/docs)
- [Zero (ROCICORP)](https://zero.rocicorp.dev/docs)
- [Hono](https://hono.dev/docs)
- [Socket.IO](https://socket.io/docs/v4)
- [next-intl](https://next-intl-docs.vercel.app/)

## CLAUDE.md Maintenance

Update this file when:

- New major dependencies are added
- Architecture changes significantly
- Common workflows change (build, test, deploy)
- New patterns emerge that are non-obvious

Do NOT update for every minor change; keep it high-level and focused on operational knowledge.
