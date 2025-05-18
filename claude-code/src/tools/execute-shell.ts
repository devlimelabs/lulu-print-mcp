import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:execute-shell' });

/**
 * Register the execute-shell tool with the MCP server
 * This tool executes shell commands through Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerExecuteShellTool(server: McpServer) {
  server.tool(
    "execute-shell",
    {
      command: z.string().describe("Shell command to execute"),
      directory: z.string().optional().describe("Directory to execute in (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ command, directory, print }) => {
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
        
        // Sanitize the command to prevent command injection
        const sanitizedCommand = sanitizeString(command);
        
        logger.debug(`Executing shell command via Claude Code: ${sanitizedCommand}`);
        const result = await executeClaudeCode(`"execute this command: ${sanitizedCommand}"`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error(`Error executing shell command: ${command}`, error);
        return {
          isError: true,
          content: [{ type: "text", text: `Error executing shell command: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered execute-shell tool");
}