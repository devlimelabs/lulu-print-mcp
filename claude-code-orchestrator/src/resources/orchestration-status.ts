import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { ProcessStatus } from "../orchestrator/process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:orchestration-status' });

/**
 * Register the orchestration-status resource with the MCP server
 * This resource provides overall status of the orchestration system
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerOrchestrationStatusResource(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.resource(
    "orchestration-status",
    "orchestration-status://overview",
    async (uri) => {
      try {
        logger.debug("Getting orchestration status");
        
        // Get all processes
        const processes = orchestrator.getAllProcesses();
        
        // Get processes by status
        const pending = orchestrator.getProcessesByStatus(ProcessStatus.PENDING);
        const running = orchestrator.getProcessesByStatus(ProcessStatus.RUNNING);
        const waiting = orchestrator.getProcessesByStatus(ProcessStatus.WAITING);
        const completed = orchestrator.getProcessesByStatus(ProcessStatus.COMPLETED);
        const failed = orchestrator.getProcessesByStatus(ProcessStatus.FAILED);
        const canceled = orchestrator.getProcessesByStatus(ProcessStatus.CANCELED);
        
        // Get queued tasks
        const queuedTasks = orchestrator.getQueuedTasks();
        
        // Generate the status report
        const statusReport = {
          totalProcesses: processes.size,
          statusBreakdown: {
            pending: pending.length,
            running: running.length,
            waiting: waiting.length,
            completed: completed.length,
            failed: failed.length,
            canceled: canceled.length
          },
          queuedTasks: queuedTasks.length
        };
        
        // Build a textual representation of the status
        const text = `# Orchestration Status Overview\n\n` +
          `## Process Summary\n` +
          `- Total processes: ${statusReport.totalProcesses}\n` +
          `- Running processes: ${statusReport.statusBreakdown.running}\n` +
          `- Waiting for input: ${statusReport.statusBreakdown.waiting}\n` +
          `- Completed processes: ${statusReport.statusBreakdown.completed}\n` +
          `- Failed processes: ${statusReport.statusBreakdown.failed}\n` +
          `- Canceled processes: ${statusReport.statusBreakdown.canceled}\n` +
          `- Pending processes: ${statusReport.statusBreakdown.pending}\n\n` +
          `## Task Queue\n` +
          `- Tasks in queue: ${statusReport.queuedTasks}\n\n` +
          
          `## Process Details\n` +
          `### Running Processes\n` +
          (running.length > 0 ? 
            running.map(p => `- ${p.id}: ${p.task} (Role: ${p.role.name})`).join('\n') : 
            '- None\n') +
          `\n\n### Waiting Processes\n` +
          (waiting.length > 0 ? 
            waiting.map(p => `- ${p.id}: ${p.task} (Role: ${p.role.name})`).join('\n') : 
            '- None\n');
            
        return {
          contents: [{
            uri: uri.href,
            text: text,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to get orchestration status", error);
        throw new Error(`Failed to get orchestration status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered orchestration-status resource");
}