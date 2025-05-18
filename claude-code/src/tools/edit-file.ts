import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeClaudeCode, sanitizeString, verifyFileExists, verifyFileWritable } from "../utils/claude-code.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import * as path from "path";
import { writeFile } from "fs/promises";
import { createTempDir } from "@devlimelabs/master-mcps-core/dist/utils/fs.js";
import * as os from "os";
import * as fs from "fs/promises";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp:edit-file' });

/**
 * Register the edit-file tool with the MCP server
 * This tool allows editing files through Claude Code
 * 
 * @param server - The MCP server instance
 */
export function registerEditFileTool(server: McpServer) {
  server.tool(
    "edit-file",
    {
      filepath: z.string().describe("Path to the file to edit"),
      instructions: z.string().describe("Instructions for how to edit the file"),
      directory: z.string().optional().describe("Base directory (defaults to current directory)"),
      print: z.boolean().optional().default(true).describe("Whether to use the --print flag")
    },
    async ({ filepath, instructions, directory, print }) => {
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
        
        // Verify the file exists and is writable
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
        
        const isWritable = await verifyFileWritable(resolvedPath);
        if (!isWritable) {
          logger.error(`File is not writable: ${resolvedPath}`);
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
          }
          
          return {
            isError: true,
            content: [{ type: "text", text: `Error: File is not writable: ${resolvedPath}` }]
          };
        }
        
        // We have two approaches to edit a file:
        // 1. Using natural language instructions directly
        // 2. Using a temporary file approach (more reliable for complex edits)
        
        // Let's implement both approaches and use them based on complexity
        
        // For simpler edits, use direct natural language approach
        if (instructions.length < 200) {
          // Build the flags array
          const flags = print ? ["--print"] : [];
          
          // Sanitize inputs
          const escapedPath = sanitizeString(resolvedPath);
          const escapedInstructions = sanitizeString(instructions);
          
          logger.debug(`Editing file via direct instructions: ${escapedPath}`);
          const result = await executeClaudeCode(`"edit file ${escapedPath}: ${escapedInstructions}"`, flags);
          
          // Change back to original directory if needed
          if (originalDir) {
            process.chdir(originalDir);
            logger.debug(`Changed back to original directory: ${originalDir}`);
          }
          
          return {
            content: [{ type: "text", text: result }]
          };
        } 
        // For more complex edits, use temporary file approach
        else {
          try {
            // Create a temporary directory
            const tempDir = await createTempDir('claude-code-mcp-');
            const tempFile = path.join(tempDir, `edit-instructions-${Date.now()}.txt`);
            
            // Write instructions to temporary file
            await writeFile(tempFile, instructions);
            
            // Build the flags array
            const flags = print ? ["--print"] : [];
            
            // Sanitize inputs
            const escapedPath = sanitizeString(resolvedPath);
            const escapedTempFile = sanitizeString(tempFile);
            
            logger.debug(`Editing file via temp file: ${escapedPath} with instructions in ${escapedTempFile}`);
            const result = await executeClaudeCode(
              `"edit the file at ${escapedPath} according to the instructions in ${escapedTempFile}"`, 
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
            logger.error("Error with temporary file approach, falling back to direct instructions", tempFileError);
            
            // If temp file approach fails, fall back to direct instructions
            const flags = print ? ["--print"] : [];
            const escapedPath = sanitizeString(resolvedPath);
            const escapedInstructions = sanitizeString(instructions);
            
            const result = await executeClaudeCode(`"edit file ${escapedPath}: ${escapedInstructions}"`, flags);
            
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
        logger.error(`Error editing file: ${filepath}`, error);
        
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
          content: [{ type: "text", text: `Error editing file: ${error instanceof Error ? error.message : String(error)}` }]
        };
      }
    }
  );
  
  logger.debug("Registered edit-file tool");
}