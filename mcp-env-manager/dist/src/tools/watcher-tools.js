import { z } from 'zod';
/**
 * Registers watcher management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 * @param watcherService Watcher service
 */
export function registerWatcherTools(server, configService, watcherService) {
    // Configure watchers
    server.tool("configure-watcher", {
        watchClaude: z.boolean().optional().describe("Whether to watch Claude for Desktop config"),
        watchCursor: z.boolean().optional().describe("Whether to watch Cursor config"),
        claudeConfigPath: z.string().optional().describe("Path to Claude for Desktop config file"),
        cursorConfigPath: z.string().optional().describe("Path to Cursor config file")
    }, async ({ watchClaude, watchCursor, claudeConfigPath, cursorConfigPath }) => {
        const config = configService.getInstallationConfig();
        const updates = {
            watchers: {
                ...config.watchers
            }
        };
        if (watchClaude !== undefined) {
            updates.watchers.claude = {
                ...config.watchers.claude,
                enabled: watchClaude
            };
        }
        if (watchCursor !== undefined) {
            updates.watchers.cursor = {
                ...config.watchers.cursor,
                enabled: watchCursor
            };
        }
        if (claudeConfigPath !== undefined) {
            updates.watchers.claude = {
                ...config.watchers.claude,
                configPath: claudeConfigPath
            };
        }
        if (cursorConfigPath !== undefined) {
            updates.watchers.cursor = {
                ...config.watchers.cursor,
                configPath: cursorConfigPath
            };
        }
        const updatedConfig = await configService.updateInstallationConfig(updates);
        // Reinitialize watchers with new config
        await watcherService.initializeWatchers();
        return {
            success: true,
            watchers: updatedConfig.watchers
        };
    });
    // Get watcher configuration
    server.tool("get-watcher-config", {}, async () => {
        const config = configService.getInstallationConfig();
        return {
            watchers: config.watchers
        };
    });
    // Enable automatic localization
    server.tool("enable-auto-localize", {
        enabled: z.boolean().describe("Whether to enable automatic localization of MCP servers")
    }, async ({ enabled }) => {
        const config = configService.getInstallationConfig();
        const updates = {
            packageManager: {
                ...config.packageManager,
                autoLocalize: enabled
            }
        };
        const updatedConfig = await configService.updateInstallationConfig(updates);
        return {
            success: true,
            autoLocalize: updatedConfig.packageManager.autoLocalize
        };
    });
    // Configure notification settings
    server.tool("configure-notifications", {
        onNewServerDetected: z.boolean().optional().describe("Notify when new servers are detected"),
        onUpdateAvailable: z.boolean().optional().describe("Notify when updates are available")
    }, async ({ onNewServerDetected, onUpdateAvailable }) => {
        const config = configService.getInstallationConfig();
        const updates = {
            notifications: {
                ...config.notifications
            }
        };
        if (onNewServerDetected !== undefined) {
            updates.notifications.onNewServerDetected = onNewServerDetected;
        }
        if (onUpdateAvailable !== undefined) {
            updates.notifications.onUpdateAvailable = onUpdateAvailable;
        }
        const updatedConfig = await configService.updateInstallationConfig(updates);
        return {
            success: true,
            notifications: updatedConfig.notifications
        };
    });
    // Update server configuration to use local package
    server.tool("localize-mcp-server", {
        configPath: z.string().describe("Path to configuration file"),
        serverName: z.string().describe("Name of the server in the configuration"),
        packageName: z.string().describe("Package name to use")
    }, async ({ configPath, serverName, packageName }) => {
        if (!configPath.trim()) {
            throw new Error("Config path cannot be empty");
        }
        if (!serverName.trim()) {
            throw new Error("Server name cannot be empty");
        }
        if (!packageName.trim()) {
            throw new Error("Package name cannot be empty");
        }
        const result = await watcherService.updateServerConfig(configPath, serverName, packageName);
        if (!result.success) {
            throw new Error(`Failed to update server configuration: ${result.error}`);
        }
        return {
            success: true,
            configPath,
            serverName,
            packageName
        };
    });
}
//# sourceMappingURL=watcher-tools.js.map