import { NextRequest, NextResponse } from "next/server";
import { generateContext } from "@/lib/context-generator";
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

    const content = generateContext(schema);
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate context file." },
      { status: 500 }
    );
  }
}
