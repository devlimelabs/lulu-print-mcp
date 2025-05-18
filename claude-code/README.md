# Claude Code MCP Server [Work in Progress]

> ⚠️ **IMPORTANT**: This package is currently under development and not yet ready for production use. The current version is a work in progress and may contain incomplete features or breaking changes.

An MCP server that integrates with Claude Code CLI, allowing users to use Claude's coding capabilities through any Model Context Protocol (MCP) client like Claude Desktop.

## Features

This MCP server provides a bridge between Claude Desktop (or any MCP client) and the Claude Code CLI, exposing Claude Code's capabilities as MCP tools and resources.

### Available Tools

- **execute-query**: Send natural language queries to Claude Code
- **run-slash-command**: Execute Claude Code slash commands
- **init-project**: Initialize a project with Claude Code
- **codebase-summary**: Get project information with categorized details
- **execute-shell**: Execute shell commands via Claude Code
- **edit-file**: Edit files through Claude Code
- **search-codebase**: Search for patterns in the codebase
- **create-file**: Create new files with specified content
- **get-cost-info**: Track token usage and costs
- **clear-history**: Reset conversation context
- **compact-conversation**: Optimize conversation memory
- **read-file**: Read file contents using Claude Code

### Available Resources

- **claude-md**: Access to the CLAUDE.md project documentation
- **claude-help**: Detailed help on all Claude Code commands
- **claude-version**: Claude Code version information

## Installation

### Prerequisites

- Node.js 18+ installed
- Claude Code CLI installed and authenticated
- MCP client (e.g., Claude Desktop)

### Installation Steps

```bash
# Install the package
npm install @devlimelabs/claude-code-mcp

# Start the server
npx claude-code-mcp
```

### Configuration with Claude Desktop

Edit your `~/Library/Application Support/Claude/claude_desktop_config.json` to include:

```json
{
  "mcpServers": {
    "claude-code": {
      "command": "npx",
      "args": ["claude-code-mcp"]
    }
  }
}
```

Then restart Claude Desktop to connect to the MCP server.

## Use Cases

This integration unlocks transformative workflows:

1. **Dual Claude Collaboration**: Use Claude Desktop for high-level planning while Claude Code handles actual implementation.

2. **Enhanced Context Sharing**: Share code snippets, search results, and project structure between Claude interfaces.

3. **Multi-Project Management**: Easily switch between different codebases while maintaining conversation context.

4. **Automated Code Generation Pipeline**: Generate specifications in Claude Desktop, then pass to Claude Code for implementation.

5. **Code Review Workflow**: Analyze implementations with Claude Code and get explanations from Claude Desktop.

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-repo/master-mcps.git
cd master-mcps

# Install dependencies
pnpm install

# Build the package
pnpm -F @devlimelabs/claude-code-mcp build

# Link for local development
cd packages/claude-code
npm link
```

### Running Tests

```bash
pnpm -F @devlimelabs/claude-code-mcp test
```

## License

MIT