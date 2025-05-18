import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Meilisearch Vector Search Tools
 *
 * This module implements MCP tools for vector search capabilities in Meilisearch.
 * Note: Vector search is an experimental feature in Meilisearch.
 */
/**
 * Register vector search tools with the MCP server
 *
 * @param server - The MCP server instance
 */
export declare const registerVectorTools: (server: McpServer) => void;
export default registerVectorTools;
