import { z } from 'zod';
/**
 * Registers installation management tools with the MCP server
 * @param server MCP server instance
 * @param configService Configuration service
 * @param packageManager Package manager
 */
export function registerInstallationTools(server, configService, packageManager) {
    // List installed MCP packages
    server.tool("list-installed-mcps", {}, async () => {
        const packages = packageManager.getInstalledPackages();
        return {
            count: packages.length,
            packages: packages.map(pkg => ({
                name: pkg.name,
                version: pkg.version,
                installedAt: pkg.installedAt,
                updatedAt: pkg.updatedAt,
                usedByConfigs: pkg.usedByConfigs
            }))
        };
    });
    // Get MCP package details
    server.tool("get-mcp-package", {
        packageName: z.string().describe("Package name to get details for")
    }, async ({ packageName }) => {
        if (!packageName.trim()) {
            throw new Error("Package name cannot be empty");
        }
        const pkg = packageManager.getInstalledPackage(packageName);
        if (!pkg) {
            throw new Error(`Package not installed: ${packageName}`);
        }
        return {
            name: pkg.name,
            version: pkg.version,
            localPath: pkg.localPath,
            binPath: pkg.binPath,
            installedAt: pkg.installedAt,
            updatedAt: pkg.updatedAt,
            usedByConfigs: pkg.usedByConfigs
        };
    });
    // Install MCP package
    server.tool("install-mcp", {
        packageName: z.string().describe("Package name to install"),
        version: z.string().optional().describe("Specific version to install")
    }, async ({ packageName, version }) => {
        if (!packageName.trim()) {
            throw new Error("Package name cannot be empty");
        }
        const result = await packageManager.installPackage(packageName, version);
        if (!result.success) {
            throw new Error(`Failed to install package: ${result.error}`);
        }
        return {
            success: true,
            packageName: result.packageName,
            version: result.version,
            localPath: result.localPath
        };
    });
    // Update MCP package
    server.tool("update-mcp", {
        packageName: z.string().describe("Package name to update"),
        version: z.string().optional().describe("Specific version to update to")
    }, async ({ packageName, version }) => {
        if (!packageName.trim()) {
            throw new Error("Package name cannot be empty");
        }
        const result = await packageManager.updatePackage(packageName, version);
        if (!result.success) {
            throw new Error(`Failed to update package: ${result.error}`);
        }
        return {
            success: true,
            packageName: result.packageName,
            version: result.version,
            localPath: result.localPath
        };
    });
    // Uninstall MCP package
    server.tool("uninstall-mcp", {
        packageName: z.string().describe("Package name to uninstall"),
        force: z.boolean().optional().describe("Force uninstallation even if referenced by configs")
    }, async ({ packageName, force = false }) => {
        if (!packageName.trim()) {
            throw new Error("Package name cannot be empty");
        }
        const pkg = packageManager.getInstalledPackage(packageName);
        if (!pkg) {
            throw new Error(`Package not installed: ${packageName}`);
        }
        // Check if package is used by any configs
        if (pkg.usedByConfigs.length > 0 && !force) {
            throw new Error(`Package is used by ${pkg.usedByConfigs.length} configurations. Use force=true to override.`);
        }
        const success = await packageManager.uninstallPackage(packageName);
        return {
            success,
            packageName
        };
    });
    // Configure installation settings
    server.tool("configure-installation", {
        installationDir: z.string().optional().describe("Directory for installing packages"),
        preferredPackageManager: z.enum(['npm', 'yarn', 'pnpm']).optional().describe("Preferred package manager"),
        autoLocalize: z.boolean().optional().describe("Automatically localize packages")
    }, async ({ installationDir, preferredPackageManager, autoLocalize }) => {
        const config = configService.getInstallationConfig();
        const updates = {
            packageManager: {
                ...config.packageManager
            }
        };
        if (installationDir !== undefined) {
            updates.packageManager.installationDir = installationDir;
        }
        if (preferredPackageManager !== undefined) {
            updates.packageManager.preferredPackageManager = preferredPackageManager;
        }
        if (autoLocalize !== undefined) {
            updates.packageManager.autoLocalize = autoLocalize;
        }
        const updatedConfig = await configService.updateInstallationConfig(updates);
        return {
            success: true,
            packageManager: updatedConfig.packageManager
        };
    });
    // Get installation settings
    server.tool("get-installation-settings", {}, async () => {
        const config = configService.getInstallationConfig();
        return {
            packageManager: config.packageManager
        };
    });
}
//# sourceMappingURL=installation-tools.js.map