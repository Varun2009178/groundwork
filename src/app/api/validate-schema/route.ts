import { NextRequest, NextResponse } from "next/server";
import { validateSchema } from "@/lib/schema-checker";
import { Schema } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schema } = body as { schema: Schema };

    if (!schema || !schema.tables || schema.tables.length === 0) {
      return NextResponse.json(
        { error: "Invalid schema — no tables found." },
        { status: 400 }
      );
    }

    const results = validateSchema(schema);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "Failed to validate schema." },
      { status: 500 }
    );
  }
}
