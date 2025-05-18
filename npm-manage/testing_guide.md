# Testing Guide for NPM Package Manager MCP

This document outlines the key features to test in the NPM Package Manager MCP and provides step-by-step testing instructions.

## Key Features to Test

1. **Package Initialization**
   - Creating new packages with npm-init
   - Updating existing package.json files
   - Setting various module types (ESM vs CommonJS)

2. **Dependency Management**
   - Installing packages (regular, dev, peer dependencies)
   - Uninstalling packages
   - Listing dependencies by type
   - Updating dependencies

3. **Package Configuration**
   - Setting and running npm scripts
   - Updating package.json fields
   - Managing version numbers

4. **Publishing Workflow**
   - Version management (major, minor, patch)
   - Publishing packages (requires npm login)
   - Registry configuration

5. **Package Analysis**
   - Security audits
   - Package information lookup
   - Package search functionality

## Manual Testing Steps

To manually test the NPM Package Manager MCP, follow these steps:

### 1. Build the Project

First, build the TypeScript code:

```bash
npm install
npm run build
```

### 2. Test with Direct JSON-RPC

You can test individual tools by sending JSON-RPC requests:

```bash
cd test_output
cat npm-init.json | node ../dist/bin.js
```

### 3. Run Automated Tests

Use the test runner script:

```bash
cd test_output
node run_tests.js
```

### 4. Test with Claude Desktop

After configuring Claude Desktop (see README), you can test by:

1. Starting a conversation with Claude
2. Asking it to create a new npm package
3. Testing various npm operations through natural language

## Test Scenarios

### Scenario 1: Create a New Package

1. Use npm-init to create a new package
2. Add some dependencies with npm-install
3. Set up scripts with npm-set-scripts
4. Run a script with npm-run-script

### Scenario 2: Dependency Management

1. List current dependencies
2. Install new packages as different dependency types
3. Update existing packages
4. Uninstall packages
5. Run security audit

### Scenario 3: Publishing Workflow

1. Update version with npm-version
2. Check npm user login status
3. Configure registry if needed
4. Publish package (if logged in)

## Common Test Commands

```bash
# Initialize a package
npm-init --packageName "test-package" --version "1.0.0"

# Install dependencies
npm-install --packages ["lodash", "express"] --dev false

# List dependencies
npm-list-deps --type "all"

# Run security audit
npm-audit --fix false

# Search for packages
npm-search --query "date utility" --limit 5
```

## Integration Testing

### With Claude Desktop

1. Install the MCP server globally or locally
2. Configure Claude Desktop as per README
3. Test natural language commands like:
   - "Create a new npm package called my-awesome-tool"
   - "Install React and TypeScript as dependencies"
   - "Show me all the dependencies in this project"
   - "Update all packages to their latest versions"

### With Cursor

1. Open Cursor Settings
2. Add MCP configuration as per README
3. Test in a Node.js project by asking Cursor to manage npm packages

### With Windsurf

1. Configure .windsurf/config.json
2. Test both production and development configurations
3. Verify tools appear in Windsurf's AI assistant

## Troubleshooting

### Common Issues

1. **"npm is not installed"**: Ensure npm is available in your PATH
2. **"No package.json found"**: Make sure you're in a directory with package.json
3. **Tool not found**: Verify the MCP server is properly configured in your client
4. **Permission errors**: Some operations may require appropriate file system permissions

### Debug Mode

To see detailed logs, check the stderr output when running the server:

```bash
node dist/bin.js 2> debug.log
```

## Performance Testing

For performance testing, consider:

1. Installing large dependency trees
2. Running audits on projects with many dependencies
3. Searching for popular packages
4. Running multiple operations in sequence

## Security Testing

Always test with:

1. Malformed package names
2. Invalid version strings
3. Non-existent packages
4. Private registry configurations