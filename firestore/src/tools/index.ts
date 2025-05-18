import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";
import { registerReadTools } from "./read.js";
import { registerWriteTools } from "./write.js";
import { registerDeleteTools } from "./delete.js";
import { registerQueryTools } from "./query.js";

export function registerTools(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  registerReadTools(server, firestoreClient, permissionManager);
  registerWriteTools(server, firestoreClient, permissionManager);
  registerDeleteTools(server, firestoreClient, permissionManager);
  registerQueryTools(server, firestoreClient, permissionManager);
}