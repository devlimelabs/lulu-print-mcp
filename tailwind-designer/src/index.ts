#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "path";
import crypto from "crypto";
import { 
  DesignSite, 
  ComponentType, 
  ColorScheme, 
  ComplexityLevel,
  SavedImage
} from "./types.js";
import { 
  CONFIG,
  initializeStorage, 
  getCollection, 
  saveToCollection, 
  removeFromCollection 
} from "./utils/storage.js";
import { 
  searchDesigns, 
  getTrendingDesigns, 
  downloadImage 
} from "./services/designScraper.js";

// Create server instance
const server = new McpServer({
  name: "TailwindDesigner",
  version: "1.0.0"
});

// ===== TOOLS =====

// Search for designs
server.tool(
  "search-designs",
  {
    site: z.enum(["dribbble", "behance", "siteinspire"]).describe("Design site to search"),
    query: z.string().describe("Search query"),
    limit: z.number().min(1).max(20).default(5).describe("Maximum number of results to return")
  },
  async ({ site, query, limit }) => {
    try {
      const response = await searchDesigns(site, query, limit);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error searching designs on ${site}: ${error.message}`
          }
        ]
      };
    }
  }
);

// Save design to collection
server.tool(
  "save-design",
  {
    imageUrl: z.string().url().describe("URL of the design image"),
    sourceUrl: z.string().url().describe("URL of the source page"),
    sourceSite: z.enum(["dribbble", "behance", "siteinspire"]).describe("Source site name"),
    title: z.string().describe("Title for the saved design"),
    tags: z.array(z.string()).default([]).describe("Tags to categorize the design")
  },
  async ({ imageUrl, sourceUrl, sourceSite, title, tags }) => {
    try {
      // Download the image
      const localPath = await downloadImage(imageUrl);
      
      // Create image record
      const image: SavedImage = {
        id: path.basename(localPath, path.extname(localPath)),
        url: imageUrl,
        sourceUrl,
        sourceSite,
        localPath,
        title,
        timestamp: new Date().toISOString(),
        tags
      };
      
      // Save to collection
      await saveToCollection(image);
      
      return {
        content: [
          {
            type: "text",
            text: `Design "${title}" saved successfully with ID: ${image.id}`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error saving design: ${error.message}`
          }
        ]
      };
    }
  }
);

// Remove design from collection
server.tool(
  "remove-design",
  {
    imageId: z.string().describe("ID of the design to remove")
  },
  async ({ imageId }) => {
    try {
      const removed = await removeFromCollection(imageId);
      
      if (removed) {
        return {
          content: [
            {
              type: "text",
              text: `Design with ID ${imageId} was removed successfully`
            }
          ]
        };
      } else {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Design with ID ${imageId} was not found in the collection`
            }
          ]
        };
      }
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error removing design: ${error.message}`
          }
        ]
      };
    }
  }
);

// Generate Tailwind component from saved designs
server.tool(
  "generate-tailwind-component",
  {
    imageIds: z.array(z.string()).min(1).describe("IDs of inspiration images"),
    componentType: z.enum([
      "card", 
      "button", 
      "navbar", 
      "hero", 
      "footer", 
      "form", 
      "sidebar", 
      "modal", 
      "pricing", 
      "feature"
    ]).describe("Type of component to generate"),
    colorScheme: z.enum([
      "match", 
      "light", 
      "dark", 
      "colorful", 
      "monochrome", 
      "brand"
    ]).default("match").describe("Color scheme to use"),
    complexity: z.enum(["simple", "medium", "complex"]).default("medium").describe("Complexity level of the component"),
    responsive: z.boolean().default(true).describe("Whether to make the component fully responsive")
  },
  async ({ imageIds, componentType, colorScheme, complexity, responsive }) => {
    try {
      // Load the collection
      const collection = await getCollection();
      
      // Find the specified images
      const selectedImages = collection.images.filter(img => imageIds.includes(img.id));
      
      if (selectedImages.length === 0) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "None of the specified image IDs were found in your collection"
            }
          ]
        };
      }
      
      // For each found image, create a description of it for the LLM
      const imageDescriptions = selectedImages.map(img => ({
        id: img.id,
        title: img.title,
        source: img.sourceSite,
        sourceUrl: img.sourceUrl,
        tags: img.tags
      }));
      
      // In a real implementation, we would generate an actual Tailwind component here
      // based on the visual analysis of the images and the requested parameters
      // For now, we'll return a placeholder message
      
      return {
        content: [
          {
            type: "text",
            text: `Design Inspiration Tailwind Component Generator

Based on ${selectedImages.length} inspiration image(s):
${selectedImages.map(img => `- ${img.title} (${img.id})`).join('\n')}

Component Request:
- Type: ${componentType}
- Color Scheme: ${colorScheme}
- Complexity: ${complexity}
- Responsive: ${responsive ? 'Yes' : 'No'}

The server would now:
1. Analyze the visual attributes of your selected inspiration images
2. Extract color schemes, layouts, and design patterns
3. Generate a Tailwind CSS component that incorporates these elements
4. Provide the complete HTML + Tailwind CSS code ready to use

For this demonstration, we would return the complete component code here.
`
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error generating Tailwind component: ${error.message}`
          }
        ]
      };
    }
  }
);

// Get trending designs
server.tool(
  "get-trending-designs",
  {
    site: z.enum(["dribbble", "behance", "siteinspire"]).describe("Design site to check"),
    limit: z.number().min(1).max(20).default(5).describe("Maximum number of results to return")
  },
  async ({ site, limit }) => {
    try {
      const response = await getTrendingDesigns(site, limit);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error fetching trending designs from ${site}: ${error.message}`
          }
        ]
      };
    }
  }
);

// ===== RESOURCES =====

// Collection resource - view all saved designs
server.resource(
  "design-collection",
  "collection://designs",
  async (uri) => {
    try {
      const collection = await getCollection();
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(collection, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error("Error retrieving design collection:", error);
      throw new Error(`Failed to retrieve design collection: ${error.message}`);
    }
  }
);

// Single design resource - view a specific saved design
server.resource(
  "design-detail",
  new ResourceTemplate("design://{imageId}", { list: undefined }),
  async (uri, { imageId }) => {
    try {
      const collection = await getCollection();
      const image = collection.images.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error(`Design with ID ${imageId} not found`);
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(image, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      console.error(`Error retrieving design with ID ${imageId}:`, error);
      throw new Error(`Failed to retrieve design: ${error.message}`);
    }
  }
);

// ===== PROMPTS =====

// Prompt for generating design search queries
server.prompt(
  "design-search-prompt",
  {
    designGoal: z.string().describe("What you're trying to design"),
    style: z.string().optional().describe("Specific style preferences (optional)"),
    industry: z.string().optional().describe("Industry or domain (optional)")
  },
  ({ designGoal, style, industry }) => {
    let prompt = `I'm looking for design inspiration for a ${designGoal}`;
    
    if (style) {
      prompt += ` with a ${style} aesthetic`;
    }
    
    if (industry) {
      prompt += ` for the ${industry} industry`;
    }
    
    prompt += `. Can you help me search for relevant designs on Dribbble, Behance, and SiteInspire? Please suggest specific search terms I could use for each platform.`;
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: prompt
        }
      }]
    };
  }
);

// Prompt for component design briefing
server.prompt(
  "component-design-brief",
  {
    componentType: z.string().describe("Type of component to design"),
    purpose: z.string().describe("Purpose and functionality of the component"),
    audience: z.string().describe("Target audience"),
    stylePreferences: z.string().optional().describe("Style preferences (optional)")
  },
  ({ componentType, purpose, audience, stylePreferences }) => {
    let prompt = `I need to design a ${componentType} component that ${purpose}. `;
    prompt += `The target audience is ${audience}. `;
    
    if (stylePreferences) {
      prompt += `Style preferences: ${stylePreferences}. `;
    }
    
    prompt += `I want to browse some design inspiration sites to find reference designs, then use those to generate a Tailwind CSS component. Can you help me with this process?`;
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: prompt
        }
      }]
    };
  }
);

// ===== SERVER INITIALIZATION =====

async function main() {
  try {
    await initializeStorage();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Tailwind Designer MCP Server started");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();