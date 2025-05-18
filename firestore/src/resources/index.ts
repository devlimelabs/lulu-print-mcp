import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";
import { registerCollectionResources } from "./collection.js";
import { registerDocumentResources } from "./document.js";

export function registerResources(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Register collection listing resource
  server.resource(
    "collections",
    "firestore://collections",
    async (uri) => {
      try {
        const collections = await firestoreClient.getCollections();
        
        // Filter collections based on permissions
        const allowedCollections = collections.filter(collectionId => 
          permissionManager.hasPermission(collectionId, 'read')
        );
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(allowedCollections, null, 2),
            mimeType: "application/json"
          }]
        };
      } catch (error) {
        console.error("Error listing collections:", error);
        throw new Error(`Failed to list collections: ${error.message}`);
      }
    }
  );
  
  // Register collection and document resources
  registerCollectionResources(server, firestoreClient, permissionManager);
  registerDocumentResources(server, firestoreClient, permissionManager);
}