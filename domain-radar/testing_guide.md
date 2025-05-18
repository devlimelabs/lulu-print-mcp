# Testing Guide for Domain Radar MCP

This document outlines the key features to test in the Domain Radar MCP and identifies any issues found during testing.

## Key Features to Test

1. **Domain Availability Checking**
   - Single domain check with TLD
   - Multiple TLD check for a base domain name
   - Error handling for API failures

2. **Expiring Domains Search**
   - Retrieving all expiring domains
   - Filtering by keyword
   - Cache functionality

3. **Expired Domains Search**
   - Retrieving all expired domains
   - Filtering by keyword
   - Cache functionality

4. **Resource Endpoints**
   - Expiring domains resource endpoint
   - Expired domains resource endpoint

## Manual Testing Steps

To manually test the Domain Radar MCP, follow these steps:

1. Start the MCP server:
   ```bash
   npm run build
   node dist/bin/cli.js
   ```

2. In a separate terminal, use one of these methods to test:

   a. Using direct stdio:
   ```bash
   cat test_output/check-domain-availability.json | node dist/bin/cli.js
   ```

   b. Using the test script:
   ```bash
   node test_output/run_tests.js
   ```

## Test Output Examples

### Check Domain Availability

**Input:**
```json
{
  "jsonrpc": "2.0",
  "method": "callTool",
  "params": {
    "name": "check-domain-availability",
    "args": {
      "domain": "example.com"
    }
  },
  "id": 1
}
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "❌ example.com is not available."
      }
    ]
  },
  "id": 1
}
```

### Search Expiring Domains

**Input:**
```json
{
  "jsonrpc": "2.0",
  "method": "callTool",
  "params": {
    "name": "search-expiring-domains",
    "args": {}
  },
  "id": 2
}
```

**Expected Output:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Domains expiring within 24 hours:\n\n• example-domain.com - Expires: 5/18/2023, 2:30:00 PM\n  Estimated Value: $1500\n  Est. Monthly Traffic: 2500\n  Categories: business, technology\n\n..."
      }
    ]
  },
  "id": 2
}
```

## Known Issues

1. **API Mocking**: The current implementation uses placeholder API endpoints that need to be replaced with real domain information APIs.
2. **Error Handling**: Some edge cases in API error handling could be improved.
3. **Cache Management**: The cache expiration could be more sophisticated to refresh data in the background.

## Recommended Improvements

1. Implement real API integrations with domain registrars and WHOIS services
2. Add more sophisticated domain suggestion algorithms
3. Improve cache management with background refreshing
4. Add domain value estimation based on historical data
5. Implement SSE transport support for better Claude Desktop integration

## Integration Testing with Claude Desktop

For testing with Claude Desktop:

1. Run the setup script:
   ```bash
   npm run setup:claude
   ```

2. Follow the instructions to configure Claude Desktop with the Domain Radar MCP.

3. In Claude Desktop, verify that the tools appear and function correctly by testing commands:
   ```
   check-domain-availability
     domain: "example.com"
   ```

## Performance Testing

If needed, you can test the performance of the MCP server with multiple concurrent requests using the provided test scripts. Note that the actual performance will depend on the underlying API services used for domain information.