import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:init-project' });

/**
 * Register the init-project tool with the MCP server
 * This tool initializes a project with Claude Code, creating a CLAUDE.md file
 * 
 * @param server - The MCP server instance
 */
export function registerInitProjectTool(server: McpServer) {
  server.tool(
    "init-project",
    { 
      directory: z.string().optional().describe("Directory to initialize (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ directory, print }) => {
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
        
        // There are two ways to initialize a project with Claude Code:
        // 1. Using the /init command
        // 2. Using a natural language query
        // Let's try the /init command first, and if it fails, fall back to the natural language approach
        
        logger.debug("Attempting to initialize project with /init command");
        try {
          const result = await executeClaudeCode("/init", flags);
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
            logger.debug(`Changed back to original directory: ${originalDir}`);
          }
          
          return {
            content: [{ type: "text", text: result }]
          };
        } catch (error) {
          // If the /init command fails, try the natural language approach
          logger.debug("Failed to use /init command, trying natural language approach", error);
          
          const result = await executeClaudeCode(
            `"initialize this project and create a CLAUDE.md file"`, 
            flags
          );
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
            logger.debug(`Changed back to original directory: ${originalDir}`);
          }
          
          return {
            content: [{ type: "text", text: result }]
          };
        }
      } catch (error) {
        logger.error("Error initializing project", error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error initializing project: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered init-project tool");
}