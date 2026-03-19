/**
 * Smart trimmer for GROUNDWORK.md content.
 * Progressively removes sections to fit within character limits
 * while preserving the most important structural information.
 *
 * Priority (drops from bottom up):
 * 1. Always keep: Tables with columns + Relationships
 * 2. Drop first: Common Patterns section
 * 3. Drop second: Common Mistakes section
 * 4. Drop third: Example queries (keep 1 per table, then drop all)
 * 5. Drop fourth: Column constraints (keep names + types only)
 */

const CURSOR_LIMIT = 6000;
const COPILOT_LIMIT = 4000;

/** Section markers used to locate removable blocks */
const SECTION_PATTERNS = {
  commonPatterns: /\n---\n\n## Common Patterns\n[\s\S]*?(?=\n---\n)/,
  commonMistakes: /\n---\n\n## Common Mistakes\n[\s\S]*?(?=\n---\n)/,
  exampleQueries: /### Example Queries\n\n[\s\S]*?(?=\n---\n)/,
  rules: /\n---\n\n## Rules\n[\s\S]*/,
};

function dropSection(content: string, pattern: RegExp): string {
  return content.replace(pattern, "");
}

function trimExamplesToOne(content: string): string {
  // Find the Example Queries block and keep only the first query block per table
  const match = content.match(/### Example Queries\n\n([\s\S]*?)(?=\n---\n)/);
  if (!match) return content;

  const examplesBlock = match[1];
  // Split by table headers (bold table names)
  const tables = examplesBlock.split(/(?=\*\*\w)/);
  const trimmed = tables
    .map((block) => {
      if (!block.trim()) return "";
      // Keep only SELECT * and SELECT by ID from each block
      const headerMatch = block.match(/\*\*(\w+)\*\*/);
      if (!headerMatch) return block;
      const tableName = headerMatch[1];
      return `**${tableName}**\n\n\`\`\`sql\nSELECT * FROM ${tableName} WHERE id = ?;\n\`\`\``;
    })
    .filter(Boolean)
    .join("\n\n");

  return content.replace(
    /### Example Queries\n\n[\s\S]*?(?=\n---\n)/,
    `### Example Queries\n\n${trimmed}`
  );
}

function stripConstraints(content: string): string {
  // Simplify table rows: keep only Column and Type, drop Constraints column
  return content.replace(
    /\| Column \| Type \| Constraints \|\n\|--------\|------\|-------------\|\n((?:\|.*\|\n?)*)/g,
    (_, rows: string) => {
      const simplified = rows
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row.split("|").filter(Boolean);
          if (cells.length >= 2) {
            return `| ${cells[0].trim()} | ${cells[1].trim()} |`;
          }
          return row;
        })
        .join("\n");
      return `| Column | Type |\n|--------|------|\n${simplified}\n`;
    }
  );
}

function smartTrim(content: string, limit: number): string {
  if (content.length <= limit) return content;

  // 1. Drop Common Patterns
  let trimmed = dropSection(content, SECTION_PATTERNS.commonPatterns);
  if (trimmed.length <= limit) return trimmed;

  // 2. Drop Common Mistakes
  trimmed = dropSection(trimmed, SECTION_PATTERNS.commonMistakes);
  if (trimmed.length <= limit) return trimmed;

  // 3. Trim examples to 1 per table
  trimmed = trimExamplesToOne(trimmed);
  if (trimmed.length <= limit) return trimmed;

  // 4. Drop all examples
  trimmed = dropSection(trimmed, SECTION_PATTERNS.exampleQueries);
  if (trimmed.length <= limit) return trimmed;

  // 5. Strip column constraints
  trimmed = stripConstraints(trimmed);
  if (trimmed.length <= limit) return trimmed;

  // 6. Drop Rules section as last resort
  trimmed = dropSection(trimmed, SECTION_PATTERNS.rules);
  if (trimmed.length <= limit) return trimmed;

  // Final fallback: hard truncate
  return trimmed.slice(0, limit - 20) + "\n\n<!-- truncated -->\n";
}

export function trimForCursor(content: string): string {
  return smartTrim(content, CURSOR_LIMIT);
}

export function trimForCopilot(content: string): string {
  return smartTrim(content, COPILOT_LIMIT);
}
