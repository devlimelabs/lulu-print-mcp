import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { ProcessInfo, ProcessStatus, hasProcessTimedOut, launchProcess, stopProcess } from "./process.js";
import { TaskQueue } from "./queue.js";
import * as os from 'os';

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:monitor' });

/**
 * Orchestrator configuration type
 */
export type OrchestratorConfig = {
  maxConcurrentProcesses: number;
  processTimeoutMs: number;
  interactionTimeoutMs: number;
  cleanupIntervalMs: number;
  oldProcessMaxAgeMs: number;
  claudeCodeMcpPath: string;
};

/**
 * Default orchestrator configuration
 */
export const DEFAULT_CONFIG: OrchestratorConfig = {
  maxConcurrentProcesses: Math.max(2, os.cpus().length > 4 ? os.cpus().length - 2 : 2),
  processTimeoutMs: 20 * 60 * 1000, // 20 minutes
  interactionTimeoutMs: 5 * 60 * 1000, // 5 minutes
  cleanupIntervalMs: 10 * 60 * 1000, // 10 minutes
  oldProcessMaxAgeMs: 60 * 60 * 1000, // 1 hour
  claudeCodeMcpPath: '' // Will be set by the user
};

/**
 * Orchestrator monitor class for managing processes and scheduling
 */
export class OrchestratorMonitor {
  private queue: TaskQueue;
  private config: OrchestratorConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Constructor
   * @param config - Orchestrator configuration
   */
  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new TaskQueue(this.config.maxConcurrentProcesses);
    
    logger.info(`Initialized orchestrator monitor with ${this.config.maxConcurrentProcesses} max concurrent processes`);
  }
  
  /**
   * Start the monitor
   */
  start(): void {
    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.queue.cleanupOldProcesses(this.config.oldProcessMaxAgeMs);
      this.scheduleNextTasks();
    }, this.config.cleanupIntervalMs);
    
    logger.info('Orchestrator monitor started');
  }
  
  /**
   * Stop the monitor
   */
  stop(): void {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    logger.info('Orchestrator monitor stopped');
  }
  
  /**
   * Update orchestrator configuration
   * @param config - New partial configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    // Update task queue max concurrent if changed
    if (this.config.maxConcurrentProcesses !== oldConfig.maxConcurrentProcesses) {
      this.queue.setMaxConcurrent(this.config.maxConcurrentProcesses);
      
      // Schedule next tasks if max concurrent increased
      if (this.config.maxConcurrentProcesses > oldConfig.maxConcurrentProcesses) {
        this.scheduleNextTasks();
      }
    }
    
    logger.info('Updated orchestrator configuration');
  }
  
  /**
   * Submit a new task
   * @param task - Task description
   * @param priority - Task priority (1-10)
   * @param roleId - Agent role ID
   * @param workingDirectory - Working directory for the process
   * @param dependencies - IDs of processes that this process depends on
   * @returns string - Task ID
   */
  submitTask(
    task: string,
    priority: number = 5,
    roleId: string = 'generalist',
    workingDirectory?: string,
    dependencies?: string[]
  ): string {
    // Add task to queue
    const taskId = this.queue.addTask(task, priority, roleId, workingDirectory, dependencies);
    
    // Try to schedule tasks
    this.scheduleNextTasks();
    
    return taskId;
  }
  
  /**
   * Schedule next tasks from the queue
   */
  scheduleNextTasks(): void {
    // While there are available slots and tasks in the queue
    while (this.queue.hasAvailableSlots()) {
      const nextTask = this.queue.getNextTask();
      if (!nextTask) {
        break;
      }
      
      // Get the process info
      const processId = nextTask.id;
      if (!processId) {
        logger.error('Task has no ID, skipping');
        continue;
      }
      
      const processInfo = this.queue.getProcess(processId);
      if (!processInfo) {
        logger.error(`Process info not found for task ID ${processId}, skipping`);
        continue;
      }
      
      // Launch the process
      this.launchClaudeCodeProcess(processInfo, nextTask.workingDirectory);
      
      // Set up timeout timer
      this.setProcessTimeoutTimer(processId);
    }
  }
  
  /**
   * Launch a Claude Code process
   * @param processInfo - Process info
   * @param workingDirectory - Working directory
   */
  private launchClaudeCodeProcess(
    processInfo: ProcessInfo,
    workingDirectory?: string
  ): void {
    if (!this.config.claudeCodeMcpPath) {
      logger.error('Claude Code MCP path not set, cannot launch process');
      processInfo.status = ProcessStatus.FAILED;
      processInfo.output += '\n[ORCHESTRATOR] Error: Claude Code MCP path not set';
      return;
    }
    
    // Set up environment variables
    const env: Record<string, string> = {
      CLAUDE_ORCHESTRATOR_PROCESS_ID: processInfo.id,
      CLAUDE_ORCHESTRATOR_ROLE: processInfo.role.id,
      CLAUDE_ORCHESTRATOR_TASK: processInfo.task,
    };
    
    // Add working directory if provided
    if (workingDirectory) {
      env.CLAUDE_ORCHESTRATOR_WORKING_DIR = workingDirectory;
    }
    
    // Launch the process
    launchProcess(processInfo, 'node', [this.config.claudeCodeMcpPath], env);
  }
  
  /**
   * Set up a timeout timer for a process
   * @param processId - Process ID
   */
  private setProcessTimeoutTimer(processId: string): void {
    // Clear any existing timer
    if (this.timers.has(processId)) {
      clearTimeout(this.timers.get(processId)!);
      this.timers.delete(processId);
    }
    
    // Set up a new timer
    const timer = setInterval(() => {
      const processInfo = this.queue.getProcess(processId);
      if (!processInfo) {
        clearInterval(timer);
        this.timers.delete(processId);
        return;
      }
      
      // Check if the process has timed out
      if (hasProcessTimedOut(
        processInfo, 
        this.config.processTimeoutMs, 
        this.config.interactionTimeoutMs
      )) {
        logger.warn(`Process ${processId} has timed out, stopping`);
        stopProcess(processInfo);
        clearInterval(timer);
        this.timers.delete(processId);
        
        // Schedule next tasks
        this.scheduleNextTasks();
      }
      
      // Check if the process has completed or failed
      if (processInfo.status === ProcessStatus.COMPLETED || 
          processInfo.status === ProcessStatus.FAILED ||
          processInfo.status === ProcessStatus.CANCELED) {
        clearInterval(timer);
        this.timers.delete(processId);
        
        // Schedule next tasks
        this.scheduleNextTasks();
      }
    }, 10000); // Check every 10 seconds
    
    this.timers.set(processId, timer);
  }
  
  /**
   * Get a process by ID
   * @param processId - Process ID
   * @returns ProcessInfo | undefined - Process info or undefined if not found
   */
  getProcess(processId: string): ProcessInfo | undefined {
    return this.queue.getProcess(processId);
  }
  
  /**
   * Get all processes
   * @returns Map<string, ProcessInfo> - Map of all processes
   */
  getAllProcesses(): Map<string, ProcessInfo> {
    return this.queue.getAllProcesses();
  }
  
  /**
   * Get processes by status
   * @param status - Process status
   * @returns ProcessInfo[] - Array of processes with the specified status
   */
  getProcessesByStatus(status: ProcessStatus): ProcessInfo[] {
    return this.queue.getProcessesByStatus(status);
  }
  
  /**
   * Get all queued tasks
   * @returns TaskQueueInfo[] - Array of queued tasks
   */
  getQueuedTasks(): any[] {
    return this.queue.getAllQueuedTasks();
  }
  
  /**
   * Update task priority
   * @param taskId - Task ID
   * @param priority - New priority
   * @returns boolean - Whether the update was successful
   */
  updateTaskPriority(taskId: string, priority: number): boolean {
    return this.queue.updateTaskPriority(taskId, priority);
  }
  
  /**
   * Remove a task from the queue
   * @param taskId - Task ID
   * @returns boolean - Whether the removal was successful
   */
  removeTask(taskId: string): boolean {
    return this.queue.removeTask(taskId);
  }
  
  /**
   * Stop a running process
   * @param processId - Process ID
   * @returns boolean - Whether the stop was successful
   */
  stopProcessById(processId: string): boolean {
    const processInfo = this.queue.getProcess(processId);
    if (!processInfo) {
      return false;
    }
    
    stopProcess(processInfo);
    
    // Clear any timeout timer
    if (this.timers.has(processId)) {
      clearTimeout(this.timers.get(processId)!);
      this.timers.delete(processId);
    }
    
    // Schedule next tasks
    this.scheduleNextTasks();
    
    return true;
  }
  
  /**
   * Send input to a waiting process
   * @param processId - Process ID
   * @param input - Input to send
   * @returns boolean - Whether the input was sent successfully
   */
  sendInputToProcess(processId: string, input: string): boolean {
    const processInfo = this.queue.getProcess(processId);
    if (!processInfo) {
      return false;
    }
    
    return processInfo.status === ProcessStatus.WAITING && 
           processInfo.process?.stdin?.write(input + '\n') === true;
  }
}