#!/bin/bash

# Setup Development Environment for NPM Package Manager MCP

echo "Setting up development environment for NPM Package Manager MCP..."

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the project
echo "Building the project..."
pnpm build

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Done! Please edit .env file with your configuration."
  else
    echo "No .env.example found. Creating minimal .env file..."
    echo "# Environment variables for NPM Package Manager MCP" > .env
    echo "# Add any configuration here if needed" >> .env
  fi
else
  echo ".env file already exists."
fi

# Run basic tests (if any)
if [ -f jest.config.js ]; then
  echo "Running basic tests..."
  pnpm test || echo "Tests failed, but continuing setup..."
fi

echo "Development environment setup complete!"
echo ""
echo "To start the MCP server in development mode:"
echo "  pnpm dev"
echo ""
echo "To build for production:"
echo "  pnpm build"
echo ""
echo "To run the production build:"
echo "  pnpm start"