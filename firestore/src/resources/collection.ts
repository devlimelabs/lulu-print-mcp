import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerCollectionResources(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Register collection resource template
  server.resource(
    "collection",
    new ResourceTemplate("firestore://collection/{collectionId}", {
      list: {
        resourceNameHint: "Collections",
        description: "List of Firestore collections"
      }
    }),
    async (uri, { collectionId }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'read')) {
        throw new Error(`Access denied to collection: ${collectionId}`);
      }
      
      try {
        const documents = await firestoreClient.getCollection(collectionId);
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(documents, null, 2),
            mimeType: "application/json"
          }]
        };
      } catch (error) {
        console.error(`Error reading collection ${collectionId}:`, error);
        throw new Error(`Failed to read collection ${collectionId}: ${error.message}`);
      }
    }
  );
}