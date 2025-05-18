# Domain Radar MCP Server

A Model Context Protocol (MCP) server that provides domain name information, availability checking, and trend analysis for Claude and other MCP clients.

## Features

- **Domain Availability**: Check if domains are available for registration
- **Expiring Domains**: Find domains that are about to expire within 24 hours
- **Expired Domains**: Discover recently expired domains that may be available for registration
- **Domain Filtering**: Search domains by keywords and categories
- **Domain Information**: View detailed information about domains including estimated values and traffic

## Installation

### Global Installation

```bash
# Install the package globally
npm install -g @devlimelabs/domain-radar-mcp

# Start the server
domain-radar-mcp
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/devlimelabs/domain-radar-mcp.git
cd domain-radar-mcp

# Install dependencies
npm install

# Set up development environment
npm run setup:dev

# Start the development server
npm run dev
```

### Docker Installation

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run the Docker image directly
docker build -t domain-radar-mcp .
docker run -p 3000:3000 domain-radar-mcp
```

## Configuration

The Domain Radar MCP uses **WhoisXML API** for domain availability checking. Follow these steps to set it up:

### 1. Get a WhoisXML API Key

1. Sign up for a free account at [WhoisXML API](https://domain-availability.whoisxmlapi.com/api/signup)
2. You'll receive 100 free domain availability queries per month
3. After signing up, find your API key in your dashboard

### 2. Configure Environment Variables

```bash
# Create a configuration file
cp .env.example .env
```

Edit the `.env` file with your WhoisXML API key:

```
# Required: Your WhoisXML API key
DOMAIN_API_KEY=YOUR_WHOISXML_API_KEY

# WhoisXML API Endpoint (default is already configured)
AVAILABILITY_API_URL=https://domain-availability.whoisxmlapi.com/api/v1

# NOTE: Expired/Expiring domains currently use mock data
# WhoisXML requires data feed subscription for these features
EXPIRATION_API_URL=https://api.example.com/domains/expiring
EXPIRED_API_URL=https://api.example.com/domains/expired

# Top-level domains to check (comma-separated)
TOP_LEVEL_DOMAINS=.com,.net,.org,.io,.co,.dev,.app,.ai

# Cache time-to-live in milliseconds (default: 15 minutes)
CACHE_TTL=900000
```

### Important Notes

- **Domain Availability**: Fully functional with WhoisXML API
- **Expiring Domains**: Currently returns mock data (WhoisXML requires data feed subscription)
- **Expired Domains**: Currently returns mock data (WhoisXML requires data feed subscription)

For production use with expired/expiring domains, consider:
1. Subscribing to WhoisXML's data feeds
2. Using an alternative API that provides REST endpoints for these features
3. Implementing a custom solution with domain monitoring

## Usage with Claude Desktop

Add this MCP server to your Claude Desktop configuration file:

```bash
# Run the Claude Desktop setup script
npm run setup:claude
```

Follow the instructions to update your Claude Desktop configuration file. The script will generate a configuration similar to:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "domain-radar-mcp",
      "env": {
        "DOMAIN_API_KEY": "your_domain_api_key"
      }
    }
  }
}
```

## Usage with Cursor

Add this MCP server to your Cursor configuration file:

1. Open Cursor Settings (`Cursor → Settings` or `Cmd+,` on Mac)
2. Navigate to the Features section
3. Find the "Model Context Protocol" settings
4. Add the following configuration:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "node",
      "args": ["/path/to/global/domain-radar-mcp/dist/index.js"],
      "env": {
        "DOMAIN_API_KEY": "your_domain_api_key"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "domain-radar-mcp",
      "env": {
        "DOMAIN_API_KEY": "your_domain_api_key"
      }
    }
  }
}
```

## Usage with Windsurf

Add this MCP server to your Windsurf configuration:

1. Create or edit the `.windsurf/config.json` file in your project directory
2. Add the following configuration:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "domain-radar-mcp",
      "env": {
        "DOMAIN_API_KEY": "your_domain_api_key"
      }
    }
  }
}
```

For development setup with Windsurf:

```json
{
  "mcpServers": {
    "domain-radar": {
      "command": "tsx",
      "args": ["src/index.ts"],
      "cwd": "/path/to/domain-radar",
      "env": {
        "DOMAIN_API_KEY": "your_domain_api_key"
      }
    }
  }
}
```

## Available Tools

### check-domain-availability

Check if domains are available for registration:

```
check-domain-availability
  domain: "example.com"
```

If you provide a domain name without a TLD (e.g., "example" instead of "example.com"), the tool will check availability across common TLDs (.com, .net, .org, etc.).

### search-expiring-domains

Search for domains expiring within 24 hours:

```
search-expiring-domains
  keyword: "tech" # Optional filter
```

### search-expired-domains

Search for recently expired domains:

```
search-expired-domains
  keyword: "business" # Optional filter
```

## Available Resources

### expiring-domains

View a markdown table of domains expiring within 24 hours:

```
Resource: expiring-domains://list
```

### expired-domains

View a markdown table of recently expired domains:

```
Resource: expired-domains://list
```

## Example Use Cases

### Finding Available Domain Names

```
User: I'm looking for a technology blog domain name with "tech" in it. What's available?

Claude: Let me check domain availability for names containing "tech".

[Uses check-domain-availability tool with domain "tech"]

Here are the available domains with "tech":
- techblog.io is available
- mytechworld.com is available
- techtips.dev is available

Would you like me to check any specific domains?
```

### Checking Specific Domain Availability

```
User: Check if devlime.ai is available.

Claude: Let me check the availability of devlime.ai for you.

[Uses check-domain-availability tool with domain "devlime.ai"]

✅ devlime.ai is available! Price: $45 USD

Would you like me to check any other domains?
```

### Finding Expiring Domains

```
User: Are there any good AI-related domains expiring soon?

Claude: Let me search for AI-related domains that are expiring within the next 24 hours.

[Uses search-expiring-domains tool with keyword "ai"]

Domains expiring within 24 hours matching "ai":

• aistudios.net - Expires: 5/18/2023, 3:45:00 PM
  Estimated Value: $2,800
  Est. Monthly Traffic: 1,200
  Categories: artificial intelligence, technology, education

• fairdata.org - Expires: 5/18/2023, 11:30:00 PM
  Estimated Value: $5,500
  Est. Monthly Traffic: 3,100
  Categories: artificial intelligence, data science, ethics

Would you like details on any of these domains?
```

## Known Limitations and Future Improvements

For details on known limitations, issues, and planned improvements, see the [ISSUES.md](./ISSUES.md) file.

## Running Manual Tests

For manual testing details, see the [Testing Guide](./testing_guide.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT