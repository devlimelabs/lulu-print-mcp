import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";
import { PermissionManager } from "./permissions/manager.js";
import { FirestoreClient } from "./firestore/client.js";
import { PermissionConfig } from "./permissions/types.js";

export interface ServerOptions {
  permissionConfig: PermissionConfig;
  projectId?: string;
  credentialPath?: string;
}

export async function createServer(options: ServerOptions) {
  // Initialize Firestore client
  const firestoreClient = new FirestoreClient({
    projectId: options.projectId,
    credentialPath: options.credentialPath,
  });
  await firestoreClient.initialize();

  // Initialize permission manager
  const permissionManager = new PermissionManager(options.permissionConfig);

  // Create MCP server
  const server = new McpServer({
    name: "firestore-mcp",
    version: "0.1.0",
  });

  // Register resources and tools
  registerResources(server, firestoreClient, permissionManager);
  registerTools(server, firestoreClient, permissionManager);

  return server;
}

export async function startServer(options: ServerOptions) {
  const server = await createServer(options);
  
  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Firestore MCP server started");
  
  return server;
}