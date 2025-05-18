import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:submit-task' });

/**
 * Register the submit-task tool with the MCP server
 * This tool allows submission of new development tasks to the orchestrator
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerSubmitTaskTool(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.tool(
    "submit-task",
    {
      task: z.string().describe("The development task to be performed"),
      priority: z.number().min(1).max(10).default(5).describe("Priority level (1-10, with 10 being highest)"),
      role: z.string().default("generalist").describe("Agent role ID (architect, implementer, tester, reviewer, devops, documenter, generalist)"),
      workingDirectory: z.string().optional().describe("Directory to execute the task in (defaults to current directory)"),
      dependencies: z.array(z.string()).optional().describe("IDs of processes that this task depends on")
    },
    async ({ task, priority, role, workingDirectory, dependencies }) => {
      try {
        // Submit the task to the orchestrator
        const taskId = orchestrator.submitTask(
          task,
          priority,
          role,
          workingDirectory,
          dependencies
        );
        
        return {
          content: [
            {
              type: "text",
              text: `Task submitted with ID: ${taskId}\n\nPriority: ${priority}\nRole: ${role}`
            }
          ]
        };
      } catch (error) {
        logger.error("Error submitting task", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error submitting task: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  logger.debug("Registered submit-task tool");
}