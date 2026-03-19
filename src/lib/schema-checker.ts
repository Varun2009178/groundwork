import { Schema } from "./types";

export interface CheckResult {
  status: "pass" | "warn" | "fail";
  message: string;
}

export function validateSchema(schema: Schema): CheckResult[] {
  const results: CheckResult[] = [];

  // 1. Primary keys
  const tablesWithoutPK = schema.tables.filter(
    (t) => !t.columns.some((c) => c.primaryKey)
  );
  if (tablesWithoutPK.length === 0) {
    results.push({ status: "pass", message: "Primary keys: all tables have primary keys" });
  } else {
    for (const t of tablesWithoutPK) {
      results.push({ status: "fail", message: `Missing primary key on \`${t.name}\`` });
    }
  }

  // 2. Foreign keys without indexes
  for (const table of schema.tables) {
    const fkCols = table.columns.filter((c) => c.references);
    for (const fk of fkCols) {
      results.push({
        status: "warn",
        message: `Missing index: \`${table.name}.${fk.name}\` is a foreign key — ensure it's indexed`,
      });
    }
  }

  // 3. Suspicious nullable columns
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.nullable && ["name", "email", "title", "username"].includes(col.name)) {
        results.push({
          status: "warn",
          message: `Suspicious nullable: \`${table.name}.${col.name}\` is nullable — this is usually required`,
        });
      }
    }
  }

  // 4. Missing timestamps
  for (const table of schema.tables) {
    if (!table.columns.some((c) => c.name === "created_at")) {
      results.push({
        status: "warn",
        message: `Missing timestamp: \`${table.name}\` has no \`created_at\` column`,
      });
    }
    if (!table.columns.some((c) => c.name === "updated_at")) {
      results.push({
        status: "warn",
        message: `Missing timestamp: \`${table.name}\` has no \`updated_at\` — consider adding for audit trails`,
      });
    }
  }

  // 5. Ambiguous column names
  const colUsage: Record<string, string[]> = {};
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.primaryKey || ["id", "created_at", "updated_at"].includes(col.name)) continue;
      if (!colUsage[col.name]) colUsage[col.name] = [];
      colUsage[col.name].push(table.name);
    }
  }
  for (const [colName, tables] of Object.entries(colUsage)) {
    if (tables.length > 1) {
      results.push({
        status: "warn",
        message: `Ambiguous column: \`${colName}\` exists in ${tables.map((t) => `\`${t}\``).join(" and ")} — AI may confuse them`,
      });
    }
  }

  // 6. N+1 query risks
  for (const table of schema.tables) {
    const fkCols = table.columns.filter((c) => c.references);
    if (fkCols.length >= 2) {
      results.push({
        status: "warn",
        message: `N+1 risk: \`${table.name}\` has ${fkCols.length} foreign keys — use JOINs instead of sequential queries`,
      });
    }
  }

  return results;
}
