#!/usr/bin/env node

import { Command } from "commander";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { callLLM, getKeyInfo } from "./llm";
import { claudeResponseSchema } from "./validator";
import { generateContext } from "./generator";
import { checkFile, formatResults } from "./check";
import { Schema } from "./types";
import { findPrismaSchema, displayPath } from "./schema-finder";
import { startWatcher, syncSchema } from "./watcher";

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);
const VERSION: string = pkg.version;

// Load .env.local / .env from the current directory (so users don't need to export manually)
function loadEnvFile() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.resolve(process.cwd(), name);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
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

function createSpinner(text: string) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i % frames.length]} ${text}`);
    i++;
  }, 80);
  return {
    stop(finalText: string) {
      clearInterval(interval);
      process.stdout.write(`\r${finalText}\n`);
    },
  };
}

function prompt(question: string): Promise<string> {
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

async function readMultilineInput(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    "\nDescribe your database schema in plain English."
  );
  console.log("(Press Enter twice to submit)\n");

  return new Promise((resolve) => {
    const lines: string[] = [];
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

async function initCommand(options: { output?: string }) {
  const outputFile = options.output || "GROUNDWORK.md";
  const outputPath = path.resolve(process.cwd(), outputFile);

  // Prevent path traversal — output must stay within the working directory
  if (!outputPath.startsWith(process.cwd() + path.sep) && outputPath !== process.cwd()) {
    console.error("\n✗ Output path must be within the current directory.\n");
    process.exit(1);
  }

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    const answer = await prompt(
      `\n${outputFile} already exists. Overwrite? (y/N) `
    );
    if (answer.toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  // Check for API key
  const keyInfo = getKeyInfo();
  if (!keyInfo) {
    console.error(
      "\n✗ Missing API key. Set one of these in your environment or .env.local:\n"
    );
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

  let rawJson: string;
  try {
    rawJson = await callLLM(input);
  } catch (err: unknown) {
    spinner.stop("✗ Failed to parse schema.");
    if (err instanceof Error) {
      console.error(`  ${err.message}\n`);
    }
    process.exit(1);
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    // Retry once
    try {
      rawJson = await callLLM(input);
      parsed = JSON.parse(rawJson);
    } catch {
      spinner.stop("✗ Couldn't parse the response — try being more specific.");
      process.exit(1);
    }
  }

  // Validate
  const validated = claudeResponseSchema.safeParse(parsed);
  if (!validated.success) {
    spinner.stop("✗ Schema parsing produced unexpected structure — try rephrasing.");
    process.exit(1);
  }

  const schema: Schema = {
    id: crypto.randomUUID(),
    ...validated.data,
    createdAt: new Date().toISOString(),
  };

  spinner.stop(`✓ Parsed ${schema.tables.length} tables, ${schema.relationships.length} relationships`);

  // Generate context
  const content = generateContext(schema);
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

const program = new Command();

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
  .action((options: { file?: string }) => {
    const filePath = options.file || "GROUNDWORK.md";
    console.log(`\nChecking ${filePath}...\n`);

    const { schema, results } = checkFile(filePath);

    if (!schema) {
      console.log(formatResults(results));
      process.exit(1);
    }

    console.log(formatResults(results));

    const passes = results.filter((r) => r.status === "pass").length;
    const warns = results.filter((r) => r.status === "warn").length;
    const fails = results.filter((r) => r.status === "fail").length;

    console.log(
      `\n  ${passes} passed · ${warns} warnings · ${fails} errors\n`
    );

    if (fails > 0) process.exit(1);
  });

program
  .command("watch")
  .description("Watch schema.prisma and auto-regenerate GROUNDWORK.md on changes")
  .option("-s, --schema <path>", "Path to schema.prisma")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action((options: { schema?: string; output?: string }) => {
    const schemaPath = findPrismaSchema(options.schema);
    if (!schemaPath) {
      console.error("\n✗ Could not find schema.prisma.");
      console.error("  Searched: ./prisma/schema.prisma, ./schema.prisma");
      console.error("  Use --schema <path> to specify the location.\n");
      process.exit(1);
    }

    const outputPath = path.resolve(process.cwd(), options.output || "GROUNDWORK.md");

    const watcher = startWatcher({ schemaPath, outputPath });

    // Graceful shutdown on Ctrl+C
    process.on("SIGINT", async () => {
      console.log("\nStopping watcher...");
      await watcher.close();
      process.exit(0);
    });
    process.on("SIGTERM", async () => {
      await watcher.close();
      process.exit(0);
    });
  });

program
  .command("sync")
  .description("One-shot: parse schema.prisma and regenerate GROUNDWORK.md")
  .option("-s, --schema <path>", "Path to schema.prisma")
  .option("-o, --output <file>", "Output filename", "GROUNDWORK.md")
  .action((options: { schema?: string; output?: string }) => {
    const schemaPath = findPrismaSchema(options.schema);
    if (!schemaPath) {
      console.error("\n✗ Could not find schema.prisma.");
      console.error("  Searched: ./prisma/schema.prisma, ./schema.prisma");
      console.error("  Use --schema <path> to specify the location.\n");
      process.exit(1);
    }

    const outputPath = path.resolve(process.cwd(), options.output || "GROUNDWORK.md");

    try {
      const summary = syncSchema(schemaPath, outputPath);
      const relativeOutput = displayPath(outputPath);
      console.log(`\n✓ ${relativeOutput} synced (${summary})\n`);
    } catch (err) {
      console.error(`\n✗ Parse error: ${err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    }
  });

program.parse();
