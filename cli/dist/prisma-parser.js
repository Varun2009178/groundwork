"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePrismaSchema = parsePrismaSchema;
const prisma_ast_1 = require("@mrleebo/prisma-ast");
const crypto = __importStar(require("crypto"));
/**
 * Maps Prisma scalar types to Groundwork ColumnType.
 * Unknown types fall back to "string".
 */
const PRISMA_TYPE_MAP = {
    String: "string",
    Int: "integer",
    BigInt: "integer",
    Float: "float",
    Decimal: "float",
    Boolean: "boolean",
    DateTime: "timestamp",
    Json: "text",
    Bytes: "string",
};
function mapPrismaType(prismaType) {
    return PRISMA_TYPE_MAP[prismaType] || "string";
}
/**
 * Pluralizes a PascalCase model name into snake_case table name.
 * e.g., "User" → "users", "BlogPost" → "blog_posts", "Category" → "categories"
 */
function toTableName(modelName) {
    // PascalCase to snake_case
    const snake = modelName
        .replace(/([A-Z])/g, (match, char, index) => index > 0 ? `_${char.toLowerCase()}` : char.toLowerCase());
    // Simple pluralization
    if (snake.endsWith("y") && !snake.endsWith("ay") && !snake.endsWith("ey") && !snake.endsWith("oy") && !snake.endsWith("uy")) {
        return snake.slice(0, -1) + "ies";
    }
    if (snake.endsWith("s") || snake.endsWith("x") || snake.endsWith("sh") || snake.endsWith("ch")) {
        return snake + "es";
    }
    return snake + "s";
}
/**
 * Checks if a field has a specific attribute (e.g., @id, @unique).
 */
function hasAttribute(field, name) {
    return field.attributes?.some((a) => a.name === name) ?? false;
}
/**
 * Extracts the @default(...) value from a field, if present.
 * Returns the string representation (e.g., "autoincrement()", "now()", "true").
 */
function getDefaultValue(field) {
    const attr = field.attributes?.find((a) => a.name === "default");
    if (!attr || !attr.args || attr.args.length === 0)
        return undefined;
    const arg = attr.args[0];
    if (!arg)
        return undefined;
    const val = arg.value;
    if (typeof val === "string")
        return val;
    if (typeof val === "number" || typeof val === "boolean")
        return String(val);
    if (val && typeof val === "object" && "type" in val && val.type === "function") {
        return `${val.name}()`;
    }
    return undefined;
}
/**
 * Returns true if the field is a relation field (its type is another model name, not a scalar).
 * Relation fields have a fieldType that is not in PRISMA_TYPE_MAP, or have array/optional markers
 * combined with a @relation attribute.
 */
function isRelationField(field) {
    if (typeof field.fieldType !== "string")
        return false;
    // If it's a known scalar type, it's not a relation
    if (PRISMA_TYPE_MAP[field.fieldType])
        return false;
    // If it has @relation, it's definitely a relation
    if (hasAttribute(field, "relation"))
        return true;
    // If the type is not a known scalar and it's an array, it's a relation list
    if (field.array)
        return true;
    // If the type is not a known scalar, assume it's a relation
    return true;
}
/**
 * Extracts the @relation(fields: [...], references: [...]) info from a field.
 */
function getRelationInfo(field) {
    const attr = field.attributes?.find((a) => a.name === "relation");
    if (!attr || !attr.args)
        return null;
    let fields = [];
    let references = [];
    for (const arg of attr.args) {
        const val = arg.value;
        if (val && typeof val === "object" && "type" in val && val.type === "keyValue") {
            const kv = val;
            if (kv.key === "fields" && kv.value && typeof kv.value === "object" && "type" in kv.value && kv.value.type === "array") {
                const arrayValue = kv.value;
                fields = arrayValue.args.filter((a) => typeof a === "string");
            }
            if (kv.key === "references" && kv.value && typeof kv.value === "object" && "type" in kv.value && kv.value.type === "array") {
                const arrayValue = kv.value;
                references = arrayValue.args.filter((a) => typeof a === "string");
            }
        }
    }
    if (fields.length > 0 && references.length > 0) {
        return { fields, references };
    }
    return null;
}
/**
 * Converts a single Prisma model into a Groundwork Table + Relationship entries.
 * Skips relation fields (virtual, not real columns). FK scalar fields get `references` set.
 */
function parseModel(model, allModelNames) {
    const tableName = toTableName(model.name);
    const columns = [];
    const relationships = [];
    // Collect relation info first so we can annotate FK scalar fields
    const relationFKs = new Map();
    for (const prop of model.properties) {
        if (prop.type !== "field")
            continue;
        const field = prop;
        if (!isRelationField(field))
            continue;
        const relInfo = getRelationInfo(field);
        if (relInfo && typeof field.fieldType === "string") {
            for (let i = 0; i < relInfo.fields.length; i++) {
                relationFKs.set(relInfo.fields[i], {
                    toModel: field.fieldType,
                    refColumn: relInfo.references[i],
                    isList: false,
                });
            }
        }
    }
    // Now parse all scalar fields
    for (const prop of model.properties) {
        if (prop.type !== "field")
            continue;
        const field = prop;
        // Skip relation fields (they're virtual, not real DB columns)
        if (isRelationField(field))
            continue;
        const column = {
            name: field.name,
            type: mapPrismaType(typeof field.fieldType === "string" ? field.fieldType : "String"),
            primaryKey: hasAttribute(field, "id") || undefined,
            unique: hasAttribute(field, "unique") || undefined,
            nullable: field.optional || undefined,
            defaultValue: getDefaultValue(field),
        };
        // If this scalar field is a FK (referenced by a @relation on another field)
        const fkInfo = relationFKs.get(field.name);
        if (fkInfo) {
            const toTable = toTableName(fkInfo.toModel);
            column.references = {
                table: toTable,
                column: fkInfo.refColumn,
            };
            // Create the relationship entry
            const fromSingular = model.name.toLowerCase();
            const toSingular = fkInfo.toModel.toLowerCase();
            relationships.push({
                from: tableName,
                to: toTable,
                type: "one-to-many",
                foreignKey: field.name,
                description: `Each ${fromSingular} belongs to one ${toSingular}`,
            });
        }
        columns.push(column);
    }
    return {
        table: {
            name: tableName,
            description: `Stores ${model.name.toLowerCase()} records`,
            columns,
        },
        relationships,
    };
}
/**
 * Main entry point: parses a schema.prisma file content string into a Groundwork Schema.
 */
function parsePrismaSchema(source) {
    const ast = (0, prisma_ast_1.getSchema)(source);
    // Extract all model names for relation detection
    const models = ast.list.filter((block) => block.type === "model");
    const modelNames = models.map((m) => m.name);
    const tables = [];
    const relationships = [];
    for (const model of models) {
        const result = parseModel(model, modelNames);
        tables.push(result.table);
        relationships.push(...result.relationships);
    }
    // Derive schema name from the models
    const schemaName = tables.length > 0
        ? tables.map((t) => t.name).join("_") + "_schema"
        : "unknown_schema";
    return {
        id: crypto.randomUUID(),
        name: schemaName.length > 50 ? "database_schema" : schemaName,
        description: `Database schema with ${tables.length} tables parsed from schema.prisma`,
        tables,
        relationships,
        createdAt: new Date().toISOString(),
    };
}
