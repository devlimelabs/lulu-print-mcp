#!/usr/bin/env node
/**
 * Domain Radar MCP CLI
 * 
 * This is the command-line interface for the Domain Radar MCP server.
 * It handles command-line arguments and sets up the server with the
 * appropriate transport (stdio or SSE).
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { program } from "commander";
import { createRequire } from "module";
import { server, initializeServer } from "../server.js";

// Use createRequire for package.json import in ESM
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

// Parse command line arguments
program
  .name('domain-radar')
  .description('MCP server for domain name intelligence')
  .version(packageJson.version)
  .option('-s, --sse', 'Use Server-Sent Events (SSE) transport instead of stdio')
  .option('-p, --port <number>', 'Port for SSE server (default: 3000)', '3000')
  .parse(process.argv);

const options = program.opts();

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    console.error(`Starting Domain Radar MCP Server v${packageJson.version}...`);
    
    // Initialize the server with all tools and resources
    await initializeServer();
    
    // Create and connect to the appropriate transport
    let transport;
    if (options.sse) {
      console.error(`Warning: SSE transport is not yet implemented. Using stdio transport instead.`);
      transport = new StdioServerTransport();
      // Future implementation:
      // transport = new SseServerTransport({ port: parseInt(options.port, 10) });
    } else {
      transport = new StdioServerTransport();
    }
    
    await server.connect(transport);
    
    console.error(`Domain Radar MCP Server is running on ${options.sse ? `SSE (port ${options.port})` : 'stdio'} transport`);
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.error("Shutting down Domain Radar MCP Server...");
      try {
        if (transport && typeof transport.close === 'function') {
          await transport.close();
        }
        console.error("Server disconnected successfully");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };
    
    // Register signal handlers for graceful shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error("Failed to start Domain Radar MCP Server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});