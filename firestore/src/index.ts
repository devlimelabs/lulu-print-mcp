#!/usr/bin/env node
import { startServer } from "./server.js";
import { createDefaultConfig, createReadOnlyConfig, createFullAccessConfig, loadPermissionConfig } from "./permissions/config.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Set up command line arguments
const args = process.argv.slice(2);
const options: {
  configPath?: string;
  projectId?: string;
  credentialPath?: string;
  mode?: 'full' | 'read-only' | 'custom';
  collections?: string[];
} = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--config' && i + 1 < args.length) {
    options.configPath = args[++i];
  } else if (arg === '--project-id' && i + 1 < args.length) {
    options.projectId = args[++i];
  } else if (arg === '--credential-path' && i + 1 < args.length) {
    options.credentialPath = args[++i];
  } else if (arg === '--mode' && i + 1 < args.length) {
    const mode = args[++i];
    if (['full', 'read-only', 'custom'].includes(mode)) {
      options.mode = mode as 'full' | 'read-only' | 'custom';
    } else {
      console.error(`Invalid mode: ${mode}. Must be 'full', 'read-only', or 'custom'.`);
      process.exit(1);
    }
  } else if (arg === '--collections' && i + 1 < args.length) {
    options.collections = args[++i].split(',');
  } else if (arg === '--help') {
    console.log(`
Firestore MCP Server
Usage: mcp-firestore [options]

Options:
  --config <path>           Path to permission configuration file
  --project-id <id>         Firebase project ID
  --credential-path <path>  Path to Firebase service account key
  --mode <mode>             Permission mode: 'full', 'read-only', or 'custom'
  --collections <list>      Comma-separated list of collections (for read-only mode)
  --help                    Show this help message
    `);
    process.exit(0);
  }
}

async function main() {
  try {
    // Determine project ID
    const projectId = options.projectId || process.env.FIREBASE_PROJECT_ID;
    
    // Determine credential path
    const credentialPath = options.credentialPath || process.env.FIREBASE_CREDENTIAL_PATH;
    
    // Determine permission config
    let permissionConfig;
    
    if (options.mode === 'full') {
      permissionConfig = createFullAccessConfig();
    } else if (options.mode === 'read-only') {
      permissionConfig = createReadOnlyConfig(options.collections || []);
    } else if (options.configPath) {
      try {
        permissionConfig = loadPermissionConfig(options.configPath);
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    } else {
      permissionConfig = createDefaultConfig();
    }
    
    // Start the server
    await startServer({
      permissionConfig,
      projectId,
      credentialPath
    });
    
    console.error("Firestore MCP server running");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();