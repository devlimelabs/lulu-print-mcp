#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const version = packageJson.version;

import { server } from './index.js';

// Enhanced server connection with proper error handling and logging
async function main() {
  try {
    console.error(`Starting NPM Package Manager MCP Server v${version}...`);
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    console.error('NPM Package Manager MCP Server is running on stdio transport');
    
    // Graceful shutdown
    const shutdown = async () => {
      console.error('Shutting down NPM Package Manager MCP Server...');
      try {
        await transport.close();
        console.error('Server disconnected successfully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('Failed to start NPM Package Manager MCP Server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});