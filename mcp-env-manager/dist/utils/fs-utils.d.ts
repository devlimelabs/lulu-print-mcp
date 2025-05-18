/**
 * Creates a directory and its parents if they don't exist
 * @param dir Directory path to create
 */
export declare function ensureDir(dir: string): Promise<void>;
/**
 * Checks if a file exists
 * @param filePath Path to check
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Checks if a directory exists
 * @param dirPath Path to check
 */
export declare function dirExists(dirPath: string): Promise<boolean>;
/**
 * Recursively copies a directory
 * @param src Source directory
 * @param dest Destination directory
 */
export declare function copyDir(src: string, dest: string): Promise<void>;
/**
 * Creates a JSON file with the given data
 * @param filePath File path
 * @param data Data to write
 */
export declare function writeJsonFile(filePath: string, data: unknown): Promise<void>;
/**
 * Reads a JSON file
 * @param filePath File path
 */
export declare function readJsonFile<T>(filePath: string): Promise<T>;
/**
 * Reads a JSON file if it exists, or returns a default value
 * @param filePath File path
 * @param defaultValue Default value if file doesn't exist
 */
export declare function readJsonFileOrDefault<T>(filePath: string, defaultValue: T): Promise<T>;
