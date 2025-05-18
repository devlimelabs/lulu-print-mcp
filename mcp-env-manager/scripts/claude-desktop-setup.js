import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

#!/usr/bin/env node

/**
 * This script helps set up the MCP Environment & Installation Manager
 * in Claude for Desktop's configuration file.
 */

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Platform-specific path for Claude for Desktop configuration
function getClaudeConfigPath() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    // Windows
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'linux') {
    // Linux
    return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function main() {
  try {
    const configPath = getClaudeConfigPath();
    console.log(`Claude for Desktop config path: ${configPath}`);
    
    // Check if directory exists, create if not
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    
    // Read existing config if it exists
    let config = { mcpServers: {} };
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData);
      
      // Initialize mcpServers if it doesn't exist
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
    } catch (error) {
      console.log('No existing configuration found, creating new one.');
    }
    
    // Check if env-manager is already in config
    if (config.mcpServers['env-manager']) {
      console.log('MCP Environment & Installation Manager is already configured in Claude for Desktop.');
      console.log('Current configuration:');
      console.log(JSON.stringify(config.mcpServers['env-manager'], null, 2));
      
      const answer = await prompt('Update configuration? (y/n) ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Configuration not updated.');
        return;
      }
    }
    
    // Add or update the MCP Environment & Installation Manager configuration
    config.mcpServers['env-manager'] = {
      command: 'mcp-env-manager',
      displayName: 'Environment & Installation Manager'
    };
    
    // Write the updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log('MCP Environment & Installation Manager has been configured in Claude for Desktop.');
    console.log('Please restart Claude for Desktop to apply the changes.');
  } catch (error) {
    console.error('Failed to configure Claude for Desktop:', error);
    process.exit(1);
  }
}

// Simple prompt function
function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

main().catch(console.error); 
