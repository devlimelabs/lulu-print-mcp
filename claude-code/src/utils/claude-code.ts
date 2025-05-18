import { exec } from "child_process";
import { promisify } from "util";
import { access } from "fs/promises";
import { constants } from "fs";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Promisify exec for async/await usage
const execPromise = promisify(exec);

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp' });

/**
 * Check if Claude Code CLI is installed and accessible
 * @returns Promise<boolean> - true if Claude Code is installed, false otherwise
 */
export async function checkClaudeCodeInstalled(): Promise<boolean> {
  try {
    await execPromise("claude --version");
    return true;
  } catch (error) {
    logger.error("Claude Code not found. Make sure it's installed and in your PATH.", error);
    return false;
  }
}

/**
 * Execute Claude Code CLI commands
 * @param command - The command to execute
 * @param flags - Optional flags to pass to Claude Code
 * @returns Promise<string> - Command output
 */
export async function executeClaudeCode(command: string, flags: string[] = []): Promise<string> {
  const flagsStr = flags.length > 0 ? flags.join(" ") + " " : "";
  const fullCommand = `claude ${flagsStr}${command}`;
  
  logger.debug(`Executing Claude Code command: ${fullCommand}`);
  
  try {
    const { stdout, stderr } = await execPromise(fullCommand);
    if (stderr) {
      logger.warn(`Claude Code stderr: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    logger.error(`Error executing Claude Code command: ${command}`, error);
    throw new Error(`Failed to execute Claude Code command: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sanitize a string to prevent command injection
 * @param input - The string to sanitize
 * @returns string - Sanitized string
 */
export function sanitizeString(input: string): string {
  return input.replace(/"/g, '\\"');
}

/**
 * Verify that a file exists and is accessible
 * @param filePath - The file path to verify
 * @returns Promise<boolean> - true if file exists and is accessible, false otherwise
 */
export async function verifyFileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verify that a file is writable
 * @param filePath - The file path to verify
 * @returns Promise<boolean> - true if file is writable, false otherwise
 */
export async function verifyFileWritable(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}