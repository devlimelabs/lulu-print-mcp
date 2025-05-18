import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConfigService } from '../services/config-service.js';
import { PackageManager } from '../services/package-manager.js';
/**
 * Registers installation management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 * @param packageManager Package manager
 */
export declare function registerInstallationTools(server: McpServer, configService: ConfigService, packageManager: PackageManager): void;
