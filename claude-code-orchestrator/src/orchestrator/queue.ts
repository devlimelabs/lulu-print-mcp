import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { ProcessInfo, ProcessStatus, createProcessInfo } from "./process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:queue' });

/**
 * Task queue info type
 */
export type TaskQueueInfo = {
  id?: string;
  task: string;
  priority: number;
  roleId: string;
  workingDirectory?: string;
  dependencies?: string[];
};

/**
 * Task queue class for managing process scheduling
 */
export class TaskQueue {
  private queue: TaskQueueInfo[] = [];
  private processes: Map<string, ProcessInfo> = new Map();
  private maxConcurrent: number;
  private defaultPriority: number = 5;
  
  /**
   * Constructor
   * @param maxConcurrent - Maximum number of concurrent processes
   */
  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }
  
  /**
   * Add a task to the queue
   * @param task - The task description
   * @param priority - Task priority (1-10)
   * @param roleId - The agent role ID
   * @param workingDirectory - Working directory for the process
   * @param dependencies - IDs of processes that this process depends on
   * @returns string - The task ID
   */
  addTask(
    task: string,
    priority: number = this.defaultPriority,
    roleId: string = 'generalist',
    workingDirectory?: string,
    dependencies?: string[]
  ): string {
    // Create process info
    const processInfo = createProcessInfo(task, priority, roleId, workingDirectory, dependencies);
    const id = processInfo.id;
    
    // Store in processes map
    this.processes.set(id, processInfo);
    
    // Add to queue
    this.queue.push({
      id,
      task,
      priority,
      roleId,
      workingDirectory,
      dependencies
    });
    
    logger.info(`Added task to queue: ${task} (ID: ${id}, Priority: ${priority}, Role: ${roleId})`);
    
    return id;
  }
  
  /**
   * Get active process count
   * @returns number - Number of active processes
   */
  getActiveCount(): number {
    let activeCount = 0;
    for (const process of this.processes.values()) {
      if (process.status === ProcessStatus.RUNNING || process.status === ProcessStatus.WAITING) {
        activeCount++;
      }
    }
    return activeCount;
  }
  
  /**
   * Get the next task to process
   * @returns TaskQueueInfo | undefined - Next task or undefined if no tasks are ready
   */
  getNextTask(): TaskQueueInfo | undefined {
    if (this.queue.length === 0) {
      return undefined;
    }
    
    // Sort queue by priority (higher first)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    // Find the first task with all dependencies met
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      
      // Check if dependencies are met
      if (task.dependencies && task.dependencies.length > 0) {
        let dependenciesMet = true;
        
        for (const depId of task.dependencies) {
          const depProcess = this.processes.get(depId);
          
          if (!depProcess || depProcess.status !== ProcessStatus.COMPLETED) {
            dependenciesMet = false;
            break;
          }
        }
        
        if (!dependenciesMet) {
          continue;
        }
      }
      
      // Remove task from queue
      this.queue.splice(i, 1);
      return task;
    }
    
    return undefined;
  }
  
  /**
   * Check if there are available slots for new processes
   * @returns boolean - Whether there are available slots
   */
  hasAvailableSlots(): boolean {
    return this.getActiveCount() < this.maxConcurrent;
  }
  
  /**
   * Set the maximum number of concurrent processes
   * @param maxConcurrent - Maximum number of concurrent processes
   */
  setMaxConcurrent(maxConcurrent: number): void {
    this.maxConcurrent = maxConcurrent;
    logger.info(`Set max concurrent processes to ${maxConcurrent}`);
  }
  
  /**
   * Get all processes
   * @returns Map<string, ProcessInfo> - Map of all processes
   */
  getAllProcesses(): Map<string, ProcessInfo> {
    return this.processes;
  }
  
  /**
   * Get a process by ID
   * @param id - Process ID
   * @returns ProcessInfo | undefined - Process info or undefined if not found
   */
  getProcess(id: string): ProcessInfo | undefined {
    return this.processes.get(id);
  }
  
  /**
   * Get all tasks in the queue
   * @returns TaskQueueInfo[] - Array of tasks in the queue
   */
  getAllQueuedTasks(): TaskQueueInfo[] {
    return [...this.queue];
  }
  
  /**
   * Update task priority
   * @param id - Task ID
   * @param priority - New priority
   * @returns boolean - Whether the update was successful
   */
  updateTaskPriority(id: string, priority: number): boolean {
    const taskIndex = this.queue.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return false;
    }
    
    this.queue[taskIndex].priority = priority;
    logger.info(`Updated priority for task ${id} to ${priority}`);
    return true;
  }
  
  /**
   * Remove a task from the queue
   * @param id - Task ID
   * @returns boolean - Whether the removal was successful
   */
  removeTask(id: string): boolean {
    const taskIndex = this.queue.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return false;
    }
    
    this.queue.splice(taskIndex, 1);
    logger.info(`Removed task ${id} from queue`);
    return true;
  }
  
  /**
   * Get queue size
   * @returns number - Number of tasks in the queue
   */
  getQueueSize(): number {
    return this.queue.length;
  }
  
  /**
   * Get processes by status
   * @param status - Process status
   * @returns ProcessInfo[] - Array of processes with the specified status
   */
  getProcessesByStatus(status: ProcessStatus): ProcessInfo[] {
    const result: ProcessInfo[] = [];
    for (const process of this.processes.values()) {
      if (process.status === status) {
        result.push(process);
      }
    }
    return result;
  }
  
  /**
   * Clean up old completed/failed processes
   * @param maxAge - Maximum age in milliseconds
   */
  cleanupOldProcesses(maxAge: number): void {
    const now = Date.now();
    let cleanupCount = 0;
    
    for (const [id, info] of this.processes.entries()) {
      if ((info.status === ProcessStatus.COMPLETED || 
           info.status === ProcessStatus.FAILED || 
           info.status === ProcessStatus.CANCELED) && 
          (now - info.lastActivity > maxAge)) {
        this.processes.delete(id);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      logger.info(`Cleaned up ${cleanupCount} old processes`);
    }
  }
}