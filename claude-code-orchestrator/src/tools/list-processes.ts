import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { ProcessStatus, getProcessRuntime } from "../orchestrator/process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:list-processes' });

/**
 * Register the list-processes tool with the MCP server
 * This tool lists processes with optional status filtering
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerListProcessesTool(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.tool(
    "list-processes",
    {
      status: z.enum(["all", "running", "waiting", "completed", "failed", "canceled", "pending"])
        .default("all")
        .describe("Filter processes by status")
    },
    async ({ status }) => {
      try {
        // Get processes based on status
        let processes;
        if (status === "all") {
          processes = Array.from(orchestrator.getAllProcesses().values());
        } else {
          const statusEnum = status as ProcessStatus;
          processes = orchestrator.getProcessesByStatus(statusEnum);
        }
        
        // Create a formatted list
        const formattedProcesses = processes.map(p => ({
          id: p.id,
          task: p.task,
          status: p.status,
          role: p.role.name,
          priority: p.priority,
          runtime: `${getProcessRuntime(p)} seconds`,
          workingDirectory: p.workingDirectory || "default"
        }));
        
        // Sort by status and priority
        formattedProcesses.sort((a, b) => {
          // First by status (running and waiting first)
          const statusOrder = {
            [ProcessStatus.RUNNING]: 0,
            [ProcessStatus.WAITING]: 1,
            [ProcessStatus.PENDING]: 2,
            [ProcessStatus.COMPLETED]: 3,
            [ProcessStatus.FAILED]: 4,
            [ProcessStatus.CANCELED]: 5
          };
          
          const statusDiff = statusOrder[a.status as ProcessStatus] - statusOrder[b.status as ProcessStatus];
          if (statusDiff !== 0) return statusDiff;
          
          // Then by priority (higher first)
          return b.priority - a.priority;
        });
        
        // Generate output
        let output = `# Process List (${status.toUpperCase()})\n\n`;
        
        if (formattedProcesses.length === 0) {
          output += "No processes found with the specified status.\n";
        } else {
          // Group by status
          const byStatus: Record<string, typeof formattedProcesses> = {};
          
          for (const p of formattedProcesses) {
            if (!byStatus[p.status]) {
              byStatus[p.status] = [];
            }
            byStatus[p.status].push(p);
          }
          
          // Generate output for each status group
          for (const [status, processes] of Object.entries(byStatus)) {
            output += `## ${status.toUpperCase()} (${processes.length})\n\n`;
            
            for (const p of processes) {
              output += `### ${p.id}\n\n`;
              output += `- **Task**: ${p.task}\n`;
              output += `- **Role**: ${p.role}\n`;
              output += `- **Priority**: ${p.priority}\n`;
              output += `- **Runtime**: ${p.runtime}\n`;
              output += `- **Directory**: ${p.workingDirectory}\n\n`;
            }
          }
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
        logger.error("Error listing processes", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error listing processes: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  logger.debug("Registered list-processes tool");
}