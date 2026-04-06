import { Schema } from "./types";
/**
 * Main entry point: parses a schema.prisma file content string into a Groundwork Schema.
 */
export declare function parsePrismaSchema(source: string): Schema;
