"use client";

import { useState } from "react";
import Link from "next/link";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { MouseGlow } from "@/components/ui/mouse-glow";

function CopyButton({ text, label, className, style }: { text: string; label?: boolean; className?: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);
  const iconSize = label ? "w-3 h-3" : "w-4 h-4";
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={className || "ml-1 p-1.5 rounded-lg transition-colors duration-150 cursor-pointer"}
      style={style || { color: "var(--text-muted)" }}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="rgba(74, 222, 128, 0.8)" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {label && <span style={{ color: "rgba(74, 222, 128, 0.8)" }}>Copied!</span>}
        </>
      ) : (
        <>
          <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {label && "Copy"}
        </>
      )}
    </button>
  );
}

// Colorful syntax-highlighted preview
function PreviewCode() {
  const h2 = { color: "#e2e8f0", fontWeight: 700 };
  const h3 = { color: "#cbd5e1" };
  const rule = { color: "#94a3b8" };
  const num = { color: "#f59e0b" };
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
    <>
      <span style={h2}>## AI Instructions</span>{"\n\n"}
      <span style={rule}>When working with this database schema, follow these rules:</span>{"\n\n"}
      <span style={num}>1.</span> <span style={rule}>Always use the exact table and column names defined above</span>{"\n"}
      <span style={num}>2.</span> <span style={rule}>Always include proper foreign key references in queries</span>{"\n"}
      <span style={num}>3.</span> <span style={rule}>Use the relationships defined above — do not infer new ones</span>{"\n\n"}
      <span style={h3}>### Example Queries</span>{"\n\n"}
      <span style={h3}>**posts**</span>{"\n\n"}
      <span style={dim}>```sql</span>{"\n"}
      <span style={comment}>-- Get all posts</span>{"\n"}
      <span style={kw}>SELECT</span> <span style={sym}>*</span> <span style={kw}>FROM</span> <span style={tbl}>posts</span><span style={sym}>;</span>{"\n\n"}
      <span style={comment}>-- Get posts by ID</span>{"\n"}
      <span style={kw}>SELECT</span> <span style={sym}>*</span> <span style={kw}>FROM</span> <span style={tbl}>posts</span> <span style={kw}>WHERE</span> <span style={col}>id</span> <span style={sym}>=</span> <span style={str}>?</span><span style={sym}>;</span>{"\n\n"}
      <span style={comment}>-- Get posts with users info</span>{"\n"}
      <span style={kw}>SELECT</span> <span style={fn}>t</span><span style={sym}>.*,</span> <span style={fn}>r</span><span style={sym}>.*</span>{"\n"}
      <span style={kw}>FROM</span> <span style={tbl}>posts</span> <span style={fn}>t</span>{"\n"}
      <span style={kw}>JOIN</span> <span style={tbl}>users</span> <span style={fn}>r</span> <span style={kw}>ON</span> <span style={fn}>t</span><span style={sym}>.</span><span style={col}>user_id</span> <span style={sym}>=</span> <span style={fn}>r</span><span style={sym}>.</span><span style={col}>id</span>{"\n"}
      <span style={kw}>WHERE</span> <span style={fn}>t</span><span style={sym}>.</span><span style={col}>id</span> <span style={sym}>=</span> <span style={str}>?</span><span style={sym}>;</span>{"\n"}
      <span style={dim}>```</span>{"\n\n"}
      <span style={dim}>---</span>{"\n\n"}
      <span style={h2}>## Common Mistakes</span>{"\n\n"}
      <span style={warn}>-</span> <span style={rule}>When querying </span><span style={tbl}>`posts`</span><span style={rule}> with </span><span style={col}>`user_id`</span><span style={rule}>, always JOIN on</span>{"\n"}
      {"  "}<span style={tbl}>`users`</span><span style={sym}>.</span><span style={col}>`id`</span><span style={rule}> — do not select </span><span style={col}>`user_id`</span><span style={rule}> as a raw integer</span>{"\n"}
      <span style={warn}>-</span> <span style={rule}>The column is </span><span style={tbl}>`posts`</span><span style={sym}>.</span><span style={col}>`user_id`</span><span style={rule}>, not </span><span style={str}>`posts.user`</span>{"\n"}
      <span style={warn}>-</span> <span style={tbl}>`posts`</span><span style={sym}>.</span><span style={col}>`body`</span><span style={rule}> is nullable — use </span><span style={kw}>COALESCE</span><span style={rule}> or handle NULL</span>{"\n\n"}
      <span style={h2}>## Relationships Map</span>{"\n\n"}
      <span style={dim}>```</span>{"\n"}
      {"  "}<span style={tbl}>users</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>posts</span> <span style={dim}>(</span><span style={col}>user_id</span><span style={dim}>)</span>{"\n"}
      {"  "}<span style={tbl}>users</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>comments</span> <span style={dim}>(</span><span style={col}>user_id</span><span style={dim}>)</span>{"\n"}
      {"  "}<span style={tbl}>posts</span>{"  "}<span style={rel}>1──*</span> <span style={tbl}>comments</span> <span style={dim}>(</span><span style={col}>post_id</span><span style={dim}>)</span>{"\n"}
      <span style={dim}>```</span>
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden hero-warm-bg">
      <MouseGlow />

      {/* Minimal nav — just logo + one action */}
      <nav
        className="w-full px-6 py-5 sticky top-0 z-50"
        style={{
          background: "rgba(10, 10, 10, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Groundwork
          </span>
          <Link
            href="/app"
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            Open App →
          </Link>
        </div>
      </nav>

      {/* Hero + Scroll Animation — the star of the page */}
      <div className="hero-glow">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center relative z-20">
              <h1
                className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] mb-5"
                style={{ color: "var(--text-primary)" }}
              >
                Give your AI
                <br />
                the{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #fb923c, #f472b6, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  full picture.
                </span>
              </h1>
              <p
                className="text-base leading-relaxed max-w-md mx-auto mb-10"
                style={{ color: "var(--text-secondary)" }}
              >
                Stop AI from hallucinating your database. One command, full context.
              </p>
              {/* Primary CTA — the CLI command, big and prominent */}
              <div
                className="btn-glow px-10 py-5 rounded-2xl inline-flex items-center gap-4 mb-5"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
              >
                <span className="text-xl" style={{ color: "var(--text-muted)" }}>$</span>
                <span className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  npx groundwork-cli init
                </span>
                <CopyButton text="npx groundwork-cli init" />
              </div>
              <Link
                href="/app"
                className="text-sm font-medium transition-colors duration-200 inline-flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                or use the web app →
              </Link>
            </div>
          }
        >
          {/* Colorful GROUNDWORK.md preview */}
          <div className="h-full w-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
            <div
              className="px-5 py-3 flex items-center justify-between shrink-0"
              style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255, 99, 99, 0.6)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255, 189, 46, 0.6)" }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: "rgba(39, 201, 63, 0.6)" }} />
                </div>
                <span className="text-xs font-medium ml-2" style={{ color: "var(--text-secondary)" }}>
                  GROUNDWORK.md
                </span>
              </div>
              <span className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(74, 222, 128, 0.6)" }} />
                  Cursor
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(74, 222, 128, 0.6)" }} />
                  Copilot
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(74, 222, 128, 0.6)" }} />
                  Claude
                </span>
              </span>
            </div>
            <pre
              className="p-5 md:p-6 text-[12px] md:text-[13px] leading-relaxed font-mono overflow-hidden flex-1"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-primary)",
              }}
            >
              <code><PreviewCode /></code>
            </pre>
          </div>
        </ContainerScroll>
      </div>

      {/* The pitch — not "features", just what you get vs what you'd do */}
      <section className="px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Before / After contrast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-color)" }}>
            <div className="p-8 md:p-10" style={{ background: "var(--bg-card)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
                Without Groundwork
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(255, 99, 99, 0.6)" }}>&#10005;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    &quot;users table has id, name, email&quot;
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(255, 99, 99, 0.6)" }}>&#10005;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    AI hallucinates <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#fb923c" }}>posts.user</code> instead of <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#67e8f9" }}>posts.user_id</code>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(255, 99, 99, 0.6)" }}>&#10005;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Forgets nullable columns, writes queries that crash on NULL
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(255, 99, 99, 0.6)" }}>&#10005;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    You re-explain the schema every new chat
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8 md:p-10" style={{ background: "var(--bg-secondary)", borderLeft: "1px solid var(--border-color)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(74, 222, 128, 0.6)" }}>
                With Groundwork
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(74, 222, 128, 0.7)" }}>&#10003;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Full schema with types, constraints, and relationships
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(74, 222, 128, 0.7)" }}>&#10003;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Example queries with correct JOINs using your real column names
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(74, 222, 128, 0.7)" }}>&#10003;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Common mistake warnings — <code className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#fbbf24" }}>body is nullable</code>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm mt-0.5" style={{ color: "rgba(74, 222, 128, 0.7)" }}>&#10003;</span>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Drop it in your project, works with Cursor, Copilot, and Claude
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works — inline, not its own section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", label: "Describe", detail: "Write your database in plain English — tables, columns, relationships. Or use the CLI." },
              { step: "2", label: "Review", detail: "See the parsed schema as visual cards. Catch anything wrong before generating." },
              { step: "3", label: "Export", detail: "Download as GROUNDWORK.md, .cursorrules, or copilot-instructions.md." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <span
                  className="text-2xl font-bold shrink-0 w-8"
                  style={{ color: "rgba(255, 180, 80, 0.3)" }}
                >
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{s.label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CLI — the main event */}
          <div className="mt-24">
            <div className="text-center mb-8">
              <p className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                One command. Done.
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No config, no setup. Describe your schema, get your context file.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden preview-glow max-w-2xl mx-auto" style={{ border: "1px solid var(--border-color)" }}>
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255, 99, 99, 0.5)" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255, 189, 46, 0.5)" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(39, 201, 63, 0.5)" }} />
                  </div>
                  <span className="text-xs font-medium ml-2" style={{ color: "var(--text-secondary)" }}>Terminal</span>
                </div>
                <CopyButton
                  text="npx groundwork-cli init"
                  label
                  className="text-xs px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer inline-flex items-center gap-1.5"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border-color)" }}
                />
              </div>
              <pre
                className="p-6 text-[13px] md:text-[14px] leading-loose font-mono"
                style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
              >
                <code>
                  <span style={{ color: "var(--text-muted)" }}>$</span> <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>npx groundwork-cli init</span>{"\n\n"}
                  <span style={{ color: "var(--text-secondary)" }}>Describe your database schema in plain English.</span>{"\n"}
                  <span style={{ color: "var(--text-muted)" }}>(Press Enter twice when done)</span>{"\n\n"}
                  <span style={{ color: "var(--text-muted)" }}>&gt;</span> I have a users table with id, name, email.{"\n"}
                  <span style={{ color: "var(--text-muted)" }}>&gt;</span> Posts belong to users via user_id.{"\n"}
                  <span style={{ color: "var(--text-muted)" }}>&gt;</span> Comments belong to both posts and users.{"\n\n"}
                  <span style={{ color: "rgba(74, 222, 128, 0.8)" }}>✓</span> Parsed 3 tables, 12 columns, 3 relationships{"\n"}
                  <span style={{ color: "rgba(74, 222, 128, 0.8)" }}>✓</span> Written to <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>GROUNDWORK.md</span>{"\n"}
                  <span style={{ color: "var(--text-muted)" }}>  87 lines · 3,240 chars · Cursor + Copilot + Claude ready</span>
                </code>
              </pre>
            </div>
            <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
              Requires OPENROUTER_API_KEY or ANTHROPIC_API_KEY in your environment
            </p>
          </div>

          {/* Final CTA */}
          <div className="mt-24 mb-20 text-center">
            <p className="text-2xl md:text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
              Stop re-explaining your schema.
            </p>
            <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
              Define it once. Use it everywhere. Free and open source.
            </p>
            <div
              className="btn-glow px-10 py-5 rounded-2xl inline-flex items-center gap-4 mb-5"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
            >
              <span className="text-xl" style={{ color: "var(--text-muted)" }}>$</span>
              <span className="text-xl md:text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                npx groundwork-cli init
              </span>
            </div>
            <div className="flex items-center justify-center gap-5">
              <Link
                href="/app"
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--text-secondary)" }}
              >
                Web app →
              </Link>
              <a
                href="https://github.com/Varun2009178/groundwork"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors duration-200 inline-flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="py-6 px-6 relative z-10" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Groundwork
          </span>
          <div className="flex items-center gap-5">
            <Link href="/app" className="text-xs" style={{ color: "var(--text-muted)" }}>App</Link>
            <a href="https://github.com/Varun2009178/groundwork" target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--text-muted)" }}>GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
