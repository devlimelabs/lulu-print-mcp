import { FSWatcher, watch } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';

import { ConfigReference, McpConfig } from '../config.js';
import { fileExists, readJsonFileOrDefault } from '../utils/fs-utils.js';
import { debounce } from '../utils/func-utils.js';
import { ConfigService } from './config-service.js';
import { PackageManager } from './package-manager.js';

/**
 * Interface for MCP server detection
 */
export interface DetectedMcpServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  configPath: string;
  platform: 'claude' | 'cursor';
}

/**
 * Result of updating a configuration
 */
export interface ConfigUpdateResult {
  success: boolean;
  configPath: string;
  serverName: string;
  packageName?: string;
  error?: string;
}

/**
 * Service for watching MCP configuration files
 */
export class WatcherService {
  private watchers: Map<string, FSWatcher> = new Map();
  private configCache: Map<string, McpConfig> = new Map();
  
  /**
   * Creates a new WatcherService instance
   * @param configService Configuration service
   * @param packageManager Package manager
   */
  constructor(
    private configService: ConfigService,
    private packageManager: PackageManager
  ) {}
  
  /**
   * Initializes the file watchers based on configuration
   */
  async initializeWatchers(): Promise<void> {
    const config = this.configService.getInstallationConfig();
    
    // Close any existing watchers
    await this.closeAllWatchers();
    
    // Watch Claude config if enabled
    if (config.watchers.claude.enabled) {
      await this.watchConfig(config.watchers.claude.configPath, 'claude');
    }
    
    // Watch Cursor config if enabled
    if (config.watchers.cursor.enabled) {
      await this.watchConfig(config.watchers.cursor.configPath, 'cursor');
    }
  }
  
  /**
   * Sets up a watcher for a configuration file
   * @param configPath Path to the configuration file
   * @param platform Platform name ('claude' or 'cursor')
   */
  async watchConfig(configPath: string, platform: 'claude' | 'cursor'): Promise<void> {
    // Don't watch if already watching
    if (this.watchers.has(configPath)) {
      return;
    }
    
    // Check if file exists, create it if not
    if (!(await fileExists(configPath))) {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify({ mcpServers: {} }, null, 2));
    }
    
    // Load initial config
    try {
      const config = await readJsonFileOrDefault<McpConfig>(configPath, { mcpServers: {} });
      this.configCache.set(configPath, config);
    } catch (error) {
      console.error(`Failed to load initial config ${configPath}:`, error);
    }
    
    // Create debounced change handler
    const debouncedChangeHandler = debounce(
      () => this.onConfigChanged(configPath, platform),
      500
    );
    
    // Set up watcher
    const watcher = watch(configPath, {
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    watcher.on('change', debouncedChangeHandler);
    this.watchers.set(configPath, watcher);
    
    console.log(`Watching ${platform} config file: ${configPath}`);
  }
  
  /**
   * Handles changes to a configuration file
   * @param configPath Path to the configuration file
   * @param platform Platform name ('claude' or 'cursor')
   */
  private async onConfigChanged(configPath: string, platform: 'claude' | 'cursor'): Promise<void> {
    try {
      // Load the new config
      const newConfig = await readJsonFileOrDefault<McpConfig>(configPath, { mcpServers: {} });
      
      // Get the old config
      const oldConfig = this.configCache.get(configPath) || { mcpServers: {} };
      
      // Update the cache
      this.configCache.set(configPath, newConfig);
      
      // Detect new MCP servers
      const newServers = this.detectNewMcpServers(oldConfig, newConfig, configPath, platform);
      
      // Check if auto-localize is enabled
      const config = this.configService.getInstallationConfig();
      if (config.packageManager.autoLocalize && newServers.length > 0) {
        for (const server of newServers) {
          // Check if this is a package we can install
          if (this.isNpmPackage(server.command)) {
            const packageName = this.extractPackageName(server.command);
            
            // Attempt to install the package
            await this.packageManager.installPackage(packageName);
            
            // Create a config reference
            const configRef: ConfigReference = {
              path: configPath,
              platform,
              serverName: server.name
            };
            
            await this.packageManager.addConfigReference(packageName, configRef);
            
            // Notify if configured
            if (config.notifications.onNewServerDetected) {
              console.log(`Automatically installed MCP server: ${packageName}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error handling config change for ${configPath}:`, error);
    }
  }
  
  /**
   * Detects new MCP servers in a config change
   * @param oldConfig Old configuration
   * @param newConfig New configuration
   * @param configPath Configuration file path
   * @param platform Platform name ('claude' or 'cursor')
   */
  private detectNewMcpServers(
    oldConfig: McpConfig,
    newConfig: McpConfig,
    configPath: string,
    platform: 'claude' | 'cursor'
  ): DetectedMcpServer[] {
    const newServers: DetectedMcpServer[] = [];
    
    // Get the old servers
    const oldServers = oldConfig.mcpServers || {};
    
    // Get the new servers
    const newServerEntries = newConfig.mcpServers || {};
    
    // Check for new servers
    for (const [name, entry] of Object.entries(newServerEntries)) {
      // If server didn't exist before or command changed
      if (!oldServers[name] || oldServers[name].command !== entry.command) {
        newServers.push({
          name,
          command: entry.command,
          args: entry.args,
          env: entry.env,
          configPath,
          platform
        });
      }
    }
    
    return newServers;
  }
  
  /**
   * Updates an MCP server configuration to use a locally installed package
   * @param configPath Configuration file path
   * @param serverName Server name
   * @param packageName Package name
   */
  async updateServerConfig(
    configPath: string,
    serverName: string,
    packageName: string
  ): Promise<ConfigUpdateResult> {
    try {
      // Check if package is installed
      const installedPackage = this.packageManager.getInstalledPackage(packageName);
      if (!installedPackage) {
        return {
          success: false,
          configPath,
          serverName,
          packageName,
          error: `Package not installed: ${packageName}`
        };
      }
      
      // Read the config file
      const config = await readJsonFileOrDefault<McpConfig>(configPath, { mcpServers: {} });
      
      // Check if server exists
      if (!config.mcpServers || !config.mcpServers[serverName]) {
        return {
          success: false,
          configPath,
          serverName,
          packageName,
          error: `Server not found in config: ${serverName}`
        };
      }
      
      // Update the command to use the local package
      const server = config.mcpServers[serverName];
      
      // If bin path exists, use that
      if (installedPackage.binPath) {
        server.command = 'node';
        server.args = [installedPackage.binPath];
      } else {
        // Otherwise, use node with the package's main file
        server.command = 'node';
        server.args = [path.join(installedPackage.localPath, 'dist/index.js')];
      }
      
      // Write the updated config
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      // Update the cache
      this.configCache.set(configPath, config);
      
      // Add config reference
      await this.packageManager.addConfigReference(packageName, {
        path: configPath,
        platform: this.getPlatformForConfig(configPath),
        serverName
      });
      
      return {
        success: true,
        configPath,
        serverName,
        packageName
      };
    } catch (error) {
      return {
        success: false,
        configPath,
        serverName,
        packageName,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Stops all watchers
   */
  async closeAllWatchers(): Promise<void> {
    for (const [configPath, watcher] of this.watchers.entries()) {
      await watcher.close();
      this.watchers.delete(configPath);
    }
  }
  
  /**
   * Checks if a command is likely an npm package
   * @param command Command to check
   */
  private isNpmPackage(command: string): boolean {
    // Check if command looks like an npm package
    return command.includes('/') || !command.includes(' ') && !command.includes('/');
  }
  
  /**
   * Extracts the package name from a command
   * @param command Command to extract from
   */
  private extractPackageName(command: string): string {
    // Remove version specifier if present
    if (command.includes('@') && !command.startsWith('@')) {
      return command.split('@')[0];
    }
    
    return command;
  }
  
  /**
   * Gets the platform for a config path
   * @param configPath Configuration file path
   */
  private getPlatformForConfig(configPath: string): 'claude' | 'cursor' {
    const config = this.configService.getInstallationConfig();
    
    if (configPath === config.watchers.claude.configPath) {
      return 'claude';
    }
    
    if (configPath === config.watchers.cursor.configPath) {
      return 'cursor';
    }
    
    // Default to claude
    return 'claude';
  }
}

/**
 * Initializes the watcher service
 * @param configService Configuration service
 * @param packageManager Package manager
 */
export async function initializeWatcherService(
  configService: ConfigService,
  packageManager: PackageManager
): Promise<WatcherService> {
  return new WatcherService(configService, packageManager);
} 
