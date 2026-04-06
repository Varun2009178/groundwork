/**
 * Finds schema.prisma in the project.
 * Search order:
 *   1. User-specified path (--schema flag)
 *   2. ./prisma/schema.prisma (Prisma default)
 *   3. ./schema.prisma (root-level)
 *
 * Returns the resolved absolute path, or null if not found.
 */
export declare function findPrismaSchema(userPath?: string): string | null;
/**
 * Returns a display-friendly relative path from cwd.
 */
export declare function displayPath(absolutePath: string): string;
