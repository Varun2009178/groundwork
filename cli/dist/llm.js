"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLLM = callLLM;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
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
function extractJSON(text) {
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch)
        return fenceMatch[1].trim();
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch)
        return braceMatch[0];
    return text.trim();
}
async function callViaOpenRouter(input) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://groundwork.dev",
            "X-Title": "Groundwork CLI",
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
    const data = (await res.json());
    return data.choices[0].message.content;
}
async function callViaAnthropic(input) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const client = new sdk_1.default({ apiKey });
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
async function callLLM(input) {
    let raw;
    if (process.env.OPENROUTER_API_KEY) {
        raw = await callViaOpenRouter(input);
    }
    else if (process.env.ANTHROPIC_API_KEY) {
        raw = await callViaAnthropic(input);
    }
    else {
        throw new Error("Missing API key. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY in your environment.");
    }
    return extractJSON(raw);
}
