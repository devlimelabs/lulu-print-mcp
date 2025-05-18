import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:codebase-summary' });

// Define the possible detail types
const DetailType = z.enum([
  "general", 
  "architecture", 
  "dependencies", 
  "structure"
]);

/**
 * Register the codebase-summary tool with the MCP server
 * This tool gets detailed information about the codebase
 * 
 * @param server - The MCP server instance
 */
export function registerCodebaseSummaryTool(server: McpServer) {
  server.tool(
    "codebase-summary",
    {
      directory: z.string().optional().describe("Directory of codebase (defaults to current directory)"),
      detail: DetailType.optional().default("general").describe("Type of detail to retrieve"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ directory, detail, print }) => {
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
        
        // Build query based on detail type
        let query;
        switch (detail) {
          case "general":
            query = "summarize this project";
            break;
          case "architecture":
            query = "explain the architecture of this project";
            break;
          case "dependencies":
            query = "list and explain the key dependencies of this project";
            break;
          case "structure":
            query = "explain the file and directory structure of this project";
            break;
          default:
            query = "summarize this project";
        }
        
        logger.debug(`Getting codebase summary with query: ${query}`);
        const result = await executeClaudeCode(`"${sanitizeString(query)}"`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error("Error getting codebase summary", error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error getting codebase summary: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered codebase-summary tool");
}