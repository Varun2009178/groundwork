import * as fs from "fs";
import * as path from "path";

/**
 * Finds schema.prisma in the project.
 * Search order:
 *   1. User-specified path (--schema flag)
 *   2. ./prisma/schema.prisma (Prisma default)
 *   3. ./schema.prisma (root-level)
 *
 * Returns the resolved absolute path, or null if not found.
 */
export function findPrismaSchema(userPath?: string): string | null {
  if (userPath) {
    const resolved = path.resolve(process.cwd(), userPath);
    return fs.existsSync(resolved) ? resolved : null;
  }

  const candidates = [
    path.resolve(process.cwd(), "prisma", "schema.prisma"),
    path.resolve(process.cwd(), "schema.prisma"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Returns a display-friendly relative path from cwd.
 */
export function displayPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
