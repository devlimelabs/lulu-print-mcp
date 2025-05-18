import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'util';
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { randomUUID } from 'crypto';

// Promisify exec for async usage
const execPromise = promisify(exec);

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:process-helpers' });

/**
 * Check if a specific command exists in the system
 * @param command - The command to check
 * @returns Promise<boolean> - True if the command exists, false otherwise
 */
export async function checkCommandExists(command: string): Promise<boolean> {
  try {
    // Use the 'which' command on Unix/Mac or 'where' on Windows
    const whichCommand = process.platform === 'win32' ? 'where' : 'which';
    await execPromise(`${whichCommand} ${command}`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Start an MCP process
 * @param command - The command to run
 * @param args - Command line arguments
 * @param env - Environment variables
 * @returns ChildProcess - The spawned process
 */
export function startProcess(
  command: string, 
  args: string[] = [], 
  env: Record<string, string> = {}
): ChildProcess {
  logger.debug(`Starting process: ${command} ${args.join(' ')}`);
  
  // Merge process environment with provided environment variables
  const processEnv = { ...process.env, ...env };
  
  // Spawn the process
  const childProcess = spawn(command, args, {
    env: processEnv,
    stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
  });
  
  // Log process output
  childProcess.stdout.on('data', (data) => {
    logger.debug(`Process stdout: ${data.toString().trim()}`);
  });
  
  childProcess.stderr.on('data', (data) => {
    logger.debug(`Process stderr: ${data.toString().trim()}`);
  });
  
  // Handle process exit
  childProcess.on('exit', (code, signal) => {
    if (code === 0) {
      logger.info(`Process exited successfully`);
    } else {
      logger.error(`Process exited with code ${code} and signal ${signal}`);
    }
  });
  
  // Handle process error
  childProcess.on('error', (error) => {
    logger.error(`Process error: ${error.message}`, error);
  });
  
  return childProcess;
}

/**
 * Generate a unique ID for a process
 * @returns string - A unique ID
 */
export function generateProcessId(): string {
  return randomUUID();
}

/**
 * Get current timestamp in milliseconds
 * @returns number - Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}