import * as fs from 'fs/promises';
import * as path from 'path';
/**
 * Creates a directory and its parents if they don't exist
 * @param dir Directory path to create
 */
export async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    }
    catch (error) {
        // Check if directory exists
        try {
            const stats = await fs.stat(dir);
            if (!stats.isDirectory()) {
                throw new Error(`Path exists but is not a directory: ${dir}`);
            }
        }
        catch (statError) {
            // If this also fails, re-throw the original error
            throw error;
        }
    }
}
/**
 * Checks if a file exists
 * @param filePath Path to check
 */
export async function fileExists(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    }
    catch (error) {
        return false;
    }
}
/**
 * Checks if a directory exists
 * @param dirPath Path to check
 */
export async function dirExists(dirPath) {
    try {
        const stats = await fs.stat(dirPath);
        return stats.isDirectory();
    }
    catch (error) {
        return false;
    }
}
/**
 * Recursively copies a directory
 * @param src Source directory
 * @param dest Destination directory
 */
export async function copyDir(src, dest) {
    await ensureDir(dest);
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        }
        else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}
/**
 * Creates a JSON file with the given data
 * @param filePath File path
 * @param data Data to write
 */
export async function writeJsonFile(filePath, data) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
/**
 * Reads a JSON file
 * @param filePath File path
 */
export async function readJsonFile(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}
/**
 * Reads a JSON file if it exists, or returns a default value
 * @param filePath File path
 * @param defaultValue Default value if file doesn't exist
 */
export async function readJsonFileOrDefault(filePath, defaultValue) {
    try {
        return await readJsonFile(filePath);
    }
    catch (error) {
        return defaultValue;
    }
}
//# sourceMappingURL=fs-utils.js.map