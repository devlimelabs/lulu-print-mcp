import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:execute-query' });

/**
 * Register the execute-query tool with the MCP server
 * This tool allows executing natural language queries with Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerExecuteQueryTool(server: McpServer) {
  server.tool(
    "execute-query",
    {
      query: z.string().describe("Natural language query to send to Claude Code"),
      directory: z.string().optional().describe("Directory to execute query in (defaults to current directory)"),
      print: z.boolean().optional().default(false).describe("Whether to use the --print flag")
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
        
        // Sanitize the query to prevent command injection
        const sanitizedQuery = sanitizeString(query);
        
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        // Execute the query
        const result = await executeClaudeCode(`"${sanitizedQuery}"`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error(`Error executing query: ${query}`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered execute-query tool");
}