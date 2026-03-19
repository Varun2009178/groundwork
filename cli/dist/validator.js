"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeResponseSchema = void 0;
const zod_1 = require("zod");
const VALID_COLUMN_TYPES = ["string", "integer", "timestamp", "boolean", "text", "float"];
const columnSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.string().transform((val) => {
        if (VALID_COLUMN_TYPES.includes(val))
            return val;
        return "string";
    }),
    primaryKey: zod_1.z.boolean().optional(),
    nullable: zod_1.z.boolean().optional(),
    unique: zod_1.z.boolean().optional(),
    defaultValue: zod_1.z.string().optional(),
    references: zod_1.z.object({
        table: zod_1.z.string(),
        column: zod_1.z.string(),
    }).optional(),
});
const tableSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    columns: zod_1.z.array(columnSchema),
});
const relationshipSchema = zod_1.z.object({
    from: zod_1.z.string(),
    to: zod_1.z.string(),
    type: zod_1.z.enum(["one-to-many", "many-to-many", "one-to-one"]),
    foreignKey: zod_1.z.string(),
    description: zod_1.z.string(),
});
exports.claudeResponseSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string(),
    tables: zod_1.z.array(tableSchema),
    relationships: zod_1.z.array(relationshipSchema),
});
