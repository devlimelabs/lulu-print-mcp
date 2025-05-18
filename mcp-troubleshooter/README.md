# MCP Troubleshooter [Work in Progress]

> ⚠️ **IMPORTANT**: This package is currently under development and not yet ready for production use. The current version is a work in progress and may contain incomplete features or breaking changes.

A self-diagnostic framework for AI models that enables them to diagnose and fix MCP-related issues.

## Architecture

```mermaid
flowchart TB
    Client["AI Model\n(e.g., Claude)"]
    
    subgraph "MCP Troubleshooter Server"
        LogTools["Log Management"]
        ConnTools["Connection Testing"]
        ConfigTools["Configuration Analysis"]
        FixTools["Fix Implementation"]
        
        subgraph "Log Analysis Engine"
            LogReader["Log Reader"]
            LogParser["Pattern Recognition"]
            ErrorClassifier["Issue Classification"]
        end
        
        subgraph "Connection Diagnostics"
            ConnTester["Transport Testing"]
            PortScanner["Port Availability"]
            HandshakeTester["Protocol Validation"]
        end
        
        subgraph "Configuration Manager"
            ConfigReader["Config Parser"]
            ConfigValidator["Schema Validation"]
            TemplateLibrary["Template Repository"]
        end
    end

    FileSystem["Host File System\n(Logs & Configs)"]
    OtherMCPs["Target MCP Servers"]
    
    Client <--> LogTools
    Client <--> ConnTools
    Client <--> ConfigTools
    Client <--> FixTools
    
    LogTools --> LogAnalysisEngine
    ConnTools --> ConnectionDiagnostics
    ConfigTools --> ConfigurationManager
    
    LogReader --> FileSystem
    ConfigReader --> FileSystem
    ConnTester --> OtherMCPs
    FixTools --> FileSystem
    FixTools --> OtherMCPs
    
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style FileSystem fill:#bbf,stroke:#333,stroke-width:2px
    style OtherMCPs fill:#bbf,stroke:#333,stroke-width:2px
    style "MCP Troubleshooter Server" fill:#eff,stroke:#333,stroke-width:4px
```

## Overview

MCP Troubleshooter is a specialized MCP server that transforms troubleshooting from a developer-only task into a capability the AI itself can leverage, allowing AI models to:

1. **Analyze MCP logs** - Automatically scan for common error patterns and provide insightful diagnostics
2. **Validate configurations** - Check server configurations against best practices and identify issues
3. **Test connections** - Verify network connectivity and server availability 
4. **Generate templates** - Create working MCP server configurations for quick setup
5. **Fix common issues** - Update configurations and implement solutions directly

## Installation

```bash
# Install the package globally
npm install -g @devlimelabs/mcp-troubleshooter

# Start the server
mcp-troubleshooter
```

## Usage

### Configuration for Claude Desktop

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "troubleshooter": {
      "command": "mcp-troubleshooter"
    }
  }
}
```

## Tools

### Log Management Tools

- **read-mcp-logs**: Retrieves and displays MCP log files
- **analyze-mcp-logs**: Uses pattern recognition to identify common error signatures

### Configuration Tools

- **read-mcp-config**: Extracts and validates Claude Desktop's MCP configuration
- **update-mcp-config**: Safely updates configurations with proper backup mechanisms
- **validate-mcp-server-config**: Performs deep validation of server configurations

### Connection Testing Tools

- **test-port-availability**: Checks if required ports are available for MCP servers
- **check-mcp-server-process**: Verifies if MCP server processes are running correctly

### Fix Implementation Tools

- **generate-mcp-server-template**: Creates customized server templates for different languages
- **generate-claude-desktop-config**: Builds optimized configuration files for Claude Desktop

## Resources

- **common-mcp-issues**: A comprehensive guide to common MCP problems and their solutions
- **mcp-config-templates**: Configuration templates for various MCP server setups

## Example Use Cases

### Diagnosing a Broken MCP Server

```
User: My MCP server isn't connecting properly to Claude Desktop. Can you help diagnose it?

Claude: I'll help diagnose your MCP server connection issue. First, let me run some diagnostics.

[Uses check-mcp-server-process tool with the command from the user]

I've identified several possible issues with your MCP server:

1. **Connection Timeout**: The server isn't responding within the expected timeframe.
2. **JSON-RPC Format Error**: There seems to be a format issue in the JSON-RPC responses.
3. **Transport Mismatch**: Claude Desktop is expecting stdio transport, but your server might be using SSE.

Let me run a more specific connection test to confirm:

[Uses test-port-availability tool]

The connection test confirms that your server is starting, but it's timing out during the handshake phase. This is likely due to incorrect JSON-RPC message formatting in your server implementation.

Recommended fixes:
1. Ensure your server returns properly formatted JSON-RPC 2.0 responses
2. Check your transport implementation, it should be using proper stdio pipes
3. Verify that your server is correctly handling the initialize method

Would you like me to analyze a specific log file or check your server's code for these issues?
```

### Validating MCP Configuration

```
User: Can you validate my Claude Desktop MCP configuration?

Claude: I'd be happy to validate your Claude Desktop MCP configuration.

[Uses read-mcp-config tool]

I've analyzed your Claude Desktop configuration file. Here are my findings:

✅ **Valid Configuration Structure**: The overall structure of your configuration is valid.

⚠️ **Path Issues**: 2 servers have invalid paths:
- "code-llm": The file path "/usr/local/bin/code-llm" doesn't exist
- "database-tool": The command "db-tool" is not in the PATH

❌ **Environment Variables**: 1 server has missing required environment variables:
- "firebase-mcp": Missing required FIREBASE_API_KEY

✅ **Transport Configuration**: All servers properly specify transport options

Recommended fixes:
1. Update the path for "code-llm" to the correct location
2. Install "db-tool" or correct its path
3. Add the missing FIREBASE_API_KEY to the "firebase-mcp" server configuration

Would you like me to help you implement any of these fixes?
```

## Platform Support

- **Windows**: Accesses logs and configs in `%APPDATA%\Claude\`
- **macOS**: Accesses logs in `~/Library/Logs/Claude/` and configs in `~/Library/Application Support/Claude/`
- **Linux**: Accesses logs in `~/.local/share/Claude/logs/` and configs in `~/.config/Claude/`

## Development

```bash
# Clone the repository
git clone https://github.com/devlimelabs/master-mcps.git
cd master-mcps

# Install dependencies
pnpm install

# Build the package
pnpm -F @devlimelabs/mcp-troubleshooter build

# Run tests
pnpm -F @devlimelabs/mcp-troubleshooter test
```

## License

MIT