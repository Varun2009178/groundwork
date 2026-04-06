# Groundwork Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `groundwork watch` and `groundwork sync` CLI commands that parse `schema.prisma` deterministically and auto-regenerate GROUNDWORK.md on every save.

**Architecture:** A Prisma AST parser (`prisma-parser.ts`) converts `schema.prisma` into the existing `Schema` type, which feeds into the existing `generator.ts` unchanged. A file watcher (`watcher.ts`) uses chokidar to detect saves and triggers re-parse + re-generate. Two new CLI commands (`watch` and `sync`) orchestrate everything.

**Tech Stack:** Node.js, TypeScript, `@mrleebo/prisma-ast` (AST parsing), `chokidar` v4 (file watching, CommonJS-compatible)

---

### Task 1: Install Dependencies

**Files:**
- Modify: `cli/package.json`

- [ ] **Step 1: Install prisma-ast and chokidar**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npm install @mrleebo/prisma-ast chokidar@4
```

Note: chokidar v4 (not v5) because the CLI uses CommonJS (`"module": "commonjs"` in tsconfig). v5 is ESM-only.

- [ ] **Step 2: Verify installation**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && node -e "const p = require('@mrleebo/prisma-ast'); const c = require('chokidar'); console.log('prisma-ast:', typeof p.getSchema); console.log('chokidar:', typeof c.watch);"
```

Expected: Both print `function`.

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add package.json package-lock.json && git commit -m "chore: add prisma-ast and chokidar dependencies for watch feature"
```

---

### Task 2: Prisma Schema Parser — Type Mapping and Column Parsing

**Files:**
- Create: `cli/src/prisma-parser.ts`

This task builds the core parser that converts a `schema.prisma` string into the existing `Schema` type. We start with scalar fields (no relations yet).

- [ ] **Step 1: Create prisma-parser.ts with type mapping and model parsing**

Create `cli/src/prisma-parser.ts`:

```typescript
import { getSchema, Model, Field, Attribute } from "@mrleebo/prisma-ast";
import { Schema, Table, Column, ColumnType, Relationship } from "./types";
import * as crypto from "crypto";

/**
 * Maps Prisma scalar types to Groundwork ColumnType.
 * Unknown types fall back to "string".
 */
const PRISMA_TYPE_MAP: Record<string, ColumnType> = {
  String: "string",
  Int: "integer",
  BigInt: "integer",
  Float: "float",
  Decimal: "float",
  Boolean: "boolean",
  DateTime: "timestamp",
  Json: "text",
  Bytes: "string",
};

function mapPrismaType(prismaType: string): ColumnType {
  return PRISMA_TYPE_MAP[prismaType] || "string";
}

/**
 * Pluralizes a PascalCase model name into snake_case table name.
 * e.g., "User" → "users", "BlogPost" → "blog_posts", "Category" → "categories"
 */
function toTableName(modelName: string): string {
  // PascalCase to snake_case
  const snake = modelName
    .replace(/([A-Z])/g, (match, char, index) =>
      index > 0 ? `_${char.toLowerCase()}` : char.toLowerCase()
    );

  // Simple pluralization
  if (snake.endsWith("y") && !snake.endsWith("ay") && !snake.endsWith("ey") && !snake.endsWith("oy") && !snake.endsWith("uy")) {
    return snake.slice(0, -1) + "ies";
  }
  if (snake.endsWith("s") || snake.endsWith("x") || snake.endsWith("sh") || snake.endsWith("ch")) {
    return snake + "es";
  }
  return snake + "s";
}

/**
 * Checks if a field has a specific attribute (e.g., @id, @unique).
 */
function hasAttribute(field: Field, name: string): boolean {
  return field.attributes?.some((a: Attribute) => a.name === name) ?? false;
}

/**
 * Extracts the @default(...) value from a field, if present.
 * Returns the string representation (e.g., "autoincrement()", "now()", "true").
 */
function getDefaultValue(field: Field): string | undefined {
  const attr = field.attributes?.find((a: Attribute) => a.name === "default");
  if (!attr || !attr.args || attr.args.length === 0) return undefined;

  const arg = attr.args[0];
  if (!arg) return undefined;

  const val = arg.value;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object" && "type" in val && val.type === "function") {
    return `${val.name}()`;
  }
  return undefined;
}

/**
 * Returns true if the field is a relation field (its type is another model name, not a scalar).
 * Relation fields have a fieldType that is not in PRISMA_TYPE_MAP, or have array/optional markers
 * combined with a @relation attribute.
 */
function isRelationField(field: Field): boolean {
  if (typeof field.fieldType !== "string") return false;
  // If it's a known scalar type, it's not a relation
  if (PRISMA_TYPE_MAP[field.fieldType]) return false;
  // If it has @relation, it's definitely a relation
  if (hasAttribute(field, "relation")) return true;
  // If the type is not a known scalar and it's an array, it's a relation list
  if (field.array) return true;
  // If the type is not a known scalar, assume it's a relation
  return true;
}

/**
 * Extracts the @relation(fields: [...], references: [...]) info from a field.
 */
function getRelationInfo(field: Field): { fields: string[]; references: string[] } | null {
  const attr = field.attributes?.find((a: Attribute) => a.name === "relation");
  if (!attr || !attr.args) return null;

  let fields: string[] = [];
  let references: string[] = [];

  for (const arg of attr.args) {
    const val = arg.value;
    if (val && typeof val === "object" && "type" in val && val.type === "keyValue") {
      const kv = val as { type: "keyValue"; key: string; value: unknown };
      if (kv.key === "fields" && kv.value && typeof kv.value === "object" && "type" in kv.value && (kv.value as { type: string }).type === "array") {
        fields = ((kv.value as { args: unknown[] }).args).filter((a): a is string => typeof a === "string");
      }
      if (kv.key === "references" && kv.value && typeof kv.value === "object" && "type" in kv.value && (kv.value as { type: string }).type === "array") {
        references = ((kv.value as { args: unknown[] }).args).filter((a): a is string => typeof a === "string");
      }
    }
  }

  if (fields.length > 0 && references.length > 0) {
    return { fields, references };
  }
  return null;
}

/**
 * Converts a single Prisma model into a Groundwork Table + Relationship entries.
 * Skips relation fields (virtual, not real columns). FK scalar fields get `references` set.
 */
function parseModel(
  model: Model,
  allModelNames: string[]
): { table: Table; relationships: Relationship[] } {
  const tableName = toTableName(model.name);
  const columns: Column[] = [];
  const relationships: Relationship[] = [];

  // Collect relation info first so we can annotate FK scalar fields
  const relationFKs = new Map<string, { toModel: string; refColumn: string; isList: boolean }>();

  for (const prop of model.properties) {
    if (prop.type !== "field") continue;
    const field = prop as Field;
    if (!isRelationField(field)) continue;

    const relInfo = getRelationInfo(field);
    if (relInfo && typeof field.fieldType === "string") {
      for (let i = 0; i < relInfo.fields.length; i++) {
        relationFKs.set(relInfo.fields[i], {
          toModel: field.fieldType,
          refColumn: relInfo.references[i],
          isList: false, // This side holds the FK, so it's the "many" side
        });
      }
    }
  }

  // Also check for list relations on this model to detect one-to-many from the "one" side
  // We only create relationships from the FK-holding side, so list relations are skipped

  // Now parse all scalar fields
  for (const prop of model.properties) {
    if (prop.type !== "field") continue;
    const field = prop as Field;

    // Skip relation fields (they're virtual, not real DB columns)
    if (isRelationField(field)) continue;

    const column: Column = {
      name: field.name,
      type: mapPrismaType(typeof field.fieldType === "string" ? field.fieldType : "String"),
      primaryKey: hasAttribute(field, "id") || undefined,
      unique: hasAttribute(field, "unique") || undefined,
      nullable: field.optional || undefined,
      defaultValue: getDefaultValue(field),
    };

    // If this scalar field is a FK (referenced by a @relation on another field)
    const fkInfo = relationFKs.get(field.name);
    if (fkInfo) {
      const toTable = toTableName(fkInfo.toModel);
      column.references = {
        table: toTable,
        column: fkInfo.refColumn,
      };

      // Create the relationship entry
      const fromSingular = model.name.toLowerCase();
      const toSingular = fkInfo.toModel.toLowerCase();
      relationships.push({
        from: tableName,
        to: toTable,
        type: "one-to-many",
        foreignKey: field.name,
        description: `Each ${fromSingular} belongs to one ${toSingular}`,
      });
    }

    columns.push(column);
  }

  return {
    table: {
      name: tableName,
      description: `Stores ${model.name.toLowerCase()} records`,
      columns,
    },
    relationships,
  };
}

/**
 * Main entry point: parses a schema.prisma file content string into a Groundwork Schema.
 */
export function parsePrismaSchema(source: string): Schema {
  const ast = getSchema(source);

  // Extract all model names for relation detection
  const models = ast.list.filter((block): block is Model => block.type === "model");
  const modelNames = models.map((m) => m.name);

  const tables: Table[] = [];
  const relationships: Relationship[] = [];

  for (const model of models) {
    const result = parseModel(model, modelNames);
    tables.push(result.table);
    relationships.push(...result.relationships);
  }

  // Derive schema name from the models
  const schemaName = tables.length > 0
    ? tables.map((t) => t.name).join("_") + "_schema"
    : "unknown_schema";

  return {
    id: crypto.randomUUID(),
    name: schemaName.length > 50 ? "database_schema" : schemaName,
    description: `Database schema with ${tables.length} tables parsed from schema.prisma`,
    tables,
    relationships,
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual smoke test with a real Prisma schema**

Create a temporary test file and run a quick verification:

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && node -e "
const { parsePrismaSchema } = require('./dist/prisma-parser');
const schema = parsePrismaSchema(\`
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
\`);
console.log(JSON.stringify(schema, null, 2));
"
```

Note: Run `npx tsc` first to compile, then run the node command.

Expected output should show:
- 2 tables: `users` and `posts`
- `users` table with columns: id (integer, pk), email (string, unique), name (string, nullable), createdAt (timestamp)
- `posts` table with columns: id (integer, pk), title (string), content (string, nullable), published (boolean), authorId (integer, fk → users.id), createdAt (timestamp)
- 1 relationship: posts → users, one-to-many, foreignKey: authorId

- [ ] **Step 4: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add src/prisma-parser.ts && git commit -m "feat: add Prisma schema parser (prisma-ast → Schema type)"
```

---

### Task 3: Add Metadata Footer to Generator

**Files:**
- Modify: `cli/src/generator.ts`

Add an optional metadata footer to the generated GROUNDWORK.md so users and AI tools know it was auto-generated and when it was last synced.

- [ ] **Step 1: Add metadata parameter to generateContext**

In `cli/src/generator.ts`, modify the `generateContext` function signature and add the footer at the end:

Change the function signature from:

```typescript
export function generateContext(schema: Schema): string {
```

to:

```typescript
export function generateContext(schema: Schema, metadata?: { syncedFrom?: string }): string {
```

Then, at the very end of the return template string (after the Instructions section's closing backtick-line), append:

```typescript
${metadata?.syncedFrom ? `\n---\n_Last synced: ${new Date().toISOString()} from ${metadata.syncedFrom}_\n_Auto-generated by Groundwork. Do not edit manually._\n` : ""}
```

The full return statement becomes:

```typescript
  return `# GROUNDWORK.md
# Generated by Groundwork

## Schema: ${schema.name}
${schema.description}

> ${tableCount} tables · ${colCount} columns · ${relCount} relationships

---

## Tables

${tableSections}

---

## Relationships
${relationships}

${relationshipsMap}

---

## Example Queries

${exampleQueries}

---

${commonMistakes}

---

## Instructions

This file is the source of truth for the database schema. You MUST follow these rules:

1. Use the exact table and column names defined in this file — do not guess or infer names
2. Use the relationships defined above — do not invent new foreign keys or associations
3. When JOINing tables, use the foreign keys listed in the Relationships section
4. Include all non-nullable columns when inserting records; let defaults handle timestamps
5. Use indexed columns (primary keys, foreign keys) in WHERE clauses for performance
6. Check the Common Mistakes section before writing any query involving these tables
7. If a column is marked nullable, handle NULL values explicitly (COALESCE, IS NULL checks, or conditional logic)
${metadata?.syncedFrom ? `\n---\n_Last synced: ${new Date().toISOString()} from ${metadata.syncedFrom}_\n_Auto-generated by Groundwork. Do not edit manually._\n` : ""}`;
```

- [ ] **Step 2: Verify existing behavior unchanged**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npx tsc --noEmit
```

Expected: No errors. Existing callers pass no second argument, so they get no footer (backward compatible).

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add src/generator.ts && git commit -m "feat: add optional metadata footer to generated GROUNDWORK.md"
```

---

### Task 4: Schema Finder Utility

**Files:**
- Create: `cli/src/schema-finder.ts`

A small utility that locates `schema.prisma` in the project. Used by both `watch` and `sync` commands.

- [ ] **Step 1: Create schema-finder.ts**

Create `cli/src/schema-finder.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

/**
 * Finds schema.prisma in the project.
 * Search order:
 *   1. User-specified path (--schema flag)
 *   2. ./prisma/schema.prisma (Prisma default)
 *   3. ./schema.prisma (root-level)
 *
 * Returns the resolved absolute path, or null if not found.
 */
export function findPrismaSchema(userPath?: string): string | null {
  if (userPath) {
    const resolved = path.resolve(process.cwd(), userPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  const candidates = [
    path.resolve(process.cwd(), "prisma", "schema.prisma"),
    path.resolve(process.cwd(), "schema.prisma"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Returns a display-friendly relative path from cwd.
 */
export function displayPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add src/schema-finder.ts && git commit -m "feat: add schema.prisma auto-detection utility"
```

---

### Task 5: Watcher Module

**Files:**
- Create: `cli/src/watcher.ts`

The core watcher that ties together: detect file change → parse Prisma → generate GROUNDWORK.md → write to disk. Used by the `watch` command.

- [ ] **Step 1: Create watcher.ts**

Create `cli/src/watcher.ts`:

```typescript
import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { parsePrismaSchema } from "./prisma-parser";
import { generateContext } from "./generator";
import { displayPath } from "./schema-finder";

interface WatcherOptions {
  schemaPath: string;
  outputPath: string;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

/**
 * Parses the Prisma schema and writes GROUNDWORK.md.
 * Returns a summary string on success, or throws on parse error.
 */
export function syncSchema(schemaPath: string, outputPath: string): string {
  const source = fs.readFileSync(schemaPath, "utf-8");
  const schema = parsePrismaSchema(source);
  const relativeSrc = displayPath(schemaPath);
  const content = generateContext(schema, { syncedFrom: relativeSrc });
  fs.writeFileSync(outputPath, content, "utf-8");
  return `${schema.tables.length} tables, ${schema.relationships.length} relationships`;
}

/**
 * Starts the file watcher. Returns a cleanup function.
 */
export function startWatcher(options: WatcherOptions): { close: () => Promise<void> } {
  const { schemaPath, outputPath } = options;
  const relativeSchema = displayPath(schemaPath);
  const relativeOutput = displayPath(outputPath);

  // Initial generation
  try {
    const summary = syncSchema(schemaPath, outputPath);
    console.log(`\n✓ ${relativeOutput} generated (${summary})`);
  } catch (err) {
    console.error(`\n✗ Initial parse failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // Print setup instructions
  console.log(`\nWatching ${relativeSchema} → ${relativeOutput}\n`);
  console.log("  To make your AI read it automatically, add one line:\n");
  console.log("  Claude Code  → CLAUDE.md                         @GROUNDWORK.md");
  console.log("  Cursor       → .cursorrules                      Read and follow GROUNDWORK.md for all database work.");
  console.log("  Windsurf     → .windsurfrules                    Read and follow GROUNDWORK.md for all database work.");
  console.log("  Copilot      → .github/copilot-instructions.md   Read and follow GROUNDWORK.md for all database work.");
  console.log("\n  Press Ctrl+C to stop.\n");

  // Set up debounced watcher
  let debounceTimer: NodeJS.Timeout | null = null;

  const watcher = chokidar.watch(schemaPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("change", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const summary = syncSchema(schemaPath, outputPath);
        console.log(`[${timestamp()}] ${relativeOutput} updated (${summary})`);
      } catch (err) {
        console.log(`[${timestamp()}] Parse error: ${err instanceof Error ? err.message : err} (${relativeOutput} unchanged)`);
      }
    }, 300);
  });

  watcher.on("error", (err) => {
    console.error(`Watcher error: ${err.message}`);
  });

  return {
    close: async () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      await watcher.close();
    },
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add src/watcher.ts && git commit -m "feat: add file watcher module (parse + regenerate on change)"
```

---

### Task 6: Wire Up CLI Commands

**Files:**
- Modify: `cli/src/index.ts`

Add the `watch` and `sync` commands to the existing Commander.js CLI.

- [ ] **Step 1: Add imports**

At the top of `cli/src/index.ts`, after the existing imports (line 11), add:

```typescript
import { findPrismaSchema, displayPath } from "./schema-finder";
import { startWatcher, syncSchema } from "./watcher";
```

- [ ] **Step 2: Add the `watch` command**

After the `check` command block (after line 245, before `program.parse()`), add:

```typescript
program
  .command("watch")
  .description("Watch schema.prisma and auto-regenerate GROUNDWORK.md on changes")
  .option("-s, --schema <path>", "Path to schema.prisma")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action((options: { schema?: string; output?: string }) => {
    const schemaPath = findPrismaSchema(options.schema);
    if (!schemaPath) {
      console.error("\n✗ Could not find schema.prisma.");
      console.error("  Searched: ./prisma/schema.prisma, ./schema.prisma");
      console.error("  Use --schema <path> to specify the location.\n");
      process.exit(1);
    }

    const outputPath = path.resolve(process.cwd(), options.output || "GROUNDWORK.md");

    const watcher = startWatcher({ schemaPath, outputPath });

    // Graceful shutdown on Ctrl+C
    process.on("SIGINT", async () => {
      console.log("\nStopping watcher...");
      await watcher.close();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await watcher.close();
      process.exit(0);
    });
  });
```

- [ ] **Step 3: Add the `sync` command**

Immediately after the `watch` command block, add:

```typescript
program
  .command("sync")
  .description("One-shot: parse schema.prisma and regenerate GROUNDWORK.md")
  .option("-s, --schema <path>", "Path to schema.prisma")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action((options: { schema?: string; output?: string }) => {
    const schemaPath = findPrismaSchema(options.schema);
    if (!schemaPath) {
      console.error("\n✗ Could not find schema.prisma.");
      console.error("  Searched: ./prisma/schema.prisma, ./schema.prisma");
      console.error("  Use --schema <path> to specify the location.\n");
      process.exit(1);
    }

    const outputPath = path.resolve(process.cwd(), options.output || "GROUNDWORK.md");

    try {
      const summary = syncSchema(schemaPath, outputPath);
      const relativeOutput = displayPath(outputPath);
      console.log(`\n✓ ${relativeOutput} synced (${summary})\n`);
    } catch (err) {
      console.error(`\n✗ Parse error: ${err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    }
  });
```

- [ ] **Step 4: Verify it compiles**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git add src/index.ts && git commit -m "feat: add watch and sync CLI commands"
```

---

### Task 7: End-to-End Integration Test

**Files:**
- No new files — manual test using a real Prisma schema

- [ ] **Step 1: Build the CLI**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && npm run build
```

Expected: Compiles with no errors.

- [ ] **Step 2: Create a test Prisma schema**

```bash
mkdir -p /tmp/groundwork-test/prisma
```

Write `/tmp/groundwork-test/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  Int
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Test `sync` command**

```bash
cd /tmp/groundwork-test && node /Users/varunnukala/Desktop/Groundwork/cli/dist/index.js sync
```

Expected:
- Prints: `✓ GROUNDWORK.md synced (3 tables, 3 relationships)`
- File `GROUNDWORK.md` is created with tables for users, posts, comments
- Footer shows `_Last synced: ... from prisma/schema.prisma_`

- [ ] **Step 4: Verify GROUNDWORK.md content**

Read the generated file and verify:
- 3 tables: users, posts, comments
- users has columns: id, email, name, createdAt, updatedAt
- posts has columns: id, title, content, published, authorId (FK → users.id), createdAt, updatedAt
- comments has columns: id, text, postId (FK → posts.id), authorId (FK → users.id), createdAt
- Relationships section shows 3 entries
- Relationship map shows ASCII diagram
- Example queries section exists
- Metadata footer present

- [ ] **Step 5: Test `watch` command**

```bash
cd /tmp/groundwork-test && node /Users/varunnukala/Desktop/Groundwork/cli/dist/index.js watch
```

Expected: Prints initial generation message and "Watching prisma/schema.prisma → GROUNDWORK.md"

Then, in another terminal, edit the Prisma schema (add a new model):

```bash
cat >> /tmp/groundwork-test/prisma/schema.prisma << 'EOF'

model Tag {
  id   Int    @id @default(autoincrement())
  name String @unique
}
EOF
```

Expected in the watch terminal: `[HH:MM:SS] GROUNDWORK.md updated (4 tables, 3 relationships)`

Ctrl+C to stop the watcher. Expected: `Stopping watcher...` and clean exit.

- [ ] **Step 6: Test error resilience**

Start the watcher again, then write invalid Prisma syntax:

```bash
echo "model Broken {{{" >> /tmp/groundwork-test/prisma/schema.prisma
```

Expected: Watch terminal shows a parse error message but GROUNDWORK.md is NOT overwritten (still has the valid 4-table version).

Fix the schema by removing the broken line:

```bash
cd /tmp/groundwork-test && head -n -1 prisma/schema.prisma > prisma/tmp.prisma && mv prisma/tmp.prisma prisma/schema.prisma
```

Expected: Watcher regenerates successfully.

- [ ] **Step 7: Clean up and commit**

```bash
rm -rf /tmp/groundwork-test
cd /Users/varunnukala/Desktop/Groundwork/cli && git add -A && git commit -m "feat: groundwork watch & sync — complete implementation"
```

---

### Task 8: Final Build Verification

**Files:**
- No changes — verification only

- [ ] **Step 1: Clean build**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && rm -rf dist && npm run build
```

Expected: Compiles with no errors, `dist/` directory contains all compiled files including `prisma-parser.js`, `schema-finder.js`, `watcher.js`.

- [ ] **Step 2: Verify CLI help includes new commands**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && node dist/index.js --help
```

Expected output includes:
```
Commands:
  init [options]   Interactively describe your schema and generate GROUNDWORK.md (default)
  check [options]  Validate your GROUNDWORK.md for common schema issues
  watch [options]  Watch schema.prisma and auto-regenerate GROUNDWORK.md on changes
  sync [options]   One-shot: parse schema.prisma and regenerate GROUNDWORK.md
  help [command]   display help for command
```

- [ ] **Step 3: Verify subcommand help**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && node dist/index.js watch --help
```

Expected:
```
Usage: groundwork watch [options]

Watch schema.prisma and auto-regenerate GROUNDWORK.md on changes

Options:
  -s, --schema <path>  Path to schema.prisma
  -o, --output <file>  Output filename (default: "GROUNDWORK.md")
  -h, --help           display help for this command
```

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
cd /Users/varunnukala/Desktop/Groundwork/cli && git status
```

If there are changes, commit them. Otherwise, done.
