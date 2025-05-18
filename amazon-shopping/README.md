# Amazon Shopping MCP Server [Work in Progress]

> ⚠️ **IMPORTANT**: This package is currently under development and not yet ready for production use. The current version is a work in progress and may contain incomplete features or breaking changes.

A Model Context Protocol (MCP) server that allows you to search for Amazon products, view details, add items to cart, and check out - all through Claude or any other MCP client.

## Features

- 🔍 **Product Search**: Search Amazon's vast catalog with keywords and category filtering
- 📋 **Product Details**: Get comprehensive details about any product using its ASIN
- 🛒 **Shopping Cart Management**: Create carts, add items, and view cart contents
- 💳 **Checkout**: Complete purchases through Amazon's official checkout

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- Amazon Product Advertising API access (requires Amazon Associate account)
- Environment variables for Amazon API credentials

## Installation

1. Clone this repository or download the source code:

```bash
git clone https://github.com/yourusername/amazon-shopping-mcp.git
cd amazon-shopping-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create an `.env` file with your Amazon Product Advertising API credentials:

```bash
cp .env.example .env
```

Edit the `.env` file to include your Amazon API credentials:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ASSOCIATE_TAG=your_associate_tag
AWS_REGION=US
```

4. Build the server:

```bash
npm run build
```

## Usage with Claude for Desktop

1. Configure Claude for Desktop to use this MCP server by adding it to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "amazon-shopping": {
      "command": "node",
      "args": ["/absolute/path/to/amazon-shopping-mcp/build/src/index.js"],
      "env": {
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key",
        "AWS_ASSOCIATE_TAG": "your_associate_tag",
        "AWS_REGION": "US"
      }
    }
  }
}
```

2. Restart Claude for Desktop and you will see the "amazon-shopping" MCP server connected.

## Available MCP Tools

### Product Tools

- **search-products**: Search for products on Amazon
  - Parameters:
    - `keywords`: Search terms (required)
    - `category`: Product category (optional, default: "All")
    - `sortBy`: Sort order (optional, default: "relevancerank")
    - `page`: Result page number (optional, default: 1)

- **get-product-details**: Get detailed information about a product
  - Parameters:
    - `asin`: Amazon Standard Identification Number (required)

### Cart Tools

- **create-cart**: Create a new shopping cart with an item
  - Parameters:
    - `asin`: Product ASIN (required)
    - `quantity`: Quantity to add (optional, default: 1)

- **add-to-cart**: Add an item to your existing cart
  - Parameters:
    - `asin`: Product ASIN (required)
    - `quantity`: Quantity to add (optional, default: 1)

- **view-cart**: View your current cart contents
  - No parameters required

- **checkout**: Get a link to complete your purchase on Amazon
  - No parameters required

## Example Conversation

Here's an example of how you might use the MCP server with Claude:

```
You: Can you find me some wireless headphones on Amazon?

Claude: I'll search for wireless headphones on Amazon for you.
[Uses search-products tool with keywords="wireless headphones"]

You: Show me more details about the second one in the list.

Claude: Here are the details for those headphones.
[Uses get-product-details tool with the ASIN]

You: Add those to my cart please.

Claude: I've added the headphones to your cart.
[Uses create-cart or add-to-cart tool]

You: What's in my cart now?

Claude: Here's what's currently in your cart.
[Uses view-cart tool]

You: I'd like to check out now.

Claude: Here's a link to complete your purchase on Amazon.
[Uses checkout tool and provides the checkout URL]
```

## Limitations

- Amazon Product Advertising API has a rate limit (typically 1 request per second)
- Digital items like Kindle eBooks and MP3s cannot be added to carts via the API
- You must complete the actual purchase on Amazon's website
- This server requires Amazon Associate credentials, so you must be part of the Amazon Associates program

## Getting Amazon Product Advertising API Access

1. Sign up for the [Amazon Associates Program](https://affiliate-program.amazon.com/)
2. Once approved as an Associate, log in to your Amazon Associates account
3. Go to "Tools" and select "Product Advertising API"
4. Click "Join" to register for the API
5. After registration, download your credentials or copy your Access Key and Secret Key

## License

MIT