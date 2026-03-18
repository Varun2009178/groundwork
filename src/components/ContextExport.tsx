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
