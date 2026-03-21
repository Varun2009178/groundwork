# Groundwork Launch-Ready Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Goal:** Make Groundwork demo-ready for public launch — thousands of users, forkable, polished to paid-product quality. Fully free and open-source; revenue is adoption and credibility.

---

## Scope Summary

Six workstreams, no new features beyond what's listed:

1. Bug fixes (relationship map direction, CLI default command, package rename)
2. Rate limiting (Vercel KV, server-side key for web app free tier)
3. Deployment (Vercel, environment variables)
4. Landing page & SEO (OG tags, "Coming Soon" section, CTA polish)
5. Repo cleanup & fork-readiness (.env.example, GitHub Actions CI, README)
6. Error handling (error boundary, 404 page, KV fail-open)

---

## 1. Bug Fixes

### 1a. Relationship Map Direction

**Problem:** Both `cli/src/generator.ts` (around lines 53 and 98) and `src/lib/context-generator.ts` render relationships as `${r.from} 1──* ${r.to}`. The LLM returns `from` as the FK-holding table (the "many" side), so `posts 1──* users` reads as "one post has many users" — semantically backwards.

**Fix:** For `one-to-many` relationships, swap `from` and `to` for display in:
- The ASCII relationship map: `users 1──* posts (user_id)` instead of `posts 1──* users (user_id)`
- The text relationship line: `**users → posts**: one-to-many via posts.user_id` instead of `**posts → users**: one-to-many`

**Important:** When swapping `from`/`to` for display, the `via` clause must still reference the original FK-holding table. Use the original `from` value (not the swapped one) for the `via` reference: `via ${originalFrom}.${r.foreignKey}`.

For `many-to-many` and `one-to-one`, order doesn't matter semantically — leave as-is.

**Files changed:**
- `cli/src/generator.ts` — `buildRelationshipsMap()` and the relationship text in `generateContext()`
- `src/lib/context-generator.ts` — same functions (web app's copy)

### 1b. CLI Default Command

**Problem:** Running `groundwork` (or `npx groundwork-cli`) with no subcommand exits with code 1 and shows help. Most users only need `init`.

**Fix:** When no command is provided, run `init` by default. Commander.js supports this via setting a default command or detecting no args and calling `initCommand()`.

**File changed:** `cli/src/index.ts`

### 1c. Package Rename

**Goal:** `npx groundwork` instead of `npx groundwork-cli init`.

**Action:** Check if `groundwork` is available on npm. If yes, rename `cli/package.json` name from `groundwork-cli` to `groundwork`. The binary name stays `groundwork` (already correct). Publish new version.

If `groundwork` is taken on npm, keep `groundwork-cli` — the default-to-init fix from 1b means `npx groundwork-cli` still works cleanly without the `init` subcommand.

**File changed:** `cli/package.json` (name field, version bump)

---

## 2. Rate Limiting & Server Key

### Architecture

The web app's `/api/parse-schema` route currently requires the client to provide an API key. We add a server-side fallback key so visitors can try Groundwork without BYOK, protected by IP-based rate limiting.

### Flow

```
Client POST /api/parse-schema { input, apiKey? }
  │
  ├─ apiKey provided? → Use client's key, no rate limit, call LLM
  │
  └─ No apiKey? → Check rate limit (IP-based via Vercel KV)
       │
       ├─ Under limit (<=10/day)? → Use server key, increment counter, call LLM
       │
       └─ Over limit? → Return 429: "You've used your 10 free generations
                         today. Add your own API key to continue, or come
                         back tomorrow."
```

### Implementation

- **Store:** Vercel KV (Redis) via `@vercel/redis`. Free tier: 30K requests/month, 256MB.
- **Key format:** `ratelimit:parse:{ip}` with value = integer count
- **IP extraction:** `request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()` with fallback to `'unknown'`. On Vercel, `x-forwarded-for` is always set.
- **TTL:** 86400 seconds (24 hours), set on first request. Counter resets 24 hours after first use. This is simpler than midnight-UTC resets and more predictable for users.
- **Limit:** 10 generations per IP per 24-hour window
- **Fail-open:** If KV is unreachable (try-catch around KV calls), allow the request using the server key. Availability > protection.
- **Server key:** The existing `callLLM` function in the route already falls through `OPENROUTER_API_KEY || ANTHROPIC_API_KEY || OPENAI_API_KEY || GEMINI_API_KEY` when no client key is provided. No new key-routing logic needed — the rate limit check is the only new logic. If no `apiKey` in the request body, check rate limit, then let the existing server-side fallback handle the LLM call.

### Dependencies

- `@vercel/redis` package added to root `package.json` (note: `@vercel/kv` is deprecated, `@vercel/redis` is the current replacement with the same backing store)

### File changed

- `src/app/api/parse-schema/route.ts` — add rate limit check at top of handler

---

## 3. Deployment

### Vercel Setup

- Connect GitHub repo (`Varun2009178/groundwork`) to Vercel
- Framework: Next.js (auto-detected)
- Build command: `next build` (default)
- Output directory: `.next` (default)
- No `vercel.json` needed

### Environment Variables (Vercel Dashboard)

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Server-side key for free tier LLM calls |
| `KV_REST_API_URL` | Auto-provisioned when adding Vercel KV store |
| `KV_REST_API_TOKEN` | Auto-provisioned when adding Vercel KV store |

### Domain

Point custom domain (e.g., `groundwork.dev`) at Vercel after initial deployment. The `*.vercel.app` URL works for initial demos.

### No config file changes needed

`next.config.ts` stays empty. Vercel handles Next.js 16 natively.

---

## 4. Landing Page & SEO

### 4a. Open Graph Meta Tags

Add to `src/app/layout.tsx` via Next.js metadata export:

```typescript
export const metadata: Metadata = {
  title: "Groundwork — Give your AI the full picture",
  description: "Turn plain English into structured database context files that AI tools actually understand.",
  openGraph: {
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
  },
};
```

**OG image:** Create a static 1200x630 PNG in `public/og-image.png`. Clean branded card with the Groundwork name, tagline, and a hint of the GROUNDWORK.md output format.

### 4b. "Coming Soon" Section

Add a section near the bottom of `src/app/page.tsx` (before footer/GitHub link) listing planned features:

- `groundwork check` — Validate your schema for common issues
- Import from SQL DDL or Prisma schema
- Schema version history
- Team sharing

Style: muted, teaser-style cards. Not prominent — just signals the project is alive and growing.

### 4c. CTA Polish

**Depends on sections 1b and 1c being completed first.** Implement in order: 1b → 1c → 4c.

- Make the "Try it now" button and `npx groundwork` command more visually prominent on the landing page
- Update CLI command references from `npx groundwork-cli init` to `npx groundwork` (or `npx groundwork-cli` if rename not possible)

### 4d. Favicon

No favicon currently exists in `public/` (only default Next.js SVGs). Add `public/favicon.ico` (or `src/app/icon.png` using Next.js App Router convention). Ensure `layout.tsx` references it via the metadata `icons` property.

---

## 5. Repo Cleanup & Fork-Readiness

### 5a. `.env.example`

Update the existing `.env.example` in the repo root to include KV variables and all four provider keys:

```env
# Server-side API key for web app free tier (pick one)
OPENROUTER_API_KEY=your-key-here
# ANTHROPIC_API_KEY=
# OPENAI_API_KEY=
# GEMINI_API_KEY=

# Vercel KV (auto-provisioned on Vercel, only needed locally for rate limit testing)
# KV_REST_API_URL=
# KV_REST_API_TOKEN=
```

### 5b. GitHub Actions CI

Single workflow at `.github/workflows/ci.yml`:

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
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: cd cli && npm ci && npm run build
```

No test step — no tests exist yet. CI ensures lint + build pass on every push/PR.

**Important:** Ensure `package-lock.json` (root) and `cli/package-lock.json` are committed to the repo. `npm ci` requires lockfiles.

### 5c. README Updates

- Verify Next.js version is listed as 16 throughout README (already correct in tech stack table, check for any other references)
- Update CLI invocation to `npx groundwork` (or `npx groundwork-cli`)
- Add badges at top: CI status, npm version, MIT license
- Clean up any stale references

### 5d. Commit Uncommitted Changes

The repo has unstaged modifications across CLI and web app files. These get committed as a clean baseline before starting this work.

---

## 6. Error Handling

### 6a. React Error Boundary

Add an `error.tsx` file in `src/app/app/` (Next.js App Router convention). Catches runtime errors in the stepper UI and shows:

- "Something went wrong" message
- "Start over" button that resets state and navigates to step 1
- Styled consistently with the dark theme

### 6b. 404 Page

Add `src/app/not-found.tsx`:

- Branded "Page not found" message
- Link back to home
- Dark theme consistent with the rest of the app

### 6c. KV Fail-Open

In the rate limit check (section 2), wrap all KV operations in try-catch. If KV is unreachable, log the error and allow the request through using the server key. Users should never be blocked by infrastructure failures.

---

## Out of Scope

These are explicitly NOT included in this work:

- `groundwork check` improvements (coming soon)
- Import from SQL/Prisma
- Schema history / persistence
- User authentication
- Analytics / telemetry
- Windsurf export format
- Docker setup
- Unit/integration tests

---

## Files Changed Summary

| File | Change |
|------|--------|
| `cli/src/generator.ts` | Fix relationship map direction |
| `cli/src/index.ts` | Default to init command |
| `cli/package.json` | Version bump, possible name rename |
| `src/lib/context-generator.ts` | Fix relationship map direction |
| `src/app/api/parse-schema/route.ts` | Add rate limiting, server key fallback |
| `src/app/layout.tsx` | OG meta tags, favicon |
| `src/app/page.tsx` | Coming Soon section, CTA polish |
| `src/app/app/error.tsx` | New: error boundary |
| `src/app/not-found.tsx` | New: 404 page |
| `.env.example` | Updated: add KV variables and all provider keys |
| `.github/workflows/ci.yml` | New: CI pipeline |
| `README.md` | Version fix, badges, CLI invocation update |
| `public/og-image.png` | New: OG image for social sharing |
| `package.json` | Add @vercel/redis dependency |
