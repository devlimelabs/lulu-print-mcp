import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:compact-conversation' });

/**
 * Register the compact-conversation tool with the MCP server
 * This tool compacts the Claude Code conversation to optimize memory
 * 
 * @param server - The MCP server instance
 */
export function registerCompactConversationTool(server: McpServer) {
  server.tool(
    "compact-conversation",
    {
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ print }) => {
      try {
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        logger.debug("Compacting Claude Code conversation");
        const result = await executeClaudeCode("/compact", flags);
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error("Error compacting conversation", error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error compacting conversation: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered compact-conversation tool");
}