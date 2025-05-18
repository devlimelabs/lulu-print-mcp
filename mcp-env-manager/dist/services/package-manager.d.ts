import { ConfigReference, InstalledPackage } from '../config.js';
import { ConfigService } from './config-service.js';
/**
 * Result of a package installation
 */
export interface InstallResult {
    success: boolean;
    packageName: string;
    version: string;
    localPath: string;
    binPath?: string;
    error?: string;
}
/**
 * Service for managing MCP package installations
 */
export declare class PackageManager {
    private configService;
    private registryPath;
    private packagesDir;
    private registry;
    private preferredPackageManager;
    /**
     * Creates a new PackageManager instance
     * @param configService Configuration service
     */
    constructor(configService: ConfigService);
    /**
     * Loads the package registry from disk
     */
    loadRegistry(): Promise<void>;
    /**
     * Saves the package registry to disk
     */
    saveRegistry(): Promise<void>;
    /**
     * Gets all installed packages
     */
    getInstalledPackages(): InstalledPackage[];
    /**
     * Gets an installed package by name
     */
    getInstalledPackage(packageName: string): InstalledPackage | undefined;
    /**
     * Installs an MCP package
     * @param packageName Package name to install
     * @param version Optional specific version to install
     */
    installPackage(packageName: string, version?: string): Promise<InstallResult>;
    /**
     * Updates an installed package
     * @param packageName Package name to update
     * @param version Optional target version
     */
    updatePackage(packageName: string, version?: string): Promise<InstallResult>;
    /**
     * Uninstalls a package
     * @param packageName Package name to uninstall
     */
    uninstallPackage(packageName: string): Promise<boolean>;
    /**
     * Adds a configuration reference to a package
     * @param packageName Package name
     * @param configRef Configuration reference
     */
    addConfigReference(packageName: string, configRef: ConfigReference): Promise<void>;
    /**
     * Removes a configuration reference from a package
     * @param packageName Package name
     * @param configPath Configuration file path
     * @param serverName Server name
     */
    removeConfigReference(packageName: string, configPath: string, serverName: string): Promise<void>;
    /**
     * Gets the install command for a package
     * @param packageName Package name
     * @param version Optional specific version
     */
    private getInstallCommand;
    /**
     * Gets the installed version of a package
     * @param nodeModulesDir Node modules directory
     * @param packageName Package name
     */
    private getInstalledVersion;
    /**
     * Finds the binary path for a package
     * @param nodeModulesDir Node modules directory
     * @param packageName Package name
     */
    private findPackageBin;
}
/**
 * Initializes the package manager
 * @param configService Configuration service
 */
export declare function initializePackageManager(configService: ConfigService): Promise<PackageManager>;
