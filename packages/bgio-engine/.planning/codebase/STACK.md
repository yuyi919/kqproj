# Technology Stack

**Analysis Date:** 2026-02-17

## Languages

**Primary:**
- TypeScript 5.9.3 - All packages, game logic, and configuration
- JavaScript/TypeScript (JSX/TSX) - React components and UI

**Secondary:**
- CSS - Tailwind CSS for styling

## Runtime

**Environment:**
- Node.js 20+ (required for Next.js 16)
- Bun 1.3.8 - Used for testing, WebSocket server (bot.ts), and build tooling

**Package Manager:**
- pnpm 10.29.3 - Workspace monorepo management
- Lockfile: Present (pnpm-lock.yaml)

## Frameworks

**Core Web Framework:**
- Next.js 16.1.6 - Full-stack web application framework with App Router
  - Output: standalone (container-friendly)
  - React 19 support with reactStrictMode: false

**UI Framework:**
- Refine 5.0.8 - Admin/B2B data management framework
- Ant Design 6.2.2 - UI component library
- Tailwind CSS 4.1.18 + tailwindcss-animate - Styling utilities
- Radix UI 1.4.3 - Headless UI primitives

**Game Engine:**
- boardgame.io 0.50.2 - Real-time multiplayer game logic
  - Used in `packages/bgio-engine` for Witch Trial game

**API Framework:**
- Hono 4.11.7 - Lightweight web framework for edge-compatible API routes
  - Used in `apps/web/src/server/api/`

**State Management:**
- TanStack React Query 5.90.20 - Server state management
- Zustand - Client state (implied by dependencies)

**Testing:**
- Bun's built-in test runner - Primary test framework
- Jest (not used)

**Build/Dev:**
- TypeScript Compiler (tsc) - Type checking and build
- Biome 2.3.15 - Linting and formatting
- Refine CLI - Project scaffolding and dev commands

## Key Dependencies

**Critical:**
- `effect` 3.19.16 - Functional programming and effect system (used in game engine)
- `@effect/platform` 0.94.4, `@effect/experimental` 0.58.0 - Effect system runtime
- `@effect/language-service` 0.73.1 - Language server for Effect TS
- `@effect/platform-bun` 0.87.1 - Bun platform adapter for Effect
- `es-toolkit` 1.44.0 - Utility functions (lodash/ramda alternative)
- `nanoid` 5.1.6 - Unique ID generation

**Game Logic:**
- `boardgame.io` 0.50.2 - Game state machine and multiplayer
- `socket.io` 4.8.3 - Real-time game communication
- `socket.io-client` 4.8.3 - Client-side WebSocket
- `@socket.io/bun-engine` 0.1.0 - Bun adapter for Socket.IO
- `@socket.io/postgres-adapter` 0.5.0 - PostgreSQL adapter for Socket.IO

**Database & ORM:**
- `prisma` 7.3.0 - ORM with PostgreSQL support
- `@rocicorp/zero` 0.25.11 - Real-time database sync
- `pg` 8.18.0 - PostgreSQL driver
- `prisma-zero` 0.1.2 - Zero generator for Prisma

**Authentication:**
- `@supabase/ssr` 0.3.0 - Server-side Supabase integration
- `@supabase/supabase-js` 2.95.3 - Client-side Supabase

**Internationalization:**
- `next-intl` 4.8.2 - i18n with App Router support

**UI & Icons:**
- `antd` 6.2.2 - Component library
- `@ant-design/icons` 5.5.1 - Icon library
- `@ant-design/x` 2.2.1 - Extended Ant Design components
- `@ant-design/nextjs-registry` 1.3.0 - Next.js registry for Ant Design
- `lucide-react` 0.563.0 - Additional icons
- `@refinedev/antd` 6.0.3 - Refine Ant Design provider

**Validation:**
- `zod` 4.3.6 - Schema validation
- `@hono/zod-validator` 0.7.6 - Zod validation middleware for Hono

**WebSocket:**
- `@ws-kit/bun` 0.10.1 - Bun WebSocket kit
- `@ws-kit/core` 0.10.1 - Core WebSocket kit
- `@ws-kit/memory` 0.10.1 - In-memory WebSocket
- `@ws-kit/zod` 0.10.2 - Zod support for WebSocket

**Utilities:**
- `class-variance-authority` 0.7.1 - Class variance utility
- `clsx` 2.1.1 - ClassName utility
- `tailwind-merge` 3.4.0 - Tailwind class merging

## Configuration

**Environment:**
- Node.js 20+ required
- pnpm package manager
- Bun for testing and WebSocket server
- `.env` file present with environment configuration
- Required env vars: DATABASE_URL, DIRECT_URL, ZERO_UPSTREAM_DB, Supabase credentials, DB_PWD

**Build Config:**
- `apps/web/tsconfig.json` - TypeScript configuration with path aliases (@/*)
- `packages/bgio-engine/tsconfig.json` - TypeScript with Effect language service plugin
- `biome.json` - Linting and formatting rules (root + per-package)
- `next.config.mjs` - Next.js configuration with next-intl plugin
- `prisma/schema.prisma` - Database schema definition

**Code Quality:**
- TypeScript strict mode enabled
- Biome linter with custom rules
- 2-space indentation, 80-character line width

## Platform Requirements

**Development:**
- Node.js 20+
- pnpm 10.29.3
- Bun for running tests

**Production:**
- Container deployment (standalone Next.js output)
- PostgreSQL database (Supabase hosted)
- WebSocket server for real-time game state

---

*Stack analysis: 2026-02-17*
