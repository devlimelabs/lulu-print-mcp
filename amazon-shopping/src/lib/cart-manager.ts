// Simple in-memory cart state manager
// Note: In a production environment, you would want to use a database or persistent storage

interface CartState {
  cartId: string;
  hmac: string;
  items: CartItem[];
  purchaseUrl: string;
  createdAt: Date;
}

interface CartItem {
  asin: string;
  title: string;
  quantity: number;
  price: string;
  imageUrl?: string;
}

class CartManager {
  private currentCart: CartState | null = null;

  // Update or set the current cart state
  setCart(
    cartId: string,
    hmac: string,
    items: CartItem[],
    purchaseUrl: string
  ): void {
    this.currentCart = {
      cartId,
      hmac,
      items,
      purchaseUrl,
      createdAt: new Date(),
    };
  }

  // Get the current cart
  getCart(): CartState | null {
    return this.currentCart;
  }

  // Check if a cart exists
  hasCart(): boolean {
    return this.currentCart !== null;
  }

  // Clear the current cart
  clearCart(): void {
    this.currentCart = null;
  }

  // Update items in the current cart
  updateItems(items: CartItem[]): void {
    if (this.currentCart) {
      this.currentCart.items = items;
    }
  }

  // Add an item to the cart (for local tracking before API call)
  addItem(item: CartItem): void {
    if (!this.currentCart) {
      throw new Error("No active cart");
    }

    // Check if item already exists
    const existingItemIndex = this.currentCart.items.findIndex(
      (i) => i.asin === item.asin
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      this.currentCart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      this.currentCart.items.push(item);
    }
  }
}

// Export a singleton instance
export const cartManager = new CartManager();
