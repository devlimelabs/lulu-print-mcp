import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString, verifyFileExists } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import * as path from "path";
import { writeFile } from "fs/promises";
import { createTempDir } from "../utils/fs.js";
import * as fs from "fs/promises";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:create-file' });

/**
 * Register the create-file tool with the MCP server
 * This tool creates a new file with specified content via Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerCreateFileTool(server: McpServer) {
  server.tool(
    "create-file",
    {
      filepath: z.string().describe("Path to the new file"),
      description: z.string().describe("Description of what the file should contain"),
      directory: z.string().optional().describe("Base directory (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ filepath, description, directory, print }) => {
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
        
        // Check if file already exists - we don't want to overwrite existing files
        const fileExists = await verifyFileExists(resolvedPath);
        if (fileExists) {
          logger.error(`File already exists: ${resolvedPath}`);
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
          }
          
          return {
            isError: true,
            content: [{ type: "text", text: `Error: File already exists: ${resolvedPath}` }]
          };
        }
        
        // We have two approaches to create a file:
        // 1. Using natural language description directly
        // 2. Using a temporary file approach for longer descriptions
        
        // For shorter descriptions, use direct approach
        if (description.length < 200) {
          // Build the flags array
          const flags = print ? ["--print"] : [];
          
          // Sanitize inputs
          const escapedPath = sanitizeString(resolvedPath);
          const escapedDescription = sanitizeString(description);
          
          logger.debug(`Creating file via direct description: ${escapedPath}`);
          const result = await executeClaudeCode(
            `"create a new file at ${escapedPath} with the following content: ${escapedDescription}"`, 
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
        // For longer descriptions, use the temporary file approach
        else {
          try {
            // Create a temporary directory
            const tempDir = await createTempDir('claude-code-mcp-');
            const tempFile = path.join(tempDir, `file-description-${Date.now()}.txt`);
            
            // Write description to temporary file
            await writeFile(tempFile, description);
            
            // Build the flags array
            const flags = print ? ["--print"] : [];
            
            // Sanitize inputs
            const escapedPath = sanitizeString(resolvedPath);
            const escapedTempFile = sanitizeString(tempFile);
            
            logger.debug(`Creating file via temp file description: ${escapedPath}`);
            const result = await executeClaudeCode(
              `"create a new file at ${escapedPath} following the instructions in ${escapedTempFile}"`, 
              flags
            );
            
            // Clean up the temporary file
            try {
              await fs.unlink(tempFile);
              await fs.rmdir(tempDir);
            } catch (cleanupError) {
              logger.warn(`Error cleaning up temporary files: ${cleanupError}`);
            }
            
            // Change back to original directory if needed
            if (originalDir) {
              process.chdir(originalDir);
              logger.debug(`Changed back to original directory: ${originalDir}`);
            }
            
            return {
              content: [{ type: "text", text: result }]
            };
          } catch (tempFileError) {
            logger.error("Error with temporary file approach, falling back to direct description", tempFileError);
            
            // Fall back to direct description approach
            const flags = print ? ["--print"] : [];
            const escapedPath = sanitizeString(resolvedPath);
            const escapedDescription = sanitizeString(description);
            
            const result = await executeClaudeCode(
              `"create a new file at ${escapedPath} with the following content: ${escapedDescription}"`, 
              flags
            );
            
            // Change back to original directory if needed
            if (originalDir) {
              process.chdir(originalDir);
            }
            
            return {
              content: [{ type: "text", text: result }]
            };
          }
        }
      } catch (error) {
        logger.error(`Error creating file: ${filepath}`, error);
        
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
          content: [{ type: "text", text: `Error creating file: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered create-file tool");
}