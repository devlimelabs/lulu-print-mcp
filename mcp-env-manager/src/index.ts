// Export server
export { server, initializeServer } from './server.js';

// Export services
export { ConfigService } from './services/config-service.js';
export { PackageManager } from './services/package-manager.js';
export { WatcherService } from './services/watcher-service.js';

// Export config interfaces
export {
  EnvVar,
  Profile,
  ProfilesConfig,
  InstallationConfig,
  InstalledPackage,
  ConfigReference,
  PackageRegistry,
  McpServerEntry,
  McpConfig
} from './config.js';

// Export paths and constants
export {
  ENV_STORAGE_DIR,
  PROFILES_FILE,
  INSTALLATION_CONFIG_FILE,
  PACKAGES_DIR,
  REGISTRY_FILE,
  DEFAULT_INSTALLATION_CONFIG,
  ENCRYPTION_KEY_ENV_VAR,
  getClaudeConfigFile,
  getCursorConfigFile
} from './config.js';

// Export utilities
export * from './utils/fs-utils.js';
export * from './utils/func-utils.js'; 
