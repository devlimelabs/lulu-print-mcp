import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:search-codebase' });

/**
 * Register the search-codebase tool with the MCP server
 * This tool searches through the codebase using Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerSearchCodebaseTool(server: McpServer) {
  server.tool(
    "search-codebase",
    {
      query: z.string().describe("Search query or pattern"),
      directory: z.string().optional().describe("Directory to search (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ query, directory, print }) => {
      try {
        // Change to the directory if provided
        let originalDir;
        if (directory) {
          originalDir = process.cwd();
          process.chdir(directory);
          logger.debug(`Changed directory to: ${directory}`);
        }
        
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        // Sanitize the query to prevent command injection
        const escapedQuery = sanitizeString(query);
        
        logger.debug(`Searching codebase for: ${escapedQuery}`);
        const result = await executeClaudeCode(`"search the codebase for ${escapedQuery}"`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error(`Error searching codebase: ${query}`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error searching codebase: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered search-codebase tool");
}