import { exec as execCallback } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import { ConfigReference, InstalledPackage, PackageRegistry, REGISTRY_FILE } from '../config.js';
import { ensureDir, fileExists, readJsonFileOrDefault, writeJsonFile } from '../utils/fs-utils.js';
import { ConfigService } from './config-service.js';

// Promisified exec
const exec = promisify(execCallback);

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
export class PackageManager {
  private registryPath: string;
  private packagesDir: string;
  private registry: PackageRegistry;
  private preferredPackageManager: 'npm' | 'yarn' | 'pnpm';

  /**
   * Creates a new PackageManager instance
   * @param configService Configuration service
   */
  constructor(private configService: ConfigService) {
    const config = configService.getInstallationConfig();
    this.packagesDir = config.packageManager.installationDir;
    this.registryPath = REGISTRY_FILE;
    this.preferredPackageManager = config.packageManager.preferredPackageManager;
    this.registry = { packages: {} };
  }

  /**
   * Loads the package registry from disk
   */
  async loadRegistry(): Promise<void> {
    this.registry = await readJsonFileOrDefault<PackageRegistry>(
      this.registryPath,
      { packages: {} }
    );
    
    // Ensure packages directory exists
    await ensureDir(this.packagesDir);
  }

  /**
   * Saves the package registry to disk
   */
  async saveRegistry(): Promise<void> {
    await writeJsonFile(this.registryPath, this.registry);
  }

  /**
   * Gets all installed packages
   */
  getInstalledPackages(): InstalledPackage[] {
    return Object.values(this.registry.packages);
  }

  /**
   * Gets an installed package by name
   */
  getInstalledPackage(packageName: string): InstalledPackage | undefined {
    return this.registry.packages[packageName];
  }

  /**
   * Installs an MCP package
   * @param packageName Package name to install
   * @param version Optional specific version to install
   */
  async installPackage(packageName: string, version?: string): Promise<InstallResult> {
    try {
      // Create package-specific directory
      const packageDir = path.join(this.packagesDir, packageName.replace('/', '-'));
      await ensureDir(packageDir);
      
      // Create package.json if it doesn't exist
      const packageJsonPath = path.join(packageDir, 'package.json');
      if (!(await fileExists(packageJsonPath))) {
        await writeJsonFile(packageJsonPath, {
          name: 'mcp-package-wrapper',
          version: '1.0.0',
          private: true,
          type: 'module'
        });
      }
      
      // Install the package
      const installCmd = this.getInstallCommand(packageName, version);
      await exec(installCmd, { cwd: packageDir });
      
      // Get installed version
      const nodeModulesDir = path.join(packageDir, 'node_modules');
      const installedVersion = await this.getInstalledVersion(nodeModulesDir, packageName);
      
      // Find bin path if it exists
      const binPath = await this.findPackageBin(nodeModulesDir, packageName);
      
      // Add to registry
      const now = new Date().toISOString();
      const localPath = path.join(nodeModulesDir, packageName);
      
      const installedPackage: InstalledPackage = {
        name: packageName,
        version: installedVersion,
        localPath,
        binPath,
        installedAt: now,
        updatedAt: now,
        dependencies: [], // TODO: Extract dependencies
        usedByConfigs: []
      };
      
      this.registry.packages[packageName] = installedPackage;
      await this.saveRegistry();
      
      return {
        success: true,
        packageName,
        version: installedVersion,
        localPath,
        binPath
      };
    } catch (error) {
      return {
        success: false,
        packageName,
        version: version || 'latest',
        localPath: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Updates an installed package
   * @param packageName Package name to update
   * @param version Optional target version
   */
  async updatePackage(packageName: string, version?: string): Promise<InstallResult> {
    const existing = this.getInstalledPackage(packageName);
    if (!existing) {
      return this.installPackage(packageName, version);
    }
    
    try {
      const packageDir = path.dirname(path.dirname(existing.localPath));
      
      // Update the package
      const updateCmd = this.getInstallCommand(packageName, version);
      await exec(updateCmd, { cwd: packageDir });
      
      // Get installed version
      const nodeModulesDir = path.join(packageDir, 'node_modules');
      const installedVersion = await this.getInstalledVersion(nodeModulesDir, packageName);
      
      // Find bin path if it exists
      const binPath = await this.findPackageBin(nodeModulesDir, packageName);
      
      // Update registry
      const now = new Date().toISOString();
      const localPath = path.join(nodeModulesDir, packageName);
      
      this.registry.packages[packageName] = {
        ...existing,
        version: installedVersion,
        localPath,
        binPath,
        updatedAt: now
      };
      
      await this.saveRegistry();
      
      return {
        success: true,
        packageName,
        version: installedVersion,
        localPath,
        binPath
      };
    } catch (error) {
      return {
        success: false,
        packageName,
        version: version || 'latest',
        localPath: existing.localPath,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Uninstalls a package
   * @param packageName Package name to uninstall
   */
  async uninstallPackage(packageName: string): Promise<boolean> {
    const existing = this.getInstalledPackage(packageName);
    if (!existing) {
      return false;
    }
    
    try {
      const packageDir = path.dirname(path.dirname(existing.localPath));
      
      // Uninstall the package
      const uninstallCmd = `${this.preferredPackageManager} remove ${packageName}`;
      await exec(uninstallCmd, { cwd: packageDir });
      
      // Remove from registry
      delete this.registry.packages[packageName];
      await this.saveRegistry();
      
      return true;
    } catch (error) {
      console.error(`Failed to uninstall package ${packageName}:`, error);
      return false;
    }
  }

  /**
   * Adds a configuration reference to a package
   * @param packageName Package name
   * @param configRef Configuration reference
   */
  async addConfigReference(packageName: string, configRef: ConfigReference): Promise<void> {
    const existing = this.getInstalledPackage(packageName);
    if (!existing) {
      throw new Error(`Package not installed: ${packageName}`);
    }
    
    // Check if reference already exists
    const existingRef = existing.usedByConfigs.find(
      ref => ref.path === configRef.path && ref.serverName === configRef.serverName
    );
    
    if (!existingRef) {
      existing.usedByConfigs.push(configRef);
      await this.saveRegistry();
    }
  }

  /**
   * Removes a configuration reference from a package
   * @param packageName Package name
   * @param configPath Configuration file path
   * @param serverName Server name
   */
  async removeConfigReference(packageName: string, configPath: string, serverName: string): Promise<void> {
    const existing = this.getInstalledPackage(packageName);
    if (!existing) {
      return;
    }
    
    existing.usedByConfigs = existing.usedByConfigs.filter(
      ref => ref.path !== configPath || ref.serverName !== serverName
    );
    
    await this.saveRegistry();
  }

  /**
   * Gets the install command for a package
   * @param packageName Package name
   * @param version Optional specific version
   */
  private getInstallCommand(packageName: string, version?: string): string {
    const versionSuffix = version ? `@${version}` : '';
    return `${this.preferredPackageManager} install ${packageName}${versionSuffix}`;
  }

  /**
   * Gets the installed version of a package
   * @param nodeModulesDir Node modules directory
   * @param packageName Package name
   */
  private async getInstalledVersion(nodeModulesDir: string, packageName: string): Promise<string> {
    try {
      // Find the package.json in node_modules
      const packageJsonPath = path.join(nodeModulesDir, packageName, 'package.json');
      const packageJson = await readJsonFileOrDefault<{ version: string }>(
        packageJsonPath,
        { version: 'unknown' }
      );
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Finds the binary path for a package
   * @param nodeModulesDir Node modules directory
   * @param packageName Package name
   */
  private async findPackageBin(nodeModulesDir: string, packageName: string): Promise<string | undefined> {
    try {
      // Check package.json for bin field
      const packageJsonPath = path.join(nodeModulesDir, packageName, 'package.json');
      const packageJson = await readJsonFileOrDefault<{ bin?: string | Record<string, string> }>(
        packageJsonPath,
        { bin: undefined }
      );
      
      if (!packageJson.bin) {
        return undefined;
      }
      
      // If bin is a string, use that
      if (typeof packageJson.bin === 'string') {
        return path.join(nodeModulesDir, packageName, packageJson.bin);
      }
      
      // If bin is an object, use the first entry
      const binEntries = Object.entries(packageJson.bin);
      if (binEntries.length > 0) {
        const [, binPath] = binEntries[0];
        return path.join(nodeModulesDir, packageName, binPath);
      }
      
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}

/**
 * Initializes the package manager
 * @param configService Configuration service
 */
export async function initializePackageManager(configService: ConfigService): Promise<PackageManager> {
  const packageManager = new PackageManager(configService);
  await packageManager.loadRegistry();
  return packageManager;
} 
