#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { registerProductTools } from "./tools/product-tools.js";
import { registerCartTools } from "./tools/cart-tools.js";
import { validateCredentials } from "./lib/amazon-client.js";

// Load environment variables
config();

// Validate required environment variables
validateCredentials();

// Create MCP server
const server = new McpServer({
  name: "amazon-shopping",
  version: "1.0.0",
});

// Register all tools
registerProductTools(server);
registerCartTools(server);

// Connect to stdio transport
async function main() {
  console.error("Starting Amazon Shopping MCP Server...");
  const transport = new StdioServerTransport();
  
  try {
    await server.connect(transport);
    console.error("Amazon Shopping MCP Server running");
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
