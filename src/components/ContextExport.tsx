"use client";

import { useState } from "react";

interface ContextExportProps {
  content: string;
  onStartOver: () => void;
}

export default function ContextExport({ content, onStartOver }: ContextExportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
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
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GROUNDWORK.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = content.split("\n").length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}>
            Your GROUNDWORK.md is ready
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Drop this file into any AI coding session for consistent, accurate database queries.
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

      <div className="mt-6 mb-4">
        <p className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}>
          {lineCount} lines
        </p>
      </div>

      <div className="rounded-xl overflow-hidden mb-6"
        style={{ border: "1px solid var(--border-color)" }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>
            <span className="text-xs font-medium ml-2" style={{ color: "var(--text-secondary)" }}>
              GROUNDWORK.md
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
          <code>{content}</code>
        </pre>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
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
              Copy to Clipboard
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
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
          Download .md
        </button>
      </div>
    </div>
  );
}
