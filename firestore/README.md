# Firestore MCP Server [Work in Progress]

> ⚠️ **IMPORTANT**: This package is currently under development and not yet ready for production use. The current version is a work in progress and may contain incomplete features or breaking changes.

A Model Context Protocol (MCP) server that provides secure access to Firestore databases through Claude or any other MCP client. This allows LLM agents to read, write, query, and manage Firestore documents with fine-grained permission controls.

## Features

- **Permission-Based Access**: Define permissions for collections and documents
- **Document Management**: Read, write, update, and delete documents
- **Collection Queries**: Query documents with filters and pagination
- **Permission Inheritance**: Configure nested collections to inherit parent permissions
- **Cloud Firestore Support**: Works with Google Cloud Firestore
- **Local Emulator Support**: Works with local Firestore emulator

## Installation

```bash
# Install the package
npm install @devlimelabs/firestore-mcp

# Start the server
npx firestore-mcp
```

## Configuration

### Firebase Project Setup

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Create a Firestore database
3. Generate a service account key file

### MCP Configuration

Create a `.env` file with your Firebase configuration:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
# For local emulator
FIRESTORE_EMULATOR_HOST=localhost:8080
```

Create a permissions configuration file to define access:

```json
{
  "collections": {
    "users": {
      "read": true,
      "write": false,
      "query": true,
      "delete": false
    },
    "public/*": {
      "read": true,
      "write": true,
      "query": true,
      "delete": true
    }
  }
}
```

## Usage with Claude Desktop

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "firestore": {
      "command": "npx",
      "args": ["firestore-mcp"],
      "env": {
        "FIREBASE_PROJECT_ID": "your-project-id",
        "FIREBASE_CLIENT_EMAIL": "your-service-account-email",
        "FIREBASE_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

## Available Tools

### read

Read a document by path:

```
read 
  path: "users/user123"
```

### query

Query a collection with filters:

```
query
  collection: "users"
  where: 
    - ["age", ">", 21]
  orderBy: "name"
  limit: 10
```

### write

Write or update a document:

```
write
  path: "users/user123"
  data: 
    name: "John Doe"
    email: "john@example.com"
    age: 25
```

### delete

Delete a document:

```
delete
  path: "users/user123"
```

## Example Conversations

### Querying Data

```
User: Can you find all users who are older than 30?

Claude: I'll query the Firestore database for users over 30.
[Uses query tool on the users collection with age filter]

I found 3 users over 30:
- Alice Smith (32): alice@example.com
- Bob Johnson (45): bob@example.com
- Carol Williams (38): carol@example.com
```

### Creating Records

```
User: Add a new product to our inventory

Claude: I'll help you add a new product. What details should I include?

User: It's a laptop, model XPS 15, price $1299.99, 20 in stock

Claude: I'll add this product to the inventory.
[Uses write tool to create a new document in the products collection]

I've successfully added the laptop to the inventory with ID: product456.
```

## Permission Configuration Examples

See the examples directory for different permission configuration examples:

- read-only.json: Read-only access to all collections
- conditional-permissions.json: Permissions based on document content
- mixed-permissions.json: Different permissions for different collections

## Development

```bash
# Clone the repository
git clone https://github.com/your-repo/master-mcps.git
cd master-mcps

# Install dependencies
pnpm install

# Build the package
pnpm -F @devlimelabs/firestore-mcp build

# Run tests
pnpm -F @devlimelabs/firestore-mcp test
```

## License

MIT