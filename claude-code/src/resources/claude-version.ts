import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:claude-version' });

/**
 * Register the claude-version resource with the MCP server
 * This resource provides access to Claude Code version information
 * 
 * @param server - The MCP server instance
 */
export function registerClaudeVersionResource(server: McpServer) {
  server.resource(
    "claude-version",
    "claude-version://info",
    async (uri) => {
      try {
        logger.debug("Getting Claude Code version information");
        const versionOutput = await executeClaudeCode("--version");
        
        return {
          contents: [{
            uri: uri.href,
            text: versionOutput,
            mimeType: "text/plain"
          }]
        };
      } catch (error) {
        logger.error("Failed to get Claude Code version", error);
        throw new Error(`Failed to get Claude Code version: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered claude-version resource");
}