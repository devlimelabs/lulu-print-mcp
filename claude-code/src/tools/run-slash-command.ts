import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:run-slash-command' });

/**
 * Register the run-slash-command tool with the MCP server
 * This tool allows executing Claude Code slash commands
 * 
 * @param server - The MCP server instance
 */
export function registerRunSlashCommandTool(server: McpServer) {
  server.tool(
    "run-slash-command",
    {
      command: z.string().describe("Claude Code slash command to run (with or without the leading / character)"),
      directory: z.string().optional().describe("Directory to run command in (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ command, directory, print }) => {
      try {
        // Check if command starts with / and normalize
        const normalizedCommand = command.startsWith("/") ? command.substring(1) : command;
        
        // Change to the directory if provided
        let originalDir;
        if (directory) {
          originalDir = process.cwd();
          process.chdir(directory);
          logger.debug(`Changed directory to: ${directory}`);
        }
        
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        // Execute the command
        logger.debug(`Executing slash command: /${normalizedCommand}`);
        const result = await executeClaudeCode(`/${normalizedCommand}`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error(`Error running slash command: ${command}`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error running slash command: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered run-slash-command tool");
}