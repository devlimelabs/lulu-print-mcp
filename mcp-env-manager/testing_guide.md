# Testing Guide for MCP Environment Manager

This document outlines the key features to test in the MCP Environment Manager and identifies any issues found during testing.

## Key Features to Test

1. **Profile Management**
   - Creating, listing, updating, and deleting profiles
   - Setting the active profile

2. **Environment Variable Management**
   - Setting, retrieving, and deleting environment variables
   - Managing sensitive vs. non-sensitive variables
   - Exporting variables in different formats

3. **MCP Package Installation**
   - Installing, updating, and uninstalling MCP packages
   - Listing installed packages

4. **Configuration Watching**
   - Watching Claude Desktop and Cursor config files
   - Auto-detecting new MCP server entries

5. **Auto-Configuration**
   - Automatically localizing MCP servers
   - Managing references between packages and configurations

## Manual Testing Steps

To manually test the MCP Environment Manager, follow these steps:

1. Start the MCP server:
   ```bash
   cd /Users/john/code/master-mcps/packages/mcp-env-manager
   MCP_ENV_ENCRYPTION_KEY="test-key-1234567890" node dist/bin/mcp-env-manager.js
   ```

2. In a separate terminal, use the `curl` command to interact with the MCP server:
   ```bash
   # Create a profile
   echo '{"jsonrpc": "2.0", "method": "callTool", "params": {"name": "create-profile", "args": {"name": "Test Profile", "description": "A profile for testing"}}, "id": 1}' | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:3000/message
   
   # List profiles
   echo '{"jsonrpc": "2.0", "method": "callTool", "params": {"name": "list-profiles", "args": {}}, "id": 2}' | curl -X POST -H "Content-Type: application/json" -d @- http://localhost:3000/message
   ```

Note: The MCP server is designed to run with a standard I/O transport by default, which makes it ideal for direct integration with tools like Claude Desktop but more challenging to test via HTTP. For SSE (Server-Sent Events) mode testing, additional implementation work might be needed.

## Known Issues

1. **SSE Transport**: The SSE transport implementation currently falls back to stdio and requires more work to properly handle HTTP requests.

2. **Package Installation**: The package installation functionality depends on the local Node.js environment and might require additional validation to ensure it works correctly.

3. **Watcher Configuration**: The watcher is set up to watch Claude Desktop and Cursor configurations, but auto-localization might need additional testing with actual config changes.

## Recommended Improvements

1. **Complete SSE Transport**: Implement and test a complete SSE transport for web-based integrations.

2. **Command-Line Interface**: Enhance the CLI to allow direct operations without requiring JSON-RPC formatting.

3. **Testing Infrastructure**: Develop a better testing approach that allows programmatic interaction with the server.

4. **Documentation**: Add more complete documentation about the server capabilities and configuration options.

## Integration Testing with Claude Desktop

For testing with Claude Desktop:

1. Run the setup script:
   ```bash
   npm run setup:claude
   ```

2. Configure Claude Desktop to use the MCP Environment Manager.

3. Verify that the Environment Manager tools appear in Claude Desktop and can be used successfully.