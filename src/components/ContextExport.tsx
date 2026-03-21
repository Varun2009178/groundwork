"use client";

import { useState } from "react";

type ExportTab = "full" | "cursor" | "copilot";

const TAB_CONFIG: Record<ExportTab, { label: string; filename: string; path: string; instructions: string; autoSetup?: string }> = {
  full: {
    label: "Full",
    filename: "GROUNDWORK.md",
    path: "your-project/GROUNDWORK.md",
    instructions: "Drop it in your project root. AI tools will read it automatically once you add the one-line hook below.",
  },
  cursor: {
    label: "Cursor",
    filename: ".cursorrules",
    path: "your-project/.cursorrules",
    instructions: "Cursor automatically reads .cursorrules from your project root. No extra setup needed.",
    autoSetup: "Cursor reads this file automatically — zero config.",
  },
  copilot: {
    label: "Copilot",
    filename: "copilot-instructions.md",
    path: "your-project/.github/copilot-instructions.md",
    instructions: "Copilot reads from .github/copilot-instructions.md. Create the .github folder if it doesn't exist.",
    autoSetup: "Copilot reads this file automatically — zero config.",
  },
};

import { Schema } from "@/lib/types";

interface ValidationResult {
  status: "pass" | "warn" | "fail";
  message: string;
}

interface ContextExportProps {
  content: string;
  cursorContent: string;
  copilotContent: string;
  schema: Schema;
  onStartOver: () => void;
}

export default function ContextExport({
  content,
  cursorContent,
  copilotContent,
  schema,
  onStartOver,
}: ContextExportProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ExportTab>("full");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[] | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const contentMap: Record<ExportTab, string> = {
    full: content,
    cursor: cursorContent,
    copilot: copilotContent,
  };

  const activeContent = contentMap[activeTab];
  const { filename, path, instructions } = TAB_CONFIG[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = activeContent;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToProject = async () => {
    setSaveError("");
    try {
      // File System Access API — lets user pick their project folder
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });

      // For copilot, we need to create .github subfolder
      let targetDir = dirHandle;
      if (activeTab === "copilot") {
        try {
          targetDir = await dirHandle.getDirectoryHandle(".github", { create: true });
        } catch {
          setSaveError("Could not create .github folder");
          return;
        }
      }

      const fileHandle = await targetDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(activeContent);
      await writable.close();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // user cancelled picker
      // Browser doesn't support File System Access API — fall back to download
      handleDownload();
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/validate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema }),
      });
      const data = await res.json();
      if (res.ok) {
        setValidationResults(data.results);
      }
    } catch {
      // silently fail
    } finally {
      setIsValidating(false);
    }
  };

  const lineCount = activeContent.split("\n").length;
  const charCount = activeContent.length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Your context file is ready
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Add it to your project so every AI session has the right context.
          </p>
        </div>
        <button
          onClick={onStartOver}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shrink-0 cursor-pointer"
          style={{
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          ← Start Over
        </button>
      </div>

      {/* Tab selector */}
      <div className="mt-6 mb-4 flex items-center gap-1">
        {(Object.keys(TAB_CONFIG) as ExportTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCopied(false);
              setSaved(false);
              setSaveError("");
            }}
            className="px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
            style={{
              background:
                activeTab === tab ? "var(--accent-subtle)" : "transparent",
              color:
                activeTab === tab
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              border:
                activeTab === tab
                  ? "1px solid var(--border-color)"
                  : "1px solid transparent",
            }}
          >
            {TAB_CONFIG[tab].label}
          </button>
        ))}
        <span
          className="ml-3 text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {lineCount} lines · {charCount.toLocaleString()} chars
        </span>
      </div>

      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ border: "1px solid var(--border-color)" }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "rgba(255,255,255,0.08)" }}
              />
            </div>
            <span
              className="text-xs font-medium ml-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {filename}
            </span>
          </div>
        </div>
        <pre
          className="p-5 text-[13px] leading-relaxed overflow-x-auto overflow-y-auto font-mono"
          style={{
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            maxHeight: "60vh",
          }}
        >
          <code>{activeContent}</code>
        </pre>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleSaveToProject}
          className="px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{
            background: "var(--button-bg)",
            color: "var(--button-text)",
          }}
        >
          {saved ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved to project!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <polyline points="9 14 12 11 15 14" />
              </svg>
              Save to Project
            </>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
      </div>

      {saveError && (
        <p className="text-sm text-red-400 mb-4">{saveError}</p>
      )}

      {/* Setup instructions */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Setup
        </p>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(74, 222, 128, 0.1)" }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="rgba(74, 222, 128, 0.7)" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>
              Place at <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#67e8f9" }}>{path}</code>
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {instructions}
            </p>
          </div>
        </div>

        {activeTab === "full" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2 mt-4" style={{ color: "var(--text-muted)" }}>
              Auto-load hooks
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              Add one line to your AI tool&apos;s config file so it reads GROUNDWORK.md automatically every session:
            </p>
            <div className="flex flex-col gap-2">
              {[
                { tool: "Claude Code", file: "CLAUDE.md", line: "@GROUNDWORK.md" },
                { tool: "Cursor", file: ".cursorrules", line: "Read and follow GROUNDWORK.md for all database work." },
                { tool: "Windsurf", file: ".windsurfrules", line: "Read and follow GROUNDWORK.md for all database work." },
                { tool: "Copilot", file: ".github/copilot-instructions.md", line: "Read and follow GROUNDWORK.md for all database work." },
              ].map((hook) => (
                <div key={hook.tool} className="rounded-lg p-3 flex items-center justify-between gap-4" style={{ background: "var(--bg-input)" }}>
                  <div className="min-w-0">
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{hook.tool}</span>
                    <span className="text-xs mx-2" style={{ color: "var(--text-muted)" }}>→</span>
                    <code className="text-xs" style={{ color: "#67e8f9" }}>{hook.file}</code>
                  </div>
                  <code className="text-xs shrink-0" style={{ color: "rgba(74, 222, 128, 0.8)" }}>{hook.line}</code>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "cursor" && (
          <div className="flex items-start gap-3 mt-1">
            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(74, 222, 128, 0.1)" }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="rgba(74, 222, 128, 0.7)" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Cursor reads .cursorrules automatically — zero config. Just save and go.
            </p>
          </div>
        )}

        {activeTab === "copilot" && (
          <>
            <div className="flex items-start gap-3 mt-1">
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(74, 222, 128, 0.1)" }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="rgba(74, 222, 128, 0.7)" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Copilot reads this file automatically — zero config.
              </p>
            </div>
            <div className="mt-3 rounded-lg p-3" style={{ background: "var(--bg-input)" }}>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-secondary)" }}>$</span> mkdir -p .github && mv ~/Downloads/copilot-instructions.md .github/
              </p>
            </div>
          </>
        )}
      </div>

      {/* Validate schema */}
      <div className="mt-6">
        <button
          onClick={handleValidate}
          disabled={isValidating}
          className="px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
          }}
        >
          {isValidating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Validating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Validate Schema
            </>
          )}
        </button>

        {validationResults && (
          <div
            className="mt-4 rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Validation Report
            </p>
            <div className="flex flex-col gap-2">
              {validationResults.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 mt-0.5" style={{
                    color: r.status === "pass" ? "rgba(74, 222, 128, 0.8)"
                      : r.status === "warn" ? "rgba(250, 204, 21, 0.8)"
                      : "rgba(248, 113, 113, 0.8)"
                  }}>
                    {r.status === "pass" ? "✓" : r.status === "warn" ? "⚠" : "✗"}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>{r.message}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              {validationResults.filter((r) => r.status === "pass").length} passed · {validationResults.filter((r) => r.status === "warn").length} warnings · {validationResults.filter((r) => r.status === "fail").length} errors
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
