import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { claudeResponseSchema } from "@/lib/schema-validator";
import { Schema } from "@/lib/types";

const SYSTEM_PROMPT = `You are a database schema parser. Given a plain English description of a database, extract the structured schema as JSON.

Return ONLY valid JSON matching this exact shape:
{
  "name": string,
  "description": string,
  "tables": [
    {
      "name": string,
      "description": string,
      "columns": [
        {
          "name": string,
          "type": "string" | "integer" | "timestamp" | "boolean" | "text" | "float",
          "primaryKey": boolean (optional),
          "nullable": boolean (optional),
          "unique": boolean (optional),
          "defaultValue": string (optional),
          "references": { "table": string, "column": string } (optional)
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": string,
      "to": string,
      "type": "one-to-many" | "many-to-many" | "one-to-one",
      "foreignKey": string,
      "description": string
    }
  ]
}

Rules:
- Infer reasonable column types from the six allowed values above
- Add an "id" integer primary key to every table if not mentioned
- Add "created_at" timestamp with default "now()" to every table if not mentioned
- Infer foreign keys from relationships (e.g. "posts belong to users" → posts.user_id with references to users.id)
- If the description is vague, make reasonable assumptions and include them
- Table and column names should be snake_case
- Do not include any text outside the JSON object`;

const OPENROUTER_MODEL = "anthropic/claude-sonnet-4";

async function callViaOpenRouter(input: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY!;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://groundwork.dev",
      "X-Title": "Groundwork",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callViaAnthropic(input: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: input }],
  });

  const textBlock = response.content[0];
  if (textBlock.type !== "text") {
    throw new Error("Unexpected response format from Claude");
  }
  return textBlock.text;
}

async function callLLM(input: string): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    return callViaOpenRouter(input);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return callViaAnthropic(input);
  }
  throw new Error("Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY in .env.local");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== "string" || input.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed schema description (at least 10 characters)." },
        { status: 400 }
      );
    }

    if (input.length > 5000) {
      return NextResponse.json(
        { error: "Schema description is too long. Please keep it under 5000 characters." },
        { status: 400 }
      );
    }

    // Call LLM, retry once on invalid JSON
    let rawJson: string;
    try {
      rawJson = await callLLM(input);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY")) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
      return NextResponse.json(
        { error: "Something went wrong — please try again." },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      // Retry once with same prompt
      try {
        rawJson = await callLLM(input);
        parsed = JSON.parse(rawJson);
      } catch {
        return NextResponse.json(
          { error: "Couldn't parse that — try being more specific." },
          { status: 500 }
        );
      }
    }

    // Validate with Zod
    const validated = claudeResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Schema parsing produced unexpected structure — try rephrasing." },
        { status: 500 }
      );
    }

    // Build full Schema object with id and timestamp
    const schema: Schema = {
      id: crypto.randomUUID(),
      ...validated.data,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ schema });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 }
    );
  }
}
