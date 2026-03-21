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
