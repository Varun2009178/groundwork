# Groundwork

**Your AI is guessing your database. Groundwork makes it know.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/groundwork-cli)](https://www.npmjs.com/package/groundwork-cli)

> Persistent AI context files for your database schema. Drop it into your AI coding sessions and never explain your schema again.

---

## The Problem

Every time you start a new AI coding session, your AI has no idea what your database looks like. It guesses column names, invents tables that don't exist, and writes queries that break silently.

You could paste your schema every time. But you'd forget the nullable columns, the exact foreign key names, and the edge cases. Groundwork generates a persistent context file that covers all of it — table definitions, example queries with your actual column names, common mistake warnings, and relationship maps. Drop it in your project once and every AI session gets it right.

---

## Quick Start

```bash
npx groundwork-cli init
```

That's it. Describe your schema, get a `GROUNDWORK.md`.

Or use the [web app](https://groundwork.dev) for a visual experience with schema review cards and multiple export formats.

---

## Commands

```bash
groundwork init          # Generate GROUNDWORK.md from plain English
groundwork check         # Validate your schema for common issues
```

### `groundwork init`

Interactive schema input. Describe your database in plain English, press Enter twice, and get a `GROUNDWORK.md` in your current directory.

```bash
$ npx groundwork-cli init

Describe your database schema in plain English.
(Press Enter twice to submit)

> I have users with name, email. Posts belong to users.
> Comments belong to both posts and users.

✓ Parsed 3 tables, 3 relationships
✓ Written to GROUNDWORK.md
  87 lines, 3,240 chars
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

## Export Formats

The web app generates three variants:

| Format | File | Limit |
|--------|------|-------|
| Full | `GROUNDWORK.md` | No limit |
| Cursor | `.cursorrules` | 6,000 chars |
| Copilot | `copilot-instructions.md` | 4,000 chars |

Smart trimming progressively removes sections (patterns → mistakes → examples → constraints) to fit within each tool's context limit while preserving core schema info.

---

## Setup

**Requirements:** Node.js 18+ and an API key from [Anthropic](https://console.anthropic.com/) or [OpenRouter](https://openrouter.ai/).

```bash
# CLI
export ANTHROPIC_API_KEY=your-key
npx groundwork-cli init

# Web app (development)
git clone https://github.com/Varun2009178/groundwork.git
cd groundwork
cp .env.example .env.local
# Add your API key to .env.local
npm install
npm run dev
```

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
    index.ts                    # CLI entry point (init + check commands)
    llm.ts                      # Claude API calls
    generator.ts                # GROUNDWORK.md builder
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
