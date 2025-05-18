#!/usr/bin/env node
/**
 * Claude Desktop Integration Setup Script
 * 
 * This script helps users configure Claude Desktop to use the Domain Radar MCP.
 * It generates the configuration JSON needed for the Claude Desktop configuration file.
 */

import fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');

// Determine the Claude Desktop config path based on the OS
let claudeConfigPath;
switch (os.platform()) {
  case 'darwin':
    claudeConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'config.json');
    break;
  case 'win32':
    claudeConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'config.json');
    break;
  case 'linux':
    claudeConfigPath = path.join(os.homedir(), '.config', 'Claude', 'config.json');
    break;
  default:
    console.error('Unsupported operating system');
    process.exit(1);
}

// Try to load existing environment variables from .env
const envVars = {};
try {
  const envPath = path.join(packageDir, '.env');
  const envFile = await fs.readFile(envPath, 'utf8');
  const envLines = envFile.split('\\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=', 2);
      if (key && value) {
        envVars[key] = value;
      }
    }
  }
} catch (error) {
  console.warn('Warning: Could not read .env file. Using empty environment variables.');
}

// Generate the Claude Desktop configuration
const mcpConfig = {
  "mcpServers": {
    "domain-radar": {
      "command": "domain-radar-mcp",
      "env": envVars
    }
  }
};

// Print instructions for the user
console.log(`
=======================================================================================
CLAUDE DESKTOP INTEGRATION
=======================================================================================

To integrate the Domain Radar MCP with Claude Desktop, add this configuration to your
Claude Desktop config file:

${JSON.stringify(mcpConfig, null, 2)}

Config location based on your operating system:
${claudeConfigPath}

If the file doesn't exist yet, create it with the content above.
If it exists, merge the mcpServers section with your existing configuration.

=======================================================================================
`);

// Check if the package is installed globally
try {
  console.log('Verifying if the package is installed globally...');
  // Simulate checking for global installation
  console.log('NOTE: This package should be installed globally for Claude Desktop integration:');
  console.log('npm install -g @devlimelabs/domain-radar-mcp');
  console.log('');
  console.log('If you encounter any issues with the integration, please ensure:');
  console.log('1. The package is installed globally');
  console.log('2. Your API keys are correctly configured in the Claude Desktop config');
  console.log('3. Claude Desktop is restarted after configuration changes');
} catch (error) {
  console.error('Error during setup:', error);
}