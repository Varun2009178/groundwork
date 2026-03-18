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
