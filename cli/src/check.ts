import * as fs from "fs";
import * as path from "path";
import { Schema, Table, Column } from "./types";

export interface CheckResult {
  status: "pass" | "warn" | "fail";
  message: string;
}

/**
 * Parse a GROUNDWORK.md file back into a minimal schema structure
 * for validation purposes. Extracts tables, columns, and relationships.
 */
function parseGroundworkMd(content: string): Schema | null {
  const tables: Table[] = [];
  const nameMatch = content.match(/## Schema: (.+)/);
  const descMatch = content.match(/## Schema: .+\n(.+)/);

  // Extract tables by finding ### headers followed by column tables
  const tableBlocks = content.split(/### (?=\w)/);
  for (const block of tableBlocks) {
    if (!block.trim()) continue;
    const lines = block.split("\n");
    const tableName = lines[0]?.trim();
    if (!tableName || tableName.startsWith("#")) continue;

    const description = lines[1]?.trim() || "";
    const columns: Column[] = [];

    // Find markdown table rows (skip header and separator)
    let inTable = false;
    for (const line of lines) {
      if (line.startsWith("| Column")) {
        inTable = true;
        continue;
      }
      if (line.startsWith("|---")) continue;
      if (inTable && line.startsWith("|")) {
        const cells = line.split("|").filter(Boolean).map((s) => s.trim());
        if (cells.length >= 2) {
          const col: Column = {
            name: cells[0],
            type: cells[1] as Column["type"],
          };
          const constraints = cells[2] || "";
          if (constraints.includes("primary key")) col.primaryKey = true;
          if (constraints.includes("unique")) col.unique = true;
          if (constraints.includes("nullable")) col.nullable = true;
          if (constraints.includes("fk")) {
            const fkMatch = constraints.match(/fk\s*→\s*(\w+)\.(\w+)/);
            if (fkMatch) col.references = { table: fkMatch[1], column: fkMatch[2] };
          }
          if (constraints.includes("default:")) {
            const defMatch = constraints.match(/default:\s*(.+?)(?:,|$)/);
            if (defMatch) col.defaultValue = defMatch[1].trim();
          }
          columns.push(col);
        }
      } else if (inTable && !line.startsWith("|")) {
        inTable = false;
      }
    }

    if (columns.length > 0) {
      tables.push({ name: tableName, description, columns });
    }
  }

  if (tables.length === 0) return null;

  return {
    id: "",
    name: nameMatch?.[1] || "Unknown",
    description: descMatch?.[1] || "",
    tables,
    relationships: [],
    createdAt: "",
  };
}

/**
 * Run schema validation checks — purely deterministic, no AI needed.
 */
export function validateSchema(schema: Schema): CheckResult[] {
  const results: CheckResult[] = [];

  // 1. Check primary keys
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

  // 2. Check foreign keys without indexes (FK columns should ideally be indexed)
  for (const table of schema.tables) {
    const fkCols = table.columns.filter((c) => c.references);
    for (const fk of fkCols) {
      results.push({
        status: "warn",
        message: `Missing index: \`${table.name}.${fk.name}\` is a foreign key — ensure it's indexed in your database`,
      });
    }
  }

  // 3. Check nullable columns that probably shouldn't be
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.nullable && (col.name === "name" || col.name === "email" || col.name === "title")) {
        results.push({
          status: "warn",
          message: `Suspicious nullable: \`${table.name}.${col.name}\` is nullable — this is usually required`,
        });
      }
    }
  }

  // 4. Check for missing timestamps
  for (const table of schema.tables) {
    const hasCreatedAt = table.columns.some((c) => c.name === "created_at");
    const hasUpdatedAt = table.columns.some((c) => c.name === "updated_at");
    if (!hasCreatedAt) {
      results.push({
        status: "warn",
        message: `Missing timestamp: \`${table.name}\` has no \`created_at\` column`,
      });
    }
    if (!hasUpdatedAt) {
      results.push({
        status: "warn",
        message: `Missing timestamp: \`${table.name}\` has no \`updated_at\` column — consider adding for audit trails`,
      });
    }
  }

  // 5. Check for ambiguous column names across tables
  const colUsage: Record<string, string[]> = {};
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.primaryKey || col.name === "id" || col.name === "created_at" || col.name === "updated_at") continue;
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

  // 6. Check for N+1 query risks
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

/**
 * Read and validate a GROUNDWORK.md file from disk.
 */
export function checkFile(filePath: string): { schema: Schema | null; results: CheckResult[] } {
  const absPath = path.resolve(process.cwd(), filePath);

  // Prevent path traversal — file must be within the working directory
  if (!absPath.startsWith(process.cwd() + path.sep) && absPath !== process.cwd()) {
    return {
      schema: null,
      results: [{ status: "fail", message: "File path must be within the current directory." }],
    };
  }

  if (!fs.existsSync(absPath)) {
    return {
      schema: null,
      results: [{ status: "fail", message: `File not found: ${filePath}` }],
    };
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const schema = parseGroundworkMd(content);

  if (!schema) {
    return {
      schema: null,
      results: [{ status: "fail", message: "Could not parse schema from GROUNDWORK.md — is it a valid Groundwork file?" }],
    };
  }

  const results = validateSchema(schema);
  return { schema, results };
}

/**
 * Format check results for terminal output.
 */
export function formatResults(results: CheckResult[]): string {
  const icons = { pass: "✓", warn: "⚠", fail: "✗" };
  return results
    .map((r) => `  ${icons[r.status]} ${r.message}`)
    .join("\n");
}
