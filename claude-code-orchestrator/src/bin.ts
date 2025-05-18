#!/usr/bin/env node
import { server, initializeServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator' });

// Main function to start the server
async function main() {
  try {
    // Initialize the server
    await initializeServer();
    
    // Create and connect transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    logger.info("Claude Code Orchestrator MCP Server started successfully");
  } catch (error) {
    logger.error("Failed to start Claude Code Orchestrator MCP Server", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});