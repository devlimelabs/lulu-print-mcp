import * as path from 'path';
import * as os from 'os';
// Default paths for configuration files
export const ENV_STORAGE_DIR = path.join(os.homedir(), '.mcp-env-manager');
export const PROFILES_FILE = path.join(ENV_STORAGE_DIR, 'profiles.json');
export const INSTALLATION_CONFIG_FILE = path.join(ENV_STORAGE_DIR, 'installation-config.json');
export const PACKAGES_DIR = path.join(ENV_STORAGE_DIR, 'packages');
export const REGISTRY_FILE = path.join(ENV_STORAGE_DIR, 'registry.json');
// Platform-specific path for Claude for Desktop configuration
export const getClaudeConfigFile = () => {
    const platform = process.platform;
    if (platform === 'darwin') {
        // macOS
        return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    }
    else if (platform === 'win32') {
        // Windows
        return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    }
    else if (platform === 'linux') {
        // Linux
        return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
    }
    else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
};
// Platform-specific path for Cursor configuration
export const getCursorConfigFile = () => {
    const platform = process.platform;
    if (platform === 'darwin') {
        // macOS
        return path.join(os.homedir(), '.cursor', 'mcp_config.json');
    }
    else if (platform === 'win32') {
        // Windows
        return path.join(process.env.APPDATA || '', 'Cursor', 'mcp_config.json');
    }
    else if (platform === 'linux') {
        // Linux
        return path.join(os.homedir(), '.config', 'cursor', 'mcp_config.json');
    }
    else {
        throw new Error(`Unsupported platform: ${platform}`);
    }
};
// Default encryption key environment variable name
export const ENCRYPTION_KEY_ENV_VAR = 'MCP_ENV_ENCRYPTION_KEY';
// Default installation configuration
export const DEFAULT_INSTALLATION_CONFIG = {
    watchers: {
        claude: {
            enabled: true,
            configPath: getClaudeConfigFile()
        },
        cursor: {
            enabled: true,
            configPath: getCursorConfigFile()
        }
    },
    packageManager: {
        installationDir: PACKAGES_DIR,
        autoLocalize: true,
        preferredPackageManager: 'npm'
    },
    notifications: {
        onNewServerDetected: true,
        onUpdateAvailable: true
    }
};
//# sourceMappingURL=config.js.map