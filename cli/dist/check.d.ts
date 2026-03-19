import { Schema } from "./types";
export interface CheckResult {
    status: "pass" | "warn" | "fail";
    message: string;
}
/**
 * Run schema validation checks — purely deterministic, no AI needed.
 */
export declare function validateSchema(schema: Schema): CheckResult[];
/**
 * Read and validate a GROUNDWORK.md file from disk.
 */
export declare function checkFile(filePath: string): {
    schema: Schema | null;
    results: CheckResult[];
};
/**
 * Format check results for terminal output.
 */
export declare function formatResults(results: CheckResult[]): string;
