#!/usr/bin/env node
import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("meilisearch MCP server started");
}

main().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});