import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const version = packageJson.version;
import { initializeConfigService } from './services/config-service.js';
import { initializePackageManager } from './services/package-manager.js';
import { initializeWatcherService } from './services/watcher-service.js';
import { registerEnvironmentTools } from './tools/environment-tools.js';
import { registerInstallationTools } from './tools/installation-tools.js';
import { registerProfileTools } from './tools/profile-tools.js';
import { registerWatcherTools } from './tools/watcher-tools.js';

// Import tool implementations
// Import service initializers
// Create server
export const server = new McpServer({
  name: 'EnvManager',
  version
});

// Initialize server with tools and resources
export const initializeServer = async () => {
  // Initialize services
  const configService = await initializeConfigService();
  const packageManager = await initializePackageManager(configService);
  const watcherService = await initializeWatcherService(configService, packageManager);
  
  // Register all tools
  registerEnvironmentTools(server, configService);
  registerProfileTools(server, configService);
  registerInstallationTools(server, configService, packageManager);
  registerWatcherTools(server, configService, watcherService);
  
  // Initialize watchers if enabled in config
  const config = configService.getInstallationConfig();
  if (config.watchers.claude.enabled || config.watchers.cursor.enabled) {
    await watcherService.initializeWatchers();
  }
  
  return server;
};

// Export initialized server for bin script
export default server;

// Note: This is just a placeholder file with the server instance.
// Claude Code will implement the full server with tools, resources and prompts
// based on the FEATURE-SPEC-INSTALLATION-MANAGER.md specification
