# GamePhase Refactoring Journal

**Date:** 2026-02-13
**Author:** Claude Code
**Project:** Witch Trial Board Game Engine

---

## 1. Executive Summary

This document records the complete refactoring of the game's phase naming system, converting from string literals to a TypeScript `enum` for improved type safety and maintainability.

### Changes Made

| Original Name | New Name | Enum Value | Purpose |
|--------------|-----------|------------|---------|
| `voting` | `GamePhase.NIGHT` | `"night"` | Voting phase (imprisonment) |
| `night` | `GamePhase.DEEP_NIGHT` | `"deepNight"` | Card action phase |

### Final Status

| Metric | Result |
|--------|--------|
| TypeScript Build | ✅ 0 errors |
| Tests | ✅ 211 pass, 0 fail |
| Files Modified | 15+ |
| Documentation | ✅ Updated |

---

## 2. Decision Background

### Original Problem

The codebase used inconsistent phase naming:
- Phase names were scattered as string literals across files
- Easy to introduce typos
- Difficult to refactor or rename
- Confusion between `voting` (voting) and `night` (card actions)

### Decision Made (2026-02-12)

Convert to TypeScript enum:
```typescript
export enum GamePhase {
  MORNING = "morning",
  DAY = "day",
  NIGHT = "night",          // Formerly "voting"
  DEEP_NIGHT = "deepNight", // Formerly "night"
  RESOLUTION = "resolution",
  CARD_SELECTION = "cardSelection",
}
```

---

## 3. Implementation Process

### Phase 1: Core Type Definition

**File:** `packages/bgio-engine/src/types/core.ts`

Created the enum with descriptive comments (later simplified per user request):

```typescript
export enum GamePhase {
  LOBBY = "lobby",
  SETUP = "setup",
  MORNING = "morning",
  DAY = "day",
  NIGHT = "night",
  DEEP_NIGHT = "deepNight",
  CARD_SELECTION = "cardSelection",
  RESOLUTION = "resolution",
  ENDED = "ended",
}
```

**Key Learning:** Enum exports need both value and type exports when used in both contexts.

**File:** `packages/bgio-engine/src/types/index.ts`
```typescript
// GamePhase needs value export (not just type) since it's an enum
export { GamePhase } from "./core";
```

---

### Phase 2: Game Logic Updates

**Files Modified:**
- `game/phases.ts`
- `game/index.ts`
- `game/moves.ts`
- `game/assertions.ts`
- `contexts/GameContext.tsx`
- `utils.ts`

**Example Update (moves.ts):**
```typescript
// Before
assertPhase(G, "night");

// After
import { GamePhase } from "../types/core";
assertPhase(G, GamePhase.NIGHT);
```

---

### Phase 3: UI Component Updates

**Files Modified:**
- `components/Board/ActionPanel.tsx`
- `components/ChatBox/MessageItem.tsx`
- `components/ui/PhaseBadge.tsx`

---

### Phase 4: Test Files Complete Rewrite

**All 8 test files were fully updated:**
- `game.test.ts`
- `attack.test.ts`
- `cardSelection.test.ts`
- `trade.test.ts`
- `voting.test.ts`
- `resolution.test.ts`
- `visibility.test.ts`
- `utils.test.ts`
- `testUtils.ts`

**Key Challenge:** boardgame.io's `Ctx.phase` type expects string literals, not enum values. Test utilities needed to handle this mismatch.

---

### Phase 5: Documentation Updates

**Files Updated:**
- `packages/bgio-engine/CLAUDE.md`
- `docs/rule.md` (already used Chinese terms, no change needed)

---

## 4. Mistakes and Reflections

### Mistake 1: Type-Only Import for Enum

**Problem:** Initially used `import type { GamePhase }` which only imports the type, not the value.

```typescript
// Wrong
import type { GamePhase } from "../types/core";
assertPhase(G, GamePhase.NIGHT); // Compile error!
```

**Error Message:**
```
This comparison appears to be unconditional because the types have no overlapping properties
```

**Solution:** Use value import:
```typescript
import { GamePhase } from "../types/core";
```

**Reflection:** Enum is both a type AND a value in TypeScript. When used in runtime comparisons, need full import.

---

### Mistake 2: Taking Shortcuts in Tests

**Problem:** Tried to use type assertions instead of complete enum replacement.

**User Instruction:**
> "不要怎么简单怎么来，我需要保障正确性的最佳方式"
> (Don't take shortcuts - complete replacement using enum is the best way to ensure correctness)

**Solution:** Complete rewrite of all test files, replacing every string literal with enum reference.

---

### Mistake 3: Leaving Legacy Comments

**Problem:** Left comments like "(原 voting)" which confused future developers.

**Example:**
```typescript
/** 夜间阶段（投票），原 voting */  // Confusing!
NIGHT = "night",
```

**Solution:** Simplified to pure functional description:
```typescript
/** 夜间阶段 */
NIGHT = "night",
```

**Reflection:** Documentation should describe WHAT things ARE, not what they USED TO BE.

---

## 5. Lessons Learned

### For Enum Refactoring

1. **Understand Export Patterns:** Enum needs value export, not just type export
2. **Check External Types:** Know how external libraries (boardgame.io) use your types
3. **Complete Replacement:** Don't mix string literals with enums
4. **Documentation Hygiene:** Remove legacy references, don't add "(formerly X)"

### For TypeScript Projects

1. **Run Build First:** Type errors often hidden until build
2. **Test After Build:** Runtime tests may pass even with type errors
3. **Type Safety Matters:** Enums prevent runtime bugs from typos

---

## 6. Necessity of This Improvement

### Before Refactoring

| Issue | Impact |
|-------|--------|
| String literals everywhere | Typos only caught at runtime |
| Scattered phase names | Inconsistent usage across files |
| Difficult renaming | Fear of breaking something |
| No IDE support | No autocomplete for phase names |

### After Refactoring

| Improvement | Benefit |
|-------------|---------|
| Centralized definition | Single source of truth |
| Type safety | Compile-time error detection |
| IDE support | Autocomplete and refactoring tools |
| Future-proof | Easy to add new phases |

---

## 7. Files Modified Summary

### Core Types
- `src/types/core.ts` - GamePhase enum definition
- `src/types/index.ts` - Export fix for GamePhase

### Game Logic
- `game/phases.ts` - Phase configurations
- `game/index.ts` - Main game definition
- `game/moves.ts` - Move functions
- `game/assertions.ts` - Assertion helpers

### Integration
- `contexts/GameContext.tsx` - Game context
- `utils.ts` - Selectors and utilities
- `ui/formatters.ts` - UI formatters

### UI Components
- `components/Board/ActionPanel.tsx`
- `components/ChatBox/MessageItem.tsx`
- `components/ui/PhaseBadge.tsx`

### Tests (8 files)
- `__tests__/game.test.ts`
- `__tests__/attack.test.ts`
- `__tests__/cardSelection.test.ts`
- `__tests__/trade.test.ts`
- `__tests__/voting.test.ts`
- `__tests__/resolution.test.ts`
- `__tests__/visibility.test.ts`
- `__tests__/utils.test.ts`
- `__tests__/testUtils.ts`

### Documentation
- `packages/bgio-engine/CLAUDE.md`
- `docs/refactoring/JOURNAL.md` (this file)

---

## 8. Verification Checklist

- [x] TypeScript build passes (0 errors)
- [x] All tests pass (211 pass, 0 fail)
- [x] No legacy comments like "(原 voting)"
- [x] Documentation updated
- [x] Both English and Chinese versions created

---

## 9. Future Recommendations

### Immediate
1. **Add Phase Name Mapping:** Consider adding `displayName` to enum for UI
2. **Unit Test Coverage:** Add specific tests for phase transitions

### Long-term
1. **Phase Validation:** Add runtime assertions for valid phase sequences
2. **Documentation Links:** Link to this journal from CLAUDE.md
3. **Migration Guide:** Document the migration process for future refactorings

---

## 10. Appendix: Phase Flow Reference

```
lobby → setup → morning → day → NIGHT → DEEP_NIGHT → resolution → (repeat)
         ↓                                              ↑
    (game ends) ←─────────────────────────────────────┘
```

| Phase | Code | Duration Config | Description |
|-------|------|-----------------|-------------|
| MORNING | `GamePhase.MORNING` | - | Death announcements, discussion |
| DAY | `GamePhase.DAY` | `dayDuration` | Discussion, trading |
| NIGHT | `GamePhase.NIGHT` | `votingDuration` | Voting for imprisonment |
| DEEP_NIGHT | `GamePhase.DEEP_NIGHT` | `nightDuration` | Card actions |
| RESOLUTION | `GamePhase.RESOLUTION` | - | Action resolution |

---

*Document generated: 2026-02-13*
*Project: Witch Trial Board Game Engine*
*Author: Claude Code*

