/**
 * NPM Package Manager MCP Server
 *
 * This server enables AI assistants to manage NPM packages through natural language.
 * It provides tools for package initialization, dependency management, publishing,
 * and other npm operations, allowing LLMs to help with the full lifecycle of
 * JavaScript/TypeScript package development.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
declare const server: McpServer;
export { server };
