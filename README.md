# Lulu Print MCP Server

A Model Context Protocol (MCP) server that provides integration with Lulu Print API for print-on-demand services through Claude Desktop and other MCP clients.

## Features

### 📚 Print Job Management
- Create and manage print jobs for books and other printed materials
- Track order status from creation to delivery
- Calculate costs before placing orders
- Support for multiple line items per order

### 📄 File Validation
- Validate interior PDF files before printing
- Validate cover PDF files with dimension checking
- Calculate required cover dimensions based on page count
- Get detailed validation status and error reporting

### 💰 Cost Calculation
- Calculate product costs based on specifications
- Include shipping and tax calculations
- Support for different shipping levels (MAIL to EXPRESS)
- Get detailed cost breakdowns

### 🚚 Shipping Management
- Retrieve available shipping options by destination
- Support for international shipping
- Different service levels from standard mail to express delivery

### 🔔 Webhooks
- Subscribe to print job status changes
- Manage webhook endpoints
- Test webhook delivery
- View webhook submission history

## Installation

### Global Installation

```bash
# Install the package globally
npm install -g @devlimelabs/lulu-print-mcp

# Start the server
lulu-print-mcp
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/devlimelabs/lulu-print-mcp.git
cd lulu-print-mcp

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
docker build -t lulu-print-mcp .
docker run -p 3000:3000 lulu-print-mcp
```

## Configuration

### 1. Get Lulu API Credentials

1. Sign up for a Lulu developer account at [https://developers.lulu.com/](https://developers.lulu.com/)
2. For testing, create a sandbox account at [https://developers.sandbox.lulu.com/](https://developers.sandbox.lulu.com/)
3. Navigate to your [API Keys](https://developers.lulu.com/user-profile/api-keys) page
4. Copy your client key and client secret

### 2. Configure Environment Variables

```bash
# Create a configuration file
cp .env.example .env
```

Edit the `.env` file with your Lulu API credentials:

```
# Required: Your Lulu API credentials
LULU_CLIENT_KEY=your_client_key_here
LULU_CLIENT_SECRET=your_client_secret_here

# Optional: API endpoints (defaults are provided)
LULU_API_URL=https://api.lulu.com
LULU_SANDBOX_API_URL=https://api.sandbox.lulu.com
LULU_AUTH_URL=https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token
LULU_SANDBOX_AUTH_URL=https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token

# Use sandbox environment for testing (default: false)
LULU_USE_SANDBOX=false

# Enable debug logging (default: false)
DEBUG=false
```

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
    "lulu-print": {
      "command": "lulu-print-mcp",
      "env": {
        "LULU_CLIENT_KEY": "your_client_key",
        "LULU_CLIENT_SECRET": "your_client_secret"
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
    "lulu-print": {
      "command": "node",
      "args": ["/path/to/global/lulu-print-mcp/dist/index.js"],
      "env": {
        "LULU_CLIENT_KEY": "your_client_key",
        "LULU_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "lulu-print": {
      "command": "lulu-print-mcp",
      "env": {
        "LULU_CLIENT_KEY": "your_client_key",
        "LULU_CLIENT_SECRET": "your_client_secret"
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
    "lulu-print": {
      "command": "lulu-print-mcp",
      "env": {
        "LULU_CLIENT_KEY": "your_client_key",
        "LULU_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

For development setup with Windsurf:

```json
{
  "mcpServers": {
    "lulu-print": {
      "command": "tsx",
      "args": ["src/index.ts"],
      "cwd": "/path/to/lulu-print-mcp",
      "env": {
        "LULU_CLIENT_KEY": "your_client_key",
        "LULU_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## Available Tools

### Cost Calculation

#### calculate-print-job-cost
Calculate the cost of a print job without creating it:

```
calculate-print-job-cost
  line_items: Array of items to price
    - pod_package_id: Product SKU (e.g., "0600X0900BWSTDPB060UW444MXX")
    - page_count: Number of pages
    - quantity: Number of copies
  shipping_address: Delivery address
    - street1: Street address
    - city: City name
    - country_code: 2-letter ISO country code
    - postcode: Postal code
    - phone_number: Contact phone
  shipping_option: MAIL | PRIORITY_MAIL | GROUND | EXPEDITED | EXPRESS
```

### Print Job Management

#### create-print-job
Create a new print job order:

```
create-print-job
  line_items: Array of books to print
    - title: Book title
    - cover_url: URL to cover PDF
    - interior_url: URL to interior PDF
    - pod_package_id: Product SKU
    - quantity: Number of copies
  shipping_address: Delivery address
    - name: Recipient name
    - street1: Street address
    - city: City
    - country_code: 2-letter ISO code
    - postcode: Postal code
    - phone_number: Phone
  contact_email: Email for order communication
  shipping_level: MAIL | PRIORITY_MAIL | GROUND | EXPEDITED | EXPRESS
  external_id: Your order reference (optional)
```

#### list-print-jobs
List print jobs with optional filters:

```
list-print-jobs
  page: Page number (optional)
  page_size: Results per page (optional)
  status: Filter by status (optional)
  created_after: Filter by creation date (optional)
  created_before: Filter by creation date (optional)
```

#### get-print-job
Get details of a specific print job:

```
get-print-job
  id: Print job ID
```

#### update-print-job
Update a print job (only before payment):

```
update-print-job
  id: Print job ID
  external_id: New reference (optional)
  contact_email: New email (optional)
```

#### cancel-print-job
Cancel a print job (only if unpaid):

```
cancel-print-job
  id: Print job ID
```

#### get-print-job-status
Get the current status of a print job:

```
get-print-job-status
  id: Print job ID
```

#### get-print-job-costs
Get detailed costs for a print job:

```
get-print-job-costs
  id: Print job ID
```

#### get-print-job-statistics
Get statistics for print jobs over a time period:

```
get-print-job-statistics
  start_date: Start date (YYYY-MM-DD) (optional)
  end_date: End date (YYYY-MM-DD) (optional)
  group_by: DAY | WEEK | MONTH (optional)
```

### File Validation

#### validate-interior-file
Validate an interior PDF file:

```
validate-interior-file
  file_url: URL to interior PDF
  pod_package_id: Product SKU (optional, for normalization)
```

#### get-interior-validation
Check validation status:

```
get-interior-validation
  validation_id: ID from validate-interior-file
```

#### calculate-cover-dimensions
Calculate required cover dimensions:

```
calculate-cover-dimensions
  pod_package_id: Product SKU
  page_count: Number of interior pages
  unit: IN | MM | PT (optional, default: PT)
```

#### validate-cover-file
Validate a cover PDF file:

```
validate-cover-file
  file_url: URL to cover PDF
  pod_package_id: Product SKU
  page_count: Number of interior pages
```

#### get-cover-validation
Check cover validation status:

```
get-cover-validation
  validation_id: ID from validate-cover-file
```

### Shipping

#### get-shipping-options
Get available shipping options:

```
get-shipping-options
  country_code: 2-letter ISO country code
  state_code: State/province code (optional)
  quantity: Number of items (optional)
  pod_package_id: Product SKU (optional)
  page_count: Number of pages (optional)
  level: Filter by specific level (optional)
```

### Webhooks

#### create-webhook
Create a webhook subscription:

```
create-webhook
  url: Webhook endpoint URL
  topics: Array of events (currently supports ["PRINT_JOB_STATUS_CHANGED"])
```

#### list-webhooks
List all webhook subscriptions:

```
list-webhooks
```

#### get-webhook
Get webhook details:

```
get-webhook
  id: Webhook ID
```

#### update-webhook
Update a webhook:

```
update-webhook
  id: Webhook ID
  url: New URL (optional)
  topics: New topics (optional)
  is_active: Enable/disable (optional)
```

#### delete-webhook
Delete a webhook:

```
delete-webhook
  id: Webhook ID
```

#### test-webhook
Send a test webhook:

```
test-webhook
  id: Webhook ID
  topic: PRINT_JOB_STATUS_CHANGED
```

#### list-webhook-submissions
List webhook delivery attempts:

```
list-webhook-submissions
  webhook_id: Filter by webhook (optional)
  page: Page number (optional)
  page_size: Results per page (optional)
```

## Lulu Product SKUs

Lulu uses a 27-character SKU system to identify products:

**Format**: `Trim Size + Color + Print Quality + Bind + Paper + PPI + Finish + Linen + Foil`

### Common Examples

| SKU | Description |
| --- | --- |
| `0850X1100BWSTDLW060UW444MNG` | 8.5" x 11" black-and-white standard linen wrap with navy linen and gold foil |
| `0600X0900FCSTDPB080CW444GXX` | 6" x 9" full color standard paperback with glossy cover |
| `0700X1000FCPRECO060UC444MXX` | 7" x 10" full color premium coil-bound with matte cover |
| `0600X0900BWSTDPB060UW444MXX` | 6" x 9" black-and-white standard paperback with matte cover |

Use the [Lulu Pricing Calculator](https://developers.lulu.com/price-calculator) to generate SKUs for your specific needs.

## Testing with Sandbox

To use the Lulu sandbox environment for testing:

1. Create a sandbox account at [https://developers.sandbox.lulu.com/](https://developers.sandbox.lulu.com/)
2. Get your sandbox API credentials
3. Set `LULU_USE_SANDBOX=true` in your `.env` file
4. Or use the `--sandbox` flag when running the CLI: `lulu-print-mcp --sandbox`

In sandbox mode:
- Use test credit card numbers for payments
- Orders won't be sent to real production
- Perfect for development and testing

## Command Line Options

```bash
lulu-print-mcp [options]

Options:
  -s, --sandbox    Use Lulu sandbox environment instead of production
  -d, --debug      Enable debug logging
  -h, --help       Display help
  -V, --version    Display version
```

## Troubleshooting

### Authentication Issues
- Verify your client key and secret are correct
- Check if you're using the right environment (production vs sandbox)
- Ensure your API credentials have the necessary permissions

### File Validation Errors
- Ensure PDF files are publicly accessible via URL
- Check file format requirements in Lulu's documentation
- Verify page count and dimensions match the product specifications

### Network Issues
- Check your internet connection
- Verify firewall settings allow HTTPS connections to api.lulu.com
- Enable debug mode to see detailed request/response logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT