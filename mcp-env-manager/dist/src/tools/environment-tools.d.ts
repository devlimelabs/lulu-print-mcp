import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConfigService } from '../services/config-service.js';
/**
 * Registers environment variable management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 */
export declare function registerEnvironmentTools(server: McpServer, configService: ConfigService): void;
