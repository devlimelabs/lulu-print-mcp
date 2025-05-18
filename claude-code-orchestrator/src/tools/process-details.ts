import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { getProcessRuntime } from "../orchestrator/process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:process-details' });

/**
 * Register the process-details tool with the MCP server
 * This tool provides detailed information about a specific process
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerProcessDetailsTool(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.tool(
    "process-details",
    {
      id: z.string().describe("Process ID to get details for"),
      includeOutput: z.boolean().default(false).describe("Whether to include process output")
    },
    async ({ id, includeOutput }) => {
      try {
        // Get the process
        const process = orchestrator.getProcess(id);
        if (!process) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Process with ID ${id} not found.`
              }
            ]
          };
        }
        
        // Calculate runtime
        const runtime = getProcessRuntime(process);
        
        // Format process details
        const details = {
          id: process.id,
          task: process.task,
          status: process.status,
          role: process.role.name,
          priority: process.priority,
          startTime: new Date(process.startTime).toISOString(),
          lastActivity: new Date(process.lastActivity).toISOString(),
          runtime: `${runtime} seconds`,
          workingDirectory: process.workingDirectory || "default",
          exitCode: process.exitCode,
          dependencies: process.dependencies || []
        };
        
        // Generate output
        let output = `# Process Details: ${id}\n\n`;
        
        output += `- **Task**: ${details.task}\n`;
        output += `- **Status**: ${details.status}\n`;
        output += `- **Role**: ${details.role}\n`;
        output += `- **Priority**: ${details.priority}\n`;
        output += `- **Runtime**: ${details.runtime}\n`;
        output += `- **Start Time**: ${details.startTime}\n`;
        output += `- **Last Activity**: ${details.lastActivity}\n`;
        output += `- **Working Directory**: ${details.workingDirectory}\n`;
        
        if (details.exitCode !== undefined) {
          output += `- **Exit Code**: ${details.exitCode}\n`;
        }
        
        if (details.dependencies.length > 0) {
          output += `- **Dependencies**: ${details.dependencies.join(', ')}\n`;
        }
        
        // Include process output if requested
        if (includeOutput) {
          output += `\n## Process Output\n\n\`\`\`\n${process.output}\n\`\`\`\n`;
        } else {
          output += `\n*Use \`resource://process-logs/${id}\` to view the full process output.*\n`;
        }
        
        return {
          content: [
            {
              type: "text",
              text: output
            }
          ]
        };
      } catch (error) {
        logger.error(`Error getting details for process ${id}`, error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error getting process details: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  logger.debug("Registered process-details tool");
}