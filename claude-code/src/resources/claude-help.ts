import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:claude-help' });

/**
 * Register the claude-help resource with the MCP server
 * This resource provides access to Claude Code CLI help information
 * 
 * @param server - The MCP server instance
 */
export function registerClaudeHelpResource(server: McpServer) {
  server.resource(
    "claude-help",
    "claude-help://commands",
    async (uri) => {
      try {
        logger.debug("Getting Claude Code help information");
        const helpOutput = await executeClaudeCode("--help");
        
        return {
          contents: [{
            uri: uri.href,
            text: helpOutput,
            mimeType: "text/plain"
          }]
        };
      } catch (error) {
        logger.error("Failed to get Claude Code help", error);
        throw new Error(`Failed to get Claude Code help: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered claude-help resource");
}