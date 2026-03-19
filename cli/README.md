# groundwork-cli

**Persistent AI context files for your database schema.** Drop it into your AI coding sessions and never explain your schema again.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/Varun2009178/groundwork/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/groundwork-cli)](https://www.npmjs.com/package/groundwork-cli)

---

## Install

```bash
npx groundwork-cli init
```

Or install globally:

```bash
npm install -g groundwork-cli
groundwork init
```

**Requirements:** Node.js 18+ and an API key from [Anthropic](https://console.anthropic.com/) or [OpenRouter](https://openrouter.ai/).

```bash
export ANTHROPIC_API_KEY=your-key
# or
export OPENROUTER_API_KEY=your-key
```

---

## Commands

### `groundwork init`

Describe your database in plain English, get a `GROUNDWORK.md` context file.

```bash
$ groundwork init

Describe your database schema in plain English.
(Press Enter twice to submit)

> I have users with name, email. Posts belong to users.
> Comments belong to both posts and users.

✓ Parsed 3 tables, 3 relationships
✓ Written to GROUNDWORK.md
  87 lines, 3,240 chars
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-o, --output <file>` | `GROUNDWORK.md` | Output filename |

### `groundwork check`

Validate your `GROUNDWORK.md` for issues that will trip up AI:

```bash
$ groundwork check

Checking GROUNDWORK.md...

  ✓ Primary keys: all tables have primary keys
  ⚠ Missing index: posts.user_id is a foreign key — ensure it's indexed
  ⚠ Missing timestamp: posts has no updated_at — consider adding for audit trails

  1 passed · 2 warnings · 0 errors
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --file <path>` | `GROUNDWORK.md` | Path to schema file |

---

## What You Get

A `GROUNDWORK.md` with:

- **Table definitions** — columns, types, constraints, foreign keys
- **Example queries** — SELECT, INSERT, JOIN using your actual column names
- **Common mistakes** — nullable warnings, wrong column name patterns
- **Relationship map** — ASCII diagram of all table relationships
- **AI instructions** — rules for the AI to follow when using your schema

Drop it in your project root. Works with Cursor, Copilot, Claude, and any AI coding tool.

---

## Links

- [Web App](https://groundwork.dev) — visual schema builder with export to `.cursorrules` and `copilot-instructions.md`
- [GitHub](https://github.com/Varun2009178/groundwork) — source code, issues, contributions
- [Examples](https://github.com/Varun2009178/groundwork/tree/main/examples) — sample output

---

## License

MIT
