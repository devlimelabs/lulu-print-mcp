# Tailwind Designer MCP Server [Work in Progress]

> ⚠️ **IMPORTANT**: This package is currently under development and not yet ready for production use. The current version is a work in progress and may contain incomplete features or breaking changes.

A Model Context Protocol (MCP) server that helps Claude and other AI agents create, edit, and preview Tailwind CSS designs. This MCP server provides tools for generating Tailwind components, visualizing designs, and optimizing CSS.

## Features

- **Component Design**: Generate Tailwind CSS components from descriptions
- **CSS Optimization**: Identify and remove redundant classes
- **Visual Preview**: Generate visual previews of Tailwind components
- **Design System Compatibility**: Ensure components work with existing design systems
- **Code Conversion**: Convert CSS/SCSS/HTML to Tailwind equivalents
- **Responsive Analysis**: Check components for responsive behavior

## Installation

```bash
# Install the package globally
npm install -g @devlimelabs/tailwind-designer-mcp

# Start the server
tailwind-designer-mcp
```

## Usage with Claude Desktop

Add this MCP server to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "tailwind-designer": {
      "command": "tailwind-designer-mcp"
    }
  }
}
```

## Available Tools

### design-component

Design a new Tailwind component from a description:

```
design-component
  description: "A responsive card with image, title, and description"
  theme: "dark" # Optional, defaults to "light"
  framework: "react" # Optional: "react", "vue", "angular", or "html"
```

### preview-component

Generate a visual preview of a Tailwind component:

```
preview-component
  html: "<div class=\"p-4 bg-blue-500 text-white\">Hello World</div>"
  width: 400 # Optional, defaults to 800
  height: 300 # Optional, defaults to 600
```

### optimize-classes

Optimize Tailwind classes for a component:

```
optimize-classes
  html: "<div class=\"p-4 pt-4 m-2 m-2 flex flex-row\">Content</div>"
```

### convert-to-tailwind

Convert plain CSS, SCSS, or HTML with styles to Tailwind:

```
convert-to-tailwind
  code: "div { padding: 1rem; margin: 0.5rem; background-color: #3b82f6; }"
  format: "css" # or "scss", "html"
```

### check-responsiveness

Check component for responsive behavior:

```
check-responsiveness
  html: "<div class=\"p-4 md:p-6 lg:p-8\">Responsive content</div>"
  breakpoints: ["sm", "md", "lg", "xl", "2xl"] # Optional
```

### extract-colors

Extract and standardize colors from a design:

```
extract-colors
  html: "<div style=\"color: #3b82f6\">Blue text</div>"
  format: "tailwind" # or "hex", "rgb"
```

## Example Use Cases

### Creating a Newsletter Signup Form

```
User: Can you create a newsletter signup form with Tailwind CSS?

Claude: I'll design a newsletter signup form using Tailwind CSS.

[Uses design-component tool with appropriate description]

Here's a responsive newsletter signup form using Tailwind CSS:

```html
<div class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
  <h2 class="text-2xl font-bold text-gray-800 mb-4">Subscribe to our Newsletter</h2>
  <p class="text-gray-600 mb-6">Get the latest updates and offers delivered directly to your inbox.</p>
  
  <form class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
      <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="you@example.com" required>
    </div>
    
    <div class="flex items-start">
      <input id="privacy" type="checkbox" class="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1">
      <label for="privacy" class="ml-2 block text-sm text-gray-600">
        I agree to the <a href="#" class="text-blue-600 hover:underline">privacy policy</a>
      </label>
    </div>
    
    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out">
      Subscribe Now
    </button>
  </form>
</div>
```

[Uses preview-component tool to show the result]

Would you like me to customize this form further or optimize the Tailwind classes?
```

### Converting Existing CSS to Tailwind

```
User: Can you convert this CSS to Tailwind for me?
.button {
  display: flex;
  padding: 12px 24px;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.button:hover {
  background-color: #2563eb;
}

Claude: I'll convert this CSS to Tailwind classes for you.

[Uses convert-to-tailwind tool with the CSS]

Here's your button CSS converted to Tailwind:

```html
<button class="flex px-6 py-3 bg-blue-500 text-white rounded font-semibold shadow-md hover:bg-blue-600">
  Button Text
</button>
```

The Tailwind classes match your original CSS:
- `flex` = display: flex
- `px-6 py-3` = padding: 12px 24px (3rem = 12px, 6rem = 24px)
- `bg-blue-500` = background-color: #3b82f6
- `text-white` = color: white
- `rounded` = border-radius: 4px (Tailwind's default rounded size)
- `font-semibold` = font-weight: 600
- `shadow-md` = box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
- `hover:bg-blue-600` = on hover, background-color: #2563eb

Would you like me to customize this conversion further?
```

## Development

```bash
# Clone the repository
git clone https://github.com/devlimelabs/master-mcps.git
cd master-mcps

# Install dependencies
pnpm install

# Build the package
pnpm -F @devlimelabs/tailwind-designer-mcp build

# Run tests
pnpm -F @devlimelabs/tailwind-designer-mcp test
```

## License

MIT