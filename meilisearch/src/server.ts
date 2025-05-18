import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MeiliSearch } from "meilisearch";
import { createLogger } from "@devlimelabs/master-mcps-core";

// Logging
const logger = createLogger({ scope: 'meilisearch-mcp' });

// Configuration 
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "";

// Create client instance
const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_KEY
});

// Create MCP server
export const server = new McpServer({
  name: "meilisearch",
  version: "1.0.0"
});

// Add resources
server.resource(
  "indexes",
  "meilisearch://indexes",
  async (uri) => {
    try {
      const { results } = await client.getIndexes();
      const indexesInfo = results.map(index => 
        `${index.uid}: ${index.primaryKey || 'No primary key'} (${index.documentsCount} documents)`
      ).join('\n');
      
      return {
        contents: [{
          uri: uri.href,
          text: indexesInfo || "No indexes found",
          mimeType: "text/plain"
        }]
      };
    } catch (error) {
      logger.error("Failed to fetch indexes", error);
      throw new Error("Failed to fetch Meilisearch indexes");
    }
  }
);

// Add tools
server.tool(
  "search",
  {
    indexName: z.string().description("Name of the index to search"),
    query: z.string().description("Search query"),
    limit: z.number().optional().description("Maximum number of results (default: 20)"),
    offset: z.number().optional().description("Offset for pagination (default: 0)")
  },
  async ({ indexName, query, limit = 20, offset = 0 }) => {
    try {
      const index = client.index(indexName);
      const searchResults = await index.search(query, {
        limit,
        offset
      });
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(searchResults, null, 2)
        }]
      };
    } catch (error) {
      logger.error(`Search failed for ${indexName}`, error);
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error searching index: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);