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
exports.findPrismaSchema = findPrismaSchema;
exports.displayPath = displayPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Finds schema.prisma in the project.
 * Search order:
 *   1. User-specified path (--schema flag)
 *   2. ./prisma/schema.prisma (Prisma default)
 *   3. ./schema.prisma (root-level)
 *
 * Returns the resolved absolute path, or null if not found.
 */
function findPrismaSchema(userPath) {
    if (userPath) {
        const resolved = path.resolve(process.cwd(), userPath);
        return fs.existsSync(resolved) ? resolved : null;
    }
    const candidates = [
        path.resolve(process.cwd(), "prisma", "schema.prisma"),
        path.resolve(process.cwd(), "schema.prisma"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate))
            return candidate;
    }
    return null;
}
/**
 * Returns a display-friendly relative path from cwd.
 */
function displayPath(absolutePath) {
    return path.relative(process.cwd(), absolutePath);
}
