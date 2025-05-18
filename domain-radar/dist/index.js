/**
 * Domain Radar MCP - Main Entry Point
 * 
 * This file serves  primary entry point for the Domain Radar MCP server.
 * It sets up the server and connects it to the stdio transport.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server, initializeServer } from "./server.js";

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    // Initialize the server with all tools and resources
    await initializeServer();
    
    // Create and connect to the stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Domain Radar MCP Server started successfully");
    
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
        console.error("Error during shutdown, error);
        process.exit(1);
      }
    };
    
    // Register signal handlers for graceful shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error("Failed to start Domain Radar MCP Server, error);
    process.exit(1);
  }
}

// Start the server
main().catch(error => {
  console.error("Unhandled error, error);
  process.exit(1);
});