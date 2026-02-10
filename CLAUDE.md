# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **multiplayer online party game platform** (similar to Werewolf/Mafia) called "Killerqueen" (魔女审判/Witch Trial), built as a full-stack application with admin panel. The project uses a monorepo structure with pnpm workspaces.

**Core Features:**
- Real-time multiplayer card game with day/night cycles, voting, and special abilities
- Game room management (create, join, leave, ready status, start game)
- Chat system with real-time messaging (day/night channels)
- Admin panel for user management and data monitoring (Refine-based)
- i18n support (English/Chinese)
- Full authentication via Supabase

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5
- **Admin UI**: Refine framework with Ant Design 6
- **Backend**: Hono 4 (running within Next.js API routes)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **ORM**: Prisma 7 + Zero sync
- **Real-time**: Socket.IO 4 + Supabase Realtime
- **Game Engine**: Custom boardgame.io-based engine
- **Styling**: Tailwind CSS 4 + Ant Design
- **Testing**: Bun test
- **Package Manager**: pnpm

## Monorepo Structure

```
whole-ends-kneel-monorepo/
├── apps/
│   └── web/                    # Main Next.js application
├── packages/                   # Shared packages (currently empty)
├── AGENTS.md                   # Detailed project documentation (IMPORTANT)
├── package.json               # Root package.json with workspace scripts
└── pnpm-workspace.yaml        # pnpm workspace configuration
```

## Key Architecture Patterns

### 1. Next.js App Router + Refine Integration

The app combines Next.js App Router with Refine for admin functionality:

- **Root Layout** (`src/app/layout.tsx`): Wraps entire app with providers:
  - AntdRegistry (Ant Design)
  - NextIntlClientProvider (i18n)
  - RefineKbarProvider (keyboard shortcuts)
  - ColorModeContextProvider (dark/light mode)
  - ServerAuthProvider (server-side auth state)
  - RefineProvider (Refine core)

- **Route Groups**:
  - `(auth)/` - Login, register, forgot password pages
  - `(protected)/` - Admin panel (blog posts, categories, users, settings)
  - Public routes: `game/`, `lobby/`, `room/[id]/`, `debug/socket/`

### 2. Backend API Layer (Hono)

The backend uses Hono mounted at `/api` via Next.js route handlers:

- **Entry**: `src/server/api/app.ts` - Hono app with middleware
- **Middleware**: `supabase.ts` - Attaches Supabase client to request context
- **Routes**:
  - `/api/auth` - Authentication endpoints
  - `/api/data` - Generic CRUD for all tables (dynamic resource routing)
  - `/api/users` - User-specific operations
  - `/api/game` - Game room management (create, join, leave, ready, start)
  - `/api/live` - SSE-based real-time subscriptions using Supabase Realtime

**Key Pattern**: The data provider (`src/providers/data-provider/api.ts`) translates Refine's data operations into Hono RPC calls using generated types from `@utils/api/rpc`.

### 3. Real-time Communication

Two real-time systems work together:

- **Socket.IO** (`src/server/api/socket-io.ts`):
  - Game state synchronization
  - Chat messaging
  - Player actions/events
  - Uses PostgreSQL adapter for multi-instance scaling
  - Authenticates via Supabase session cookies

- **Supabase Realtime** (`src/providers/live-provider/`):
  - CRUD change notifications for Refine LiveProvider
  - SSE endpoint at `/api/live/subscribe`
  - Supports catch-up for missed events

### 4. Game Engine (Boardgame.io)

Located in `src/lib/bgio-engine/`:

- **Core Types**: `types.ts` - Game state, phases, player status, cards, actions
- **Game Definition**: `game/index.ts` - `WitchTrialGame` object with setup, phases, moves, endIf
- **Phases**: `phases.ts` - Configuration for morning, day, voting, night, resolution phases
- **Moves**: `moves.ts` - All game actions (vote, use card, ready, etc.)
- **Selectors**: `utils/selectors.ts` - Pure functions for deriving state
- **Components**: `components/` - React UI for board, hand, voting, etc.
- **Hook**: `hooks/useWitchTrial` - Client-side game state management

**Game Flow**: The game implements a social deduction card game with:
- 5 card types: Witch Killer, Barrier Magic, Kill Magic, Detect Magic, Check Magic
- Day phase: voting to imprison players
- Night phase: players use abilities
- Win conditions: survive as witch or eliminate all witches

### 5. Database Layer

**Prisma Schema** (`apps/web/prisma/schema.prisma`):

Key tables:
- `users` - User profiles (extends Supabase auth)
- `groups` - Chat groups
- `group_members` - Group membership
- `messages` - Chat messages
- `game_rooms` - Game room metadata
- `game_players` - Players in rooms (with seat numbers, status)
- `game_rounds` - Round history (if implemented)

**Row Level Security**: Many models have RLS enabled (see Prisma schema comments).

### 6. Authentication & Authorization

- **Provider**: Supabase Auth with custom JWT session handling
- **Client**: `src/utils/supabase/client.ts`
- **Server**: `src/providers/auth-provider/` - Both client and server implementations
- **Middleware**: `src/middleware.ts` - Updates session on each request
- **Refine Integration**: `authProviderClient` / `authProviderServer` adapt Supabase to Refine's auth interface

### 7. Internationalization (i18n)

- **Library**: next-intl
- **Config**: `src/i18n/config.ts`
- **Locales**: `src/i18n/locales/` (en.ts, zh-CN.ts)
- Messages loaded server-side via `getMessages()` in layout

## Important Directories

```
apps/web/src/
├── app/                    # Next.js App Router pages & layouts
├── components/             # React components (including Refine overrides)
│   ├── RefineProvider.tsx  # Main Refine provider setup
│   └── ...
├── contexts/               # React contexts (color-mode, server-auth, game)
├── hooks/                  # Custom hooks (useSocket, useUser)
├── interfaces/             # TypeScript type definitions (socket, game, user)
├── lib/                    # Core libraries
│   ├── bgio-engine/       # Active boardgame.io game engine (Witch Trial)
│   ├── game-engine/       # Legacy engine (may be deprecated)
│   ├── utils/             # Utility functions (api/rpc.ts, supabase/)
│   └── ...
├── providers/             # Refine providers (auth, data, live, i18n, devtools)
│   ├── auth-provider/
│   ├── data-provider/
│   ├── i18n-provider/
│   └── live-provider/
├── server/                # Backend code
│   └── api/
│       ├── app.ts         # Hono app entry
│       ├── middleware/    # Supabase middleware
│       ├── routes/        # API endpoints
│       ├── socket-io.ts   # Socket.io setup
│       └── ...
├── i18n/                  # Internationalization config & translations
├── middleware.ts          # Next.js middleware for auth session
└── generated/             # Generated code (Prisma client, etc.)
```

## Common Development Commands

### Root Level (monorepo)

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Start all dev servers
pnpm build                # Build all packages/apps
pnpm start                # Start all production servers
pnpm lint                 # Lint all packages/apps
pnpm test                 # Run tests in all packages/apps
```

### Within `apps/web`

```bash
pnpm dev                  # Start Next.js dev server (with increased memory)
pnpm build               # Build for production
pnpm start               # Start production server
pnpm lint                # Run Next.js ESLint
pnpm test                # Run Bun tests
pnpm test:watch          # Run tests in watch mode
pnpm db:pull             # Pull schema from Supabase
pnpm db:gen              # Generate Prisma client
pnpm db:migrate          # Run migrations (if schema changes)
pnpm refine              # Open Refine DevTools
```

**Note**: The dev script uses `cross-env NODE_OPTIONS=--max_old_space_size=4096` to increase Node memory limit.

### Database Commands

```bash
cd apps/web
pnpm db:pull    # Sync schema from database
pnpm db:gen     # Generate TypeScript types and client
```

## Testing Strategy

- **Runner**: Bun's built-in test runner (no Jest/Vitest config)
- **Location**: Tests co-located with code in `__tests__/` directories
- **Game Engine Tests**: `src/lib/bgio-engine/__tests__/`
  - `utils.test.ts` - 31 tests for selectors, mutations, utilities
  - `game.test.ts` - 18 tests for game setup, voting, night phases, end conditions
- **Pattern**: Mock random functions for deterministic tests, use `as any` assertions to simplify complex boardgame.io types
- **Run single test**: `bun test src/lib/bgio-engine/__tests__/utils.test.ts`

## Environment Variables

See `.env` in `apps/web/` for required configuration. Minimum required:
- `DATABASE_URL` - Supabase pooler connection
- `DIRECT_URL` - Direct connection for migrations
- `ZERO_UPSTREAM_DB` - Zero sync database (optional)
- `DB_PWD` - Database password (used by Socket.IO adapter)

Supabase-specific env vars also required for auth:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Code Style & Conventions

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (`.prettierrc` at root)
- **Linting**: ESLint with Next.js config (`.eslintrc.json` in apps/web)
- **Components**: Functional components with hooks
- **Server Components**: Use `"use client"` directive when needed
- **API Routes**: Use Hono with Zod validation (`zValidator`)
- **Game Logic**: Pure functions where possible (Selectors, Mutations)
- **State Management**: Boardgame.io for game state; React Context for UI state; TanStack Query not used

## Important Notes

1. **Route Groups**: The protected admin routes use route groups `(protected)/` and `(auth)/`. These are URL-optional (don't appear in URLs).

2. **Refine Resources**: Defined in `src/components/RefineProvider.tsx`. Current resources:
   - `groups` (maps to blog-posts in UI)
   - `messages` (maps to rooms)
   - `users`
   - `categories`

3. **Dynamic Imports**: Some packages transpiled in `next.config.mjs`:
   - `@refinedev/antd`
   - `@stackframe/stack-shared`

4. **Socket.IO + PostgreSQL**: Uses `@socket.io/postgres-adapter` for horizontal scaling. Requires PostgreSQL connection pool.

5. **Game State Persistence**: Game state is NOT persisted to database yet (in-memory only via Socket.IO rooms). Consider implementing state snapshots if needed.

6. **RLS**: Database uses Row Level Security. Ensure Supabase policies are properly configured.

7. **Zero Sync**: Prisma Zero generator configured but may not be active. Check `prisma-zero` dependency.

## Useful Skills

This repository benefits from these Claude Code skills:
- `antd-v6-best-practices` - For Ant Design component questions
- `react-dev` / `react-patterns` - For React component design
- `typescript-strict-migrator` - If upgrading TypeScript
- `i18n-frontend-implementer` - For adding translations
- `state-ux-flow-builder` - For loading/error states
- `table-builder` - For admin panel table components
- `form-wizard-builder` - For multi-step forms
- `unit-test-generator` - For adding game logic tests

## Troubleshooting

**Socket.IO connection issues**:
- Check DB_PWD is set correctly
- Verify PostgreSQL connection pool is accessible
- Check Socket.IO server logs in `socket-io.ts`

**Game state not updating**:
- Game state is in-memory; server restarts lose state
- Ensure Socket.IO connection is established
- Check `useWitchTrial` hook for client-side sync

**Refine resources not showing**:
- Resources defined in `RefineProvider.tsx`
- Routes must match resource list configuration
- Check browser console for route match errors

**Next.js build errors**:
- `transpilePackages` in `next.config.mjs` includes required packages
- Some packages may need to be added if using additional Refine modules

## References

- **Internal Docs**: `AGENTS.md` - Comprehensive Chinese documentation
- **Refine Docs**: https://refine.dev/docs
- **Boardgame.io**: https://boardgame.io/
- **Hono**: https://hono.dev/
- **Next.js i18n**: https://next-intl.dev/
