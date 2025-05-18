import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FirestoreClient } from "../firestore/client.js";
import { PermissionManager } from "../permissions/manager.js";

export function registerQueryTools(
  server: McpServer,
  firestoreClient: FirestoreClient,
  permissionManager: PermissionManager
) {
  // Query collection tool
  server.tool(
    "firestore-query-collection",
    "Query documents in a Firestore collection",
    {
      collectionId: z.string().describe("The ID of the collection"),
      filters: z.array(z.object({
        field: z.string().describe("Field path to filter on"),
        operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "array-contains", "in", "array-contains-any", "not-in"])
          .describe("Operator for comparison"),
        value: z.any().describe("Value to compare against")
      })).describe("Array of filter conditions"),
      limit: z.number().optional().describe("Maximum number of results to return"),
      orderBy: z.object({
        field: z.string().describe("Field to order by"),
        direction: z.enum(["asc", "desc"]).describe("Sort direction")
      }).optional().describe("Order specification")
    },
    async ({ collectionId, filters, limit, orderBy }) => {
      // Check permissions
      if (!permissionManager.hasPermission(collectionId, 'query')) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: `Access denied to query collection: ${collectionId}`
          }]
        };
      }
      
      try {
        const documents = await firestoreClient.queryCollection(
          collectionId,
          filters,
          limit,
          orderBy
        );
        
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
            text: `Error querying collection ${collectionId}: ${error.message}`
          }]
        };
      }
    }
  );
}