# Groundwork Launch-Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Groundwork demo-ready for public launch — fix bugs, add rate limiting, polish landing page, clean up repo for fork-readiness.

**Architecture:** Minimal changes to existing Next.js 16 + CLI codebase. Add Vercel KV rate limiting to the parse-schema API route (server-side key for free tier, BYOK bypass). Landing page gets OG tags, Coming Soon section, and updated CLI commands. Repo gets CI, .env.example update, and error pages.

**Tech Stack:** Next.js 16, TypeScript, @vercel/redis, Vercel KV, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-03-20-groundwork-launch-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/generator.ts` | Modify lines 51-53, 97-98 | Fix relationship map direction (CLI) |
| `src/lib/context-generator.ts` | Modify lines 53-55, 106-108 | Fix relationship map direction (web) |
| `cli/src/index.ts` | Modify lines 200-241 | Default to init when no subcommand |
| `cli/package.json` | Modify version | Bump version for republish |
| `src/app/api/parse-schema/route.ts` | Modify lines 153-216 | Add rate limiting before LLM call |
| `src/lib/rate-limit.ts` | Create | Rate limiting helper (Vercel KV) |
| `src/app/layout.tsx` | Modify | Add OG meta tags, favicon ref |
| `src/app/page.tsx` | Modify lines 165, 341, 352, 383, add section before line 411 | Update CLI commands, add Coming Soon (must be done sequentially) |
| `src/app/app/error.tsx` | Create | React error boundary for stepper |
| `src/app/not-found.tsx` | Create | Custom 404 page |
| `.env.example` | Modify | Add KV variables and all provider keys |
| `.github/workflows/ci.yml` | Create | Lint + build CI pipeline |
| `README.md` | Modify lines 5-6, 23, 44, 62 | Update badges and CLI commands |
| `package.json` | Modify | Add @vercel/redis dependency |
| `src/app/icon.tsx` | Create | Dynamic favicon via Next.js ImageResponse |
| `src/app/opengraph-image.tsx` | Create | Dynamic OG image via Next.js ImageResponse |
| `src/lib/rate-limit.ts` | Create | Rate limiting helper (deliberate deviation from spec — extracted for clarity) |

---

### Task 1: Commit Baseline

Commit all existing unstaged changes as a clean baseline before starting launch work.

**Files:**
- All currently modified files in the working tree

- [ ] **Step 1: Stage and commit all current changes**

Stage only the known modified files (avoid `git add -A` which could include sensitive files):

```bash
git add cli/dist/ cli/src/ cli/package.json src/app/api/parse-schema/route.ts src/app/app/page.tsx src/components/ContextExport.tsx src/components/SchemaInput.tsx src/lib/context-generator.ts GROUNDWORK.md
git commit -m "chore: baseline commit before launch prep"
```

- [ ] **Step 2: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

---

### Task 2: Fix Relationship Map Direction (CLI)

The LLM returns `from` as the FK-holding table (many side). For one-to-many, swap from/to in display so `users 1──* posts` instead of `posts 1──* users`.

**Files:**
- Modify: `cli/src/generator.ts` (lines 51-53 and 97-98)

- [ ] **Step 1: Fix the ASCII relationship map in `buildRelationshipsMap()`**

In `cli/src/generator.ts`, replace lines 51-53:

```typescript
  const lines = schema.relationships.map((r) => {
    const sym = typeSymbol[r.type] || "──";
    return `  ${r.from} ${sym} ${r.to} (${r.foreignKey})`;
  });
```

With:

```typescript
  const lines = schema.relationships.map((r) => {
    const sym = typeSymbol[r.type] || "──";
    // For one-to-many, swap from/to so "one" side comes first (from = FK holder = many side)
    if (r.type === "one-to-many") {
      return `  ${r.to} ${sym} ${r.from} (${r.foreignKey})`;
    }
    return `  ${r.from} ${sym} ${r.to} (${r.foreignKey})`;
  });
```

- [ ] **Step 2: Fix the text relationship line in `generateContext()`**

In `cli/src/generator.ts`, replace lines 97-98:

```typescript
  const relationships = schema.relationships
    .map((r) => `- **${r.from} → ${r.to}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`)
    .join("\n");
```

With:

```typescript
  const relationships = schema.relationships
    .map((r) => {
      // For one-to-many, display as "to → from" (one side → many side), but via still references FK holder
      if (r.type === "one-to-many") {
        return `- **${r.to} → ${r.from}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`;
      }
      return `- **${r.from} → ${r.to}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`;
    })
    .join("\n");
```

- [ ] **Step 3: Rebuild CLI**

```bash
cd cli && npm run build
```

Expected: Compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add cli/src/generator.ts cli/dist/generator.js
git commit -m "fix: correct relationship map direction for one-to-many in CLI"
```

---

### Task 3: Fix Relationship Map Direction (Web App)

Same fix as Task 2, applied to the web app's copy of the generator.

**Files:**
- Modify: `src/lib/context-generator.ts` (lines 53-55 and 106-108)

- [ ] **Step 1: Fix the ASCII relationship map in `buildRelationshipsMap()`**

In `src/lib/context-generator.ts`, replace lines 53-55:

```typescript
  const lines = schema.relationships.map((r) => {
    const sym = typeSymbol[r.type] || "──";
    return `  ${r.from} ${sym} ${r.to} (${r.foreignKey})`;
  });
```

With:

```typescript
  const lines = schema.relationships.map((r) => {
    const sym = typeSymbol[r.type] || "──";
    if (r.type === "one-to-many") {
      return `  ${r.to} ${sym} ${r.from} (${r.foreignKey})`;
    }
    return `  ${r.from} ${sym} ${r.to} (${r.foreignKey})`;
  });
```

- [ ] **Step 2: Fix the text relationship line in `generateContext()`**

In `src/lib/context-generator.ts`, replace lines 106-108:

```typescript
  const relationships = schema.relationships
    .map((r) => `- **${r.from} → ${r.to}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`)
    .join("\n");
```

With:

```typescript
  const relationships = schema.relationships
    .map((r) => {
      if (r.type === "one-to-many") {
        return `- **${r.to} → ${r.from}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`;
      }
      return `- **${r.from} → ${r.to}**: ${r.type} via \`${r.from}.${r.foreignKey}\` — ${r.description}`;
    })
    .join("\n");
```

- [ ] **Step 3: Verify web app builds**

```bash
npm run build
```

Expected: Builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/context-generator.ts
git commit -m "fix: correct relationship map direction for one-to-many in web app"
```

---

### Task 4: CLI Default to Init + Version Bump

Make `groundwork` (or `npx groundwork-cli`) with no subcommand run `init` by default. The `groundwork` npm name is taken, so keep `groundwork-cli`.

**Files:**
- Modify: `cli/src/index.ts` (lines 200-241)
- Modify: `cli/package.json` (version)

- [ ] **Step 1: Verify `groundwork` npm name is taken**

```bash
npm view groundwork name 2>&1
```

Expected: Shows `groundwork` (confirming it's taken). We keep `groundwork-cli`.

- [ ] **Step 2: Add default command behavior**

In `cli/src/index.ts`, replace the `program.command("init")` block (lines 207-211):

```typescript
program
  .command("init")
  .description("Interactively describe your schema and generate GROUNDWORK.md")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action(initCommand);
```

With (only change is adding `{ isDefault: true }`):

```typescript
program
  .command("init", { isDefault: true })
  .description("Interactively describe your schema and generate GROUNDWORK.md")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action(initCommand);
```

This tells Commander.js to run `init` when no subcommand is provided.

- [ ] **Step 3: Bump CLI version**

In `cli/package.json`, change version from `"0.1.3"` to `"0.2.0"` (minor bump for behavior change).

- [ ] **Step 4: Rebuild and test**

```bash
cd cli && npm run build
```

Test locally:
```bash
echo "" | node cli/dist/index.js 2>&1 | head -3
```

Expected: Should show "Using <provider> key:" or "Missing API key" — NOT the help text.

- [ ] **Step 5: Commit**

```bash
git add cli/src/index.ts cli/dist/index.js cli/package.json
git commit -m "feat: default to init when no subcommand given, bump to 0.2.0"
```

---

### Task 5: Add Rate Limiting Helper

Create a rate limiting module using @vercel/redis. Isolated from the route for testability.

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Install @vercel/redis**

```bash
npm install @vercel/redis
```

- [ ] **Step 2: Create rate limiting helper**

Create `src/lib/rate-limit.ts`:

```typescript
import { Redis } from "@vercel/redis";

const DAILY_LIMIT = 10;
const TTL_SECONDS = 86400; // 24 hours

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // If KV is not configured (local dev), fail open
  if (!process.env.KV_REST_API_URL) {
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }

  const redis = Redis.fromEnv();
  const key = `ratelimit:parse:${ip}`;

  try {
    // Atomic: single incr avoids race condition between get and incr
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, TTL_SECONDS);
    }

    if (count > DAILY_LIMIT) {
      return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
    }

    return { allowed: true, remaining: DAILY_LIMIT - count, limit: DAILY_LIMIT };
  } catch (error) {
    // Fail open: if KV is down, allow the request
    console.error("Rate limit check failed, allowing request:", error);
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts package.json package-lock.json
git commit -m "feat: add rate limiting helper with Vercel KV"
```

---

### Task 6: Integrate Rate Limiting into Parse-Schema Route

Wire the rate limiter into the API route. BYOK requests skip rate limiting.

**Files:**
- Modify: `src/app/api/parse-schema/route.ts` (lines 153-170)

- [ ] **Step 1: Add rate limit import and IP extraction**

Add at the top of `src/app/api/parse-schema/route.ts` (after line 3):

```typescript
import { checkRateLimit } from "@/lib/rate-limit";
```

- [ ] **Step 2: Add rate limit check in the POST handler**

In `src/app/api/parse-schema/route.ts`, inside the POST handler, after the input length validation (after line 170) and before the `let rawJson` declaration (line 172), add:

```typescript
    // Rate limit: only applies when using server-side key (no client key)
    if (!clientKey) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const rateLimit = await checkRateLimit(ip);

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: "You've used your 10 free generations today. Add your own API key to continue, or come back tomorrow." },
          { status: 429 }
        );
      }
    }
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Builds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/parse-schema/route.ts
git commit -m "feat: add IP-based rate limiting for server-key requests"
```

---

### Task 7: OG Meta Tags + Favicon

Add Open Graph tags for social sharing and a dynamic favicon + OG image using Next.js ImageResponse (generates real PNG at build time — works on all social platforms).

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/icon.tsx`
- Create: `src/app/opengraph-image.tsx`

- [ ] **Step 1: Update metadata in layout.tsx**

Replace the `metadata` export in `src/app/layout.tsx` (lines 14-17):

```typescript
export const metadata: Metadata = {
  title: "Groundwork",
  description: "Define your database schema once. Get consistent AI context forever.",
};
```

With:

```typescript
export const metadata: Metadata = {
  title: "Groundwork — Give your AI the full picture",
  description: "Turn plain English into structured database context files that AI tools actually understand.",
  openGraph: {
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
  },
};
```

Note: No `icons` or `images` properties needed — Next.js auto-discovers `icon.tsx` and `opengraph-image.tsx` files.

- [ ] **Step 2: Create dynamic favicon**

Create `src/app/icon.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "#191919",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#e5e5e5", fontSize: 20, fontWeight: 700 }}>G</span>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 3: Create dynamic OG image**

Create `src/app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const alt = "Groundwork — Give your AI the full picture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <span style={{ color: "#e5e5e5", fontSize: 72, fontWeight: 700 }}>
          Groundwork
        </span>
        <span style={{ color: "#888", fontSize: 28, marginTop: 16 }}>
          Give your AI the full picture
        </span>
        <span style={{ color: "#555", fontSize: 20, marginTop: 48, fontFamily: "monospace" }}>
          $ npx groundwork-cli
        </span>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Builds without errors. Next.js will generate `/icon` and `/opengraph-image` routes automatically.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/icon.tsx src/app/opengraph-image.tsx
git commit -m "feat: add OG meta tags, dynamic favicon, and social sharing image"
```

---

### Task 8: Landing Page — Coming Soon + CLI Command Updates

Add "Coming Soon" section and update all CLI command references. These are combined into one task since they both modify `src/app/page.tsx` and must not be parallelized.

**Depends on:** Task 4 (CLI default-to-init must be done first so the new command is valid).

**Files:**
- Modify: `src/app/page.tsx` (lines 165, 341, 352, 383, and insert before line 411)

- [ ] **Step 1: Update all CLI command references**

In `src/app/page.tsx`, find and replace all occurrences of `npx groundwork-cli init` with `npx groundwork-cli`:

1. Line 165 (hero CTA display text)
2. Line 167 (hero CTA CopyButton text prop)
3. Line 341 (terminal section CopyButton text prop)
4. Line 352 (terminal demo `<span>` inside the `<pre>` block)
5. Line 383 (final CTA display text)

Use find-and-replace: `npx groundwork-cli init` → `npx groundwork-cli` (should hit 5 occurrences).

- [ ] **Step 2: Add Coming Soon section**

In `src/app/page.tsx`, insert the following between the closing `</section>` tag (around line 409) and the `{/* Minimal footer */}` comment:

```tsx
      {/* Coming Soon */}
      <section className="py-16 px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest mb-8" style={{ color: "var(--text-muted)" }}>
            Coming Soon
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "groundwork check", desc: "Validate your schema for common issues" },
              { title: "Import from SQL", desc: "Paste DDL or Prisma schema, get GROUNDWORK.md" },
              { title: "Schema History", desc: "Track how your schema evolves over time" },
              { title: "Team Sharing", desc: "Share schemas across your team" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-5 text-left"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                  {item.title}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Verify it renders**

```bash
npm run dev
```

Check `http://localhost:3000` — scroll to bottom, Coming Soon section should appear above the footer. Verify CLI commands show `npx groundwork-cli` (no `init`).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add Coming Soon section and update CLI commands on landing page"
```

---

### Task 9: Error Boundary

Add a React error boundary for the stepper app using Next.js App Router's `error.tsx` convention.

**Files:**
- Create: `src/app/app/error.tsx`

- [ ] **Step 1: Create error boundary**

Create `src/app/app/error.tsx`:

```tsx
"use client";

export default function StepperError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-primary)" }}>
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">:/</p>
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          An unexpected error occurred. Your input was not lost — try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/app/error.tsx
git commit -m "feat: add error boundary for stepper app"
```

---

### Task 10: 404 Page

Add a custom 404 page matching the dark theme.

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create 404 page**

Create `src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-primary)" }}>
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold mb-4" style={{ color: "var(--text-muted)" }}>
          404
        </p>
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 inline-block"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: add custom 404 page"
```

---

### Task 11: Update .env.example

Expand the existing `.env.example` with all provider keys and KV variables.

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update .env.example**

Replace the entire contents of `.env.example` with:

```env
# Server-side API key for web app free tier (pick one)
OPENROUTER_API_KEY=your-key-here
# ANTHROPIC_API_KEY=your-key-here
# OPENAI_API_KEY=your-key-here
# GEMINI_API_KEY=your-key-here

# Vercel KV — auto-provisioned when you add a KV store on Vercel.
# Only needed locally if you want to test rate limiting.
# KV_REST_API_URL=
# KV_REST_API_TOKEN=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: expand .env.example with all provider keys and KV vars"
```

---

### Task 12: GitHub Actions CI

Add a CI workflow that runs lint + build on push and PRs.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build web app
        run: npm run build

      - name: Build CLI
        run: cd cli && npm ci && npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint and build"
```

---

### Task 13: README Updates

Update badges, CLI invocation, and clean up stale references.

**Files:**
- Modify: `README.md` (lines 5-6, 23, 44, 62)

- [ ] **Step 1: Update badges**

In `README.md`, replace lines 5-6:

```markdown
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/groundwork-cli)](https://www.npmjs.com/package/groundwork-cli)
```

With:

```markdown
[![CI](https://github.com/Varun2009178/groundwork/actions/workflows/ci.yml/badge.svg)](https://github.com/Varun2009178/groundwork/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/groundwork-cli)](https://www.npmjs.com/package/groundwork-cli)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
```

- [ ] **Step 2: Update CLI invocation commands**

Find and replace all `npx groundwork-cli init` with `npx groundwork-cli` in README.md. Use global find-and-replace to catch all occurrences (at least lines 23, 44, and ~158). The `check` command reference (line 62) stays as `npx groundwork-cli check` (explicit subcommand).

Known occurrences:
- Line 23: `npx groundwork-cli init` → `npx groundwork-cli`
- Line 44: `$ npx groundwork-cli init` → `$ npx groundwork-cli`
- Line ~158 (Setup section): `npx groundwork-cli init` → `npx groundwork-cli`
- Line 62: Keep `$ npx groundwork-cli check` unchanged

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with CI badge and simplified CLI commands"
```

---

### Task 14: Final Build Verification

Verify everything builds cleanly and the app works.

**Files:** None (verification only)

- [ ] **Step 1: Full web app build**

```bash
npm run build
```

Expected: Builds without errors.

- [ ] **Step 2: Full CLI build**

```bash
cd cli && npm run build
```

Expected: Compiles without errors.

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Quick smoke test — CLI defaults to init**

```bash
echo "" | node cli/dist/index.js 2>&1 | head -5
```

Expected: Shows API key detection message or missing key error — NOT help text.

- [ ] **Step 5: Quick smoke test — web app starts**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: Returns HTML content.

---

## Execution Notes

- **Task ordering:** Task 1 first (baseline). Tasks 2-4 (bug fixes) are independent and can be parallelized. Tasks 5-6 (rate limiting) must be sequential. Task 7 (OG/favicon) is independent. Task 8 (landing page) depends on Task 4 and modifies `page.tsx` — do not parallelize with other `page.tsx` work. Tasks 9-12 are independent of each other. Task 13 (README) depends on Task 4. Task 14 runs last.
- **npm publish:** After Task 4, the CLI should be republished to npm with `cd cli && npm publish`. This requires npm credentials and should be confirmed with the user.
- **OG image:** Task 7 uses Next.js ImageResponse to generate real PNG images at build time — works on all social platforms without conversion.
- **Vercel deployment:** Not in this plan — it's a Vercel dashboard action (connect repo, add env vars, deploy). The code changes here make the app deployment-ready.
