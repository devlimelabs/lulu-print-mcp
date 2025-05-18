import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "fs/promises";
import * as path from "path";
import { verifyFileExists } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:claude-md' });

/**
 * Register the claude-md resource with the MCP server
 * This resource provides access to the CLAUDE.md file if it exists
 * 
 * @param server - The MCP server instance
 */
export function registerClaudeMdResource(server: McpServer) {
  server.resource(
    "claude-md",
    "claude-md://project",
    async (uri) => {
      try {
        const claudeMdPath = path.resolve("CLAUDE.md");
        
        // Check if CLAUDE.md exists
        const exists = await verifyFileExists(claudeMdPath);
        if (!exists) {
          logger.debug("CLAUDE.md not found in the current directory");
          return {
            contents: [{
              uri: uri.href,
              text: "CLAUDE.md not found in the current directory."
            }]
          };
        }
        
        // Read the CLAUDE.md file
        logger.debug(`Reading CLAUDE.md from: ${claudeMdPath}`);
        const content = await readFile(claudeMdPath, "utf-8");
        
        return {
          contents: [{
            uri: uri.href,
            text: content,
            mimeType: "text/markdown"
          }]
        };
      } catch (error) {
        logger.error("Failed to read CLAUDE.md", error);
        throw new Error(`Failed to read CLAUDE.md: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  logger.debug("Registered claude-md resource");
}