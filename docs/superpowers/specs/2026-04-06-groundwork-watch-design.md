# Groundwork Watch — Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Scope:** `groundwork watch` CLI command — auto-sync Prisma schema to GROUNDWORK.md

---

## Problem

AI tools (Claude Code, Cursor, Copilot) hallucinate database schemas because they don't have reliable, up-to-date schema context. Groundwork already solves this with GROUNDWORK.md, but today it's a one-shot process — if the schema changes, the developer must manually re-export. This means GROUNDWORK.md goes stale, and AI tools start hallucinating again.

## Solution

A file watcher (`groundwork watch`) that monitors `schema.prisma` and automatically regenerates GROUNDWORK.md on every save. Combined with AI tool integration (e.g., `@GROUNDWORK.md` in CLAUDE.md), this creates a closed loop where AI tools always have the real schema.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Trigger source | ORM schema files | Structured, parseable, single source of truth |
| ORM support at launch | Prisma only | Most popular, well-structured, easiest to parse |
| Parsing strategy | Deterministic (prisma-ast) | No API key, instant, offline, free |
| Watcher runtime | CLI `watch` command | Explicit, simple, runs alongside dev server |
| Output location | Project root `./GROUNDWORK.md` | Convention — AI tools read root-level markdown |
| Parser library | `@mrleebo/prisma-ast` | Lightweight (~15KB), no Prisma engine dependency, robust AST |

---

## Prisma Schema Parser

**New file:** `cli/src/prisma-parser.ts`

Parses `schema.prisma` into the existing `Schema` type from `cli/src/types.ts`, so the existing `generator.ts` (context-generator) works unchanged.

### Type Mapping

| Prisma type | Groundwork `ColumnType` |
|---|---|
| `String` | `"string"` |
| `Int`, `BigInt` | `"integer"` |
| `Float`, `Decimal` | `"float"` |
| `Boolean` | `"boolean"` |
| `DateTime` | `"timestamp"` |
| `Json` | `"text"` |
| All others | `"string"` (fallback) |

### Model Mapping

| Prisma concept | Groundwork type | Notes |
|---|---|---|
| `model User { ... }` | `Table` | Name pluralized and snake_cased (e.g., `User` → `users`) |
| Scalar field | `Column` | Type mapped per table above |
| `@id` | `Column.primaryKey: true` | |
| `@unique` | `Column.unique: true` | |
| `?` (optional) | `Column.nullable: true` | |
| `@default(...)` | `Column.defaultValue` | Extracted as string (e.g., `"autoincrement()"`, `"now()"`) |
| `@relation(...)` field | Skipped | Relation fields are virtual, not real columns |
| `[]` list relation | Skipped | Virtual relation, not a column |
| FK scalar field (e.g., `userId Int`) | `Column` with `references` | `references: { table: "users", column: "id" }` |

### Relationship Detection

When a field has `@relation(fields: [userId], references: [id])`:
1. The relation field itself (e.g., `author User`) is skipped (not a real column)
2. The FK scalar field (e.g., `userId Int`) becomes a `Column` with `references`
3. A `Relationship` entry is created:
   - `from`: the current model (pluralized, snake_cased)
   - `to`: the referenced model (pluralized, snake_cased)
   - `type`: `"one-to-many"` if the inverse side is a list `[]`, `"one-to-one"` if scalar
   - `foreignKey`: the FK field name (e.g., `"userId"`)
   - `description`: auto-generated (e.g., `"Each post belongs to one user"`)

### Auto-generated Descriptions

- **Tables:** `"Stores <model_name> records"` (e.g., `"Stores user records"`)
- **Relationships:** `"Each <from_singular> belongs to one <to_singular>"` for many-to-one, `"Each <from_singular> has many <to_plural>"` for one-to-many

---

## CLI Commands

### `groundwork watch`

```
groundwork watch [--schema <path>] [--output <path>]
```

**Options:**
- `--schema <path>` — Path to `schema.prisma`. Default: auto-detect (`./prisma/schema.prisma` then `./schema.prisma`)
- `--output <path>` — Path for generated file. Default: `./GROUNDWORK.md`

**Behavior:**

1. **Find schema:** Search for `schema.prisma` in order:
   - User-specified `--schema` path
   - `./prisma/schema.prisma`
   - `./schema.prisma`
   - If not found, exit with error: `Could not find schema.prisma. Use --schema <path> to specify.`

2. **Initial generation:** Parse the schema and write GROUNDWORK.md immediately

3. **Watch loop:** Use `chokidar` to watch the resolved schema path
   - Debounce: 300ms (prevents thrashing on rapid saves)
   - On change: re-parse, regenerate, write

4. **Terminal output:**
   - Start: `Watching prisma/schema.prisma → GROUNDWORK.md`
   - Regeneration: `[12:34:56] GROUNDWORK.md updated (5 tables, 3 relationships)`
   - Parse error: `[12:34:57] Parse error: <message> (GROUNDWORK.md unchanged)`

5. **Error handling:** If `schema.prisma` has a syntax error, log the error but **do not overwrite** GROUNDWORK.md. Keep the last valid version.

6. **Graceful shutdown:** Ctrl+C stops the watcher cleanly (close chokidar instance)

7. **First-run instructions:** After initial generation, print:
   ```
   GROUNDWORK.md generated successfully.

   To make your AI tools use this file automatically:

     Claude Code  →  Add "@GROUNDWORK.md" to your CLAUDE.md
     Cursor       →  Add GROUNDWORK.md to your project context
     Copilot      →  Reference in .github/copilot-instructions.md

   The watcher will keep GROUNDWORK.md in sync as you edit schema.prisma.
   ```

### `groundwork sync`

```
groundwork sync [--schema <path>] [--output <path>]
```

One-shot variant — same parsing and generation logic, no watcher. Useful for CI, git hooks, or manual runs.

**Output:**
```
GROUNDWORK.md synced (5 tables, 3 relationships)
```

---

## GROUNDWORK.md Metadata Footer

Each generated file includes a metadata footer:

```markdown
---
_Last synced: 2026-04-06T14:23:01Z from prisma/schema.prisma_
_Auto-generated by Groundwork. Do not edit manually._
```

This tells both humans and AI tools that the file is managed automatically.

---

## AI Tool Integration

GROUNDWORK.md is designed to be loaded into AI tool context automatically:

| AI Tool | Integration |
|---|---|
| Claude Code | Add `@GROUNDWORK.md` to `CLAUDE.md` |
| Cursor | Add GROUNDWORK.md to project context |
| Copilot | Reference in `.github/copilot-instructions.md` |

The watcher keeps GROUNDWORK.md current, so the AI tool always reads the latest schema. No manual intervention needed after initial setup.

---

## End-to-End Flow

```
schema.prisma (source of truth)
       │
       ▼ (file save detected by chokidar)
prisma-parser.ts
       │
       ▼ (deterministic: prisma AST → Schema type)
generator.ts (existing, unchanged)
       │
       ▼ (deterministic: Schema → markdown)
GROUNDWORK.md (written to project root)
       │
       ▼ (read by AI tool via @GROUNDWORK.md, .cursorrules, etc.)
AI has accurate, current schema context
```

---

## Scope Boundaries

**In scope:**
- Prisma schema parsing (models, fields, relations, enums as string type)
- File watching with debounce
- `watch` and `sync` CLI commands
- Metadata footer on generated files
- First-run setup instructions

**Out of scope:**
- Direct database connection
- Running or generating migrations
- Modifying schema.prisma (read-only)
- Multi-file Prisma schemas
- ORMs other than Prisma (future work)
- Web app changes (CLI-only feature)

---

## Dependencies

| Package | Purpose | Size |
|---|---|---|
| `@mrleebo/prisma-ast` | Parse schema.prisma into AST | ~15KB |
| `chokidar` | Cross-platform file watching | ~30KB |

Both are added to `cli/package.json` only.

---

## File Changes Summary

| File | Change |
|---|---|
| `cli/src/prisma-parser.ts` | **New** — Prisma AST → Schema type |
| `cli/src/index.ts` | Add `watch` and `sync` commands |
| `cli/src/generator.ts` | Add metadata footer to output |
| `cli/package.json` | Add `@mrleebo/prisma-ast`, `chokidar` dependencies |
