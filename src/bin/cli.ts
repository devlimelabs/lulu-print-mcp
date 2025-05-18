#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import chalk from 'chalk';
import { program } from 'commander';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');
const version = packageJson.version;

import { initializeServer, server } from '../server.js';

program
  .name('lulu-print-mcp')
  .description('Model Context Protocol server for Lulu Print API integration')
  .version(version)
  .option('-s, --sandbox', 'Use Lulu sandbox environment instead of production')
  .option('-d, --debug', 'Enable debug logging')
  .parse(process.argv);

const options = program.opts();

// Override environment variables based on CLI options
if (options.sandbox) {
  process.env.LULU_USE_SANDBOX = 'true';
}
if (options.debug) {
  process.env.DEBUG = 'true';
}

async function main() {
  try {
    console.error(chalk.blue('Starting Lulu Print MCP Server...'));
    
    if (options.sandbox) {
      console.error(chalk.yellow('Using Lulu sandbox environment'));
    }
    
    if (options.debug) {
      console.error(chalk.yellow('Debug mode enabled'));
    }
    
    await initializeServer();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error(chalk.green('Lulu Print MCP Server is running'));
    
    // Handle shutdown gracefully
    const shutdown = async () => {
      console.error(chalk.yellow('Shutting down...'));
      try {
        // Perform any cleanup if needed
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('Error during shutdown:'), error);
        process.exit(1);
      }
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGHUP', shutdown);
    
  } catch (error) {
    console.error(chalk.red('Failed to start:'), error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});