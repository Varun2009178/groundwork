import Anthropic from "@anthropic-ai/sdk";

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

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text.trim();
}

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
      Authorization: `Bearer ${apiKey}`,
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
    // Sanitize error: strip anything that looks like an API key
    const sanitized = err.replace(/sk-[a-zA-Z0-9_-]{10,}/g, "sk-***").replace(/AIza[a-zA-Z0-9_-]{10,}/g, "AIza***");
    throw new Error(`API error (${res.status}): ${sanitized.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
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

// Detect provider from key prefix and route accordingly
function detectProvider(apiKey: string): { call: (input: string) => Promise<string>; name: string } {
  if (apiKey.startsWith("sk-or-")) {
    return {
      name: "OpenRouter",
      call: (input) => callViaOpenAICompat(input, apiKey, "https://openrouter.ai/api/v1", "anthropic/claude-sonnet-4", {
        "HTTP-Referer": "https://groundwork.dev",
        "X-Title": "Groundwork CLI",
      }),
    };
  }
  if (apiKey.startsWith("sk-ant-")) {
    return { name: "Anthropic", call: (input) => callViaAnthropic(input, apiKey) };
  }
  if (apiKey.startsWith("sk-")) {
    return {
      name: "OpenAI",
      call: (input) => callViaOpenAICompat(input, apiKey, "https://api.openai.com/v1", "gpt-4o"),
    };
  }
  if (apiKey.startsWith("AIza")) {
    return {
      name: "Gemini",
      call: (input) => callViaOpenAICompat(input, apiKey, "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-2.0-flash"),
    };
  }
  // Default: try as Anthropic key
  return { name: "Anthropic", call: (input) => callViaAnthropic(input, apiKey) };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "···" + key.slice(-4);
}

export function getKeyInfo(): { key: string; provider: string; masked: string } | null {
  const key = process.env.OPENROUTER_API_KEY
    || process.env.ANTHROPIC_API_KEY
    || process.env.OPENAI_API_KEY
    || process.env.GEMINI_API_KEY;

  if (!key) return null;

  const provider = detectProvider(key);
  return { key, provider: provider.name, masked: maskKey(key) };
}

export async function callLLM(input: string): Promise<string> {
  const info = getKeyInfo();

  if (!info) {
    throw new Error(
      "Missing API key. Set one of these in your environment or .env.local:\n" +
      "  OPENROUTER_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY"
    );
  }

  const provider = detectProvider(info.key);
  const raw = await provider.call(input);
  return extractJSON(raw);
}
