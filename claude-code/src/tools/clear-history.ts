import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:clear-history' });

/**
 * Register the clear-history tool with the MCP server
 * This tool clears the Claude Code conversation history
 * 
 * @param server - The MCP server instance
 */
export function registerClearHistoryTool(server: McpServer) {
  server.tool(
    "clear-history",
    {
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ print }) => {
      try {
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        logger.debug("Clearing Claude Code conversation history");
        const result = await executeClaudeCode("/clear", flags);
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error("Error clearing history", error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error clearing history: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered clear-history tool");
}