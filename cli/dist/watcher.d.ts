interface WatcherOptions {
    schemaPath: string;
    outputPath: string;
}
/**
 * Parses the Prisma schema and writes GROUNDWORK.md.
 * Returns a summary string on success, or throws on parse error.
 */
export declare function syncSchema(schemaPath: string, outputPath: string): string;
/**
 * Starts the file watcher. Returns a cleanup function.
 */
export declare function startWatcher(options: WatcherOptions): {
    close: () => Promise<void>;
};
export {};
