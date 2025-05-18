import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerReadTools(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // List collections tool
  server.tool(
    "firestore-list-collections",
    "List Firestore collections",
    {},
    async () => {
      try {
        const collections = await firestoreClient.getCollections();
        
        // Filter collections based on permissions
        const allowedCollections = collections.filter(collectionId => 
          permissionManager.hasPermission(collectionId, 'read')
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(allowedCollections, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Error listing collections: ${error.message}`
          }]
        };
      }
    }
  );
  
  // Get collection documents tool
  server.tool(
    "firestore-get-collection",
    "Get documents from a Firestore collection",
    {
      collectionId: z.string().describe("The ID of the collection")
    },
    async ({ collectionId }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'read')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to collection: ${collectionId}`
          }]
        };
      }
      
      try {
        const documents = await firestoreClient.getCollection(collectionId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(documents, null, 2)
          }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Error getting collection ${collectionId}: ${error.message}`
          }]
        };
      }
    }
  );
  
  // Get document tool
  server.tool(
    "firestore-get-document",
    "Get a document from Firestore",
    {
      collectionId: z.string().describe("The ID of the collection"),
      documentId: z.string().describe("The ID of the document")
    },
    async ({ collectionId, documentId }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'read')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to document: ${collectionId}/${documentId}`
          }]
        };
      }
      
      try {
        const document = await firestoreClient.getDocument(collectionId, documentId);
        
        if (!document) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: `Document ${documentId} not found in collection ${collectionId}`
            }]
          };
        }
        
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
            text: `Error getting document ${collectionId}/${documentId}: ${error.message}`
          }]
        };
      }
    }
  );
}