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
export declare class WatcherService {
    private configService;
    private packageManager;
    private watchers;
    private configCache;
    /**
     * Creates a new WatcherService instance
     * @param configService Configuration service
     * @param packageManager Package manager
     */
    constructor(configService: ConfigService, packageManager: PackageManager);
    /**
     * Initializes the file watchers based on configuration
     */
    initializeWatchers(): Promise<void>;
    /**
     * Sets up a watcher for a configuration file
     * @param configPath Path to the configuration file
     * @param platform Platform name ('claude' or 'cursor')
     */
    watchConfig(configPath: string, platform: 'claude' | 'cursor'): Promise<void>;
    /**
     * Handles changes to a configuration file
     * @param configPath Path to the configuration file
     * @param platform Platform name ('claude' or 'cursor')
     */
    private onConfigChanged;
    /**
     * Detects new MCP servers in a config change
     * @param oldConfig Old configuration
     * @param newConfig New configuration
     * @param configPath Configuration file path
     * @param platform Platform name ('claude' or 'cursor')
     */
    private detectNewMcpServers;
    /**
     * Updates an MCP server configuration to use a locally installed package
     * @param configPath Configuration file path
     * @param serverName Server name
     * @param packageName Package name
     */
    updateServerConfig(configPath: string, serverName: string, packageName: string): Promise<ConfigUpdateResult>;
    /**
     * Stops all watchers
     */
    closeAllWatchers(): Promise<void>;
    /**
     * Checks if a command is likely an npm package
     * @param command Command to check
     */
    private isNpmPackage;
    /**
     * Extracts the package name from a command
     * @param command Command to extract from
     */
    private extractPackageName;
    /**
     * Gets the platform for a config path
     * @param configPath Configuration file path
     */
    private getPlatformForConfig;
}
/**
 * Initializes the watcher service
 * @param configService Configuration service
 * @param packageManager Package manager
 */
export declare function initializeWatcherService(configService: ConfigService, packageManager: PackageManager): Promise<WatcherService>;
