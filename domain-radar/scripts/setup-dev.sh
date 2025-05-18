#!/bin/bash

# Setup Development Environment for Domain Radar MCP

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Done! Please edit .env file with your configuration."
else
  echo ".env file already exists."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Display setup completion message
echo "Development environment setup complete!"
echo "To start the server in development mode, run: npm run dev"
echo "To run tests, run: npm test"