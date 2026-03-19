import { z } from "zod";
export declare const claudeResponseSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    tables: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodPipe<z.ZodString, z.ZodTransform<"string" | "boolean" | "integer" | "timestamp" | "text" | "float", string>>;
            primaryKey: z.ZodOptional<z.ZodBoolean>;
            nullable: z.ZodOptional<z.ZodBoolean>;
            unique: z.ZodOptional<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodString>;
            references: z.ZodOptional<z.ZodObject<{
                table: z.ZodString;
                column: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    relationships: z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        type: z.ZodEnum<{
            "one-to-many": "one-to-many";
            "many-to-many": "many-to-many";
            "one-to-one": "one-to-one";
        }>;
        foreignKey: z.ZodString;
        description: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
