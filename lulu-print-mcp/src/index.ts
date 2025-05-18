#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeServer, server } from './server.js';

async function main() {
  try {
    console.error("Starting Lulu Print MCP Server...");
    
    await initializeServer();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Lulu Print MCP Server is running");
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.error("Shutting down Lulu Print MCP Server...");
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error("Failed to start Lulu Print MCP Server:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});