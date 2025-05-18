/**
 * Type definition for package.json structure
 * Not comprehensive, but covers the most common fields we'll interact with
 */
export interface PackageJson {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    private?: boolean;
    main?: string;
    type?: 'module' | 'commonjs';
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    keywords?: string[];
    homepage?: string;
    repository?: string | {
        type: string;
        url: string;
    };
    bugs?: string | {
        url: string;
        email?: string;
    };
    engines?: Record<string, string>;
    [key: string]: any;
}
/**
 * Reads package.json from the specified directory
 *
 * @param packagePath - Directory containing package.json
 * @returns The parsed package.json as a JavaScript object
 * @throws Error if package.json cannot be read or parsed
 */
export declare function readPackageJson(packagePath?: string): Promise<PackageJson>;
/**
 * Writes package.json to the specified directory
 *
 * @param packageData - Package data to write
 * @param packagePath - Directory to write package.json to
 * @returns Object indicating success
 * @throws Error if package.json cannot be written
 */
export declare function writePackageJson(packageData: PackageJson, packagePath?: string): Promise<{
    success: boolean;
}>;
/**
 * Checks if package.json exists in the specified directory
 *
 * @param packagePath - Directory to check
 * @returns True if package.json exists, false otherwise
 */
export declare function packageJsonExists(packagePath?: string): Promise<boolean>;
/**
 * Updates the scripts section of package.json
 *
 * @param scripts - New scripts to add or update
 * @param packagePath - Directory containing package.json
 * @returns The updated package.json object
 * @throws Error if package.json cannot be read or written
 */
export declare function updatePackageScripts(scripts: Record<string, string>, packagePath?: string): Promise<PackageJson>;
/**
 * Gets all dependency type fields from package.json
 *
 * @param packagePath - Directory containing package.json
 * @returns Object containing all dependency types
 */
export declare function getAllDependencies(packagePath?: string): Promise<{
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    peerDependencies: Record<string, string>;
}>;
