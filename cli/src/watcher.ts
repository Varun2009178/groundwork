import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { parsePrismaSchema } from "./prisma-parser";
import { generateContext } from "./generator";
import { displayPath } from "./schema-finder";

interface WatcherOptions {
  schemaPath: string;
  outputPath: string;
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

/**
 * Parses the Prisma schema and writes GROUNDWORK.md.
 * Returns a summary string on success, or throws on parse error.
 */
export function syncSchema(schemaPath: string, outputPath: string): string {
  const source = fs.readFileSync(schemaPath, "utf-8");
  const schema = parsePrismaSchema(source);
  const relativeSrc = displayPath(schemaPath);
  const content = generateContext(schema, { syncedFrom: relativeSrc });
  fs.writeFileSync(outputPath, content, "utf-8");
  return `${schema.tables.length} tables, ${schema.relationships.length} relationships`;
}

/**
 * Starts the file watcher. Returns a cleanup function.
 */
export function startWatcher(options: WatcherOptions): { close: () => Promise<void> } {
  const { schemaPath, outputPath } = options;
  const relativeSchema = displayPath(schemaPath);
  const relativeOutput = displayPath(outputPath);

  // Initial generation
  try {
    const summary = syncSchema(schemaPath, outputPath);
    console.log(`\n✓ ${relativeOutput} generated (${summary})`);
  } catch (err) {
    console.error(`\n✗ Initial parse failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // Print setup instructions
  console.log(`\nWatching ${relativeSchema} → ${relativeOutput}\n`);
  console.log("  To make your AI read it automatically, add one line:\n");
  console.log("  Claude Code  → CLAUDE.md                         @GROUNDWORK.md");
  console.log("  Cursor       → .cursorrules                      Read and follow GROUNDWORK.md for all database work.");
  console.log("  Windsurf     → .windsurfrules                    Read and follow GROUNDWORK.md for all database work.");
  console.log("  Copilot      → .github/copilot-instructions.md   Read and follow GROUNDWORK.md for all database work.");
  console.log("\n  Press Ctrl+C to stop.\n");

  // Set up debounced watcher
  let debounceTimer: NodeJS.Timeout | null = null;

  const watcher = chokidar.watch(schemaPath, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("change", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const summary = syncSchema(schemaPath, outputPath);
        console.log(`[${timestamp()}] ${relativeOutput} updated (${summary})`);
      } catch (err) {
        console.log(`[${timestamp()}] Parse error: ${err instanceof Error ? err.message : err} (${relativeOutput} unchanged)`);
      }
    }, 300);
  });

  watcher.on("error", (err: unknown) => {
    console.error(`Watcher error: ${err instanceof Error ? err.message : err}`);
  });

  return {
    close: async () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      await watcher.close();
    },
  };
}
