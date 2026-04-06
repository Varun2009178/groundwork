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

// OpenAI-compatible chat completions (works for OpenRouter, OpenAI, Gemini)
async function callViaOpenAICompat(
  input: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  extraHeaders?: Record<string, string>
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Sanitize: strip anything that looks like an API key from error output
    const sanitized = err.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "sk-***").replace(/AIza[a-zA-Z0-9_-]{10,}/g, "AIza***");
    throw new Error(`API error (${res.status}): ${sanitized.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callViaAnthropic(input: string, apiKey: string): Promise<string> {
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

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text.trim();
}

// Detect provider from key prefix and route accordingly
function detectProvider(apiKey: string): { call: (input: string) => Promise<string> } {
  if (apiKey.startsWith("sk-or-")) {
    return {
      call: (input) => callViaOpenAICompat(input, apiKey, "https://openrouter.ai/api/v1", "anthropic/claude-sonnet-4", {
        "HTTP-Referer": "https://groundwork.dev",
        "X-Title": "Groundwork",
      }),
    };
  }
  if (apiKey.startsWith("sk-ant-")) {
    return { call: (input) => callViaAnthropic(input, apiKey) };
  }
  if (apiKey.startsWith("sk-")) {
    return {
      call: (input) => callViaOpenAICompat(input, apiKey, "https://api.openai.com/v1", "gpt-4o"),
    };
  }
  if (apiKey.startsWith("AIza")) {
    return {
      call: (input) => callViaOpenAICompat(input, apiKey, "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.0-flash"),
    };
  }
  // Default: try as Anthropic key
  return { call: (input) => callViaAnthropic(input, apiKey) };
}

async function callLLM(input: string, clientKey: string): Promise<string> {
  const provider = detectProvider(clientKey);
  const raw = await provider.call(input);
  return extractJSON(raw);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, apiKey: clientKey } = body;

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

    if (!clientKey || typeof clientKey !== "string") {
      return NextResponse.json(
        { error: "API key is required. Add your OpenRouter, Anthropic, OpenAI, or Gemini key above." },
        { status: 401 }
      );
    }

    let rawJson: string;
    try {
      rawJson = await callLLM(input, clientKey);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong — please try again.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      try {
        rawJson = await callLLM(input, clientKey);
        parsed = JSON.parse(rawJson);
      } catch {
        return NextResponse.json(
          { error: "Couldn't parse that — try being more specific." },
          { status: 500 }
        );
      }
    }

    const validated = claudeResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Schema parsing produced unexpected structure — try rephrasing." },
        { status: 500 }
      );
    }

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
