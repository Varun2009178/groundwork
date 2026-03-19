import { z } from "zod";
import { ColumnType } from "./types";

const VALID_COLUMN_TYPES = ["string", "integer", "timestamp", "boolean", "text", "float"] as const;

const columnSchema = z.object({
  name: z.string(),
  type: z.string().transform((val): ColumnType => {
    if (VALID_COLUMN_TYPES.includes(val as any)) return val as ColumnType;
    return "string";
  }),
  primaryKey: z.boolean().optional(),
  nullable: z.boolean().optional(),
  unique: z.boolean().optional(),
  defaultValue: z.string().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
  }).optional(),
});

const tableSchema = z.object({
  name: z.string(),
  description: z.string(),
  columns: z.array(columnSchema),
});

const relationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(["one-to-many", "many-to-many", "one-to-one"]),
  foreignKey: z.string(),
  description: z.string(),
});

export const claudeResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
  tables: z.array(tableSchema),
  relationships: z.array(relationshipSchema),
});
