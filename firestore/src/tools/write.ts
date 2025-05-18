import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerWriteTools(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Create document tool
  server.tool(
    "firestore-create-document",
    "Create a new document in Firestore",
    {
      collectionId: z.string().describe("The ID of the collection"),
      documentId: z.string().optional().describe("Optional document ID (auto-generated if not provided)"),
      data: z.record(z.any()).describe("The document data")
    },
    async ({ collectionId, documentId, data }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'write')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to create document in collection: ${collectionId}`
          }]
        };
      }
      
      try {
        const document = await firestoreClient.createDocument(collectionId, data, documentId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(document, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Error creating document in ${collectionId}: ${error.message}`
          }]
        };
      }
    }
  );
  
  // Update document tool
  server.tool(
    "firestore-update-document",
    "Update an existing Firestore document",
    {
      collectionId: z.string().describe("The ID of the collection"),
      documentId: z.string().describe("The ID of the document to update"),
      data: z.record(z.any()).describe("The document data to update")
    },
    async ({ collectionId, documentId, data }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'write')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to update document: ${collectionId}/${documentId}`
          }]
        };
      }
      
      try {
        const document = await firestoreClient.updateDocument(collectionId, documentId, data);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(document, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Error updating document ${collectionId}/${documentId}: ${error.message}`
          }]
        };
      }
    }
  );
}