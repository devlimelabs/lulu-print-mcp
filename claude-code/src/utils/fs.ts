import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:fs-utils' });

/**
 * Create a temporary directory with a specific prefix
 * @param prefix - Prefix for the temporary directory name
 * @returns Promise<string> - Path to the created temporary directory
 */
export async function createTempDir(prefix: string = 'temp-'): Promise<string> {
  try {
    const tempBasePath = path.join(os.tmpdir(), prefix + Math.random().toString(36).substring(2, 10));
    await fs.mkdir(tempBasePath, { recursive: true });
    logger.debug(`Created temporary directory: ${tempBasePath}`);
    return tempBasePath;
  } catch (error) {
    logger.error("Failed to create temporary directory", error);
    throw new Error(`Failed to create temporary directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}