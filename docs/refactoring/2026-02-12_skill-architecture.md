# Skill Architecture

**Date:** 2026-02-12
**Category:** refactoring
**Description:** Unified skill structure with core + extensions

---

## Summary

Refactored the witch-trial skill architecture from 4 independent skills to a unified "core + extensions" structure. The new architecture consolidates CLI entry points while maintaining backward compatibility with existing skill invocations.

**Before:**
```
.claude/skills/witch-trial/
├── maintenance/   #独立技能
├── development/   #独立技能
├── self-improving/#独立技能
└── translation/   #独立技能
```

**After:**
```
.claude/skills/witch-trial/
├── SKILL.md
├── README.md
├── scripts/
│   ├── cli.ts         #统一CLI入口
│   └── shared/
├── core/              #核心技能
│   ├── maintenance/
│   ├── development/
│   └── documentation/
├── extensions/        #扩展技能
│   └── self-improving/
└── data/
    └── terminology.json
```

---

## Details

### Problem Statement

The original skill structure had 4 independent skills with separate CLI implementations, leading to:
- Inconsistent command patterns
- Duplicated code across skills
- Difficult maintenance

### Solution Implemented

Created a unified CLI (`cli.ts`) that routes to core skills and extensions:
- **Core Skills**: maintenance, development, documentation (essential operations)
- **Extensions**: self-improving, translation (optional capabilities)

### Key Technical Changes

1. **Unified CLI Entry Point**
   - Single entry point: `bun .claude/skills/witch-trial/scripts/cli.ts`
   - Command routing based on argument patterns

2. **New Journal Command**
   - Creates separate journal files with date prefix: `YYYY-MM-DD-{title}.md`
   - Auto-categorizes by topic (refactoring, patterns, guides)
   - Auto-indexes in CLAUDE.md and AGENTS.md

3. **Terminology Mapping**
   - Centralized in `data/terminology.json`
   - Supports English/Chinese consistency

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Keep old skills temporarily | Test indexing functionality before removal |
| Date-prefixed journal files | Better organization than single-file append |
| Auto-indexing | Maintain discoverability without manual effort |
| Core + Extensions split | Separate essential vs optional capabilities |
| Bun runtime | Consistent with existing project tooling |

---

## Files Modified

| File | Change |
|------|--------|
| `.claude/skills/witch-trial/scripts/cli.ts` | Created unified CLI |
| `.claude/skills/witch-trial/extensions/self-improving/scripts/improve.ts` | Added `journal` command |
| `.claude/skills/witch-trial/core/maintenance/` | Moved to core |
| `.claude/skills/witch-trial/core/development/` | Moved to core |
| `.claude/skills/witch-trial/data/terminology.json` | Added terminology map |

---

## Verification

### Commands Tested

```powershell
# Index a journal entry
bun scripts/improve.ts index --file=docs/refactoring/JOURNAL.md --title="GamePhase Refactoring"

# Create new journal with content
bun scripts/improve.ts journal --title="Skill Architecture" --category="refactoring" --description="Unified skill structure"

# Sync all indexes
bun scripts/improve.ts sync
```

### Results

- ✅ Index entries appear in CLAUDE.md Journals section
- ✅ New journal files create with correct naming convention
- ✅ Auto-indexing in AGENTS.md works
- ✅ Legacy `capture` command still functional for backward compatibility

---

## Lessons Learned

1. **Documentation Structure Matters**: Date-prefixed files are easier to navigate than a growing single file
2. **Auto-Indexing Reduces Friction**: Developers don't need to manually update documentation indexes
3. **Backward Compatibility**: Keeping old skills during testing prevents breaking changes
4. **Translation Skill Removed**: Simple string replacement is useless for actual translation. The project uses `next-intl` for real i18n.

---

## Related

- [GamePhase Refactoring Journal](docs/refactoring/JOURNAL.md) - Previous refactoring effort
- [CLAUDE.md J](../../../../CLAUDE.md) - Project instructions
- [SKILL.md](SKILL.md) - Skill documentation

