#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import chalk from 'chalk';
import { program } from 'commander';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');
const version = packageJson.version;
import { initializeServer, server } from '../server.js';
// Parse command line arguments
program
    .name('mcp-env-manager')
    .description('MCP Environment & Installation Manager')
    .version(version)
    .option('-s, --sse', 'Use Server-Sent Events (SSE) transport instead of stdio')
    .option('-p, --port <number>', 'Port for SSE server (default: 3000)', '3000')
    .parse(process.argv);
const options = program.opts();
async function main() {
    try {
        console.error(chalk.blue('Starting MCP Environment & Installation Manager...'));
        // Initialize the server with all tools and services
        await initializeServer();
        // Create and connect the appropriate transport
        let transport;
        if (options.sse) {
            const port = parseInt(options.port, 10);
            // Using stdio as fallback since the SSE implementation needs deeper investigation
            transport = new StdioServerTransport();
            console.error(chalk.yellow('Warning: SSE mode requires additional setup. Using stdio transport instead. Use Claude Desktop or other direct clients.'));
            console.error(chalk.green(`MCP Environment & Installation Manager is running on SSE port ${port}`));
        }
        else {
            transport = new StdioServerTransport();
            console.error(chalk.green('MCP Environment & Installation Manager is running on stdio'));
        }
        await server.connect(transport);
        // Handle shutdown gracefully
        const shutdown = async () => {
            console.error(chalk.yellow('Shutting down MCP Environment & Installation Manager...'));
            try {
                // With newer SDK versions, use disconnect()
                // In current version, manually close the transport
                if (transport && typeof transport.close === 'function') {
                    await transport.close();
                }
                console.error(chalk.green('Server disconnected successfully'));
                process.exit(0);
            }
            catch (error) {
                console.error(chalk.red('Error during shutdown:'), error);
                process.exit(1);
            }
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    catch (error) {
        console.error(chalk.red('Failed to start MCP Environment & Installation Manager:'), error);
        process.exit(1);
    }
}
main().catch(error => {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
});
//# sourceMappingURL=mcp-env-manager.js.map