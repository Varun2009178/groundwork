"use client";

import { useState, useEffect } from "react";

/* ── Helpers ─────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
      }}
      className="ml-2 p-1.5 rounded-md transition-colors cursor-pointer"
      style={{ color: copied ? "#1c1c1c" : "#5f5f5d" }}
      title="Copy"
    >
      {copied ? (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

function GitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.github.com/repos/Varun2009178/groundwork")
      .then((r) => r.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) setStars(data.stargazers_count);
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href="https://github.com/Varun2009178/groundwork"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors"
      style={{ border: "1px solid #eceae4", color: "#1c1c1c" }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
      {stars !== null && (
        <span className="font-medium">
          {stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
        </span>
      )}
      {stars !== null && (
        <svg className="w-3.5 h-3.5" style={{ color: "#5f5f5d" }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </a>
  );
}

/* ── Terminal Preview ─────────────────────────────────────── */

function TerminalPreview() {
  const muted = "#6b7280";
  const white = "#e5e7eb";
  const green = "#4ade80";
  const bold = "#f9fafb";

  return (
    <pre className="p-6 text-[13px] leading-loose font-mono" style={{ color: white }}>
      <code>
        <span style={{ color: muted }}>$</span>{" "}
        <span style={{ color: bold, fontWeight: 600 }}>npx groundwork-cli watch</span>
        {"\n\n"}
        <span style={{ color: green }}>✓</span> GROUNDWORK.md generated (3 tables, 3 relationships)
        {"\n\n"}
        <span style={{ color: muted }}>Watching prisma/schema.prisma → GROUNDWORK.md</span>
        {"\n\n"}
        <span style={{ color: muted }}>[14:23:01]</span> GROUNDWORK.md updated (4 tables, 3 relationships)
        {"\n"}
        <span style={{ color: muted }}>[14:25:12]</span> GROUNDWORK.md updated (4 tables, 5 relationships)
        {"\n\n"}
        <span style={{ color: muted }}>  Schema changes auto-sync. Your AI always has the latest.</span>
      </code>
    </pre>
  );
}

/* ── Code Preview ─────────────────────────────────────────── */

function CodePreview() {
  const h2 = { color: "#e2e8f0", fontWeight: 700 };
  const h3 = { color: "#cbd5e1" };
  const rule = { color: "#94a3b8" };
  const kw = { color: "#60a5fa" };
  const str = { color: "#34d399" };
  const comment = { color: "#6b7280", fontStyle: "italic" as const };
  const fn = { color: "#c084fc" };
  const tbl = { color: "#fb923c" };
  const col = { color: "#67e8f9" };
  const sym = { color: "#94a3b8" };
  const warn = { color: "#fbbf24" };
  const dim = { color: "#475569" };
  const rel = { color: "#a78bfa" };

  return (
    <pre className="p-5 md:p-6 text-[12px] md:text-[13px] leading-relaxed font-mono overflow-hidden flex-1" style={{ color: "#e2e8f0" }}>
      <code>
        <span style={h2}>## Tables</span>{"\n\n"}
        <span style={h3}>### users</span>{"\n"}
        <span style={rule}>Stores user records</span>{"\n\n"}
        <span style={dim}>| Column | Type | Constraints |</span>{"\n"}
        <span style={col}>  id</span>{"        "}<span style={kw}>integer</span>{"   "}<span style={str}>primary key</span>{"\n"}
        <span style={col}>  email</span>{"     "}<span style={kw}>string</span>{"    "}<span style={str}>unique</span>{"\n"}
        <span style={col}>  name</span>{"      "}<span style={kw}>string</span>{"    "}<span style={warn}>nullable</span>{"\n"}
        <span style={col}>  createdAt</span>{" "}<span style={kw}>timestamp</span>{" "}<span style={str}>default: now()</span>{"\n\n"}
        <span style={h2}>## Relationships Map</span>{"\n\n"}
        <span style={dim}>```</span>{"\n"}
        {"  "}<span style={tbl}>users</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>posts</span> <span style={dim}>(</span><span style={col}>authorId</span><span style={dim}>)</span>{"\n"}
        {"  "}<span style={tbl}>users</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>comments</span> <span style={dim}>(</span><span style={col}>authorId</span><span style={dim}>)</span>{"\n"}
        {"  "}<span style={tbl}>posts</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>comments</span> <span style={dim}>(</span><span style={col}>postId</span><span style={dim}>)</span>{"\n"}
        <span style={dim}>```</span>{"\n\n"}
        <span style={h2}>## Example Queries</span>{"\n\n"}
        <span style={comment}>-- Get posts with author info</span>{"\n"}
        <span style={kw}>SELECT</span> <span style={fn}>t</span><span style={sym}>.*,</span> <span style={fn}>r</span><span style={sym}>.*</span>{"\n"}
        <span style={kw}>FROM</span> <span style={tbl}>posts</span> <span style={fn}>t</span>{"\n"}
        <span style={kw}>JOIN</span> <span style={tbl}>users</span> <span style={fn}>r</span> <span style={kw}>ON</span> <span style={fn}>t</span><span style={sym}>.</span><span style={col}>authorId</span> <span style={sym}>=</span> <span style={fn}>r</span><span style={sym}>.</span><span style={col}>id</span>{"\n\n"}
        <span style={h2}>## Common Mistakes</span>{"\n\n"}
        <span style={warn}>-</span> <span style={rule}>The column is </span><span style={tbl}>`posts`</span><span style={sym}>.</span><span style={col}>`authorId`</span><span style={rule}>, not </span><span style={str}>`posts.author`</span>{"\n"}
        <span style={warn}>-</span> <span style={tbl}>`users`</span><span style={sym}>.</span><span style={col}>`name`</span><span style={rule}> is nullable — handle NULL</span>
      </code>
    </pre>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── Navigation ──────────────────────────────────── */}
      <nav className="w-full px-6 py-4 sticky top-0 z-50" style={{ background: "rgba(247, 244, 237, 0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(236, 234, 228, 0.5)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "#1c1c1c", letterSpacing: "-0.5px" }}>
            Groundwork
          </span>
          <GitHubStars />
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-5xl md:text-7xl font-semibold leading-[1.05] mb-6"
            style={{ color: "#1c1c1c", letterSpacing: "-1.5px" }}
          >
            Give your AI
            <br />
            the full picture.
          </h1>
          <p
            className="text-lg leading-relaxed mb-10 max-w-lg mx-auto"
            style={{ color: "#5f5f5d" }}
          >
            Stop AI from hallucinating your database. One command generates a context file that keeps your schema accurate — automatically.
          </p>

          {/* CLI command CTA */}
          <div
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl mb-4"
            style={{ background: "#1c1c1c", boxShadow: "rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px" }}
          >
            <span className="text-lg" style={{ color: "rgba(252,251,248,0.4)" }}>$</span>
            <span className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: "#fcfbf8", letterSpacing: "-0.5px" }}>
              npx groundwork-cli watch
            </span>
            <CopyButton text="npx groundwork-cli watch" />
          </div>
        </div>
      </section>

      {/* ── GROUNDWORK.md Preview Card ──────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="code-preview" style={{ border: "1px solid #eceae4" }}>
            {/* Title bar */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#ff6b6b" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#ffc93c" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "#27c93f" }} />
                </div>
                <span className="text-xs font-medium ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>GROUNDWORK.md</span>
              </div>
              <span className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {["Cursor", "Copilot", "Claude"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80" }} />
                    {t}
                  </span>
                ))}
              </span>
            </div>
            <div className="h-[340px] md:h-[380px] overflow-hidden" style={{ background: "#1c1c1c" }}>
              <CodePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Before / After ──────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid #eceae4" }}>
            {/* Without */}
            <div className="p-8 md:p-10" style={{ background: "#f7f4ed" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#5f5f5d" }}>
                Without Groundwork
              </p>
              <div className="space-y-4">
                {[
                  '"users table has id, name, email"',
                  "AI hallucinates posts.user instead of posts.user_id",
                  "Forgets nullable columns, writes queries that crash on NULL",
                  "You re-explain the schema every new chat",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm mt-0.5" style={{ color: "rgba(220, 80, 80, 0.7)" }}>&#10005;</span>
                    <p className="text-sm" style={{ color: "rgba(28,28,28,0.82)" }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* With */}
            <div className="p-8 md:p-10" style={{ background: "#ffffff", borderLeft: "1px solid #eceae4" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(28, 28, 28, 0.82)" }}>
                With Groundwork
              </p>
              <div className="space-y-4">
                {[
                  "Full schema with types, constraints, and relationships",
                  "Example queries with correct JOINs and your real column names",
                  "Common mistake warnings — body is nullable",
                  "Auto-syncs from schema.prisma — always up to date",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm mt-0.5" style={{ color: "rgba(34, 160, 80, 0.8)" }}>&#10003;</span>
                    <p className="text-sm" style={{ color: "rgba(28,28,28,0.82)" }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12" style={{ color: "#1c1c1c", letterSpacing: "-1.2px" }}>
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                label: "Describe or sync",
                detail: "Write your database in plain English, or point Groundwork at your schema.prisma — no API key needed.",
              },
              {
                step: "2",
                label: "Generate",
                detail: "Groundwork creates GROUNDWORK.md with table definitions, example queries, relationship maps, and mistake warnings.",
              },
              {
                step: "3",
                label: "Stay in sync",
                detail: "Run groundwork watch. Every time schema.prisma changes, GROUNDWORK.md updates automatically. Your AI never sees stale data.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #eceae4" }}
              >
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mb-4"
                  style={{ background: "#1c1c1c", color: "#fcfbf8" }}
                >
                  {s.step}
                </span>
                <p className="text-base font-semibold mb-2" style={{ color: "#1c1c1c" }}>
                  {s.label}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#5f5f5d" }}>
                  {s.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLI Demo — Watch Mode ───────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3" style={{ color: "#1c1c1c", letterSpacing: "-1.2px" }}>
              Always in sync.
            </h2>
            <p className="text-base" style={{ color: "#5f5f5d" }}>
              Edit your Prisma schema. GROUNDWORK.md updates instantly. No manual steps.
            </p>
          </div>
          <div className="code-preview" style={{ border: "1px solid #eceae4" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "#252525", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff6b6b" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffc93c" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#27c93f" }} />
                </div>
                <span className="text-xs font-medium ml-1" style={{ color: "rgba(255,255,255,0.5)" }}>Terminal</span>
              </div>
            </div>
            <div style={{ background: "#1c1c1c" }}>
              <TerminalPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Commands ────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4" style={{ color: "#1c1c1c", letterSpacing: "-1.2px" }}>
            Four commands. That&apos;s it.
          </h2>
          <p className="text-base text-center mb-12" style={{ color: "#5f5f5d" }}>
            Each does one thing well.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                cmd: "groundwork init",
                desc: "Describe your schema in plain English. AI parses it into a structured context file.",
                tag: "Needs API key",
              },
              {
                cmd: "groundwork sync",
                desc: "Parse schema.prisma and generate GROUNDWORK.md. No API key, instant, deterministic.",
                tag: "No API key",
              },
              {
                cmd: "groundwork watch",
                desc: "Like sync, but stays running. Re-generates every time you save schema.prisma.",
                tag: "No API key",
              },
              {
                cmd: "groundwork check",
                desc: "Validate your GROUNDWORK.md for missing primary keys, un-indexed FKs, and ambiguous columns.",
                tag: "No API key",
              },
            ].map((item) => (
              <div
                key={item.cmd}
                className="card-hover rounded-xl p-6"
                style={{ background: "#ffffff", border: "1px solid #eceae4" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <code className="text-sm font-semibold font-mono" style={{ color: "#1c1c1c" }}>
                    {item.cmd}
                  </code>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: item.tag === "No API key" ? "rgba(34,160,80,0.08)" : "rgba(28,28,28,0.06)",
                      color: item.tag === "No API key" ? "rgba(34,160,80,0.8)" : "#5f5f5d",
                      border: `1px solid ${item.tag === "No API key" ? "rgba(34,160,80,0.15)" : "#eceae4"}`,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#5f5f5d" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Tool Setup ───────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4" style={{ color: "#1c1c1c", letterSpacing: "-1.2px" }}>
            Works with every AI tool.
          </h2>
          <p className="text-base text-center mb-12" style={{ color: "#5f5f5d" }}>
            One line to set up. Your AI reads GROUNDWORK.md automatically.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { tool: "Claude Code", file: "CLAUDE.md", instruction: "@GROUNDWORK.md" },
              { tool: "Cursor", file: ".cursorrules", instruction: "Read and follow GROUNDWORK.md for all database work." },
              { tool: "Windsurf", file: ".windsurfrules", instruction: "Read and follow GROUNDWORK.md for all database work." },
              { tool: "Copilot", file: ".github/copilot-instructions.md", instruction: "Read and follow GROUNDWORK.md for all database work." },
            ].map((item) => (
              <div
                key={item.tool}
                className="rounded-xl p-6"
                style={{ background: "#ffffff", border: "1px solid #eceae4" }}
              >
                <p className="text-base font-semibold mb-1" style={{ color: "#1c1c1c" }}>
                  {item.tool}
                </p>
                <p className="text-xs mb-3" style={{ color: "#5f5f5d" }}>
                  Add to <code className="font-mono" style={{ color: "rgba(28,28,28,0.82)" }}>{item.file}</code>
                </p>
                <div
                  className="flex items-center justify-between px-3 py-2 rounded-md font-mono text-xs"
                  style={{ background: "#f7f4ed", border: "1px solid #eceae4", color: "#1c1c1c" }}
                >
                  <span className="truncate">{item.instruction}</span>
                  <CopyButton text={item.instruction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GitHub / Open Source Section ─────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-2xl p-10 md:p-14"
            style={{ background: "#ffffff", border: "1px solid #eceae4" }}
          >
            <svg className="w-10 h-10 mx-auto mb-6" viewBox="0 0 24 24" fill="#1c1c1c">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3" style={{ color: "#1c1c1c", letterSpacing: "-0.9px" }}>
              Free and open source.
            </h2>
            <p className="text-base mb-8" style={{ color: "#5f5f5d" }}>
              MIT licensed. Star the repo, open issues, submit PRs — Groundwork is built in the open.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com/Varun2009178/groundwork"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-inset px-6 py-2.5 rounded-md text-sm font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Star on GitHub
              </a>
              <a
                href="https://www.npmjs.com/package/groundwork-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-6 py-2.5 rounded-md text-sm font-medium"
              >
                View on npm
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3" style={{ color: "#1c1c1c", letterSpacing: "-1.2px" }}>
            Stop re-explaining your schema.
          </h2>
          <p className="text-base mb-8" style={{ color: "#5f5f5d" }}>
            Define it once. Keep it in sync. Every AI session gets it right.
          </p>
          <div
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl"
            style={{ background: "#1c1c1c", boxShadow: "rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px" }}
          >
            <span className="text-lg" style={{ color: "rgba(252,251,248,0.4)" }}>$</span>
            <span className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: "#fcfbf8", letterSpacing: "-0.5px" }}>
              npx groundwork-cli watch
            </span>
            <CopyButton text="npx groundwork-cli watch" />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid #eceae4" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm" style={{ color: "#5f5f5d" }}>
            Groundwork
          </span>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Varun2009178/groundwork" target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: "#5f5f5d" }}>GitHub</a>
            <a href="https://www.npmjs.com/package/groundwork-cli" target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: "#5f5f5d" }}>npm</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
