# MCP Installation Manager - Feature Specification

## Vision

The MCP Installation Manager extends our Environment Manager to create a unified control center for the Model Context Protocol ecosystem. By integrating local package installation and configuration management, we transform disconnected MCP servers into a cohesive, managed environment with automated dependency resolution, intelligent configuration updating, and seamless profile switching.

## Expanded Architecture

This feature set introduces four transformative new capabilities:

1. **Configuration Watchers** - Intelligent monitoring of MCP configuration files
2. **Local Package Management** - On-demand installation and versioning of MCP packages
3. **Auto-Configuration** - Dynamic reconfiguration of MCP references to use local installations
4. **Health Monitoring** - Status tracking and diagnostics for installed MCPs

```mermaid
flowchart TB
    subgraph "MCP Configuration Manager"
        ConfigManager["Configuration File Manager"]
        EnvStorage["Environment Variable Storage"]
        ProfileManager["Profile Manager"]
        PackageManager["Package Manager"]
        ConfigWatcher["Configuration Watcher"]
        
        subgraph "Resource Layer"
            EnvResources["Environment Variables"]
            ProfileResources["Profiles"]
            ConfigResources["Configurations"]
            PackageResources["Installed Packages"]
        end
        
        subgraph "Tool Layer"
            EnvTools["Environment Tools"]
            ProfileTools["Profile Tools"]
            ConfigTools["Configuration Tools"]
            InstallTools["Installation Tools"]
            WatcherTools["Watcher Tools"]
        end
        
        ProfileManager <--> ProfileResources
        ProfileManager <--> ProfileTools
        
        EnvStorage <--> EnvResources
        EnvStorage <--> EnvTools
        
        ConfigManager <--> ConfigResources
        ConfigManager <--> ConfigTools
        
        PackageManager <--> PackageResources
        PackageManager <--> InstallTools
        
        ConfigWatcher <--> WatcherTools
        ConfigWatcher --> ConfigManager
        ConfigWatcher --> PackageManager
    end
    
    ClaudeConfig["Claude Config Files"]
    CursorConfig["Cursor Config Files"]
    LocalPackages["Local MCP Packages"]
    
    ConfigWatcher -.-> ClaudeConfig
    ConfigWatcher -.-> CursorConfig
    PackageManager <--> LocalPackages
    
    Client["MCP Clients\n(Claude, Cursor)"]
    Client <--> "MCP Configuration Manager"
```

## New Module Structure

```
src/
├── watcher/
│   ├── config-watcher.ts       # Core watcher service
│   ├── change-detector.ts      # Detect new MCP entries
│   └── platforms/              # Platform-specific handlers
│       ├── claude.ts           # Claude Desktop config handling
│       └── cursor.ts           # Cursor config handling
│
├── package-manager/
│   ├── installer.ts            # Package installation logic
│   ├── registry.ts             # Local package registry
│   ├── updater.ts              # Update management
│   └── dependency-resolver.ts  # Resolve package dependencies
│
└── tools/
    └── installation-tools.ts   # Installation-related tools
```

## Key Components

### 1. Configuration Watcher

The Configuration Watcher is a background service that monitors MCP configuration files used by various clients like Claude Desktop and Cursor.

**Key Features:**
- File system watchers using `fs.watch` or `chokidar`
- Change detection and parsing
- Configuration diffing to identify new MCP server entries
- Platform-specific configuration handling

**Implementation Notes:**
- Use debounced watchers to prevent excessive processing
- Support multiple platform-specific config formats
- Maintain change history for troubleshooting
- Support manual triggering of config scans

**Example:**
```typescript
export class ConfigWatcher {
  private watchers: Map<string, FSWatcher> = new Map();
  private configCache: Map<string, McpConfig> = new Map();
  
  constructor(
    private packageManager: PackageManager,
    private configManager: ConfigManager
  ) {}
  
  public watch(configPath: string, platform: 'claude' | 'cursor'): void {
    // Implementation to set up a watcher on the config file
  }
  
  private async onConfigChanged(configPath: string, platform: 'claude' | 'cursor'): Promise<void> {
    // Handle configuration changes
  }
  
  private detectNewMcpServers(oldConfig: McpConfig, newConfig: McpConfig): McpServerEntry[] {
    // Detect new MCP server entries
  }
}
```

### 2. Package Manager

The Package Manager handles installation, updates, and tracking of local MCP packages.

**Key Features:**
- Local installation of MCP packages with npm/yarn
- Version tracking and management
- Update detection and application
- Dependency resolution
- Installation health checking

**Implementation Notes:**
- Use child_process to execute npm/yarn commands
- Maintain a registry of installed packages
- Support specific version installation
- Track dependencies between MCPs

**Example:**
```typescript
export class PackageManager {
  private registry: PackageRegistry;
  
  constructor(private baseDir: string) {
    this.registry = new PackageRegistry(path.join(baseDir, 'registry.json'));
  }
  
  public async installPackage(packageName: string, version?: string): Promise<InstallResult> {
    // Implementation to install a package
  }
  
  public async getLocalPath(packageName: string, version?: string): Promise<string | null> {
    // Get the local path to an installed package
  }
  
  public async updateConfigToUseLocalPackage(
    configPath: string, 
    serverName: string,
    packageName: string
  ): Promise<boolean> {
    // Update configuration to use a local package
  }
}
```

### 3. MCP Registry

The MCP Registry maintains a record of installed packages, their versions, and their local paths.

**Key Features:**
- Persistent storage of package information
- Version tracking
- Installation location tracking
- Dependency relationships

**Example Data Model:**
```typescript
interface InstalledPackage {
  name: string;
  version: string;
  localPath: string;
  binPath?: string;
  installedAt: string;
  dependencies: string[];
  usedByConfigs: ConfigReference[];
}

interface ConfigReference {
  path: string;
  platform: 'claude' | 'cursor';
  serverName: string;
}
```

## New Tools

### Installation Tools

```typescript
// Install an MCP locally
server.tool(
  "install-mcp",
  {
    packageName: z.string().description("MCP package name (e.g. @modelcontextprotocol/server-filesystem)"),
    version: z.string().optional().description("Specific version to install")
  },
  async ({ packageName, version }) => {
    // Install the package locally
    // Update registry
    // Return installation result
  }
);

// Update an installed MCP
server.tool(
  "update-mcp",
  {
    packageName: z.string().description("MCP package name to update"),
    version: z.string().optional().description("Target version (optional)")
  },
  async ({ packageName, version }) => {
    // Update the package
    // Update registry
    // Update any configs using this package
    // Return update result
  }
);

// List installed MCPs
server.tool(
  "list-installed-mcps",
  {},
  async () => {
    // Return list of installed MCPs with versions and configs using them
  }
);
```

### Watcher Tools

```typescript
// Configure watcher
server.tool(
  "configure-watcher",
  {
    watchClaude: z.boolean().default(true).description("Watch Claude Desktop config"),
    watchCursor: z.boolean().default(true).description("Watch Cursor config"),
    claudeConfigPath: z.string().optional().description("Custom path to Claude config"),
    cursorConfigPath: z.string().optional().description("Custom path to Cursor config")
  },
  async ({ watchClaude, watchCursor, claudeConfigPath, cursorConfigPath }) => {
    // Configure watchers for the specified platforms
  }
);

// Manually trigger config scan
server.tool(
  "scan-configs",
  {},
  async () => {
    // Trigger a manual scan of all watched configs
  }
);

// Auto-replace npx with local installations
server.tool(
  "enable-auto-localize",
  {
    enabled: z.boolean().default(true).description("Enable automatic localization of MCP servers")
  },
  async ({ enabled }) => {
    // Enable or disable automatic localization
  }
);
```

## Configuration Format

The MCP Installation Manager uses its own configuration stored at `~/.mcp-env-manager/installation-config.json`:

```json
{
  "watchers": {
    "claude": {
      "enabled": true,
      "configPath": "~/Library/Application Support/Claude/claude_desktop_config.json"
    },
    "cursor": {
      "enabled": true,
      "configPath": "~/.cursor/mcp_config.json"
    }
  },
  "packageManager": {
    "installationDir": "~/.mcp-env-manager/packages",
    "autoLocalize": true,
    "preferredPackageManager": "npm"
  },
  "notifications": {
    "onNewServerDetected": true,
    "onUpdateAvailable": true
  }
}
```

## Workflow Examples

### Example 1: Auto-localizing a new MCP

1. User adds a new MCP to Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
       }
     }
   }
   ```

2. Config Watcher detects the new MCP server entry
3. Package Manager installs `@modelcontextprotocol/server-filesystem` locally
4. Config Manager updates the config to use the local installation:
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "/home/user/.mcp-env-manager/packages/node_modules/.bin/server-filesystem",
         "args": ["/path/to/dir"]
       }
     }
   }
   ```

### Example 2: Switching environments with different MCPs

1. User activates a profile for Project A containing Firebase config
   - Package Manager ensures all required MCPs are installed
   - Config Manager updates Claude Desktop config with Project A MCPs
   - Environment variables for Project A are applied

2. User switches to Project B with different requirements
   - Package Manager validates different set of MCPs
   - Config Manager updates config with Project B MCPs
   - Environment variables for Project B are applied

## Implementation Strategy

1. **Phase 1: Watcher Infrastructure**
   - Implement basic config file watching
   - Add detection of MCP server entries
   - Create abstract platform handlers

2. **Phase 2: Package Management**
   - Build local package installation
   - Create package registry
   - Implement version management

3. **Phase 3: Auto-Configuration**
   - Add config file updating
   - Implement profile-specific MCP sets
   - Build dependency resolution

4. **Phase 4: Optimization & Monitoring**
   - Add health monitoring
   - Optimize package installations
   - Add update notifications

## Integration with Environment Manager

The Installation Manager seamlessly integrates with the existing Environment Manager:

1. **Shared Configuration**: Profiles can contain both environment variables and MCP package requirements
2. **Coordinated Updates**: When switching profiles, both env vars and MCP configurations are updated
3. **Unified Storage**: All data is stored in the same base directory
4. **Consistent Interface**: All tools follow the same naming and parameter conventions

## Security Considerations

1. **Config Modification**: Only modify config files according to user settings
2. **Package Validation**: Verify package integrity before installation
3. **Permission Management**: Run with appropriate permissions for file access
4. **Sensitive Data Handling**: Securely manage any credentials required for installation
5. **Isolation**: Consider sandboxing package installations

## Future Possibilities

1. **Marketplace Integration**: Browse and install verified MCPs from a curated marketplace
2. **Enhanced Analytics**: Track MCP usage and performance
3. **CI/CD Integration**: Automated updates and deployments
4. **Snapshot System**: Create and restore configuration snapshots
5. **Remote Synchronization**: Share configurations across devices

## Conclusion

This expanded architecture transforms the Environment Manager into a complete MCP ecosystem management solution. By adding installation automation, configuration watching, and health monitoring, we create a seamless experience for users working with multiple MCPs across different projects and environments.
