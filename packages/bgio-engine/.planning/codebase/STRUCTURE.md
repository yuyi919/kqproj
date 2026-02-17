# Codebase Structure

**Analysis Date:** 2026-02-17

## Directory Layout

```
packages/bgio-engine/
├── src/
│   ├── types/                    # Domain types (modularized)
│   │   ├── core.ts              # GamePhase, PlayerStatus, CardType
│   │   ├── card.ts              # CardRef, Card, CardPoolConfig
│   │   ├── player.ts            # PublicPlayerInfo, PrivatePlayerInfo
│   │   ├── state.ts              # BGGameState, Vote, NightAction
│   │   ├── message.ts            # TMessage (tagged union)
│   │   ├── death.ts              # DeathRecord, PublicDeathInfo
│   │   ├── config.ts             # GameConfig, player configs
│   │   ├── trade.ts              # Trade, DailyTradeTracker
│   │   ├── branded.ts            # Branded types for type safety
│   │   └── index.ts              # Re-exports
│   │
│   ├── domain/                   # CQRS - pure business logic
│   │   ├── commands/             # Mutations (write operations)
│   │   │   └── index.ts         # Mutations object
│   │   ├── queries/              # Selectors (read operations)
│   │   │   └── index.ts         # Selectors object
│   │   ├── services/
│   │   │   ├── cardService.ts    # Card factory and definitions
│   │   │   └── messageBuilder.ts # TMessage builder
│   │   └── refinements.ts        # Type refinements (isAlive, etc.)
│   │
│   ├── effect/                   # Effect-TS service layer
│   │   ├── context/
│   │   │   ├── gameStateRef.ts   # StateRef for game state
│   │   │   └── gameRandom.ts     # Random API wrapper
│   │   ├── services/
│   │   │   ├── attackResolutionService.ts
│   │   │   ├── playerStateService.ts
│   │   │   ├── messageService.ts
│   │   │   ├── priorityService.ts
│   │   │   ├── cardService.ts
│   │   │   └── index.ts
│   │   ├── layers/
│   │   │   └── gameLayers.ts     # Layer composition
│   │   ├── errors.ts             # Effect-TS errors
│   │   └── index.ts              # Public exports
│   │
│   ├── game/                     # boardgame.io integration
│   │   ├── index.ts              # Main game definition (WitchTrialGame)
│   │   ├── moves.ts              # Player move functions
│   │   ├── phases.ts             # Phase configurations
│   │   ├── assertions.ts         # Validation functions
│   │   ├── wrapMove.ts           # Move wrapper utilities
│   │   ├── resolution.ts         # Night resolution entry
│   │   ├── types.ts              # Game-specific types
│   │   ├── errors.ts             # Game logic errors
│   │   └── resolution/           # Resolution phases
│   │       ├── index.ts
│   │       ├── applyPhaseResult.ts
│   │       ├── types.ts
│   │       ├── phase1-detect-barrier.ts
│   │       ├── phase2-attack.ts
│   │       ├── phase3-check.ts
│   │       ├── phase4-wreck.ts
│   │       ├── phase5-consume.ts
│   │       └── services/
│   │           ├── priority.ts
│   │           └── cardDistribution.ts
│   │
│   ├── components/               # React UI components
│   │   ├── Board/
│   │   │   ├── index.tsx         # Main board component
│   │   │   ├── MainContent.tsx
│   │   │   ├── ActionPanel.tsx
│   │   │   ├── GameHeader.tsx
│   │   │   ├── GameOverScreen.tsx
│   │   │   └── PlayerListSider.tsx
│   │   ├── ChatBox/
│   │   │   ├── ChatBox.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── MessageInput.tsx
│   │   ├── PlayerList.tsx
│   │   ├── PlayerHand.tsx
│   │   ├── NightActionPanel.tsx
│   │   ├── VotingPanel.tsx
│   │   ├── PhaseDisplay.tsx
│   │   ├── CardSelectionPanel.tsx
│   │   └── ui/                   # Reusable UI components
│   │       ├── PhaseBadge.tsx
│   │       ├── PlayerStatusIcon.tsx
│   │       ├── VoteResults.tsx
│   │       ├── CardDisplay.tsx
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   └── useWitchTrial.ts      # Main game hook
│   │
│   ├── contexts/
│   │   └── GameContext.tsx       # React context for game state
│   │
│   ├── ui/
│   │   └── formatters.ts         # UI formatting utilities
│   │
│   ├── ai/                       # AI opponent (if applicable)
│   │
│   ├── types.ts                  # Legacy type re-exports (deprecated)
│   ├── index.ts                  # Main entry point
│   ├── utils.ts                  # Legacy utility re-exports
│   ├── Lobby.tsx                 # Lobby component
│   └── example.tsx               # Example game clients
│
├── dist/                         # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── [other config files]
```

## Directory Purposes

### Types (`src/types/`)

**Purpose:** Type definitions and interfaces

**Contains:**
- Core enumerations (GamePhase, CardType, PlayerStatus)
- State interfaces (BGGameState, Vote, NightAction)
- Message types (TMessage)
- Configuration types (GameConfig)

**Key Files:**
- `src/types/index.ts` - Re-exports for clean imports

---

### Domain (`src/domain/`)

**Purpose:** Pure business logic without external dependencies

**Contains:**
- Commands (state mutations)
- Queries (derived state computation)
- Services (card operations, message building)

**Key Files:**
- `src/domain/commands/index.ts` - Mutations (write)
- `src/domain/queries/index.ts` - Selectors (read)
- `src/domain/services/cardService.ts` - Card factory
- `src/domain/services/messageBuilder.ts` - TMessage builder

**Design Principle:** No boardgame.io imports; testable without game runtime

---

### Effect (`src/effect/`)

**Purpose:** Modern service layer using Effect-TS

**Contains:**
- Context definitions (StateRef, Random)
- Services with dependency injection
- Layer compositions
- Error types

**Key Files:**
- `src/effect/index.ts` - Public exports
- `src/effect/layers/gameLayers.ts` - Service composition
- `src/effect/services/attackResolutionService.ts` - Key service

---

### Game (`src/game/`)

**Purpose:** boardgame.io game definition and mechanics

**Contains:**
- Main game configuration
- Player moves
- Phase definitions
- Night resolution logic

**Key Files:**
- `src/game/index.ts` - WitchTrialGame export
- `src/game/moves.ts` - Player actions
- `src/game/phases.ts` - Phase configuration
- `src/game/resolution.ts` - Night resolution entry

---

### Components (`src/components/`)

**Purpose:** React UI components for game visualization

**Contains:**
- Board layout
- Player information display
- Card display
- Chat and messaging
- Action panels

**Key Files:**
- `src/components/Board/index.tsx` - Main board
- `src/components/PlayerHand.tsx` - Hand display
- `src/components/NightActionPanel.tsx` - Night actions
- `src/components/VotingPanel.tsx` - Voting UI

---

### Hooks (`src/hooks/`)

**Purpose:** React hooks for game integration

**Contains:**
- Main game hook (useWitchTrial)

**Key Files:**
- `src/hooks/useWitchTrial.ts` - Primary hook

---

## Key File Locations

### Entry Points

- `src/index.ts` - Main package export (WitchTrialGame, types, utils)
- `src/example.tsx` - Example game clients (Local, Online)
- `src/game/index.ts` - boardgame.io game definition

### Configuration

- `package.json` - Package metadata and dependencies
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Linting/formatting (at root)

### Testing

- `src/__tests__/` - Test files (co-located with source or in `__tests__` directories)
- `src/game/resolution/*.test.ts` - Resolution phase tests
- `src/effect/*.test.ts` - Effect-TS service tests

## Naming Conventions

### Files

**Types:**
- `*.ts` - TypeScript source files
- `*.tsx` - TypeScript with JSX (React components)
- `*.test.ts` - Test files (Bun test runner)

**Patterns:**
- PascalCase for all files: `PlayerHand.tsx`, `attackResolutionService.ts`
- Descriptive names: `phase2-attack.ts` (includes number and purpose)
- Test files match source: `attackResolutionService.test.ts`

### Functions

**Selectors (Queries):**
- camelCase
- Descriptive: `getAlivePlayers`, `computeVoteResult`, `isPlayerAlive`

**Mutations (Commands):**
- camelCase
- Action-oriented: `killPlayer`, `addCardToHand`, `transferWitchKiller`

**Components:**
- PascalCase: `Board`, `PlayerHand`, `ChatBox`

**Hooks:**
- camelCase with "use" prefix: `useWitchTrial`

### Variables

**State:**
- `G` - Game state (boardgame.io convention)
- `ctx` - Context (boardgame.io convention)
- `playerID` - Current player ID
- `state` - Game state in selectors

**Types:**
- PascalCase: `BGGameState`, `PublicPlayerInfo`, `CardRef`
- Interfaces often prefixed: `I*` in services (Effect-TS)

### Directories

**Pattern:**
- Singular nouns: `src/domain/commands/`, `src/effect/services/`
- camelCase for compound: `src/game/resolution/`

**Special:**
- `ui/` - Reusable UI components
- `components/` - Feature-specific components

## Where to Add New Code

### New Feature/Module

**Primary location:** Create in appropriate domain layer
- Business logic: `src/domain/`
- Game mechanics: `src/game/`
- UI components: `src/components/`
- Services: `src/effect/services/`

**Example:** Adding a new card type
1. Add types to `src/types/card.ts`
2. Add card definition in `src/domain/services/cardService.ts`
3. Add move validation in `src/game/assertions.ts`
4. Add UI display in `src/components/ui/CardDisplay.tsx`

### New Component/Module

**Implementation location:** Feature-specific directory
- Board components: `src/components/Board/`
- Chat components: `src/components/ChatBox/`
- UI primitives: `src/components/ui/`

### Tests

**Location:** Co-located with source
- `src/game/resolution/phase2-attack.test.ts`
- `src/effect/services/attackResolutionService.test.ts`

**Pattern:** `*.test.ts` for all test files

### Utilities

**Location:** `src/domain/services/` or `src/ui/`
- Domain logic: `src/domain/services/`
- UI formatting: `src/ui/formatters.ts`

## Special Directories

### Types (`src/types/`)

- **Purpose:** TypeScript type definitions
- **Generated:** No
- **Committed:** Yes
- **Note:** Modularized structure for maintainability

### Effect (`src/effect/`)

- **Purpose:** Effect-TS service layer
- **Generated:** No
- **Committed:** Yes
- **Status:** Evolving/migrating from domain layer

### Dist (`dist/`)

- **Purpose:** Compiled JavaScript output
- **Generated:** Yes (during build)
- **Committed:** No (gitignored)

### Game Resolution (`src/game/resolution/`)

- **Purpose:** Night action resolution phases
- **Contains:** Modular phase implementations
- **Pattern:** phase1 through phase5 for sequential resolution

---

## Additional Patterns

### Barrel Files (Re-exports)

Use `index.ts` files for clean imports:
```typescript
// src/types/index.ts
export * from "./core";
export * from "./card";
// etc.

// Usage
import { GamePhase, Card, BGGameState } from "../types";
```

### CQRS Organization

```
src/domain/
├── commands/      # Write operations (Mutations)
│   └── index.ts
├── queries/       # Read operations (Selectors)
│   └── index.ts
└── services/      # Domain services
    ├── cardService.ts
    └── messageBuilder.ts
```

### Service Layer Pattern (Effect-TS)

```
src/effect/
├── context/       # Effect contexts
├── services/      # Effect services
│   └── attackResolutionService.ts
└── layers/        # Layer composition
    └── gameLayers.ts
```

---

*Structure analysis: 2026-02-17*
