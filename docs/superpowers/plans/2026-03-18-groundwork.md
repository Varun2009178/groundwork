# Groundwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working prototype where users describe a database schema in plain English, review the parsed structure, and export a GROUNDWORK.md context file for AI coding sessions.

**Architecture:** Next.js 14 App Router with two API routes (parse-schema using Claude, generate-context using templates). Single-page stepper UI with three steps. No database — schema lives in React state.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Anthropic SDK, Zod

**Spec:** `docs/superpowers/specs/2026-03-18-groundwork-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `.env.local`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/varunnukala/Desktop/Groundwork
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full Next.js scaffold with Tailwind pre-configured.

- [ ] **Step 2: Install dependencies**

Run:
```bash
cd /Users/varunnukala/Desktop/Groundwork
npm install @anthropic-ai/sdk zod
```

- [ ] **Step 3: Create .env.local**

Create `.env.local`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

- [ ] **Step 4: Update .gitignore**

Append to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 5: Set up global styles and layout**

Replace `src/app/globals.css` with Tailwind imports plus custom CSS variables for the Groundwork theme:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #191919;
  --bg-sidebar: #141414;
  --bg-input: #1e1e1e;
  --text-primary: #ebebeb;
  --text-secondary: rgba(255, 255, 255, 0.45);
  --text-muted: rgba(255, 255, 255, 0.3);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --button-bg: #ebebeb;
  --button-text: #191919;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Groundwork",
  description: "Define your database schema once. Get consistent AI context forever.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

Replace `src/app/page.tsx` with a placeholder:

```tsx
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-semibold">Groundwork</h1>
    </div>
  );
}
```

- [ ] **Step 6: Verify dev server runs**

Run:
```bash
cd /Users/varunnukala/Desktop/Groundwork && npm run dev
```

Expected: Server starts at localhost:3000, shows "Groundwork" centered on a dark background.

- [ ] **Step 7: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git init
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind and dependencies"
```

---

### Task 2: Types and Zod Validation

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/schema-validator.ts`

- [ ] **Step 1: Create type definitions**

Create `src/lib/types.ts`:

```typescript
export type ColumnType = "string" | "integer" | "timestamp" | "boolean" | "text" | "float";

export interface Column {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  nullable?: boolean;
  unique?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface Table {
  name: string;
  description: string;
  columns: Column[];
}

export interface Relationship {
  from: string;
  to: string;
  type: "one-to-many" | "many-to-many" | "one-to-one";
  foreignKey: string;
  description: string;
}

export interface Schema {
  id: string;
  name: string;
  description: string;
  tables: Table[];
  relationships: Relationship[];
  createdAt: string;
}
```

- [ ] **Step 2: Create Zod validator**

Create `src/lib/schema-validator.ts`:

```typescript
import { z } from "zod";
import { ColumnType } from "./types";

const VALID_COLUMN_TYPES = ["string", "integer", "timestamp", "boolean", "text", "float"] as const;

const columnSchema = z.object({
  name: z.string(),
  type: z.string().transform((val): ColumnType => {
    if (VALID_COLUMN_TYPES.includes(val as any)) return val as ColumnType;
    return "string";
  }),
  primaryKey: z.boolean().optional(),
  nullable: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.string().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
  }).optional(),
});

const tableSchema = z.object({
  name: z.string(),
  description: z.string(),
  columns: z.array(columnSchema),
});

const relationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(["one-to-many", "many-to-many", "one-to-one"]),
  foreignKey: z.string(),
  description: z.string(),
});

export const claudeResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
  tables: z.array(tableSchema),
  relationships: z.array(relationshipSchema),
});

export type ClaudeSchemaResponse = z.infer<typeof claudeResponseSchema>;
```

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/lib/types.ts src/lib/schema-validator.ts
git commit -m "feat: add schema types and Zod validation"
```

---

### Task 3: Context Generator

**Files:**
- Create: `src/lib/context-generator.ts`

- [ ] **Step 1: Build the GROUNDWORK.md generator**

Create `src/lib/context-generator.ts`:

```typescript
import { Schema, Table, Column } from "./types";

function buildConstraints(col: Column): string {
  const parts: string[] = [];
  if (col.primaryKey) parts.push("primary key");
  if (col.unique) parts.push("unique");
  if (col.references) parts.push(`fk → ${col.references.table}.${col.references.column}`);
  if (col.defaultValue) parts.push(`default: ${col.defaultValue}`);
  if (col.nullable) parts.push("nullable");
  return parts.join(", ");
}

function buildTableSection(table: Table): string {
  const header = `### ${table.name}\n${table.description}\n`;
  const colHeader = "| Column | Type | Constraints |\n|--------|------|-------------|\n";
  const colRows = table.columns
    .map((col) => `| ${col.name} | ${col.type} | ${buildConstraints(col)} |`)
    .join("\n");
  return `${header}\n${colHeader}${colRows}`;
}

function buildExampleQueries(table: Table): string {
  const nonPkCols = table.columns.filter((c) => !c.primaryKey);
  const colNames = nonPkCols.map((c) => c.name).join(", ");
  const placeholders = nonPkCols.map(() => "?").join(", ");

  let sql = `**${table.name}**\n\n`;
  sql += "```sql\n";
  sql += `-- Get all ${table.name}\nSELECT * FROM ${table.name};\n\n`;
  sql += `-- Get ${table.name} by ID\nSELECT * FROM ${table.name} WHERE id = ?;\n\n`;
  sql += `-- Create a new record\nINSERT INTO ${table.name} (${colNames}) VALUES (${placeholders});\n`;

  // Add JOIN query for tables with foreign keys
  const fkCols = table.columns.filter((c) => c.references);
  for (const fk of fkCols) {
    const ref = fk.references!;
    sql += `\n-- Get ${table.name} with ${ref.table} info\n`;
    sql += `SELECT t.*, r.*\nFROM ${table.name} t\nJOIN ${ref.table} r ON t.${fk.name} = r.${ref.column}\nWHERE t.id = ?;\n`;
  }

  sql += "```";
  return sql;
}

export function generateContext(schema: Schema): string {
  const tableSections = schema.tables.map((t) => buildTableSection(t)).join("\n\n");

  const relationships = schema.relationships
    .map((r) => `- **${r.from} → ${r.to}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`)
    .join("\n");

  const exampleQueries = schema.tables.map((t) => buildExampleQueries(t)).join("\n\n");

  return `# GROUNDWORK.md
# Generated by Groundwork

## Schema: ${schema.name}
${schema.description}

---

## Tables

${tableSections}

---

## Relationships
${relationships}

---

## AI Instructions

When working with this database schema, follow these rules:

1. Always use the exact table and column names defined above
2. Always include proper foreign key references in queries
3. Use the relationships defined above — do not infer new ones
4. When creating new queries, follow these patterns:

### Example Queries

${exampleQueries}

---

## Common Patterns

- **Fetching with relations**: Always JOIN using the foreign keys defined in Relationships
- **Inserting records**: Include all non-nullable columns; let defaults handle timestamps
- **Filtering**: Use indexed columns (primary keys, foreign keys) for WHERE clauses

---

## Rules
- This file is the source of truth for database structure
- Do not modify table names, column names, or types without updating this file
- All queries should be consistent with the schema defined here
- When in doubt, reference this file before writing any database code
`;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/lib/context-generator.ts
git commit -m "feat: add GROUNDWORK.md context generator"
```

---

### Task 4: API Routes

**Files:**
- Create: `src/app/api/parse-schema/route.ts`
- Create: `src/app/api/generate-context/route.ts`

- [ ] **Step 1: Build the parse-schema API route**

Create `src/app/api/parse-schema/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { claudeResponseSchema } from "@/lib/schema-validator";
import { Schema } from "@/lib/types";

const SYSTEM_PROMPT = `You are a database schema parser. Given a plain English description of a database, extract the structured schema as JSON.

Return ONLY valid JSON matching this exact shape:
{
  "name": string,
  "description": string,
  "tables": [
    {
      "name": string,
      "description": string,
      "columns": [
        {
          "name": string,
          "type": "string" | "integer" | "timestamp" | "boolean" | "text" | "float",
          "primaryKey": boolean (optional),
          "nullable": boolean (optional),
          "unique": boolean (optional),
          "defaultValue": string (optional),
          "references": { "table": string, "column": string } (optional)
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": string,
      "to": string,
      "type": "one-to-many" | "many-to-many" | "one-to-one",
      "foreignKey": string,
      "description": string
    }
  ]
}

Rules:
- Infer reasonable column types from the six allowed values above
- Add an "id" integer primary key to every table if not mentioned
- Add "created_at" timestamp with default "now()" to every table if not mentioned
- Infer foreign keys from relationships (e.g. "posts belong to users" → posts.user_id with references to users.id)
- If the description is vague, make reasonable assumptions and include them
- Table and column names should be snake_case
- Do not include any text outside the JSON object`;

async function callClaude(input: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Set ANTHROPIC_API_KEY in .env.local");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const textBlock = response.content[0];
  if (textBlock.type !== "text") {
    throw new Error("Unexpected response format from Claude");
  }
  return textBlock.text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== "string" || input.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed schema description (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (input.length > 5000) {
      return NextResponse.json(
        { error: "Schema description is too long. Please keep it under 5000 characters." },
        { status: 400 }
      );
    }

    // Call Claude, retry once on invalid JSON
    let rawJson: string;
    try {
      rawJson = await callClaude(input);
    } catch (err: any) {
      if (err.message === "Set ANTHROPIC_API_KEY in .env.local") {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: "Something went wrong — please try again." },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Retry once with same prompt
      try {
        rawJson = await callClaude(input);
        parsed = JSON.parse(rawJson);
      } catch {
        return NextResponse.json(
          { error: "Couldn't parse that — try being more specific." },
          { status: 500 }
        );
      }
    }

    // Validate with Zod
    const validated = claudeResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Schema parsing produced unexpected structure — try rephrasing." },
        { status: 500 }
      );
    }

    // Build full Schema object with id and timestamp
    const schema: Schema = {
      id: crypto.randomUUID(),
      ...validated.data,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ schema });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Build the generate-context API route**

Create `src/app/api/generate-context/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateContext } from "@/lib/context-generator";
import { Schema } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema } = body as { schema: Schema };

    if (!schema || !schema.tables || schema.tables.length === 0) {
      return NextResponse.json(
        { error: "Invalid schema — no tables found." },
        { status: 400 }
      );
    }

    const content = generateContext(schema);
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate context file." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/app/api/
git commit -m "feat: add parse-schema and generate-context API routes"
```

---

### Task 5: Step Sidebar Component

**Files:**
- Create: `src/components/StepSidebar.tsx`

- [ ] **Step 1: Build the sidebar**

Create `src/components/StepSidebar.tsx`:

```tsx
interface StepSidebarProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Describe" },
  { number: 2, label: "Review" },
  { number: 3, label: "Export" },
] as const;

export default function StepSidebar({ currentStep }: StepSidebarProps) {
  return (
    <aside className="w-[200px] min-h-screen border-r px-5 py-6"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border-subtle)" }}>
      <div className="text-[15px] font-semibold mb-8 tracking-tight"
        style={{ color: "var(--text-primary)" }}>
        Groundwork
      </div>
      <nav className="flex flex-col gap-3.5">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isPast = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center gap-2.5">
              <span
                className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={
                  isActive || isPast
                    ? { background: "var(--text-primary)", color: "var(--bg-sidebar)" }
                    : { border: "1.5px solid var(--text-muted)", color: "var(--text-muted)" }
                }
              >
                {isPast ? "✓" : step.number}
              </span>
              <span
                className="text-[14px]"
                style={{ color: isActive || isPast ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/components/StepSidebar.tsx
git commit -m "feat: add step sidebar component"
```

---

### Task 6: Schema Input Component (Step 1)

**Files:**
- Create: `src/components/SchemaInput.tsx`

- [ ] **Step 1: Build the input component**

Create `src/components/SchemaInput.tsx`:

```tsx
"use client";

import { useRef, useCallback } from "react";

interface SchemaInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

const PLACEHOLDER = `Example: I have a users table with id, name, email, and created_at. Users can have many posts. Each post has an id, title, body, published flag, and belongs to a user. There's also a comments table where users can comment on posts.`;

export default function SchemaInput({ value, onChange, onSubmit, isLoading, error }: SchemaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1.5 tracking-tight"
        style={{ color: "var(--text-primary)" }}>
        Describe your schema
      </h2>
      <p className="text-sm mb-5 leading-relaxed"
        style={{ color: "var(--text-secondary)" }}>
        Tell us about your database tables, fields, and relationships in plain English.
      </p>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          handleInput();
        }}
        onInput={handleInput}
        disabled={isLoading}
        placeholder={PLACEHOLDER}
        className="w-full min-h-[150px] rounded-lg p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
        style={{
          background: "var(--bg-input)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
        }}
      />
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isLoading || value.trim().length < 10}
          className="px-6 py-2.5 rounded-[7px] text-sm font-medium disabled:opacity-40 transition-opacity flex items-center gap-2"
          style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Parsing...
            </>
          ) : (
            "Parse Schema →"
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/components/SchemaInput.tsx
git commit -m "feat: add schema input component"
```

---

### Task 7: Schema Review Component (Step 2)

**Files:**
- Create: `src/components/SchemaReview.tsx`

- [ ] **Step 1: Build the review component**

Create `src/components/SchemaReview.tsx`:

```tsx
import { Schema } from "@/lib/types";

interface SchemaReviewProps {
  schema: Schema;
  onEdit: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  error: string;
}

export default function SchemaReview({ schema, onEdit, onGenerate, isLoading, error }: SchemaReviewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}>
          {schema.name}
        </h2>
        <button
          onClick={onEdit}
          className="text-sm hover:underline"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Edit
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {schema.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {schema.tables.map((table) => {
          const tableRels = schema.relationships.filter(
            (r) => r.from === table.name || r.to === table.name
          );
          return (
            <div
              key={table.name}
              className="rounded-lg p-4"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {table.name}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                {table.description}
              </p>
              <div className="flex flex-col gap-1.5">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs">
                    <span style={{ color: "var(--text-primary)" }}>{col.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}
                    >
                      {col.type}
                    </span>
                    {col.primaryKey && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(255,200,50,0.1)", color: "rgba(255,200,50,0.7)" }}>
                        PK
                      </span>
                    )}
                    {col.references && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(100,180,255,0.1)", color: "rgba(100,180,255,0.7)" }}>
                        FK → {col.references.table}
                      </span>
                    )}
                    {col.unique && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(150,255,150,0.1)", color: "rgba(150,255,150,0.7)" }}>
                        unique
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {tableRels.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {tableRels.map((rel, i) => (
                    <p key={i} className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {rel.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-[7px] text-sm font-medium disabled:opacity-40 transition-opacity flex items-center gap-2"
          style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            "Generate Context →"
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/components/SchemaReview.tsx
git commit -m "feat: add schema review component"
```

---

### Task 8: Context Export Component (Step 3)

**Files:**
- Create: `src/components/ContextExport.tsx`

- [ ] **Step 1: Build the export component**

Create `src/components/ContextExport.tsx`:

```tsx
"use client";

import { useState } from "react";

interface ContextExportProps {
  content: string;
  onStartOver: () => void;
}

export default function ContextExport({ content, onStartOver }: ContextExportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GROUNDWORK.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}>
          Your GROUNDWORK.md
        </h2>
        <button
          onClick={onStartOver}
          className="text-sm hover:underline"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Start Over
        </button>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        Copy this file and drop it into any AI coding session for consistent database queries.
      </p>

      <div className="rounded-lg overflow-hidden mb-4"
        style={{ border: "1px solid var(--border-color)" }}>
        <div className="px-4 py-2 flex items-center justify-between"
          style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border-subtle)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            GROUNDWORK.md
          </span>
        </div>
        <pre
          className="p-4 text-sm leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto"
          style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
        >
          <code>{content}</code>
        </pre>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="px-6 py-2.5 rounded-[7px] text-sm font-medium transition-opacity"
          style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2.5 rounded-[7px] text-sm font-medium transition-opacity"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
        >
          Download .md
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/components/ContextExport.tsx
git commit -m "feat: add context export component"
```

---

### Task 9: Main Page — Wire Everything Together

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the main page with stepper logic**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import StepSidebar from "@/components/StepSidebar";
import SchemaInput from "@/components/SchemaInput";
import SchemaReview from "@/components/SchemaReview";
import ContextExport from "@/components/ContextExport";
import { Schema } from "@/lib/types";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [userInput, setUserInput] = useState("");
  const [parsedSchema, setParsedSchema] = useState<Schema | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleParseSchema = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parse-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setParsedSchema(data.schema);
      setCurrentStep(2);
    } catch {
      setError("Failed to connect — is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContext = async () => {
    if (!parsedSchema) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: parsedSchema }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setGeneratedMarkdown(data.content);
      setCurrentStep(3);
    } catch {
      setError("Failed to generate context file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setError("");
    setCurrentStep(1);
  };

  const handleStartOver = () => {
    setUserInput("");
    setParsedSchema(null);
    setGeneratedMarkdown("");
    setError("");
    setCurrentStep(1);
  };

  return (
    <div className="flex min-h-screen">
      <StepSidebar currentStep={currentStep} />
      <main className="flex-1 px-8 py-7 md:px-12 md:py-10 max-w-3xl">
        {currentStep === 1 && (
          <SchemaInput
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleParseSchema}
            isLoading={isLoading}
            error={error}
          />
        )}
        {currentStep === 2 && parsedSchema && (
          <SchemaReview
            schema={parsedSchema}
            onEdit={handleEdit}
            onGenerate={handleGenerateContext}
            isLoading={isLoading}
            error={error}
          />
        )}
        {currentStep === 3 && (
          <ContextExport
            content={generatedMarkdown}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the full flow works**

Run:
```bash
cd /Users/varunnukala/Desktop/Groundwork && npm run dev
```

Test the flow:
1. Enter a schema description → click "Parse Schema"
2. Review the cards → click "Generate Context"
3. See the GROUNDWORK.md → test Copy and Download buttons

- [ ] **Step 3: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add src/app/page.tsx
git commit -m "feat: wire up main page with 3-step flow"
```

---

### Task 10: Documentation

**Files:**
- Create: `README.md`
- Create: `examples/GROUNDWORK.md`

- [ ] **Step 1: Write README.md**

Create `README.md` with:
- What Groundwork is and the vibecoding consistency problem
- Install and run instructions (clone, `cp .env.example .env.local`, add API key, `npm install`, `npm run dev`)
- Usage flow (describe → review → export)
- Example GROUNDWORK.md output snippet
- Contributing section
- MIT License

- [ ] **Step 2: Write example GROUNDWORK.md**

Create `examples/GROUNDWORK.md` — a fully generated example for a SaaS app with `users`, `subscriptions`, and `posts` tables. This serves as marketing material showing what the tool produces.

- [ ] **Step 3: Create .env.example**

Create `.env.example`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

- [ ] **Step 4: Commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add README.md examples/GROUNDWORK.md .env.example
git commit -m "docs: add README, example output, and env template"
```

---

### Task 11: QA Pass

**Files:**
- May modify any file based on findings

- [ ] **Step 1: Test vague input handling**

Try these inputs and verify graceful responses:
- "I need a database" (very vague — should still produce something reasonable)
- "users and posts" (minimal — should infer reasonable columns)
- "" (empty — should show validation error)
- A 3-character string (too short — should show validation error)

- [ ] **Step 2: Test generated context quality**

Take a generated GROUNDWORK.md and mentally evaluate:
- Does it contain all tables with correct columns?
- Are the example SQL queries syntactically correct?
- Are relationships accurately represented?
- Would you trust this file if dropped into an AI conversation?

- [ ] **Step 3: Test UI interactions**

- Copy button works and shows "Copied!" feedback
- Download button downloads a valid .md file
- "← Edit" returns to Step 1 with input preserved
- "← Start Over" clears everything
- Loading states show on both Parse and Generate buttons
- Error messages display inline

- [ ] **Step 4: Test responsive layout**

Resize browser to mobile width. Verify:
- Sidebar collapses or remains usable
- Cards stack to single column
- Textarea and buttons are full-width
- Code block scrolls horizontally

- [ ] **Step 5: Fix any issues found, commit**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add -A
git commit -m "fix: QA pass — polish and bug fixes"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Clean install test**

```bash
cd /tmp
git clone /Users/varunnukala/Desktop/Groundwork groundwork-test
cd groundwork-test
cp .env.example .env.local
# (add real API key)
npm install
npm run dev
```

Verify the app works from a fresh clone.

- [ ] **Step 2: Build check**

```bash
cd /Users/varunnukala/Desktop/Groundwork && npm run build
```

Expected: No build errors.

- [ ] **Step 3: Final commit if any fixes needed**

```bash
cd /Users/varunnukala/Desktop/Groundwork
git add -A
git commit -m "chore: final polish for launch readiness"
```
