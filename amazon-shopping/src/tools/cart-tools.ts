import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  createCart, 
  addToCart, 
  viewCart, 
  generateCheckoutUrl 
} from "../lib/amazon-client.js";
import { cartManager } from "../lib/cart-manager.js";

// Register cart-related tools
export function registerCartTools(server: McpServer): void {
  // Create cart tool
  server.tool(
    "create-cart",
    "Create a new Amazon shopping cart with an item",
    {
      asin: z.string().describe("Amazon Standard Identification Number (ASIN)"),
      quantity: z.number().min(1).max(999).default(1).describe("Quantity to add"),
    },
    async ({ asin, quantity }) => {
      try {
        // Create a new cart with the item
        const response = await createCart([{ asin, quantity }]);
        
        // Extract cart information
        const cartResponse = response?.CartCreateResponse?.Cart;
        
        if (!cartResponse) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Failed to create cart. No cart information returned.",
              },
            ],
          };
        }

        const cartId = cartResponse.CartId;
        const hmac = cartResponse.HMAC;
        const purchaseUrl = cartResponse.PurchaseURL;
        
        // Get item information
        const cartItems = cartResponse.CartItems?.CartItem;
        const items = Array.isArray(cartItems) 
          ? cartItems.map(formatCartItem) 
          : cartItems ? [formatCartItem(cartItems)] : [];

        // Save cart state
        cartManager.setCart(cartId, hmac, items, purchaseUrl);

        return {
          content: [
            {
              type: "text",
              text: `Cart created successfully!\n\nItems in cart:\n${
                items.map(item => `• ${item.title} (${item.quantity}x) - ${item.price}`).join("\n")
              }\n\nUse the view-cart tool to see your cart or checkout to complete your purchase.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error creating cart:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error creating cart: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // Add to cart tool
  server.tool(
    "add-to-cart",
    "Add an item to your existing Amazon shopping cart",
    {
      asin: z.string().describe("Amazon Standard Identification Number (ASIN)"),
      quantity: z.number().min(1).max(999).default(1).describe("Quantity to add"),
    },
    async ({ asin, quantity }) => {
      try {
        // Check if we have an active cart
        if (!cartManager.hasCart()) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "No active cart found. Please create a cart first using the create-cart tool.",
              },
            ],
          };
        }

        const cart = cartManager.getCart()!;
        
        // Add item to the cart
        const response = await addToCart(cart.cartId, cart.hmac, [{ asin, quantity }]);
        
        // Extract cart information
        const cartResponse = response?.CartAddResponse?.Cart;
        
        if (!cartResponse) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Failed to add item to cart. No cart information returned.",
              },
            ],
          };
        }

        // Get updated cart information
        const cartItems = cartResponse.CartItems?.CartItem;
        const items = Array.isArray(cartItems) 
          ? cartItems.map(formatCartItem) 
          : cartItems ? [formatCartItem(cartItems)] : [];

        // Update cart state
        cartManager.updateItems(items);

        return {
          content: [
            {
              type: "text",
              text: `Item added to cart successfully!\n\nUpdated cart:\n${
                items.map(item => `• ${item.title} (${item.quantity}x) - ${item.price}`).join("\n")
              }`,
            },
          ],
        };
      } catch (error) {
        console.error("Error adding to cart:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error adding to cart: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // View cart tool
  server.tool(
    "view-cart",
    "View your current Amazon shopping cart contents",
    {},
    async () => {
      try {
        // Check if we have an active cart
        if (!cartManager.hasCart()) {
          return {
            content: [
              {
                type: "text",
                text: "No active cart found. Please create a cart first using the create-cart tool.",
              },
            ],
          };
        }

        const cart = cartManager.getCart()!;
        
        // Refresh cart information
        const response = await viewCart(cart.cartId, cart.hmac);
        
        // Extract cart information
        const cartResponse = response?.CartGetResponse?.Cart;
        
        if (!cartResponse) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Failed to view cart. No cart information returned.",
              },
            ],
          };
        }

        // Get updated cart information
        const cartItems = cartResponse.CartItems?.CartItem;
        const items = Array.isArray(cartItems) 
          ? cartItems.map(formatCartItem) 
          : cartItems ? [formatCartItem(cartItems)] : [];
          
        // Get cart subtotal
        const subtotal = cartResponse.SubTotal?.FormattedPrice || "N/A";

        // Update cart state
        cartManager.updateItems(items);

        return {
          content: [
            {
              type: "text",
              text: `Current Cart Contents:\n\n${
                items.length > 0 
                  ? items.map(item => `• ${item.title} (${item.quantity}x) - ${item.price}`).join("\n")
                  : "Your cart is empty."
              }\n\nSubtotal: ${subtotal}\n\nUse the checkout tool to complete your purchase.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error viewing cart:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error viewing cart: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // Checkout tool
  server.tool(
    "checkout",
    "Proceed to Amazon checkout with your current cart",
    {},
    async () => {
      try {
        // Check if we have an active cart
        if (!cartManager.hasCart()) {
          return {
            content: [
              {
                type: "text",
                text: "No active cart found. Please create a cart first using the create-cart tool.",
              },
            ],
          };
        }

        const cart = cartManager.getCart()!;
        
        // Generate the checkout URL
        const checkoutUrl = generateCheckoutUrl(cart.cartId, cart.hmac);

        return {
          content: [
            {
              type: "text",
              text: `Ready to check out! Your Amazon cart is ready for purchase.\n\nCheckout URL: ${checkoutUrl}\n\nPlease click the link above to complete your purchase on Amazon's website.`,
            },
          ],
        };
      } catch (error) {
        console.error("Error during checkout:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Error during checkout: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}

// Helper function to format a cart item
function formatCartItem(item: any): any {
  return {
    asin: item.ASIN || "",
    title: item.Title || "Unknown Item",
    quantity: parseInt(item.Quantity, 10) || 0,
    price: item.Price?.FormattedPrice || "Price not available",
    imageUrl: item.ImageURL || "",
  };
}
