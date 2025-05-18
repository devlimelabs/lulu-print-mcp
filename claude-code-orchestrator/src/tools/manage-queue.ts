import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { QueueManager, PRIORITY } from "../orchestrator/queue.js";

export function configureQueueTools(server: McpServer, queueManager: QueueManager): void {
  // Tool: Add task to queue
  server.tool(
    "add-task-to-queue",
    {
      taskDescription: z.string().describe("Description of the task to add to the queue"),
      role: z.string().describe("Role for this task"),
      priority: z.enum(["high", "medium", "low"]).describe("Priority level for this task")
    },
    async ({ taskDescription, role, priority }) => {
      try {
        // Convert string priority to numeric value
        const priorityValue = priority === "high" ? PRIORITY.HIGH : 
                             priority === "medium" ? PRIORITY.MEDIUM : PRIORITY.LOW;
        
        const queueItem = queueManager.addTask(taskDescription, priorityValue, role);
        
        return {
          content: [{ 
            type: "text", 
            text: `Task added to queue with ID: ${queueItem.id}\nTask: ${taskDescription}\nRole: ${role}\nPriority: ${priority}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error adding task to queue: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: List all tasks in queue
  server.tool(
    "list-queue",
    {
      filter: z.enum(["all", "assigned", "unassigned"]).default("all").describe("Filter tasks by assignment status")
    },
    async ({ filter }) => {
      try {
        let tasks;
        
        if (filter === "assigned") {
          tasks = queueManager.getAssignedTasks();
        } else if (filter === "unassigned") {
          tasks = queueManager.getUnassignedTasks();
        } else {
          tasks = queueManager.getAllTasks();
        }
        
        if (tasks.length === 0) {
          return {
            content: [{ type: "text", text: `No ${filter} tasks in the queue.` }]
          };
        }
        
        const tasksOutput = tasks.map(t => 
          `ID: ${t.id}\nTask: ${t.taskDescription}\nRole: ${t.role}\nPriority: ${t.priority}\nProcess ID: ${t.processId || 'Not assigned'}\n---`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `# ${filter.charAt(0).toUpperCase() + filter.slice(1)} Tasks in Queue\n\n${tasksOutput}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error listing queue: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Update task priority
  server.tool(
    "update-task-priority",
    {
      taskId: z.number().describe("ID of the task to update"),
      priority: z.enum(["high", "medium", "low"]).describe("New priority level for the task")
    },
    async ({ taskId, priority }) => {
      try {
        // Convert string priority to numeric value
        const priorityValue = priority === "high" ? PRIORITY.HIGH : 
                             priority === "medium" ? PRIORITY.MEDIUM : PRIORITY.LOW;
        
        const updatedTask = queueManager.updateTaskPriority(taskId, priorityValue);
        
        return {
          content: [{ 
            type: "text", 
            text: `Task ${taskId} priority updated to ${priority}.\nTask: ${updatedTask.taskDescription}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error updating task priority: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Remove task from queue
  server.tool(
    "remove-task",
    {
      taskId: z.number().describe("ID of the task to remove from the queue")
    },
    async ({ taskId }) => {
      try {
        // Get task details first for the confirmation message
        const task = queueManager.getTask(taskId);
        
        // Then remove it
        queueManager.removeTask(taskId);
        
        return {
          content: [{ 
            type: "text", 
            text: `Task ${taskId} removed from queue.\nTask: ${task.taskDescription}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error removing task: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  // Tool: Get queue statistics
  server.tool(
    "queue-stats",
    {},
    async () => {
      try {
        const stats = queueManager.getQueueStats();
        
        const statsOutput = 
          `# Queue Statistics\n\n` +
          `Total Tasks: ${stats.totalTasks}\n` +
          `Unassigned Tasks: ${stats.unassignedTasks}\n` +
          `Assigned Tasks: ${stats.assignedTasks}\n\n` +
          `## Priority Distribution\n` +
          `High Priority: ${stats.highPriorityTasks}\n` +
          `Medium Priority: ${stats.mediumPriorityTasks}\n` +
          `Low Priority: ${stats.lowPriorityTasks}\n\n` +
          `## Role Distribution\n`;
        
        const roleOutput = Object.entries(stats.roleDistribution)
          .map(([role, count]) => `${role}: ${count}`)
          .join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `${statsOutput}${roleOutput}` 
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting queue statistics: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
}