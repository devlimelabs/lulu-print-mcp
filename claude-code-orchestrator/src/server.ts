import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createLogger } from "@devlimelabs/master-mcps-core/dist/utils/logger.js";
import { checkCommandExists } from "./utils/process-helpers.js";
import { OrchestratorMonitor } from "./orchestrator/monitor.js";
import * as os from 'os';

// Create a logger instance
const logger = createLogger({ scope: 'claude-code-orchestrator' });

// Create the MCP server
export const server = new McpServer({
  name: "ClaudeCodeOrchestrator",
  version: "1.0.0"
});

// Create orchestrator monitor
export const orchestrator = new OrchestratorMonitor({
  maxConcurrentProcesses: Math.max(2, os.cpus().length - 2),
  processTimeoutMs: 20 * 60 * 1000, // 20 minutes
  interactionTimeoutMs: 5 * 60 * 1000, // 5 minutes
});

// Initialize the server with all tools and resources
export async function initializeServer(): Promise<void> {
  logger.info("Initializing Claude Code Orchestrator MCP Server");
  
  // Check if Node.js is installed (which is definitely the case since we're running this)
  const isNodeInstalled = await checkCommandExists('node');
  if (!isNodeInstalled) {
    logger.error("Node.js is required but not found. This should never happen since we're running in Node.");
    throw new Error("Node.js not found. Make sure it's installed and in your PATH.");
  }
  
  // Register tools
  const toolsContext = await import('./tools/index.js');
  for (const registerTool of Object.values(toolsContext)) {
    if (typeof registerTool === 'function') {
      registerTool(server, orchestrator);
    }
  }
  
  // Register resources
  const resourcesContext = await import('./resources/index.js');
  for (const registerResource of Object.values(resourcesContext)) {
    if (typeof registerResource === 'function') {
      registerResource(server, orchestrator);
    }
  }
  
  // Start the orchestrator
  orchestrator.start();
  
  logger.info("Claude Code Orchestrator MCP Server initialized successfully");
}

// Clean up when the server is shutting down
process.on('exit', () => {
  orchestrator.stop();
  logger.info("Claude Code Orchestrator MCP Server shutting down");
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  logger.error("Uncaught exception", error);
  orchestrator.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise}, reason: ${reason}`);
  // Don't exit, just log
});