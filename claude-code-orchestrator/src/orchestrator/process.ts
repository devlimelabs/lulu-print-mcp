import { ChildProcess } from 'child_process';
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { generateProcessId, getCurrentTimestamp, startProcess } from '../utils/process-helpers.js';
import { AgentRole, getRole } from './roles.js';
import * as os from 'os';

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:process' });

/**
 * Process status enum
 */
export enum ProcessStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  WAITING = 'waiting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Process info type
 */
export type ProcessInfo = {
  id: string;
  process: ChildProcess | null;
  task: string;
  status: ProcessStatus;
  role: AgentRole;
  priority: number;
  startTime: number;
  lastActivity: number;
  waitingSince?: number;
  output: string;
  exitCode?: number | null;
  workingDirectory?: string;
  dependencies?: string[];
};

/**
 * Create a new process info object
 * @param task - The task to perform
 * @param priority - Task priority (1-10)
 * @param roleId - The agent role ID
 * @param workingDirectory - Working directory for the process
 * @param dependencies - IDs of processes that this process depends on
 * @returns ProcessInfo - The created process info
 */
export function createProcessInfo(
  task: string,
  priority: number = 5,
  roleId: string = 'generalist',
  workingDirectory?: string,
  dependencies?: string[]
): ProcessInfo {
  const id = generateProcessId();
  const now = getCurrentTimestamp();
  const role = getRole(roleId);
  
  return {
    id,
    process: null,
    task,
    status: ProcessStatus.PENDING,
    role,
    priority,
    startTime: now,
    lastActivity: now,
    output: `[ORCHESTRATOR] Created task: ${task}\nRole: ${role.name}\n`,
    workingDirectory,
    dependencies
  };
}

/**
 * Launch a process for a given processInfo
 * @param processInfo - The process info
 * @param command - The command to run
 * @param args - Command line arguments
 * @param env - Environment variables
 */
export function launchProcess(
  processInfo: ProcessInfo,
  command: string,
  args: string[] = [],
  env: Record<string, string> = {}
): void {
  try {
    logger.info(`Launching process ${processInfo.id} for task: ${processInfo.task}`);
    
    // Create environment with role info
    const processEnv = {
      ...env,
      CLAUDE_ORCHESTRATOR_PROCESS_ID: processInfo.id,
      CLAUDE_ORCHESTRATOR_ROLE: processInfo.role.id,
      CLAUDE_ORCHESTRATOR_TASK: processInfo.task,
      CLAUDE_ORCHESTRATOR_PROMPT_PREFIX: processInfo.role.promptPrefix
    };
    
    // Start the process
    const childProcess = startProcess(command, args, processEnv);
    processInfo.process = childProcess;
    processInfo.status = ProcessStatus.RUNNING;
    processInfo.output += `\n[ORCHESTRATOR] Process started with command: ${command} ${args.join(' ')}\n`;
    
    // Handle process output
    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      processInfo.output += text;
      processInfo.lastActivity = getCurrentTimestamp();
      
      // Check if process is waiting for user input
      if (text.includes("(Y/n)") || text.includes("Do you want to proceed?") || 
          text.includes("Enter your choice:") || text.includes("[y/N]")) {
        processInfo.status = ProcessStatus.WAITING;
        processInfo.waitingSince = getCurrentTimestamp();
        logger.info(`Process ${processInfo.id} is waiting for input`);
      }
    });
    
    childProcess.stderr.on('data', (data) => {
      processInfo.output += `[ERROR] ${data.toString()}`;
      processInfo.lastActivity = getCurrentTimestamp();
    });
    
    // Handle process exit
    childProcess.on('exit', (code) => {
      processInfo.exitCode = code;
      processInfo.status = code === 0 ? ProcessStatus.COMPLETED : ProcessStatus.FAILED;
      processInfo.output += `\n[ORCHESTRATOR] Process exited with code ${code}`;
      processInfo.lastActivity = getCurrentTimestamp();
      logger.info(`Process ${processInfo.id} exited with code ${code}`);
    });
    
    logger.debug(`Process ${processInfo.id} launched successfully`);
  } catch (error) {
    processInfo.status = ProcessStatus.FAILED;
    processInfo.output += `\n[ORCHESTRATOR] Failed to launch process: ${error instanceof Error ? error.message : String(error)}`;
    processInfo.lastActivity = getCurrentTimestamp();
    logger.error(`Failed to launch process ${processInfo.id}`, error);
  }
}

/**
 * Send input to a waiting process
 * @param processInfo - The process info
 * @param input - The input to send
 * @returns boolean - Whether the input was sent successfully
 */
export function sendInputToProcess(processInfo: ProcessInfo, input: string): boolean {
  try {
    if (processInfo.status !== ProcessStatus.WAITING) {
      logger.warn(`Process ${processInfo.id} is not waiting for input (current status: ${processInfo.status})`);
      return false;
    }
    
    if (!processInfo.process) {
      logger.error(`Process ${processInfo.id} has no associated child process`);
      return false;
    }
    
    // Send input to process
    processInfo.process.stdin.write(input + '\n');
    processInfo.status = ProcessStatus.RUNNING;
    processInfo.waitingSince = undefined;
    processInfo.lastActivity = getCurrentTimestamp();
    processInfo.output += `\n[USER INPUT] ${input}\n`;
    logger.info(`Sent input to process ${processInfo.id}: ${input}`);
    
    return true;
  } catch (error) {
    logger.error(`Error sending input to process ${processInfo.id}`, error);
    return false;
  }
}

/**
 * Stop a running process
 * @param processInfo - The process info
 */
export function stopProcess(processInfo: ProcessInfo): void {
  try {
    if (processInfo.status !== ProcessStatus.RUNNING && processInfo.status !== ProcessStatus.WAITING) {
      logger.warn(`Process ${processInfo.id} is not running or waiting (current status: ${processInfo.status})`);
      return;
    }
    
    if (!processInfo.process) {
      logger.error(`Process ${processInfo.id} has no associated child process`);
      return;
    }
    
    // Stop the process
    processInfo.process.kill();
    processInfo.status = ProcessStatus.CANCELED;
    processInfo.output += '\n[ORCHESTRATOR] Process stopped by user.';
    processInfo.lastActivity = getCurrentTimestamp();
    logger.info(`Process ${processInfo.id} stopped by user`);
  } catch (error) {
    logger.error(`Error stopping process ${processInfo.id}`, error);
  }
}

/**
 * Get process runtime in seconds
 * @param processInfo - The process info
 * @returns number - Process runtime in seconds
 */
export function getProcessRuntime(processInfo: ProcessInfo): number {
  const endTime = (processInfo.status === ProcessStatus.RUNNING || processInfo.status === ProcessStatus.WAITING) 
    ? getCurrentTimestamp() 
    : processInfo.lastActivity;
  
  return Math.floor((endTime - processInfo.startTime) / 1000);
}

/**
 * Check if a process has timed out
 * @param processInfo - The process info
 * @param runningTimeout - Timeout for running processes in ms
 * @param waitingTimeout - Timeout for waiting processes in ms
 * @returns boolean - Whether the process has timed out
 */
export function hasProcessTimedOut(
  processInfo: ProcessInfo, 
  runningTimeout: number, 
  waitingTimeout: number
): boolean {
  const now = getCurrentTimestamp();
  
  // Check for waiting timeout
  if (processInfo.status === ProcessStatus.WAITING && processInfo.waitingSince) {
    return (now - processInfo.waitingSince) > waitingTimeout;
  }
  
  // Check for running timeout
  if (processInfo.status === ProcessStatus.RUNNING) {
    return (now - processInfo.startTime) > runningTimeout;
  }
  
  return false;
}