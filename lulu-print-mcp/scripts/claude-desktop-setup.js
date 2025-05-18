#!/usr/bin/env node

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Claude Desktop config path based on OS
let claudeConfigPath;
const platform = os.platform();

if (platform === 'darwin') {
  // macOS
  claudeConfigPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
} else if (platform === 'win32') {
  // Windows
  claudeConfigPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
} else {
  // Linux and others
  claudeConfigPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

// Read configuration from .env
const envPath = path.join(__dirname, '..', '.env');
let clientKey = '';
let clientSecret = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('LULU_CLIENT_KEY=')) {
      clientKey = trimmedLine.split('=')[1].trim();
    } else if (trimmedLine.startsWith('LULU_CLIENT_SECRET=')) {
      clientSecret = trimmedLine.split('=')[1].trim();
    }
  }
}

// Generate Claude Desktop configuration
const mcpConfig = {
  mcpServers: {
    "lulu-print": {
      command: "lulu-print-mcp",
      env: {
        LULU_CLIENT_KEY: clientKey || "your_lulu_client_key",
        LULU_CLIENT_SECRET: clientSecret || "your_lulu_client_secret"
      }
    }
  }
};

// Output instructions
console.log('Claude Desktop Configuration Setup');
console.log('==================================\n');

console.log('Configuration file location:');
console.log(claudeConfigPath);
console.log('');

console.log('Add the following to your Claude Desktop configuration:');
console.log(JSON.stringify(mcpConfig, null, 2));
console.log('');

console.log('Instructions:');
console.log('1. Open the Claude Desktop configuration file');
console.log('2. If the file doesn\'t exist, create it with the content above');
console.log('3. If it exists, merge the "lulu-print" entry into the existing "mcpServers" object');
console.log('4. Replace the placeholder values with your actual Lulu API credentials');
console.log('5. Save the file and restart Claude Desktop');
console.log('');

// Offer to create/update the config file
if (process.argv.includes('--auto')) {
  console.log('Auto-configuration mode enabled...');
  
  try {
    let existingConfig = {};
    
    if (fs.existsSync(claudeConfigPath)) {
      const configContent = fs.readFileSync(claudeConfigPath, 'utf8');
      existingConfig = JSON.parse(configContent);
    }
    
    // Ensure mcpServers exists
    if (!existingConfig.mcpServers) {
      existingConfig.mcpServers = {};
    }
    
    // Add our server configuration
    existingConfig.mcpServers['lulu-print'] = mcpConfig.mcpServers['lulu-print'];
    
    // Create directory if it doesn't exist
    const configDir = path.dirname(claudeConfigPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write the updated configuration
    fs.writeFileSync(claudeConfigPath, JSON.stringify(existingConfig, null, 2));
    
    console.log('✅ Configuration file updated successfully!');
    console.log('Please restart Claude Desktop to apply the changes.');
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
    console.log('Please update the configuration manually.');
  }
} else {
  console.log('To automatically update the configuration, run:');
  console.log('npm run setup:claude -- --auto');
}