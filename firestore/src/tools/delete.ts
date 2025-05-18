import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerDeleteTools(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Delete document tool
  server.tool(
    "firestore-delete-document",
    "Delete a document from Firestore",
    {
      collectionId: z.string().describe("The ID of the collection"),
      documentId: z.string().describe("The ID of the document to delete")
    },
    async ({ collectionId, documentId }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'delete')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to delete document: ${collectionId}/${documentId}`
          }]
        };
      }
      
      try {
        await firestoreClient.deleteDocument(collectionId, documentId);
        
        return {
          content: [{
            type: "text",
            text: `Successfully deleted document ${documentId} from collection ${collectionId}`
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Error deleting document ${collectionId}/${documentId}: ${error.message}`
          }]
        };
      }
    }
  );
}