# Groundwork

**Your AI is guessing your database. Groundwork makes it know.**

[![npm](https://img.shields.io/npm/v/groundwork-cli)](https://www.npmjs.com/package/groundwork-cli)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Persistent AI context files for your Prisma schema. One command generates `GROUNDWORK.md` — table definitions, example queries, relationship maps, and mistake warnings. Drop it into your project and every AI session gets your database right.

---

## Quick Start

Groundwork reads your `schema.prisma` and generates a context file. No API key needed.

```bash
npx groundwork-cli watch
```

That's it. `GROUNDWORK.md` is generated in your project root and stays in sync every time you (or your AI) save `schema.prisma`.

### Don't have a Prisma schema?

You can describe your database in plain English instead (requires an API key):

```bash
export ANTHROPIC_API_KEY=your-key
npx groundwork-cli init
```

---

## Commands

```bash
groundwork init          # Describe schema in plain English → GROUNDWORK.md (needs API key)
groundwork sync          # Parse schema.prisma → GROUNDWORK.md (no API key, instant)
groundwork watch         # Like sync, but re-generates on every save (keeps running)
groundwork check         # Validate your GROUNDWORK.md for common issues
```

### When to use each command

| Command | Use when... | Needs API key? |
|---------|------------|----------------|
| `groundwork init` | You don't have a Prisma schema and want to describe your DB in plain English | Yes |
| `groundwork sync` | You have a `schema.prisma` and want a one-time generation | No |
| `groundwork watch` | You want GROUNDWORK.md to stay in sync as you or your AI edit `schema.prisma` | No |
| `groundwork check` | You want to validate an existing GROUNDWORK.md for issues | No |

---

### `groundwork init`

Interactive schema input. Describe your database in plain English, press Enter twice, and get a `GROUNDWORK.md` in your current directory. Requires an API key from [Anthropic](https://console.anthropic.com/), [OpenRouter](https://openrouter.ai/), [OpenAI](https://platform.openai.com/), or [Google AI](https://aistudio.google.com/).

```bash
$ npx groundwork-cli

Describe your database schema in plain English.
(Press Enter twice to submit)

> I have users with name, email. Posts belong to users.
> Comments belong to both posts and users.

✓ Parsed 3 tables, 3 relationships
✓ Written to GROUNDWORK.md
  87 lines, 3,240 chars
```

### `groundwork sync`

Reads your `schema.prisma` file and generates `GROUNDWORK.md` in one shot. No API key needed — parsing is entirely deterministic.

```bash
$ npx groundwork-cli sync

✓ GROUNDWORK.md synced (3 tables, 3 relationships)
```

Groundwork auto-detects your schema at `./prisma/schema.prisma` or `./schema.prisma`. To specify a custom path:

```bash
groundwork sync --schema ./db/schema.prisma --output ./docs/GROUNDWORK.md
```

### `groundwork watch`

Like `sync`, but stays running and regenerates `GROUNDWORK.md` every time `schema.prisma` is saved. Run this alongside your dev server. When you (or your AI) add a table, rename a column, or change a relationship, GROUNDWORK.md updates within 300ms.

```bash
$ npx groundwork-cli watch

✓ GROUNDWORK.md generated (3 tables, 3 relationships)

Watching prisma/schema.prisma → GROUNDWORK.md

  Press Ctrl+C to stop.

[14:23:01] GROUNDWORK.md updated (4 tables, 3 relationships)
[14:25:12] GROUNDWORK.md updated (4 tables, 5 relationships)
```

If the schema has a syntax error mid-edit, the watcher logs the error but keeps the last valid GROUNDWORK.md — it never writes a broken file.

Options:

```bash
groundwork watch --schema ./db/schema.prisma    # Custom schema path
groundwork watch --output ./docs/GROUNDWORK.md   # Custom output path
```

### `groundwork check`

Validates your `GROUNDWORK.md` for issues that will trip up AI:

```bash
$ npx groundwork-cli check

Checking GROUNDWORK.md...

  ✓ Primary keys: all tables have primary keys
  ⚠ Missing index: posts.user_id is a foreign key — ensure it's indexed
  ⚠ Missing timestamp: posts has no updated_at — consider adding for audit trails
  ⚠ Ambiguous column: name exists in users and posts — AI may confuse them

  1 passed · 3 warnings · 0 errors
```

---

## Making Your AI Use GROUNDWORK.md

Generating the file is only half the job. You need to tell your AI tool to read it. Here's how for each tool:

### Claude Code

Add one line to your `CLAUDE.md` (create it in your project root if it doesn't exist):

```
@GROUNDWORK.md
```

That's it. Claude Code will load GROUNDWORK.md into every conversation automatically.

### Cursor

Add GROUNDWORK.md to your project-level context. Two options:

**Option A: Project rules (recommended)**

1. Open Cursor Settings > Rules
2. Add a project rule with this content:

```
Read and follow GROUNDWORK.md for all database work. Use the exact table names, column names, and relationships defined there. Do not guess or invent schema elements.
```

**Option B: .cursorrules file**

Create `.cursorrules` in your project root:

```
Read and follow GROUNDWORK.md for all database work. Use the exact table names, column names, and relationships defined there. Do not guess or invent schema elements.
```

### Windsurf

Create `.windsurfrules` in your project root:

```
Read and follow GROUNDWORK.md for all database work. Use the exact table names, column names, and relationships defined there. Do not guess or invent schema elements.
```

### GitHub Copilot

Create `.github/copilot-instructions.md` in your project:

```
Read and follow GROUNDWORK.md for all database work. Use the exact table names, column names, and relationships defined there. Do not guess or invent schema elements.
```

### Any other AI tool

If your tool supports custom instructions or context files, point it at `GROUNDWORK.md`. The file is self-contained markdown — any tool that reads it will understand the schema.

---

## Recommended Workflow

1. Run `npx groundwork-cli sync` to generate `GROUNDWORK.md` from your Prisma schema
2. Set up your AI tool to read it (see above)
3. Run `npx groundwork-cli watch` alongside your dev server to auto-sync on schema changes
4. Work normally — GROUNDWORK.md stays up to date automatically

> **No Prisma?** Use `groundwork init` to describe your schema in plain English instead (requires an API key).

---

## What You Get

A generated `GROUNDWORK.md` that includes:

```markdown
# GROUNDWORK.md

## Schema: SaaS Application
A SaaS platform with user accounts, subscriptions, and content.

> 3 tables · 18 columns · 2 relationships

## Tables

### users
| Column        | Type      | Constraints    |
|---------------|-----------|----------------|
| id            | integer   | primary key    |
| email         | string    | unique         |
| name          | string    |                |
| role          | string    | default: user  |
| created_at    | timestamp | default: now() |

### posts
| Column     | Type      | Constraints      |
|------------|-----------|------------------|
| id         | integer   | primary key      |
| user_id    | integer   | fk → users.id   |
| title      | string    |                  |
| body       | text      |                  |
| published  | boolean   | default: false   |

## Example Queries

**posts**
```sql
-- Get posts with author info
SELECT t.*, r.*
FROM posts t
JOIN users r ON t.user_id = r.id
WHERE t.id = ?;
`` `

## Common Mistakes

- The column is `posts.user_id`, not `posts.user`
- `posts.body` is nullable — use COALESCE or handle NULL

## Relationships Map

`` `
  users 1──* posts (user_id)
  users 1──* comments (user_id)
  posts 1──* comments (post_id)
`` `
```

See [`examples/GROUNDWORK.md`](examples/GROUNDWORK.md) for a complete example.

---

## Setup

**Requirements:** Node.js 18+

For `sync` and `watch` commands: no API key needed.

For `init` command: an API key from [Anthropic](https://console.anthropic.com/), [OpenRouter](https://openrouter.ai/), [OpenAI](https://platform.openai.com/), or [Google AI](https://aistudio.google.com/).

```bash
# Install globally
npm install -g groundwork-cli

# Or use npx (no install)
npx groundwork-cli sync
npx groundwork-cli watch

# For init command, set an API key first
export ANTHROPIC_API_KEY=your-key
npx groundwork-cli
```

Supported API key environment variables (auto-detected):

```bash
OPENROUTER_API_KEY    # OpenRouter (any model)
ANTHROPIC_API_KEY     # Anthropic (Claude)
OPENAI_API_KEY        # OpenAI (GPT-4o)
GEMINI_API_KEY        # Google (Gemini)
```

You can also put these in a `.env.local` or `.env` file in your project root.

---

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    app/page.tsx                # Stepper app (Describe → Review → Export)
    api/
      parse-schema/route.ts     # Claude API schema parser
      generate-context/route.ts # GROUNDWORK.md generator
      validate-schema/route.ts  # Schema validation checks
  components/
    SchemaInput.tsx             # Step 1: textarea + example prompts
    SchemaReview.tsx            # Step 2: visual table cards
    ContextExport.tsx           # Step 3: export + validate
  lib/
    types.ts                    # Schema types
    schema-validator.ts         # Zod validation for Claude responses
    schema-checker.ts           # Schema validation logic
    context-generator.ts        # GROUNDWORK.md builder
    context-trimmer.ts          # Smart trimming for Cursor/Copilot

cli/
  src/
    index.ts                    # CLI entry point (init, check, watch, sync)
    llm.ts                      # Claude API calls
    generator.ts                # GROUNDWORK.md builder
    prisma-parser.ts            # Prisma schema → Schema type parser
    watcher.ts                  # File watcher (chokidar)
    schema-finder.ts            # Auto-detect schema.prisma location
    check.ts                    # Schema validation logic
    validator.ts                # Zod validation
    types.ts                    # Schema types
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Claude API via `@anthropic-ai/sdk` |
| Validation | Zod v4 |
| CLI | Commander.js |
| Prisma Parsing | `@mrleebo/prisma-ast` |
| File Watching | chokidar |
| Animations | Framer Motion |

---

## Contributing

Contributions welcome. If you have an idea or found a bug:

1. Open an [issue](https://github.com/Varun2009178/groundwork/issues)
2. Fork the repo and create a branch
3. Make your changes and submit a PR

---

## License

MIT
