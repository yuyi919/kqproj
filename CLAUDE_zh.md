# CLAUDE.md

> **IMPORTANT: Read project instructions first!** This file provides essential guidance for Claude Code. When working on this project, prioritize project-specific instructions below over generic skills or external documentation.

## Project Instructions Priority

When working with this repository, ALWAYS prioritize these project-specific instruction files:

| File | Scope | When to Use |
|------|-------|-------------|
| **`AGENTS.md`** | Project-wide | All general development tasks, architecture decisions, game rules, and workflows |
| **`packages/bgio-engine/CLAUDE.md`** | Game Engine Package | Any work on the boardgame.io game engine, moves, phases, or game logic |
| **`.claude/settings.local.json`** | Claude Settings | MCP server configuration and permissions |

## Key Principles

1. **Check `AGENTS.md` first** - It contains the most comprehensive project documentation including game rules, database schema, API conventions, and development workflows
2. **For game engine work** - Use `packages/bgio-engine/CLAUDE.md` for patterns specific to boardgame.io implementation
3. **When in doubt** - Re-read these instruction files before consulting external documentation or skills
4. **Skills are secondary** - Custom skills in `.claude/skills/` and `.agents/skills/` provide supplementary context but should not override project-specific instructions
5. **Use PowerShell syntax** - All commands in this project assume Windows PowerShell environment. Replace `&&` with `;` for command chaining.

## 自定义技能s

Custom Claude Code skills for this project:

| Skill | Purpose | Invoke |
|-------|---------|--------|
| **`/witch-trial`** | Unified CLI + core + extensions | Use for all project tasks |
| `/witch-trial-maintenance` | 维护 (legacy) | Use for verification tasks |
| `/witch-trial-development` | 开发 (legacy) | Use for adding game features |
| `/witch-trial-self-improving` | Documentation (legacy) | Use for preserving decisions |

**Recommended:** Use `/witch-trial` for all operations via unified CLI.

## Environment

- **Platform:** Windows 11
- **Shell:** PowerShell (default)
- **Package Manager:** pnpm (workspace monorepo)
- **Runtime:** Node.js 20+, Bun (for testing and WebSocket server)

All command examples use PowerShell syntax. Key differences from bash:
- Environment variables: `$env:VAR_NAME = "value"`
- Command chaining: `;` instead of `&&`
- Command substitution: `$()` works the same

## Repository Overview

**Project Type:** Monorepo with a single Next.js application
**Primary App:** `apps/web` - A full-stack web application featuring a multiplayer "女巫审判" board game
**Platform:** Windows 11 (PowerShell)
**Package Manager:** pnpm
**Node.js:** >= 20
**Test Runner:** Bun

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
- `packages/bgio-engine/src/` - Boardgame.io game implementation (女巫审判 game)
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
- `utils.ts` - 选择器s (computed state) and utility functions
- `types.ts` - TypeScript type definitions

模式: Uses boardgame.io's reducer pattern with explicit `moveFunctions`, `phaseConfigs`, and `resolve夜间阶段Actions`.

## 开发 Commands

> **Environment:** Windows PowerShell (default shell for this project)
> - All commands should use PowerShell syntax
> - Use `Invoke-Expression` or direct script execution where needed
> - Environment variables: `$env:VAR_NAME = "value"` format

### Root Level (monorepo) - Run from repository root

```powershell
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Build all apps for production
pnpm build

# Start all apps in production mode
pnpm start

# Lint all apps
pnpm lint

# Run tests in all apps
pnpm test
```

### App-Specific (apps/web) - Run from repository root

```powershell
# Start development server (requires ~4GB memory for Next.js)
pnpm --filter @whole-ends-kneel/web dev

# Build for production
pnpm --filter @whole-ends-kneel/web build

# Start production server
pnpm --filter @whole-ends-kneel/web start

# Run ESLint
pnpm --filter @whole-ends-kneel/web lint

# Run Bun test suite
pnpm --filter @whole-ends-kneel/web test

# Run tests in watch mode
pnpm --filter @whole-ends-kneel/web test:watch
```

### Database Commands - Run from repository root

```powershell
# Pull schema from database
pnpm --filter @whole-ends-kneel/web db:pull

# Generate Prisma client
pnpm --filter @whole-ends-kneel/web db:gen

# Create and apply migration (run inside apps/web directory)
cd apps/web; npx prisma migrate dev --name <migration_name>
```

### Game Engine Tests - Run from repository root

```powershell
# Run specific test file
bun test packages/bgio-engine/src/__tests__/game.test.ts
```

### WebSocket/Chat Server

The `bot.ts` file in `apps/web/` is a standalone Bun WebSocket server. Run with:

```powershell
cd apps/web; bun run bot.ts
```

Server runs on port 3000 by default (configurable via `$env:PORT = "3000"`).

## Configuration Files

- `pnpm-workspace.yaml` - Workspace configuration (apps/_, packages/_)
- `apps/web/next.config.mjs` - Next.js config with next-intl plugin, standalone output
- `apps/web/tsconfig.json` - TypeScript config with path aliases (`@/*`)
- `apps/web/.eslintrc.json` - Extends `next/core-web-vitals`
- `apps/web/.env` - Environment variables (NEVER commit sensitive data)
- `apps/web/prisma/schema.prisma` - Database schema with Zero generator

## Environment Variables

Located in `apps/web/.env`:

```powershell
# Set environment variable in PowerShell
$env:DATABASE_URL = "postgresql://..."

# Pooled PostgreSQL connection (Supabase)
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgresql://...:5432/postgres"

# Zero sync database URL
ZERO_UPSTREAM_DB="postgresql://...:5432/postgres"

# Database password
DB_PWD="your-password"
```

## Testing

Testing uses **Bun's built-in test runner**.

Test files are co-located with source files using `__tests__/` pattern or `.test.ts` extension.

Examples:

```powershell
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
- ESLint extends `next/core-web-vitals`
- Prettier config in `.prettierrc`
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

模式:

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

The `bgio-engine` is a custom wrapper around boardgame.io for a "女巫审判" game (social deduction game similar to Werewolf/Mafia).

Key Files:

- `packages/bgio-engine/src/game/index.ts` - Main game definition (`WitchTrialGame`)
- `packages/bgio-engine/src/types.ts` - Game state and types
- `packages/bgio-engine/src/utils.ts` - 选择器s (derived state) and utilities
- `packages/bgio-engine/src/components/Board/` - Main game board UI
- `packages/bgio-engine/src/components/` - Player list, hand, voting, chat, etc.
- `packages/bgio-engine/src/hooks/useWitchTrial.ts` - Hook for game integration

Game Flow:

- 夜间阶段 phase → 午间阶段 phase → Voting → 结算阶段
- Roles: Witch, Hunter, villagers, etc.
- Uses boardgame.io's turn-based multiplayer model with server authority

## Important 模式s & Conventions

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

## Supplemental Resources

This repository contains custom Claude Code skills that provide **supplementary context** when working with specific libraries:

- `.claude/skills/` - Standard Claude Code skills for common patterns
- `.agents/skills/` - Ant Design, boardgame.io, and ES Toolkit specific guidance

**Note:** These skills should be used alongside project-specific instructions, not as a replacement. Always cross-reference with `AGENTS.md` and `packages/bgio-engine/CLAUDE.md` for project-specific patterns.

## Common 开发 Tasks

### Starting 开发

```powershell
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
3. Create and apply migration (in apps/web directory):
   ```powershell
   cd apps/web; npx prisma migrate dev --name <name>
   ```
4. Check generated types in `apps/web/src/generated/prisma/`

### Adding API Endpoints

- Extend Hono app in `apps/web/src/app/api/[[...route]]/route.ts` OR create new route segment
- Follow Hono's routing pattern: `app.get('/path', handler)` etc.
- If new resources needed, update Refine DataProvider in `providers/data-provider/api.ts`

### Adding i18n Strings

1. Add keys to `apps/web/src/i18n/locales/en.ts` and `zh-CN.ts`
2. Use `use翻译()` hook or `t('key')` in components
3. Verify completeness:
   ```powershell
   pnpm --filter @whole-ends-kneel/web exec tsx scripts/check-i18n.ts
   ```

### Formatting & Linting

```powershell
# Run ESLint
pnpm lint

# Format with Prettier (if configured)
pnpm --filter @whole-ends-kneel/web exec prettier --write .
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

1. **Game State Issues**: Check `packages/bgio-engine/src/utils.ts` 选择器s for computed state. Game logic is pure functions in `game/` directory.
2. **Auth Errors**: Verify Supabase connection and cookie handling. Check `ServerAuthProvider` and auth provider implementations.
3. **API Errors**: Hono routes in `app/api/[[...route]]/route.ts`. Data provider uses RPC calls. Check network tab for request/response.
4. **Real-time Not Working**: Both Zero and Socket.IO need proper DB/WS setup. Check connections and subscriptions.
5. **i18n Missing Keys**: Fallback to English if key missing. Use `scripts/check-i18n.ts` to find untranslated keys.

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

## CLAUDE.md 维护

Update this file when:

- New major dependencies are added
- Architecture changes significantly
- Common workflows change (build, test, deploy)
- New patterns emerge that are non-obvious

Do NOT update for every minor change; keep it high-level and focused on operational knowledge.

**Related Files:**
- Keep `AGENTS.md` in sync for comprehensive project documentation
- Update `packages/bgio-engine/CLAUDE.md` when game engine patterns change
