import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts, getProductDetails } from "../lib/amazon-client.js";

// Register product-related tools
export function registerProductTools(server: McpServer): void {
  // Search products tool
  server.tool(
    "search-products",
    "Search for products on Amazon",
    {
      keywords: z.string().describe("Search keywords"),
      category: z
        .string()
        .optional()
        .describe("Product category (e.g., Books, Electronics)"),
      sortBy: z
        .enum([
          "relevancerank",
          "salesrank",
          "price-asc-rank",
          "price-desc-rank",
          "reviewrank",
        ])
        .optional()
        .describe("Sort order for results"),
      page: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe("Result page number (1-10)"),
    },
    async ({ keywords, category = "All", sortBy = "relevancerank", page = 1 }) => {
      try {
        const response = await searchProducts(keywords, {
          searchIndex: category,
          sort: sortBy,
          page,
        });

        // Parse the response
        const items = response?.ItemSearchResponse?.Items?.Item;
        
        if (!items) {
          return {
            content: [
              {
                type: "text",
                text: "No products found for your search criteria.",
              },
            ],
          };
        }

        // Format the search results
        const formattedResults = Array.isArray(items)
          ? items.map(formatProductItem)
          : [formatProductItem(items)]; // Handle case when only one item is returned

        return {
          content: [
            {
              type: "text",
              text: `Found ${formattedResults.length} products:\n\n${formattedResults.join(
                "\n\n"
              )}`,
            },
          ],
        };
      } catch (error) {
        console.error("Error searching products:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error searching products: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // Get product details tool
  server.tool(
    "get-product-details",
    "Get detailed information about a product by ASIN",
    {
      asin: z.string().describe("Amazon Standard Identification Number (ASIN)"),
    },
    async ({ asin }) => {
      try {
        const response = await getProductDetails(asin);
        
        const item = response?.ItemLookupResponse?.Items?.Item;
        
        if (!item) {
          return {
            content: [
              {
                type: "text",
                text: `Product with ASIN ${asin} not found.`,
              },
            ],
          };
        }

        // Format the product details
        const productDetails = formatProductDetails(item);

        return {
          content: [
            {
              type: "text",
              text: productDetails,
            },
          ],
        };
      } catch (error) {
        console.error("Error getting product details:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error getting product details: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}

// Helper function to format a product item from search results
function formatProductItem(item: any): string {
  const title = item.ItemAttributes?.Title || "Unknown Title";
  const asin = item.ASIN || "Unknown ASIN";
  const price = item.Offers?.Offer?.OfferListing?.Price?.FormattedPrice || "Price not available";
  const url = item.DetailPageURL || "";
  
  return `• Title: ${title}\n  ASIN: ${asin}\n  Price: ${price}\n  URL: ${url}`;
}

// Helper function to format detailed product information
function formatProductDetails(item: any): string {
  const title = item.ItemAttributes?.Title || "Unknown Title";
  const asin = item.ASIN || "Unknown ASIN";
  const brand = item.ItemAttributes?.Brand || item.ItemAttributes?.Manufacturer || "Unknown Brand";
  const price = item.Offers?.Offer?.OfferListing?.Price?.FormattedPrice || "Price not available";
  const url = item.DetailPageURL || "";
  const imageUrl = item.LargeImage?.URL || item.MediumImage?.URL || "No image available";
  const availability = item.Offers?.Offer?.OfferListing?.Availability || "Unknown availability";
  const rating = item.CustomerReviews?.AverageRating || "No ratings";
  const features = item.ItemAttributes?.Feature;
  
  // Format product features if available
  let featuresText = "";
  if (features) {
    if (Array.isArray(features)) {
      featuresText = `\n\nFeatures:\n${features.map(f => `• ${f}`).join("\n")}`;
    } else {
      featuresText = `\n\nFeature: ${features}`;
    }
  }

  return `Product Details:
Title: ${title}
ASIN: ${asin}
Brand: ${brand}
Price: ${price}
Availability: ${availability}
Rating: ${rating}
URL: ${url}
Image: ${imageUrl}${featuresText}`;
}
