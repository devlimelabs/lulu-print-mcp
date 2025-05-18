import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { checkClaudeCodeInstalled } from "./utils/claude-code.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-mcp' });

// Create the MCP server
export const server = new McpServer({
  name: "ClaudeCode",
  version: "1.0.0"
});

// Initialize the server with all tools and resources
export async function initializeServer(): Promise<void> {
  logger.info("Initializing Claude Code MCP Server");
  
  // Check if Claude Code is installed
  const isClaudeCodeInstalled = await checkClaudeCodeInstalled();
  if (!isClaudeCodeInstalled) {
    logger.error("Claude Code CLI is required but not found. Please install it before using this MCP server.");
    throw new Error("Claude Code CLI not found. Make sure it's installed and in your PATH.");
  }
  
  // Register tools
  const toolsContext = await import('./tools/index.js');
  for (const registerTool of Object.values(toolsContext)) {
    if (typeof registerTool === 'function') {
      registerTool(server);
    }
  }
  
  // Register resources
  const resourcesContext = await import('./resources/index.js');
  for (const registerResource of Object.values(resourcesContext)) {
    if (typeof registerResource === 'function') {
      registerResource(server);
    }
  }
  
  logger.info("Claude Code MCP Server initialized successfully");
}