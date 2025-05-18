export declare const ENV_STORAGE_DIR: string;
export declare const PROFILES_FILE: string;
export declare const INSTALLATION_CONFIG_FILE: string;
export declare const PACKAGES_DIR: string;
export declare const REGISTRY_FILE: string;
export declare const getClaudeConfigFile: () => string;
export declare const getCursorConfigFile: () => string;
export declare const ENCRYPTION_KEY_ENV_VAR = "MCP_ENV_ENCRYPTION_KEY";
export interface McpServerEntry {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export interface McpConfig {
    mcpServers?: Record<string, McpServerEntry>;
}
export interface Profile {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ProfilesConfig {
    profiles: Profile[];
    activeProfile?: string;
}
export interface EnvVar {
    value: string;
    sensitive: boolean;
    description?: string;
}
export interface InstallationConfig {
    watchers: {
        claude: {
            enabled: boolean;
            configPath: string;
        };
        cursor: {
            enabled: boolean;
            configPath: string;
        };
    };
    packageManager: {
        installationDir: string;
        autoLocalize: boolean;
        preferredPackageManager: 'npm' | 'yarn' | 'pnpm';
    };
    notifications: {
        onNewServerDetected: boolean;
        onUpdateAvailable: boolean;
    };
}
export declare const DEFAULT_INSTALLATION_CONFIG: InstallationConfig;
export interface InstalledPackage {
    name: string;
    version: string;
    localPath: string;
    binPath?: string;
    installedAt: string;
    updatedAt?: string;
    dependencies: string[];
    usedByConfigs: ConfigReference[];
}
export interface ConfigReference {
    path: string;
    platform: 'claude' | 'cursor';
    serverName: string;
}
export interface PackageRegistry {
    packages: Record<string, InstalledPackage>;
}
