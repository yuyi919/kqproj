# Architecture

**Analysis Date:** 2026-02-17

## Pattern Overview

**Overall:** Hybrid DDD + CQRS + Effect-TS Architecture

The bgio-engine implements a multi-layered architecture combining Domain-Driven Design (DDD) principles with Command Query Responsibility Segregation (CQRS) and is evolving toward an Effect-TS service layer.

**Key Characteristics:**
1. **CQRS Pattern**: Clear separation between Commands (Mutations) and Queries (Selectors)
2. **Layered Architecture**: Domain types → Domain logic → Game logic → Effect-TS services → UI
3. **boardgame.io Integration**: Core game state management and multiplayer synchronization
4. **Effect-TS Migration**: New service layer using Effect-TS for dependency injection and error handling

## Layers

### 1. Types Layer (`src/types/`)

**Purpose:** Define all TypeScript interfaces and types for the game domain

**Location:** `src/types/`

**Contains:**
- `core.ts` - GamePhase enum, PlayerStatus, CardType, DeathCause
- `card.ts` - Card, CardRef, CardPoolConfig
- `player.ts` - PublicPlayerInfo, PrivatePlayerInfo
- `state.ts` - BGGameState, Vote, NightAction
- `message.ts` - TMessage (tagged union for all message types)
- `death.ts` - DeathRecord, PublicDeathInfo
- `config.ts` - GameConfig, SEVEN_PLAYER_CONFIG, etc.
- `trade.ts` - Trade, DailyTradeTracker

**Key Types:**
```typescript
// Atomic State (written to boardgame.io)
export interface BGGameState {
  players: Record<string, PublicPlayerInfo>;      // Public state
  secrets: Record<string, PrivatePlayerInfo>;       // Private state (filtered per player)
  chatMessages: TMessage[];
  deathLog: DeathRecord[];
  round: number;
  status: "lobby" | "playing" | "ended";
  config: GameConfig;
  // ... additional state
}

// Public Player Info (visible to all)
export interface PublicPlayerInfo {
  id: string;
  seatNumber: number;
  status: "alive" | "dead";  // witch displayed as alive
}

// Private Player Info (filtered per playerView)
export interface PrivatePlayerInfo {
  status: "alive" | "witch" | "dead" | "wreck";
  hand: CardRef[];
  isWitch: boolean;
  hasBarrier: boolean;
  witchKillerHolder: boolean;
}
```

**Depends on:** None (base layer)

**Used by:** All layers above

---

### 2. Domain Layer (`src/domain/`)

**Purpose:** Pure business logic following CQRS pattern

**Location:** `src/domain/`

**Contains:**

#### Commands (`src/domain/commands/index.ts`)
- **Purpose:** State mutation functions (write operations)
- **Pattern:** Mutations object with methods that modify state directly
- **Key Functions:**
  - `Mutations.msg()` - Add message to state
  - `Mutations.addCardToHand()` - Add card to player's hand
  - `Mutations.removeCardFromHand()` - Remove card from hand
  - `Mutations.killPlayer()` - Kill player and handle witch_killer transfer
  - `Mutations.transferWitchKiller()` - Transfer witch_killer card
  - `Mutations.addRevealedInfo()` - Record revealed information

```typescript
// Example mutation pattern
export const Mutations = {
  killPlayer(
    state: BGGameState,
    playerId: string,
    cause: DeathCause,
    killerId?: string,
    random?: RandomAPI,
  ): { record: DeathRecord; droppedCards: CardRef[] } | null {
    // Update private state
    const secret = state.secrets[playerId];
    secret.status = cause === "wreck" ? "wreck" : "dead";
    secret.hand = [];

    // Update public state
    const player = state.players[playerId];
    player.status = "dead";

    // Handle witch_killer transfer logic
    // ...

    return { record, droppedCards };
  },
};
```

#### Queries (`src/domain/queries/index.ts`)
- **Purpose:** Compute derived state from atomic state (read operations)
- **Pattern:** Selectors object with pure functions
- **Key Functions:**
  - `Selectors.getAlivePlayers()` - Filter alive players
  - `Selectors.isPlayerAlive()` - Check player status
  - `Selectors.getPlayerHandCount()` - Compute hand size
  - `Selectors.computeVoteResult()` - Calculate voting outcomes
  - `Selectors.computeRemainingAttackQuota()` - Calculate available attacks
  - `Selectors.isGameOver()` - Check game end condition

```typescript
// Example selector pattern
export const Selectors = {
  getAlivePlayers(state: BGGameState): PublicPlayerInfo[] {
    return Object.values(state.players).filter((p) => {
      const secret = state.secrets[p.id];
      return !!secret && Refinements.isAlive(secret);
    });
  },

  computeVoteResult(state: BGGameState): VoteResult {
    // Compute vote tally from state
  },
};
```

#### Services
- **`src/domain/services/cardService.ts`** - Card factory and definitions
- **`src/domain/services/messageBuilder.ts`** - TMessageBuilder for creating game messages

**Depends on:** Types layer only

**Used by:** Game layer, Effect layer, UI components

---

### 3. Effect Layer (`src/effect/`)

**Purpose:** Modern service layer using Effect-TS for dependency injection and error handling

**Location:** `src/effect/`

**Contains:**

#### Context (`src/effect/context/`)
- **`gameStateRef.ts`** - StateRef for managing game state access in Effect-TS
- **`gameRandom.ts`** - Random API wrapper for Effect-TS

#### Services (`src/effect/services/`)
- **`attackResolutionService.ts`** - Resolve night attack actions with Effect-TS
- **`playerStateService.ts`** - Player state management
- **`messageService.ts`** - Message handling
- **`priorityService.ts`** - Priority ordering for actions
- **`cardService.ts`** - Card operations

#### Layers (`src/effect/layers/`)
- **`gameLayers.ts`** - Layer composition combining all services
```typescript
export const GameLayers = Layer.mergeAll(
  AttackResolutionService.Default,
  BaseServices,
);
```

#### Errors (`src/effect/errors.ts`)
- Custom Effect-TS errors (PlayerNotFoundError, BarrierProtectedError, etc.)

**Pattern:**
```typescript
// Effect-TS service example
export class AttackResolutionService extends Effect.Service<AttackResolutionService>()(
  "AttackResolutionService",
  {
    effect: Effect.gen(function* () {
      const stateRef = yield* GameStateRef;
      const messageService = yield* MessageService;
      const playerStateService = yield* PlayerStateService;

      return {
        resolveAttack: (action: NightAction) => Effect.gen(function* () {
          // Effect-TS error handling and composition
        }),
      };
    }),
  },
) {}
```

**Depends on:** Domain layer, Types layer

**Used by:** Game layer for complex operations

---

### 4. Game Layer (`src/game/`)

**Purpose:** boardgame.io integration - defines game mechanics, phases, moves

**Location:** `src/game/`

**Contains:**

#### Entry Point (`src/game/index.ts`)
- **`WitchTrialGame`** - Main game definition exported to boardgame.io
- **Setup function** - Initializes game state with players, deck, secrets

```typescript
export const TypedWitchTrialGame = {
  name: "witch-trial",
  minPlayers: 2,
  maxPlayers: 14,

  setup({ ctx, random }, setupData): BGGameState {
    const config = setupData?.config || SEVEN_PLAYER_CONFIG;
    const deck = createDeck(config.cardPool, random.Shuffle);

    const players: Record<string, PublicPlayerInfo> = {};
    const secrets: Record<string, PrivatePlayerInfo> = {};

    for (const playerId of ctx.playOrder) {
      const initialCards = deck.splice(0, 4);
      const witchKillerHolder = initialCards.some(c => c.type === "witch_killer");

      players[playerId] = {
        id: playerId,
        seatNumber: i + 1,
        status: "alive",
      };

      secrets[playerId] = {
        status: witchKillerHolder ? "witch" : "alive",
        hand: initialCards,
        isWitch: witchKillerHolder,
        // ... other private state
      };
    }

    return { players, secrets, /* ... */ };
  },
};
```

#### Moves (`src/game/moves.ts`)
- **Purpose:** Player action handlers (useCard, vote, pass, say)
- **Pattern:** Move functions that use Mutations and Selectors

#### Phases (`src/game/phases.ts`)
- **Purpose:** Phase configuration with hooks (onBegin, onEnd, moves)
- **Phases:** lobby → setup → morning → day → night → deepNight → resolution

#### Resolution (`src/game/resolution/`)
- **Purpose:** Night action resolution logic
- **Phases:** phase1-detect-barrier, phase2-attack, phase3-check, phase4-wreck, phase5-consume
- **Services:** priority.ts, cardDistribution.ts

#### Assertions (`src/game/assertions.ts`)
- Validation functions before state mutations

**Depends on:** Domain layer (Mutations, Selectors), Types layer

**Used by:** boardgame.io runtime

---

### 5. UI/Components Layer (`src/components/`, `src/ui/`)

**Purpose:** React components for game visualization

**Location:** `src/components/`, `src/ui/`

**Contains:**
- **Board** - Main game board (`src/components/Board/index.tsx`)
- **PlayerList** - Player list with status
- **PlayerHand** - Player's hand display
- **ChatBox** - Game messages and chat
- **NightActionPanel** - Night action interface
- **VotingPanel** - Voting interface
- **UI components** - PhaseBadge, CardDisplay, VoteResults

**Depends on:** Game layer (via hooks), Domain layer (Selectors)

---

### 6. Hooks Layer (`src/hooks/`)

**Purpose:** React hooks for convenient game state access

**Location:** `src/hooks/`

**Contains:**
- **`useWitchTrial.ts`** - Main hook providing computed state and actions

```typescript
export function useWitchTrial(props: BoardProps<BGGameState>): UseWitchTrialReturn {
  const { G, ctx, moves, playerID } = props;

  // Computed state via Selectors
  const isAlive = useMemo(() => {
    if (!playerID) return false;
    return Selectors.isPlayerAlive(G, playerID);
  }, [G, playerID]);

  const alivePlayers = useMemo(() => Selectors.getAlivePlayers(G), [G]);

  // Action wrappers
  const useCard = useCallback((cardId: string, targetId?: string) => {
    moves.useCard(cardId, targetId);
  }, [moves]);

  return {
    gameState: G,
    round: ctx.round,
    phase: ctx.phase,
    playerID,
    isAlive,
    alivePlayers,
    useCard,
    // ...
  };
}
```

---

## Data Flow

### State Flow (Write Path)

```
User Action (UI)
    ↓
boardgame.io Move Function (src/game/moves.ts)
    ↓
Domain Commands/Mutations (src/domain/commands/)
    ↓
BGGameState (atomic state in boardgame.io)
    ↓
boardgame.io Reducer
    ↓
State Update
```

### Query Flow (Read Path)

```
UI Component
    ↓
React Hook (useWitchTrial)
    ↓
Selectors (src/domain/queries/)
    ↓
BGGameState (derived computation)
    ↓
UI Render
```

### Message Flow

```
User Action
    ↓
Move Function
    ↓
TMessageBuilder (src/domain/services/messageBuilder.ts)
    ↓
Mutations.msg()
    ↓
chatMessages in BGGameState
    ↓
Filter by visibility rules in playerView
    ↓
UI ChatBox Display
```

### Night Resolution Flow

```
Phase: deepNight ends
    ↓
resolveNightActions() called
    ↓
Effect Layer Services (AttackResolutionService)
    ↓
Phase Resolution (phase1-5)
    ↓
Mutations (killPlayer, addCardToHand, etc.)
    ↓
State Update
```

## Key Abstractions

### 1. TMessage (Tagged Union)

**Purpose:** Represent all game messages with visibility rules

**Examples:**
- `announcement` - Public to all players
- `public_action` - Public votes, passes
- `private_action` - Only actor can see
- `witnessed_action` - Actor + target can see

### 2. PlayerView Filtering

**Purpose:** Hide private information from other players

**Implementation:** boardgame.io's `playerView` option filters:
- Secrets (hand, isWitch, etc.)
- Messages (filtered by TMessage.kind)

### 3. Effect-TS Services

**Purpose:** Type-safe service layer with error handling

**Pattern:** Dependency injection via Layer composition

## Entry Points

### Main Export (`src/index.ts`)

- **WitchTrialGame** - boardgame.io game definition
- **Selectors** - Query functions
- **Mutations** - Command functions
- **Types** - All TypeScript interfaces
- **Components** - React UI components

### Example Integration (`src/example.tsx`)

- **LocalGame** - Single-player with AI
- **LocalMultiplayerGame** - Pass-and-play
- **OnlineGame** - Multiplayer via boardgame.io server

### React Hook (`src/hooks/useWitchTrial.ts`)

- **BoardProps** - boardgame.io board component props
- Returns computed state and action functions

## Error Handling

**Strategy:** Assertion-based validation before mutations

**Patterns:**
1. **Assertions** (`src/game/assertions.ts`)
   - `assertPlayerAlive()` - Validate player can act
   - `assertPhase()` - Validate current phase
   - `assertCardInHand()` - Validate card ownership

2. **Effect-TS Errors** (`src/effect/errors.ts`)
   - `PlayerNotFoundError`
   - `BarrierProtectedError`
   - `QuotaExceededError`

3. **Move Validation**
   - Return `"INVALID_MOVE"` for invalid moves
   - boardgame.io handles automatic rollback

## Cross-Cutting Concerns

### Logging
- Not explicitly implemented; relies on boardgame.io's debug mode
- Console logging in development

### Validation
- Domain assertions in `src/game/assertions.ts`
- Type validation via TypeScript
- Effect-TS error handling in services

### Authentication
- Not handled by engine; boardgame.io handles multiplayer auth
- Player ID comes from boardgame.io context

### State Persistence
- boardgame.io handles state serialization
- State is stored in memory (can be configured for persistence)

---

*Architecture analysis: 2026-02-17*
