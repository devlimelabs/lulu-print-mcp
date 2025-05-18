/**
 * Domain Radar MCP Server
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare const server: McpServer;
/**
 * Initialize the server by registering all tools and resources
 */
export declare const initializeServer: () => Promise<void>;
export default server;
