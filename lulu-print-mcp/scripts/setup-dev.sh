#!/bin/bash

# Setup Development Environment for Lulu Print MCP

echo "Starting development environment setup..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Done! Please edit .env file with your Lulu API credentials."
else
  echo ".env file already exists."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Run tests if they exist
if [ -f "jest.config.js" ]; then
  echo "Running tests..."
  npm test
fi

echo "Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your Lulu API credentials"
echo "2. To start the server in development mode, run: npm run dev"
echo "3. To test with sandbox environment, set LULU_USE_SANDBOX=true in .env"
echo ""
echo "For more information, see the README.md file."