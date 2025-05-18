import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString, verifyFileExists } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import * as path from "path";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:read-file' });

/**
 * Register the read-file tool with the MCP server
 * This tool reads file contents using Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerReadFileTool(server: McpServer) {
  server.tool(
    "read-file",
    {
      filepath: z.string().describe("Path to the file to read"),
      directory: z.string().optional().describe("Base directory (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ filepath, directory, print }) => {
      try {
        // Change to the directory if provided
        let originalDir;
        if (directory) {
          originalDir = process.cwd();
          process.chdir(directory);
          logger.debug(`Changed directory to: ${directory}`);
        }
        
        // Resolve the filepath to ensure it's absolute or proper relative path
        const resolvedPath = path.resolve(filepath);
        
        // Verify the file exists
        const fileExists = await verifyFileExists(resolvedPath);
        if (!fileExists) {
          logger.error(`File does not exist: ${resolvedPath}`);
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
          }
          
          return {
            isError: true,
            content: [{ type: "text", text: `Error: File not found: ${resolvedPath}` }]
          };
        }
        
        // Build the flags array
        const flags = print ? ["--print"] : [];
        
        // Sanitize the path
        const sanitizedPath = sanitizeString(resolvedPath);
        
        logger.debug(`Reading file via Claude Code: ${sanitizedPath}`);
        const result = await executeClaudeCode(`"Read the file ${sanitizedPath} and show its contents"`, flags);
        
        // Change back to original directory if needed
        if (originalDir) {
          process.chdir(originalDir);
          logger.debug(`Changed back to original directory: ${originalDir}`);
        }
        
        return {
          content: [{ type: "text", text: result }]
        };
      } catch (error) {
        logger.error(`Error reading file: ${filepath}`, error);
        
        // Change back to original directory if needed
        if (directory) {
          try {
            process.chdir(directory);
          } catch (dirError) {
            // Ignore directory change errors in the error handler
          }
        }
        
        return {
          isError: true,
          content: [{ type: "text", text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered read-file tool");
}