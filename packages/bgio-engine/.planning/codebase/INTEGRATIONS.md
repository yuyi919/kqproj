# External Integrations

**Analysis Date:** 2026-02-17

## APIs & External Services

**Database:**
- PostgreSQL (Supabase hosted)
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma ORM with PostgreSQL provider
  - Models: users, groups, group_members, messages, game_rooms, game_players
  - Real-time: ROCICORP Zero for live data synchronization

**Authentication & Identity:**
- Supabase (PostgreSQL-based auth)
  - Implementation: Server and client Supabase clients
  - Auth Provider: `@supabase/ssr` for SSR, `@supabase/supabase-js` for client
  - Files: `apps/web/src/utils/supabase/server.ts`, `client.ts`, `middleware.ts`
  - Cookies: HTTP-only cookies for token storage
  - Tables: `users` table in PostgreSQL

**Real-time Communication:**
- Socket.IO 4.8.3
  - Used for game state synchronization
  - Adapter: PostgreSQL adapter for multi-server deployments
  - Implementation: Custom Socket.IO server with Bun engine
  - Files: `apps/web/src/server/api/socket-io.ts`, `apps/web/src/pages/api/socket.ts`
  - Client: `socket.io-client` for React components

**API Layer:**
- Hono 4.11.7 (Edge-compatible web framework)
  - All API routes in `apps/web/src/app/api/[[...route]]/route.ts`
  - Mounted via Vercel adapter: `handle(app)`
  - Routes defined in `apps/web/src/server/api/app.ts`:
    - `/api/auth` - Authentication endpoints
    - `/api/data` - Data operations
    - `/api/users` - User management
    - `/api/game` - Game operations
    - `/api/live` - Live subscriptions
  - Data Provider: Refine's DataProvider wrapping Hono API
  - RPC: Type-safe RPC via `@utils/api/rpc`

## Data Storage

**Primary Database:**
- PostgreSQL via Supabase
  - Connection: Environment variable `DATABASE_URL` (pooled), `DIRECT_URL` (migrations)
  - ORM: Prisma 7.3.0
  - Client: Generated Prisma client in `apps/web/src/generated/prisma/client.ts`
  - Zero Sync: ROCICORP Zero for real-time subscriptions

**Real-time Sync:**
- ROCICORP Zero (@rocicorp/zero)
  - Generated types: `apps/web/src/generated/zero/schema.ts`
  - Upstream DB: Configured via `ZERO_UPSTREAM_DB` environment variable
  - Adapter: Prisma Zero generator

**File Storage:**
- Supabase Storage (implied by Supabase integration)
  - Avatar URLs stored in users table

**Caching:**
- Not explicitly configured
- In-memory caching via React Query (TanStack Query)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Split auth (server + client)
  - Server: `apps/web/src/providers/auth-provider/auth-provider.server.ts`
  - Client: `apps/web/src/providers/auth-provider/auth-provider.client.ts`
  - Middleware: `apps/web/src/middleware.ts` for route protection
  - Public wrapper: `apps/web/src/providers/auth-provider/public.ts`

**Session Management:**
- HTTP-only cookies (Supabase SSR helper)
- JWT tokens stored in cookies
- Access/refresh token flow

## Monitoring & Observability

**Error Tracking:**
- Not explicitly configured (standard console logging)

**Logs:**
- Next.js built-in logging
- Fetch request logging configured in next.config.mjs

## CI/CD & Deployment

**Hosting:**
- Vercel-compatible deployment (Next.js output: standalone)
- Container-ready with standalone output

**CI Pipeline:**
- Not explicitly configured in repository

**WebSocket Server:**
- Standalone Bun WebSocket server for chat: `apps/web/bot.ts`
- Runs on port 3000 (configurable via `PORT` env var)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL pooled connection (Supabase)
- `DIRECT_URL` - PostgreSQL direct connection (for migrations)
- `ZERO_UPSTREAM_DB` - Zero sync database URL
- `DB_PWD` - Database password (used in scripts)
- `NEXT_PUBLIC_SUPABASE_URL` - Client-side Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side anonymous key

**Secrets location:**
- `apps/web/.env` file (NOT committed to git)

**Supabase Configuration:**
- URL: https://qmvduqswpeqyrrnydcyo.supabase.co
- Anon Key: Exposed in client-side code (public)
- Service Role Key: Server-side only (not exposed)

## Webhooks & Callbacks

**Incoming:**
- Not explicitly configured

**Outgoing:**
- Socket.IO for game state broadcast to clients
- Real-time subscriptions via ROCICORP Zero

---

*Integration audit: 2026-02-17*
