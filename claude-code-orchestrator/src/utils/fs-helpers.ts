import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:fs-helpers' });

/**
 * Create a temporary directory with a specific prefix
 * @param prefix - Prefix for the temporary directory name
 * @returns Promise<string> - Path to the created temporary directory
 */
export async function createTempDir(prefix: string = 'orchestrator-'): Promise<string> {
  try {
    const tempBasePath = path.join(os.tmpdir(), `${prefix}${Math.random().toString(36).substring(2, 10)}`);
    await fs.mkdir(tempBasePath, { recursive: true });
    logger.debug(`Created temporary directory: ${tempBasePath}`);
    return tempBasePath;
  } catch (error) {
    logger.error("Failed to create temporary directory", error);
    throw new Error(`Failed to create temporary directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a process output directory
 * @param baseDir - Base directory path
 * @param processId - Process ID
 * @returns Promise<string> - Path to the created output directory
 */
export async function createProcessOutputDir(baseDir: string, processId: string): Promise<string> {
  try {
    const outputDir = path.join(baseDir, processId);
    await fs.mkdir(outputDir, { recursive: true });
    logger.debug(`Created process output directory: ${outputDir}`);
    return outputDir;
  } catch (error) {
    logger.error(`Failed to create process output directory for process ${processId}`, error);
    throw new Error(`Failed to create process output directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Write data to a file
 * @param filePath - Path to the file
 * @param data - Data to write
 * @returns Promise<void>
 */
export async function writeToFile(filePath: string, data: string): Promise<void> {
  try {
    await fs.writeFile(filePath, data, 'utf8');
    logger.debug(`Wrote data to file: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write data to file: ${filePath}`, error);
    throw new Error(`Failed to write data to file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Read data from a file
 * @param filePath - Path to the file
 * @returns Promise<string> - File contents
 */
export async function readFromFile(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    logger.debug(`Read data from file: ${filePath}`);
    return data;
  } catch (error) {
    logger.error(`Failed to read data from file: ${filePath}`, error);
    throw new Error(`Failed to read data from file: ${error instanceof Error ? error.message : String(error)}`);
  }
}