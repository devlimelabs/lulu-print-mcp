# MCP Environment & Installation Manager

A unified control center for managing MCP servers and their configurations. This MCP server provides tooling for environment variable management, profile-based configurations, and local package installation automation.

## Features

- **Environment Variable Management**: Securely store and manage environment variables for your MCP servers
- **Profile System**: Create different profiles for different projects or environments
- **Local Package Installation**: Automatically install MCP packages locally
- **Configuration Watching**: Monitor MCP configurations and adapt to changes
- **Auto-Configuration**: Automatically update configurations to use locally installed packages

## Installation

### Node.js Installation

```bash
# Global installation
npm install -g @devlimelabs/mcp-env-manager

# Or using yarn
yarn global add @devlimelabs/mcp-env-manager

# Or using pnpm
pnpm add -g @devlimelabs/mcp-env-manager
```

### Docker Installation

```bash
# Clone the repository
git clone https://github.com/devlimelabs/master-mcps.git
cd master-mcps/packages/mcp-env-manager

# Build and run with Docker
npm run docker:build
npm run docker:run

# Or using Docker Compose
npm run compose:up
```

## Configuration

Create a `.env` file based on the `.env.example` template:

```bash
# Copy the example configuration
cp .env.example .env

# Edit the configuration
nano .env
```

### Important Environment Variables

- `MCP_ENV_ENCRYPTION_KEY`: Required for encrypting sensitive values
- `MCP_ENV_STORAGE_DIR`: Directory for storing configuration (default: ~/.mcp-env-manager)

## Usage

### Command Line Interface

```bash
# Start the MCP server with stdio transport (for Claude, Cursor integration)
mcp-env-manager

# Start with SSE transport (for web integration)
mcp-env-manager --sse --port 3000
```

### With Claude for Desktop

1. Run the provided setup script:

```bash
npm run setup:claude
```

Or manually add the Environment Manager to your Claude for Desktop configuration file:

```json
{
  "mcpServers": {
    "env-manager": {
      "command": "mcp-env-manager",
      "displayName": "Environment & Installation Manager"
    }
  }
}
```

2. Restart Claude for Desktop and start using the Environment Manager tools.

### With Cursor

Add the Environment Manager to your Cursor MCP configuration file:

```json
{
  "mcpServers": {
    "env-manager": {
      "command": "mcp-env-manager"
    }
  }
}
```

## Tool Examples

### Managing Environment Profiles

```
> create-profile
  name: "Development Environment"
  description: "Configuration for local development"

> list-profiles
```

### Managing Environment Variables

```
> set-env-var
  profileId: "development-environment-12345"
  key: "API_KEY"
  value: "your-api-key-here"
  sensitive: true

> list-env-vars
  profileId: "development-environment-12345"

> activate-profile
  profileId: "development-environment-12345"
```

### Managing MCP Installations

```
> install-mcp
  packageName: "@modelcontextprotocol/server-filesystem"

> list-installed-mcps

> update-mcp
  packageName: "@modelcontextprotocol/server-filesystem"
```

### Configuration Watching

```
> configure-watcher
  watchClaude: true
  watchCursor: true

> enable-auto-localize
  enabled: true
```

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Run tests
npm test

# Build the package
npm run build
```

## Known Limitations and Future Improvements

- **SSE Transport**: The current SSE transport implementation is incomplete and falls back to stdio. Further work is needed to make it fully functional for web integrations.
- **Testing**: The MCP server communicates via JSON-RPC over stdio which makes automated testing more complex. See [testing_guide.md](./testing_guide.md) for manual testing procedures.
- **Package Installation**: Package installation depends on the local Node.js environment and should be tested with actual MCP packages.

## Running Manual Tests

For manual testing details, see the [Testing Guide](./testing_guide.md).

## Docker Deployment

The package includes a multi-stage Dockerfile and docker-compose.yml for easy deployment:

```bash
# Start the service with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Security Considerations

- The `MCP_ENV_ENCRYPTION_KEY` should be kept secure and not committed to version control
- Sensitive values are encrypted at rest using the provided encryption key
- Use a strong, randomly-generated encryption key for production environments

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT
