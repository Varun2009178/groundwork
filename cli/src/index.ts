#!/usr/bin/env node

import { Command } from "commander";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { callLLM } from "./llm";
import { claudeResponseSchema } from "./validator";
import { generateContext } from "./generator";
import { checkFile, formatResults } from "./check";
import { Schema } from "./types";

const VERSION = "0.1.0";

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
  if (!process.env.OPENROUTER_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "\n✗ Missing API key. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY in your environment.\n"
    );
    console.error("  export OPENROUTER_API_KEY=your-key-here");
    console.error("  # or");
    console.error("  export ANTHROPIC_API_KEY=your-key-here\n");
    process.exit(1);
  }

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
}

const program = new Command();

program
  .name("groundwork")
  .description("Generate AI context files from plain English database schemas")
  .version(VERSION);

program
  .command("init")
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

program.parse();
