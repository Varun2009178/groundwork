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
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}>
          {schema.name}
        </h2>
        <button
          onClick={onEdit}
          className="text-sm hover:underline"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Edit
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {schema.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {schema.tables.map((table) => {
          const tableRels = schema.relationships.filter(
            (r) => r.from === table.name || r.to === table.name
          );
          return (
            <div
              key={table.name}
              className="rounded-lg p-4"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            >
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {table.name}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                {table.description}
              </p>
              <div className="flex flex-col gap-1.5">
                {table.columns.map((col) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs">
                    <span style={{ color: "var(--text-primary)" }}>{col.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}
                    >
                      {col.type}
                    </span>
                    {col.primaryKey && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(255,200,50,0.1)", color: "rgba(255,200,50,0.7)" }}>
                        PK
                      </span>
                    )}
                    {col.references && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(100,180,255,0.1)", color: "rgba(100,180,255,0.7)" }}>
                        FK → {col.references.table}
                      </span>
                    )}
                    {col.unique && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "rgba(150,255,150,0.1)", color: "rgba(150,255,150,0.7)" }}>
                        unique
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {tableRels.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  {tableRels.map((rel, i) => (
                    <p key={i} className="text-[11px]" style={{ color: "var(--text-muted)" }}>
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
        <p className="mb-3 text-sm text-red-400">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-[7px] text-sm font-medium disabled:opacity-40 transition-opacity flex items-center gap-2"
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
