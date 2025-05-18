import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ConfigService } from '../services/config-service.js';
import { WatcherService } from '../services/watcher-service.js';
/**
 * Registers watcher management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 * @param watcherService Watcher service
 */
export declare function registerWatcherTools(server: McpServer, configService: ConfigService, watcherService: WatcherService): void;
