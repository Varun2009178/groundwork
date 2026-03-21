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
