/**
 * Utilities for working with package.json files
 * Provides typed operations for reading, writing, and modifying package.json
 */
import fs from "fs/promises";
import path from "path";
/**
 * Reads package.json from the specified directory
 *
 * @param packagePath - Directory containing package.json
 * @returns The parsed package.json as a JavaScript object
 * @throws Error if package.json cannot be read or parsed
 */
export async function readPackageJson(packagePath = process.cwd()) {
    try {
        const packageJsonPath = path.join(packagePath, 'package.json');
        const data = await fs.readFile(packageJsonPath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`package.json not found in ${packagePath}. Is this an npm package directory?`);
        }
        throw new Error(`Error reading package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Writes package.json to the specified directory
 *
 * @param packageData - Package data to write
 * @param packagePath - Directory to write package.json to
 * @returns Object indicating success
 * @throws Error if package.json cannot be written
 */
export async function writePackageJson(packageData, packagePath = process.cwd()) {
    try {
        const packageJsonPath = path.join(packagePath, 'package.json');
        await fs.writeFile(packageJsonPath, JSON.stringify(packageData, null, 2), 'utf8');
        return { success: true };
    }
    catch (error) {
        throw new Error(`Error writing package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Checks if package.json exists in the specified directory
 *
 * @param packagePath - Directory to check
 * @returns True if package.json exists, false otherwise
 */
export async function packageJsonExists(packagePath = process.cwd()) {
    try {
        const packageJsonPath = path.join(packagePath, 'package.json');
        await fs.access(packageJsonPath);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Updates the scripts section of package.json
 *
 * @param scripts - New scripts to add or update
 * @param packagePath - Directory containing package.json
 * @returns The updated package.json object
 * @throws Error if package.json cannot be read or written
 */
export async function updatePackageScripts(scripts, packagePath = process.cwd()) {
    const packageJson = await readPackageJson(packagePath);
    packageJson.scripts = { ...packageJson.scripts, ...scripts };
    await writePackageJson(packageJson, packagePath);
    return packageJson;
}
/**
 * Gets all dependency type fields from package.json
 *
 * @param packagePath - Directory containing package.json
 * @returns Object containing all dependency types
 */
export async function getAllDependencies(packagePath = process.cwd()) {
    const packageJson = await readPackageJson(packagePath);
    return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {},
    };
}
//# sourceMappingURL=package-json.js.map