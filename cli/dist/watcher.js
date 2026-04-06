"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSchema = syncSchema;
exports.startWatcher = startWatcher;
const chokidar = __importStar(require("chokidar"));
const fs = __importStar(require("fs"));
const prisma_parser_1 = require("./prisma-parser");
const generator_1 = require("./generator");
const schema_finder_1 = require("./schema-finder");
function timestamp() {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
}
/**
 * Parses the Prisma schema and writes GROUNDWORK.md.
 * Returns a summary string on success, or throws on parse error.
 */
function syncSchema(schemaPath, outputPath) {
    const source = fs.readFileSync(schemaPath, "utf-8");
    const schema = (0, prisma_parser_1.parsePrismaSchema)(source);
    const relativeSrc = (0, schema_finder_1.displayPath)(schemaPath);
    const content = (0, generator_1.generateContext)(schema, { syncedFrom: relativeSrc });
    fs.writeFileSync(outputPath, content, "utf-8");
    return `${schema.tables.length} tables, ${schema.relationships.length} relationships`;
}
/**
 * Starts the file watcher. Returns a cleanup function.
 */
function startWatcher(options) {
    const { schemaPath, outputPath } = options;
    const relativeSchema = (0, schema_finder_1.displayPath)(schemaPath);
    const relativeOutput = (0, schema_finder_1.displayPath)(outputPath);
    // Initial generation
    try {
        const summary = syncSchema(schemaPath, outputPath);
        console.log(`\n✓ ${relativeOutput} generated (${summary})`);
    }
    catch (err) {
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
    let debounceTimer = null;
    const watcher = chokidar.watch(schemaPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
        },
    });
    watcher.on("change", () => {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            try {
                const summary = syncSchema(schemaPath, outputPath);
                console.log(`[${timestamp()}] ${relativeOutput} updated (${summary})`);
            }
            catch (err) {
                console.log(`[${timestamp()}] Parse error: ${err instanceof Error ? err.message : err} (${relativeOutput} unchanged)`);
            }
        }, 300);
    });
    watcher.on("error", (err) => {
        console.error(`Watcher error: ${err instanceof Error ? err.message : err}`);
    });
    return {
        close: async () => {
            if (debounceTimer)
                clearTimeout(debounceTimer);
            await watcher.close();
        },
    };
}
