#!/bin/bash

# Start the MCP server in the background
cd /Users/john/code/master-mcps/packages/mcp-env-manager
MCP_ENV_ENCRYPTION_KEY="test-key-1234567890" node dist/bin/mcp-env-manager.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for the server to start
sleep 2

echo "Server started with PID $SERVER_PID"

# Function to send a JSON-RPC request via stdio
send_request() {
  local filename=$1
  local request=$(cat $filename)
  echo "Sending request from $filename"
  echo "$request"
  echo "$request" | nc -U /tmp/mcp_test_socket
}

# Run the tests in sequence
echo "Creating profile..."
send_request test_output/create_profile.json

echo "Listing profiles..."
send_request test_output/list_profiles.json

# Get profile ID from the file system
PROFILE_ID=$(ls -1 ~/.mcp-env-manager/profiles.json)
if [ -n "$PROFILE_ID" ]; then
  echo "Found profile ID: $PROFILE_ID"
  # Update the placeholder in the JSON files
  sed -i '' "s/PROFILE_ID_PLACEHOLDER/$PROFILE_ID/g" test_output/activate_profile.json
  sed -i '' "s/PROFILE_ID_PLACEHOLDER/$PROFILE_ID/g" test_output/set_env_var.json
  sed -i '' "s/PROFILE_ID_PLACEHOLDER/$PROFILE_ID/g" test_output/list_env_vars.json

  echo "Activating profile..."
  send_request test_output/activate_profile.json

  echo "Setting environment variable..."
  send_request test_output/set_env_var.json

  echo "Listing environment variables..."
  send_request test_output/list_env_vars.json
fi

echo "Getting watcher configuration..."
send_request test_output/get_watcher_config.json

echo "Listing installed MCPs..."
send_request test_output/list_installed_mcps.json

# Kill the server when done
echo "Stopping server with PID $SERVER_PID"
kill $SERVER_PID

echo "Tests completed"