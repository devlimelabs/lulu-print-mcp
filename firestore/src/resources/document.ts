import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerDocumentResources(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Register document resource template
  server.resource(
    "document",
    new ResourceTemplate("firestore://collection/{collectionId}/document/{documentId}", {
      list: {
        resourceNameHint: "Documents",
        description: "Firestore documents"
      }
    }),
    async (uri, { collectionId, documentId }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'read')) {
        throw new Error(`Access denied to document: ${collectionId}/${documentId}`);
      }
      
      try {
        const document = await firestoreClient.getDocument(collectionId, documentId);
        
        if (!document) {
          throw new Error(`Document ${documentId} not found in collection ${collectionId}`);
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(document, null, 2),
            mimeType: "application/json"
          }]
        };
      } catch (error) {
        console.error(`Error reading document ${collectionId}/${documentId}:`, error);
        throw new Error(`Failed to read document ${collectionId}/${documentId}: ${error.message}`);
      }
    }
  );
}