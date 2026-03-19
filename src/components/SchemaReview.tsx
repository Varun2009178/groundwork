import { Schema } from "@/lib/types";

interface SchemaReviewProps {
  schema: Schema;
  onEdit: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  error: string;
}

export default function SchemaReview({ schema, onEdit, onGenerate, isLoading, error }: SchemaReviewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}>
            {schema.name}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {schema.description}
          </p>
        </div>
        <button
          onClick={onEdit}
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
          ← Edit
        </button>
      </div>

      <div className="mt-6 mb-4">
        <p className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}>
          {schema.tables.length} {schema.tables.length === 1 ? "table" : "tables"} &middot; {schema.relationships.length} {schema.relationships.length === 1 ? "relationship" : "relationships"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {schema.tables.map((table) => {
          const tableRels = schema.relationships.filter(
            (r) => r.from === table.name || r.to === table.name
          );
          return (
            <div
              key={table.name}
              className="rounded-xl p-5 transition-all duration-200"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255, 255, 255, 0.4)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {table.name}
                </h3>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                {table.description}
              </p>
              <div className="flex flex-col gap-2">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center justify-between text-xs">
                    <span className="font-mono" style={{ color: "var(--text-primary)" }}>{col.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                        style={{ background: "var(--accent-subtle)", color: "var(--text-secondary)" }}
                      >
                        {col.type}
                      </span>
                      {col.primaryKey && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                          style={{ background: "rgba(250, 204, 21, 0.1)", color: "rgba(250, 204, 21, 0.7)" }}>
                          PK
                        </span>
                      )}
                      {col.references && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                          style={{ background: "rgba(96, 165, 250, 0.1)", color: "rgba(96, 165, 250, 0.7)" }}>
                          FK
                        </span>
                      )}
                      {col.unique && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                          style={{ background: "rgba(74, 222, 128, 0.1)", color: "rgba(74, 222, 128, 0.7)" }}>
                          UQ
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {tableRels.length > 0 && (
                <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {tableRels.map((rel, i) => (
                    <p key={i} className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {rel.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-8 py-3 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all duration-200 flex items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
          style={{ background: "var(--button-bg)", color: "var(--button-text)" }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            "Generate Context →"
          )}
        </button>
      </div>
    </div>
  );
}
