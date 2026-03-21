#!/usr/bin/env node
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
const commander_1 = require("commander");
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const llm_1 = require("./llm");
const validator_1 = require("./validator");
const generator_1 = require("./generator");
const check_1 = require("./check");
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
const VERSION = pkg.version;
// Load .env.local / .env from the current directory (so users don't need to export manually)
function loadEnvFile() {
    for (const name of [".env.local", ".env"]) {
        const filePath = path.resolve(process.cwd(), name);
        if (!fs.existsSync(filePath))
            continue;
        const content = fs.readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex === -1)
                continue;
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            // Strip surrounding quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            // Don't overwrite existing env vars
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    }
}
loadEnvFile();
function createSpinner(text) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${frames[i % frames.length]} ${text}`);
        i++;
    }, 80);
    return {
        stop(finalText) {
            clearInterval(interval);
            process.stdout.write(`\r${finalText}\n`);
        },
    };
}
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
async function readMultilineInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log("\nDescribe your database schema in plain English.");
    console.log("(Press Enter twice to submit)\n");
    return new Promise((resolve) => {
        const lines = [];
        let lastLineEmpty = false;
        rl.on("line", (line) => {
            if (line === "" && lastLineEmpty) {
                rl.close();
                resolve(lines.join("\n").trim());
                return;
            }
            lastLineEmpty = line === "";
            lines.push(line);
        });
    });
}
async function initCommand(options) {
    const outputFile = options.output || "GROUNDWORK.md";
    const outputPath = path.resolve(process.cwd(), outputFile);
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
        const answer = await prompt(`\n${outputFile} already exists. Overwrite? (y/N) `);
        if (answer.toLowerCase() !== "y") {
            console.log("Aborted.");
            process.exit(0);
        }
    }
    // Check for API key
    const keyInfo = (0, llm_1.getKeyInfo)();
    if (!keyInfo) {
        console.error("\n✗ Missing API key. Set one of these in your environment or .env.local:\n");
        console.error("  export OPENROUTER_API_KEY=your-key-here");
        console.error("  export ANTHROPIC_API_KEY=your-key-here");
        console.error("  export OPENAI_API_KEY=your-key-here");
        console.error("  export GEMINI_API_KEY=your-key-here\n");
        process.exit(1);
    }
    // Show which key will be used (masked) and get confirmation
    console.log(`\n  Using ${keyInfo.provider} key: ${keyInfo.masked}`);
    console.log("  Your key is sent directly to the provider over HTTPS. It is never stored or logged.\n");
    const input = await readMultilineInput();
    if (input.length < 10) {
        console.error("\n✗ Please provide a more detailed description (at least 10 characters).\n");
        process.exit(1);
    }
    // Call LLM
    const spinner = createSpinner("Parsing schema...");
    let rawJson;
    try {
        rawJson = await (0, llm_1.callLLM)(input);
    }
    catch (err) {
        spinner.stop("✗ Failed to parse schema.");
        if (err instanceof Error) {
            console.error(`  ${err.message}\n`);
        }
        process.exit(1);
    }
    // Parse JSON
    let parsed;
    try {
        parsed = JSON.parse(rawJson);
    }
    catch {
        // Retry once
        try {
            rawJson = await (0, llm_1.callLLM)(input);
            parsed = JSON.parse(rawJson);
        }
        catch {
            spinner.stop("✗ Couldn't parse the response — try being more specific.");
            process.exit(1);
        }
    }
    // Validate
    const validated = validator_1.claudeResponseSchema.safeParse(parsed);
    if (!validated.success) {
        spinner.stop("✗ Schema parsing produced unexpected structure — try rephrasing.");
        process.exit(1);
    }
    const schema = {
        id: crypto.randomUUID(),
        ...validated.data,
        createdAt: new Date().toISOString(),
    };
    spinner.stop(`✓ Parsed ${schema.tables.length} tables, ${schema.relationships.length} relationships`);
    // Generate context
    const content = (0, generator_1.generateContext)(schema);
    fs.writeFileSync(outputPath, content, "utf-8");
    console.log(`\n✓ Written to ${outputFile}`);
    console.log(`  ${content.split("\n").length} lines, ${content.length.toLocaleString()} chars\n`);
    // Show auto-setup instructions
    console.log("  To make your AI read it automatically, add one line:\n");
    console.log("  Claude Code  → CLAUDE.md                         @GROUNDWORK.md");
    console.log("  Cursor       → .cursorrules                      Read and follow GROUNDWORK.md for all database work.");
    console.log("  Windsurf     → .windsurfrules                    Read and follow GROUNDWORK.md for all database work.");
    console.log("  Copilot      → .github/copilot-instructions.md   Read and follow GROUNDWORK.md for all database work.");
    console.log("");
}
const program = new commander_1.Command();
program
    .name("groundwork")
    .description("Generate AI context files from plain English database schemas")
    .version(VERSION);
program
    .command("init", { isDefault: true })
    .description("Interactively describe your schema and generate GROUNDWORK.md")
    .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
    .action(initCommand);
program
    .command("check")
    .description("Validate your GROUNDWORK.md for common schema issues")
    .option("-f, --file <path>", "Path to GROUNDWORK.md", "GROUNDWORK.md")
    .action((options) => {
    const filePath = options.file || "GROUNDWORK.md";
    console.log(`\nChecking ${filePath}...\n`);
    const { schema, results } = (0, check_1.checkFile)(filePath);
    if (!schema) {
        console.log((0, check_1.formatResults)(results));
        process.exit(1);
    }
    console.log((0, check_1.formatResults)(results));
    const passes = results.filter((r) => r.status === "pass").length;
    const warns = results.filter((r) => r.status === "warn").length;
    const fails = results.filter((r) => r.status === "fail").length;
    console.log(`\n  ${passes} passed · ${warns} warnings · ${fails} errors\n`);
    if (fails > 0)
        process.exit(1);
});
program.parse();
