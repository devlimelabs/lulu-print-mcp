# NPM Package Manager MCP Server

An MCP (Model Context Protocol) server that enables AI assistants like Claude to manage npm packages through natural language. This server provides a comprehensive set of tools for the complete lifecycle of JavaScript/TypeScript package development, from initialization through publication and maintenance.

Part of the [master-mcps](https://github.com/devlimelabs/master-mcps) monorepo collection of production-ready MCP servers.

Built with MCP TypeScript SDK v1.6.0 for stability and compatibility.

## Features

The NPM Package Manager MCP server offers a complete suite of tools:

### Package Initialization
- Initialize new npm packages with customizable package.json fields
- Create packages using modern ES Modules or CommonJS
- Set up private or public package configurations

### Dependency Management
- Install, update, and uninstall packages with fine-grained control
- Manage dependencies, devDependencies, and peerDependencies
- Work with global packages or project-specific dependencies
- List and audit installed dependencies

### Package Configuration
- Configure package.json fields and scripts
- Execute npm scripts with custom arguments
- Set up publishing configuration

### Version Control & Publishing
- Update package versions following semantic versioning
- Publish packages to npm registry with custom access levels and tags
- Manage npm registry configuration for scoped packages

### Package Analysis
- Run security audits with automatic vulnerability fixing
- Search and get detailed information about packages
- View package metadata and documentation links

## Installation

### Global Installation

```bash
npm install -g @devlimelabs/npm-manage-mcp
```

### Local Installation

```bash
npm install @devlimelabs/npm-manage-mcp
```

### Development Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/devlimelabs/master-mcps.git
cd master-mcps/packages/npm-manage
npm install
npm run build
```

## Usage with Claude for Desktop

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "npm-manager": {
      "command": "npx",
      "args": ["-y", "@devlimelabs/npm-manage-mcp"]
    }
  }
}
```

For a locally installed version:

```json
{
  "mcpServers": {
    "npm-manager": {
      "command": "node",
      "args": ["/path/to/npm-manage-mcp/dist/bin.js"]
    }
  }
}
```

## Usage with Cursor

Add to your Cursor settings:

```json
{
  "mcpServers": {
    "npm-manager": {
      "command": "npm-manage-mcp",
      "env": {}
    }
  }
}
```

## Usage with Windsurf

Add to your `.windsurf/config.json`:

```json
{
  "mcpServers": {
    "npm-manager": {
      "command": "npm-manage-mcp",
      "env": {}
    }
  }
}
```

## Available Tools

### Package Initialization
- `npm-init`: Initialize a new npm package or update an existing one

### Dependency Management
- `npm-install`: Install packages as dependencies, devDependencies, or peerDependencies
- `npm-uninstall`: Remove packages from your project
- `npm-list-deps`: List all dependencies in your project
- `npm-update`: Update packages to their latest versions

### Package Configuration
- `npm-set-scripts`: Configure npm scripts in package.json
- `npm-run-script`: Execute npm scripts
- `npm-set-config`: Set any field in package.json

### Version Control & Publishing
- `npm-version`: Update package version (major, minor, patch, or custom)
- `npm-publish`: Publish package to npm registry
- `npm-registry`: Get or set npm registry configuration

### Package Analysis
- `npm-audit`: Run security audit on dependencies
- `npm-info`: Get detailed information about packages
- `npm-search`: Search for packages on npm registry

## Requirements

- Node.js 16.0.0 or higher
- npm installed and accessible from the command line

## Known Limitations and Testing

- Requires npm to be installed and accessible from the command line
- Publishing operations require npm login
- Some operations may require appropriate file system permissions

For detailed testing instructions, see the [Testing Guide](./testing_guide.md).

## Development

To run in development mode:

```bash
npm run dev
```

To run tests:

```bash
npm test
```

For a list of all available scripts:

```bash
npm run
```

## Docker Support

Build and run with Docker:

```bash
docker build -t npm-manage-mcp .
docker run -it npm-manage-mcp
```

## License

MIT

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

This is part of the [master-mcps](https://github.com/devlimelabs/master-mcps) monorepo. Please ensure all contributions follow the monorepo standards.
