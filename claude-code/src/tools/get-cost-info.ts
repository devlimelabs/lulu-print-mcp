import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:get-cost-info' });

/**
 * Register the get-cost-info tool with the MCP server
 * This tool retrieves token usage and cost information from Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerGetCostInfoTool(server: McpServer) {
  server.tool(
    "get-cost-info",
    {
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ print }) => {
      try {
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        logger.debug("Getting cost information from Claude Code");
        const result = await executeClaudeCode("/cost", flags);
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error("Error getting cost information", error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting cost information: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered get-cost-info tool");
}