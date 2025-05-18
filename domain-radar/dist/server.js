/**
 * Domain Radar MCP Server
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDomainTools } from "./tools/domain-tools.js";
import { registerDomainResources } from "./resources/domain-resources.js";
import config from "./config.js";

// Create the MCP server instance
export const server = new McpServer({
  name,
  version.version
});

/**
 * Initialize the server by registering all tools and resources
 */
export const initializeServer = async () => {
  // Register all tools
  registerDomainTools(server);
  
  // Register all resources
  registerDomainResources(server);
  
  console.error(`Domain Radar MCP Server (v${config.version}) initialized successfully`);
};

// Export default for easy importing
export default server;