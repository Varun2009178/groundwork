"use client";

import { useRef, useCallback } from "react";

interface SchemaInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string;
}

const EXAMPLES = [
  {
    label: "SaaS App",
    description: "Users, subscriptions, and posts",
    prompt: "I have a users table with id, name, email (unique), password_hash, role, and created_at. There's a subscriptions table with id, user_id, plan, status, started_at, and expires_at. Users can create posts with id, title, body, published flag, and created_at. Each user has one subscription and can have many posts.",
  },
  {
    label: "E-Commerce",
    description: "Products, orders, and customers",
    prompt: "I need a database for an online store. Customers have id, name, email, and address. Products have id, name, description, price, stock_quantity, and category. Orders belong to customers and have id, status, total_amount, and created_at. Each order has many order_items that reference a product and include quantity and unit_price.",
  },
  {
    label: "Project Tracker",
    description: "Teams, projects, and tasks",
    prompt: "I'm building a project management tool. Teams have id, name, and created_at. Users belong to a team and have id, name, email, and role. Projects belong to a team and have id, name, description, and status. Tasks belong to a project and are assigned to a user. Tasks have id, title, description, status, priority, and due_date.",
  },
];

export default function SchemaInput({ value, onChange, onSubmit, isLoading, error }: SchemaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(180, textarea.scrollHeight)}px`;
    }
  }, []);

  const handleExampleClick = (prompt: string) => {
    onChange(prompt);
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.max(180, textarea.scrollHeight)}px`;
      }
    }, 0);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero */}
      <div className="text-center mb-10 mt-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          style={{ color: "var(--text-primary)" }}>
          Describe your schema.
          <br />
          <span style={{ color: "var(--text-secondary)" }}>Get AI context forever.</span>
        </h1>
        <p className="text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--text-secondary)" }}>
          Define your database in plain English. Groundwork generates a context file
          you can drop into any AI session for consistent, accurate queries.
        </p>
      </div>

      {/* Textarea */}
      <div className="w-full max-w-2xl">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleInput();
          }}
          onInput={handleInput}
          disabled={isLoading}
          placeholder="Describe your database tables, columns, and relationships in plain English..."
          className="w-full rounded-xl p-5 text-[15px] leading-relaxed resize-none focus:outline-none disabled:opacity-50"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            minHeight: "180px",
          }}
        />

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={isLoading || value.trim().length < 10}
            className="px-8 py-3 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all duration-200 flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Parsing schema...
              </>
            ) : (
              "Parse Schema →"
            )}
          </button>
        </div>

        {/* Example prompts */}
        <div className="mt-10">
          <p className="text-xs font-medium uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}>
            Try an example
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXAMPLES.map((example) => (
              <button
                key={example.label}
                onClick={() => handleExampleClick(example.prompt)}
                disabled={isLoading}
                className="text-left p-4 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-card-hover)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-card)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  {example.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {example.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
