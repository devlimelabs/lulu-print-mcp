import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { OrchestratorMonitor } from "../orchestrator/monitor.js";
import { ProcessStatus } from "../orchestrator/process.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator:respond-to-process' });

/**
 * Register the respond-to-process tool with the MCP server
 * This tool allows sending input to a waiting process
 * 
 * @param server - The MCP server instance
 * @param orchestrator - The orchestrator monitor instance
 */
export function registerRespondToProcessTool(
  server: McpServer,
  orchestrator: OrchestratorMonitor
) {
  server.tool(
    "respond-to-process",
    {
      id: z.string().describe("Process ID to respond to"),
      input: z.string().describe("Input to send to the process")
    },
    async ({ id, input }) => {
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
        
        // Check if process is waiting
        if (process.status !== ProcessStatus.WAITING) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Process ${id} is not waiting for input (current status: ${process.status}).`
              }
            ]
          };
        }
        
        // Send input to the process
        const success = orchestrator.sendInputToProcess(id, input);
        
        if (!success) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: `Failed to send input to process ${id}.`
              }
            ]
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Input sent to process ${id}. Process has resumed execution.`
            }
          ]
        };
      } catch (error) {
        logger.error(`Error sending input to process ${id}`, error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error sending input to process: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    }
  );
  
  logger.debug("Registered respond-to-process tool");
}