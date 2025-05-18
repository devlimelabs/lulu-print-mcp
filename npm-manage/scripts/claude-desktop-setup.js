#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Claude Desktop config path based on OS
let claudeConfigPath;
switch (process.platform) {
  case 'darwin': // macOS
    claudeConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    break;
  case 'win32': // Windows
    claudeConfigPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    break;
  default: // Linux
    claudeConfigPath = path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json');
}

// Generate Claude Desktop configuration
const claudeConfig = {
  mcpServers: {
    "npm-manager": {
      command: "npm-manage-mcp",
      env: {
        // Add any required environment variables here
      }
    }
  }
};

// Output instructions for updating configuration
console.log('Claude Desktop Setup for NPM Package Manager MCP');
console.log('==============================================\n');
console.log('Configuration to add to your Claude Desktop config file:');
console.log(`Location: ${claudeConfigPath}\n`);
console.log(JSON.stringify(claudeConfig, null, 2));
console.log('\nFor a local installation, use this configuration instead:');

const localConfig = {
  mcpServers: {
    "npm-manager": {
      command: "node",
      args: [path.join(__dirname, '..', 'dist', 'bin.js')],
      env: {
        // Add any required environment variables here
      }
    }
  }
};

console.log(JSON.stringify(localConfig, null, 2));

// Check if config file exists and offer to create it
try {
  if (fs.existsSync(claudeConfigPath)) {
    console.log('\n⚠️  Claude Desktop config file already exists.');
    console.log('Please manually add the above configuration to the existing file.');
  } else {
    console.log('\n📝 Claude Desktop config file not found at expected location.');
    console.log('Creating a new config file with the NPM Package Manager MCP configuration...');
    
    // Create directory if it doesn't exist
    fs.mkdirSync(path.dirname(claudeConfigPath), { recursive: true });
    
    // Write the config file
    fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
    console.log('✅ Configuration file created successfully!');
  }
} catch (error) {
  console.error('Error accessing config file:', error.message);
}

console.log('\n📌 Additional Setup Instructions:');
console.log('1. Ensure NPM is installed and accessible from the command line');
console.log('2. Restart Claude Desktop after updating the configuration');
console.log('3. The NPM tools should now be available in Claude Desktop');
console.log('\n🧪 To test, ask Claude to:');
console.log('   - "Create a new npm package"');
console.log('   - "Install React and TypeScript as dependencies"');
console.log('   - "Show me the dependencies in this project"');