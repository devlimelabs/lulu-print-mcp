import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { getProcessRuntime } from "../orchestrator/process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:process-logs' });

/**
 * Register the process-logs resource with the MCP server
 * This resource provides access to logs for specific processes
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerProcessLogsResource(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.resource(
    "process-logs",
    "process-logs://:processId",
    async (uri) => {
      try {
        // Extract process ID from the URI
        const processId = uri.pathname.substring(1); // Remove leading slash
        if (!processId) {
          throw new Error("Process ID is required");
        }
        
        logger.debug(`Getting logs for process ${processId}`);
        
        // Get the process info
        const processInfo = orchestrator.getProcess(processId);
        if (!processInfo) {
          throw new Error(`Process not found: ${processId}`);
        }
        
        // Generate a basic header with process info
        const runtime = getProcessRuntime(processInfo);
        const header = `# Process Logs: ${processId}\n` +
          `\n` +
          `- **Task**: ${processInfo.task}\n` +
          `- **Role**: ${processInfo.role.name}\n` +
          `- **Status**: ${processInfo.status}\n` +
          `- **Priority**: ${processInfo.priority}\n` +
          `- **Runtime**: ${runtime} seconds\n` +
          (processInfo.workingDirectory ? `- **Working Directory**: ${processInfo.workingDirectory}\n` : '') +
          (processInfo.exitCode !== undefined ? `- **Exit Code**: ${processInfo.exitCode}\n` : '') +
          `\n\n## Log Output\n\n` +
          "```\n" +
          processInfo.output +
          "\n```\n";
        
        return {
          contents: [{
            uri: uri.href,
            text: header,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to get process logs", error);
        throw new Error(`Failed to get process logs: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered process-logs resource");
}